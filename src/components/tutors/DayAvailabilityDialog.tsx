"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { istanbulToday, type TutorCalendarEvent } from "@/lib/tutorCalendar";
import {
  fetchAvailability,
  createAvailabilityRule,
  deleteAvailabilityRule,
} from "@/lib/dashboardApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TimeSelect } from "@/components/ui/time-select";
import { availabilityRulesOverlap } from "@/lib/availability";

function formatRuleTime(t: string | null): string {
  if (!t) return "";
  return t.slice(0, 5);
}

interface DayAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayOfWeek: number;
  date: string;
  dayLabel: string;
  calendarEvents?: TutorCalendarEvent[];
  onChanged?: () => void;
}

export function DayAvailabilityDialog({
  open,
  onOpenChange,
  dayOfWeek,
  date,
  dayLabel,
  calendarEvents = [],
  onChanged,
}: DayAvailabilityDialogProps) {
  const queryClient = useQueryClient();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timeError, setTimeError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [mode, setMode] = useState<"date" | "weekly">("date");

  useEffect(() => {
    if (open) { setMode("date"); setStartTime(""); setEndTime(""); setTimeError(null); }
  }, [open, date]);

  const { data: rules = [], isPending: loading, isError, refetch } = useQuery({
    queryKey: ["availability"],
    queryFn: fetchAvailability,
    enabled: open,
  });

  const dateRules = rules.filter((r) => r.specific_date === date);
  const weeklyRules = rules.filter((r) => !r.specific_date && r.day_of_week === dayOfWeek);
  const isClosed = mode === "date" && dateRules.some((rule) => rule.is_unavailable);
  const dayRules = (mode === "date" ? dateRules : weeklyRules)
    .filter((rule) => !rule.is_unavailable)
    .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

  const refresh = () => {
    for (const key of ["availability", "tutor-calendar", "tutor-busy-intervals", "tutor-availability"]) void queryClient.invalidateQueries({ queryKey: [key] });
    onChanged?.();
  };
  const affectedLessons = (loading || isError ? [] : calendarEvents).filter((event) => {
    if (!["pending", "confirmed", "in_progress"].includes(event.status) || event.source !== "booking") return false;
    const dated = rules.filter((rule) => rule.specific_date === event.local_date);
    const weekday = (new Date(`${event.local_date}T12:00:00`).getDay() + 6) % 7;
    const effective = dated.length ? dated : rules.filter((rule) => !rule.specific_date && rule.day_of_week === weekday);
    const [h, m] = event.local_time.split(":").map(Number);
    const end = h * 60 + m + event.duration_minutes;
    return !effective.some((rule) => {
      if (rule.is_unavailable || !rule.start_time || !rule.end_time) return false;
      const [eh, em] = rule.end_time.split(":").map(Number);
      return rule.start_time.slice(0, 5) <= event.local_time.slice(0, 5) && eh * 60 + em >= end;
    });
  });
  const resetDate = async () => {
    setResetting(true); setTimeError(null);
    try { for (const rule of dateRules) await deleteAvailabilityRule(rule.id); }
    catch { setTimeError("Tarih istisnası tamamen kaldırılamadı. Kalan kayıtları kontrol edip yeniden dene."); }
    finally { refresh(); setResetting(false); }
  };

  const createMutation = useMutation({
    mutationFn: createAvailabilityRule,
    onSuccess: () => {
      refresh();
      setStartTime("");
      setEndTime("");
      setTimeError(null);
      toast.success("Müsaitlik güncellendi.");
    },
    onError: () => {
      setTimeError("Müsaitlik güncellenemedi. Yazdığın saatler korundu, yeniden deneyebilirsin.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAvailabilityRule,
    onSuccess: () => {
      refresh();
      toast.success("Müsaitlik güncellendi.");
    },
    onError: () => {
      setTimeError("Müsaitlik güncellenemedi. Yazdığın saatler korundu, yeniden deneyebilirsin.");
    },
  });

  const isMutating = createMutation.isPending || deleteMutation.isPending || resetting || loading || isError;
  const dateIsPast = date < istanbulToday();

  const handleAdd = () => {
    setTimeError(null);
    if (!startTime || !endTime) {
      setTimeError("Başlangıç ve bitiş saati seçin");
      return;
    }
    if (startTime >= endTime) {
      setTimeError("Başlangıç saati bitiş saatinden önce olmalıdır");
      return;
    }
    if (availabilityRulesOverlap(rules, {
      dayOfWeek,
      ...(mode === "date" ? { specificDate: date } : {}),
      startTime,
      endTime,
    })) {
      setTimeError("Bu saat aralığı mevcut müsaitlik saatiyle çakışıyor");
      return;
    }
    createMutation.mutate({
      day_of_week: dayOfWeek,
      ...(mode === "date" ? { specific_date: date } : {}),
      start_time: startTime.length === 5 ? startTime : startTime + ":00",
      end_time: endTime.length === 5 ? endTime : endTime + ":00",
    });
  };

  const handleCloseDay = () => {
    createMutation.mutate({ day_of_week: dayOfWeek, specific_date: date, is_unavailable: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dayLabel} Müsaitliği</DialogTitle>
          <DialogDescription>
            Tek tarih için istisna oluşturabilir veya bu hafta gününü her hafta tekrarlayabilirsin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading && <p role="status" className="text-sm text-ink-mid">Müsaitlik yükleniyor…</p>}
          {isError && <div role="alert" className="space-y-2 text-sm text-error"><p>Müsaitlik alınamadı.</p><Button variant="outline" onClick={() => void refetch()}>Yeniden dene</Button></div>}
          <div className="grid grid-cols-2 rounded-input bg-paper p-1">
            <Button type="button" size="sm" variant={mode === "date" ? "default" : "ghost"} disabled={isMutating} onClick={() => setMode("date")}>Yalnızca bu tarih</Button>
            <Button type="button" size="sm" variant={mode === "weekly" ? "default" : "ghost"} disabled={isMutating} onClick={() => setMode("weekly")}>Her hafta tekrarla</Button>
          </div>
          <p className="text-xs text-ink-mid">{mode === "date" ? "Bu tarihteki kurallar haftalık düzenin yerini alır." : `${dayLabel.split(" ")[0]} günleri için tekrar eden düzen.`}</p>
          {isClosed && <p className="rounded-input border border-error bg-white px-3 py-2 text-sm text-error">Bu gün kapalı.</p>}
          {!loading && !isError && (dayRules.length === 0 ? (
            <p className="rounded-input border border-dashed px-3 py-6 text-center text-sm text-ink-mid">
              Bu gün için henüz müsaitlik saati eklenmemiş.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dayRules.map((rule) => {
                const start = formatRuleTime(rule.start_time);
                const end = formatRuleTime(rule.end_time);
                return (
                  <div
                    key={rule.id}
                    className="flex items-center gap-2 rounded-input border bg-paper px-2 py-1.5 text-sm"
                  >
                    <span className="font-medium tabular-nums">
                      {start}–{end}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(rule.id)}
                      disabled={isMutating || (mode === "date" && dateIsPast)}
                      aria-label={`${dayLabel} ${start}–${end} saatini sil`}
                      className="text-ink-mid transition-colors hover:text-error disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
          {mode === "date" && dateRules.length > 0 && <Button variant="outline" disabled={isMutating || dateIsPast} onClick={() => void resetDate()}>Tarih istisnasını kaldır</Button>}
          <p className="text-xs text-ink-mid">Müsaitlik değişiklikleri mevcut dersleri iptal etmez. Tarih istisnasını kaldırınca haftalık düzene dönülür.</p>
          {affectedLessons.length > 0 && <div role="status" className="space-y-2 rounded-input border border-line p-3 text-sm text-ink"><p>Bu dönemde müsaitlik saatlerinin dışında kalan derslerin var:</p>{affectedLessons.map((event) => <Link key={event.id} className="block underline" href={`/dashboard/tutor?tab=bookings&highlightBooking=${event.id}`}>{event.local_date} {event.local_time} · {event.student.display_name}</Link>)}</div>}

          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium">Yeni saat ekle</p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="availability-start">Başlangıç</Label>
                <TimeSelect
                  id="availability-start"
                  value={startTime}
                  onChange={setStartTime}
                  disabled={isMutating || (mode === "date" && dateIsPast)}
                  className="w-[130px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="availability-end">Bitiş</Label>
                <TimeSelect
                  id="availability-end"
                  value={endTime}
                  onChange={setEndTime}
                  disabled={isMutating || (mode === "date" && dateIsPast)}
                  className="w-[130px]"
                />
              </div>
              <Button type="button" onClick={handleAdd} disabled={isMutating || (mode === "date" && dateIsPast)}>
                Ekle
              </Button>
            </div>
            {timeError && <p className="text-sm text-error">{timeError}</p>}
            {mode === "date" && !isClosed && <Button type="button" variant="outline" className="border-error text-error" onClick={handleCloseDay} disabled={isMutating || (mode === "date" && dateIsPast)}>Bu günü kapat</Button>}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
