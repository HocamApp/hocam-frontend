"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAvailability,
  createAvailabilityRule,
  deleteAvailabilityRule,
} from "@/lib/dashboardApi";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeSelect } from "@/components/ui/time-select";
import { Label } from "@/components/ui/label";
import { Plus, Trash } from "@phosphor-icons/react";
import { AvailabilityRule } from "@/types";
import { toast } from "sonner";
import { availabilityRulesOverlap } from "@/lib/availability";

const DAY_NAMES = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

// Short, unambiguous forms for the weekly grid header — a plain 3-letter
// slice of DAY_NAMES would collide (Pazartesi and Pazar both start "Paz").
const DAY_ABBREVIATIONS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function formatTimeForInput(t: string): string {
  if (!t) return "";
  return t.slice(0, 5);
}

export function AvailabilityEditor() {
  const queryClient = useQueryClient();
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timeError, setTimeError] = useState<string | null>(null);

  const { data: rules = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["availability"],
    queryFn: fetchAvailability,
  });

  const createMutation = useMutation({
    mutationFn: createAvailabilityRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-availability"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-availability"] });
      setStartTime("");
      setEndTime("");
      setTimeError(null);
      toast.success("Müsaitlik güncellendi.");
    },
    onError: () => {
      toast.error("Müsaitlik güncellenemedi.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAvailabilityRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-availability"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-availability"] });
      toast.success("Müsaitlik güncellendi.");
    },
    onError: () => {
      toast.error("Müsaitlik güncellenemedi.");
    },
  });

  const isMutating = createMutation.isPending || deleteMutation.isPending || isLoading || isError;

  const handleAdd = () => {
    setTimeError(null);
    if (!startTime || !endTime) {
      setTimeError("Başlangıç ve bitiş saati girin");
      return;
    }
    const start = startTime.trim();
    const end = endTime.trim();
    if (start >= end) {
      setTimeError("Başlangıç saati bitiş saatinden önce olmalıdır");
      return;
    }
    if (availabilityRulesOverlap(rules, { dayOfWeek, startTime: start, endTime: end })) {
      setTimeError("Bu saat aralığı mevcut müsaitlik saatiyle çakışıyor");
      return;
    }
    createMutation.mutate({
      day_of_week: dayOfWeek,
      start_time: start.length === 5 ? start : start + ":00",
      end_time: end.length === 5 ? end : end + ":00",
    });
  };

  // Monday(0)..Sunday(6), matching the backend's day_of_week convention;
  // within each day, earlier start_time first.
  const rulesByDay: AvailabilityRule[][] = DAY_NAMES.map((_, day) =>
    rules
      .filter((r) => !r.specific_date && !r.is_unavailable && !!r.start_time && !!r.end_time && r.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Müsaitlik Saatleri</h2>

      {isError ? (<div role="alert" className="space-y-2"><p className="text-sm text-error">Müsaitlik saatleri alınamadı.</p><Button variant="outline" onClick={() => void refetch()}>Tekrar dene</Button></div>) : isLoading ? (
        <p className="text-sm text-ink-mid">Yükleniyor...</p>
      ) : (
        <>
          {rulesByDay.every((day) => day.length === 0) && (
            <p className="rounded-input border border-dashed px-3 py-6 text-center text-sm text-ink-mid">
              Henüz müsaitlik saati eklenmemiş.
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
          {DAY_NAMES.map((name, day) => (
            <div key={day} className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-ink-mid">
                <span className="md:hidden">{name}</span>
                <span className="hidden md:inline">{DAY_ABBREVIATIONS[day]}</span>
              </div>
              <div className="flex flex-row flex-wrap gap-2 md:flex-col">
                {rulesByDay[day].length === 0 ? (
                  <span className="text-xs text-ink-mid">—</span>
                ) : (
                  rulesByDay[day].map((rule) => {
                    const start = formatTimeForInput(rule.start_time);
                    const end = formatTimeForInput(rule.end_time);
                    return (
                      <div
                        key={rule.id}
                        className="flex w-fit items-center gap-2 rounded-input border border-line bg-paper px-2 py-1.5 text-xs md:w-full"
                      >
                        <span className="font-medium leading-tight tabular-nums">
                          <span className="block">{start}</span>
                          <span className="block">–{end}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(rule.id)}
                          disabled={isMutating}
                          aria-label={`${name} ${start}–${end} saatini sil`}
                          className="ml-auto rounded-input focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink shrink-0 text-ink-mid transition-colors hover:text-error disabled:pointer-events-none disabled:opacity-50"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
          </div>
        </>
      )}

      <div className="space-y-3 border-t border-line pt-4">
        <h3 className="text-sm font-medium">Yeni Saat Ekle</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Gün</Label>
            <Select
              value={String(dayOfWeek)}
              onValueChange={(v) => setDayOfWeek(Number(v))}
              disabled={isMutating}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAY_NAMES.map((name, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Başlangıç</Label>
            <TimeSelect
              value={startTime}
              onChange={setStartTime}
              className="w-[130px]"
              disabled={isMutating}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Bitiş</Label>
            <TimeSelect
              value={endTime}
              onChange={setEndTime}
              className="w-[130px]"
              disabled={isMutating}
            />
          </div>
          <Button type="button" onClick={handleAdd} disabled={isMutating}>
            <Plus className="mr-1.5 h-4 w-4" />
            Ekle
          </Button>
        </div>
        {timeError && <p className="text-sm text-error">{timeError}</p>}
      </div>
    </div>
  );
}
