"use client";

import { useEffect, useState, type ReactNode } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimeSelect } from "@/components/ui/time-select";
import { availabilityRulesOverlap } from "@/lib/availability";

function formatRuleTime(t: string | null): string {
  if (!t) return "";
  return t.slice(0, 5);
}

const DAY_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

// Dates are "YYYY-MM-DD" Istanbul calendar days; noon UTC keeps day maths off the DST edge.
const weekdayOf = (date: string) => (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
function shiftDate(date: string, days: number) {
  const moved = new Date(`${date}T12:00:00Z`);
  moved.setUTCDate(moved.getUTCDate() + days);
  return moved.toISOString().slice(0, 10);
}

interface DayAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where the dialog opens; the tutor can pick another day inside it. */
  date: string;
  /** Kept for callers; the dialog derives both from the day it is showing. */
  dayOfWeek?: number;
  dayLabel?: string;
  calendarEvents?: TutorCalendarEvent[];
  onChanged?: () => void;
  /** Rendered between the header and the form, e.g. a first-time hint. */
  intro?: ReactNode;
}

export function DayAvailabilityDialog({
  open,
  onOpenChange,
  date: initialDate,
  calendarEvents = [],
  onChanged,
  intro,
}: DayAvailabilityDialogProps) {
  const queryClient = useQueryClient();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timeError, setTimeError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [mode, setMode] = useState<"date" | "weekly">("date");
  const [date, setDate] = useState(initialDate);
  const dayOfWeek = weekdayOf(date);
  const dayLabel = new Date(`${date}T12:00:00Z`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long", timeZone: "UTC" });

  useEffect(() => {
    if (open) { setMode("date"); setDate(initialDate); setStartTime(""); setEndTime(""); setTimeError(null); }
  }, [open, initialDate]);

  const { data: rules = [], isPending: loading, isError, refetch } = useQuery({
    queryKey: ["availability"],
    queryFn: fetchAvailability,
    enabled: open,
  });

  const dateRules = rules.filter((r) => r.specific_date === date);
  const weeklyRules = rules.filter((r) => !r.specific_date && r.day_of_week === dayOfWeek);
  const isClosed = mode === "date" && dateRules.some((rule) => rule.is_unavailable);
  const showingWeeklyFallback = mode === "date" && dateRules.length === 0;
  const dayRules = (mode === "date" ? (showingWeeklyFallback ? weeklyRules : dateRules) : weeklyRules)
    .filter((rule) => !rule.is_unavailable)
    .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
  const weekday = ["pazartesi", "salı", "çarşamba", "perşembe", "cuma", "cumartesi", "pazar"][dayOfWeek];
  const dateName = new Date(`${date}T12:00:00`).toLocaleDateString("tr-TR", {day:"numeric", month:"long"});
  let scopeDescription: string;
  if (mode === "weekly") {
    scopeDescription = `Bu saatler her ${weekday} geçerli.`;
  } else if (showingWeeklyFallback) {
    scopeDescription = weeklyRules.length > 0
      ? "Bu gün için haftalık programındaki saatler geçerli. Buraya yeni saat eklersen o gün yalnızca eklediğin saatler görünür."
      : `Bu gün için henüz müsait saat belirlemedin. Eklediğin saatler yalnızca ${dateName} için geçerli olur.`;
  } else if (isClosed) {
    scopeDescription = `Bu gün için müsaitliği kapattın. Bu ayar yalnızca ${dateName} için geçerli.`;
  } else {
    scopeDescription = `Buraya eklediğin saatler yalnızca ${dateName} için geçerli. O gün haftalık programındaki saatler yerine bunlar kullanılır.`;
  }

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
    catch { setTimeError("Bu güne özel saatlerin bazıları kaldırılamadı. Kalan saatleri kontrol edip yeniden dene."); }
    finally { refresh(); setResetting(false); }
  };

  const createMutation = useMutation({
    mutationFn: createAvailabilityRule,
    onSuccess: () => {
      refresh();
      setStartTime("");
      setEndTime("");
      setTimeError(null);
      toast.success("Müsait saatlerin güncellendi.");
    },
    onError: () => {
      setTimeError("Müsait saatlerin kaydedilemedi. Seçtiğin saatler duruyor; yeniden deneyebilirsin.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAvailabilityRule,
    onSuccess: () => {
      refresh();
      toast.success("Müsait saatlerin güncellendi.");
    },
    onError: () => {
      setTimeError("Müsait saatlerin güncellenemedi. Yeniden deneyebilirsin.");
    },
  });

  const isMutating = createMutation.isPending || deleteMutation.isPending || resetting || loading || isError;
  const dateIsPast = date < istanbulToday();

  const handleAdd = () => {
    setTimeError(null);
    if (!startTime || !endTime) {
      setTimeError("Başlangıç ve bitiş saatlerini seç.");
      return;
    }
    if (startTime >= endTime) {
      setTimeError("Bitiş saati başlangıçtan sonra olmalı.");
      return;
    }
    if (availabilityRulesOverlap(rules, {
      dayOfWeek,
      ...(mode === "date" ? { specificDate: date } : {}),
      startTime,
      endTime,
    })) {
      setTimeError("Bu saat aralığı eklediğin başka bir müsait saatle çakışıyor.");
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
          <DialogTitle>{dayLabel} için müsaitlik</DialogTitle>
          <DialogDescription>
            Müsait saatlerini yalnızca seçtiğin gün için veya her hafta geçerli olacak şekilde belirleyebilirsin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {intro}
          {loading && <p role="status" className="text-sm text-ink-mid">Müsaitlik yükleniyor…</p>}
          {isError && <div role="alert" className="space-y-2 text-sm text-error"><p>Müsait saatlerin yüklenemedi.</p><Button variant="outline" onClick={() => void refetch()}>Yeniden dene</Button></div>}
          <div className="grid grid-cols-2 rounded-input bg-paper p-1">
            <Button type="button" size="sm" variant={mode === "date" ? "default" : "ghost"} disabled={isMutating} onClick={() => setMode("date")}>Yalnızca bu gün</Button>
            <Button type="button" size="sm" variant={mode === "weekly" ? "default" : "ghost"} disabled={isMutating} onClick={() => setMode("weekly")}>Her hafta tekrarla</Button>
          </div>
          {mode === "date" ? (
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="availability-date">Tarih</Label>
              <Input
                id="availability-date"
                type="date"
                value={date}
                min={istanbulToday()}
                disabled={createMutation.isPending || deleteMutation.isPending || resetting}
                onChange={(event) => { if (event.target.value) { setDate(event.target.value); setTimeError(null); } }}
              />
            </div>
          ) : (
            <div role="group" aria-label="Gün" className="flex flex-wrap gap-1.5">
              {DAY_SHORT.map((label, index) => (
                <Button
                  key={label}
                  type="button"
                  size="sm"
                  variant={index === dayOfWeek ? "default" : "outline"}
                  aria-pressed={index === dayOfWeek}
                  disabled={createMutation.isPending || deleteMutation.isPending || resetting}
                  onClick={() => { setDate(shiftDate(date, index - dayOfWeek)); setTimeError(null); }}
                >
                  {label}
                </Button>
              ))}
            </div>
          )}
          <p className="text-xs text-ink-mid">{scopeDescription}</p>
          {isClosed && <p className="rounded-input border border-error bg-white px-3 py-2 text-sm text-error">Bu gün yeni ders için müsait değilsin.</p>}
          {!loading && !isError && !isClosed && (dayRules.length === 0 ? (
            <p className="rounded-input border border-dashed px-3 py-6 text-center text-sm text-ink-mid">
              {mode === "weekly" ? `Her ${weekday} için henüz müsait saat eklemedin.` : "Bu gün için müsait saat yok."}
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
                    {!showingWeeklyFallback && <button
                      type="button"
                      onClick={() => deleteMutation.mutate(rule.id)}
                      disabled={isMutating || (mode === "date" && dateIsPast)}
                      aria-label={`${dayLabel} ${start}–${end} saatini sil`}
                      className="text-ink-mid transition-colors hover:text-error disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>}
                  </div>
                );
              })}
            </div>
          ))}
          {mode === "date" && dateRules.length > 0 && <Button variant="outline" disabled={isMutating || dateIsPast} onClick={() => void resetDate()}>Bu güne özel saatleri kaldır</Button>}
          {mode === "date" && dateRules.length > 0 && <p className="text-xs text-ink-mid">Kaldırdığında bu gün için haftalık programındaki saatler geçerli olur.</p>}
          <p className="text-xs text-ink-mid">Müsait saatlerini değiştirmen, takvimindeki dersleri iptal etmez veya saatlerini değiştirmez.</p>
          {affectedLessons.length > 0 && <div role="status" className="space-y-2 rounded-input border border-line p-3 text-sm text-ink"><p>Bu dönemde müsait saatlerinin dışında kalan derslerin var:</p>{affectedLessons.map((event) => <Link key={event.id} className="block underline" href={`/dashboard/tutor?tab=bookings&highlightBooking=${encodeURIComponent(event.id)}`}>{new Date(`${event.local_date}T12:00:00`).toLocaleDateString("tr-TR", {day:"numeric", month:"long", year:"numeric"})} · {event.local_time.slice(0,5)} · {event.student.display_name}</Link>)}</div>}

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
