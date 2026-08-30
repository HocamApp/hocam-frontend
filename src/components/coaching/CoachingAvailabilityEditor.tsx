"use client";

import { useState } from "react";
import { CalendarBlank, Clock, Plus, Trash } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { CoachingStudioPanel } from "@/components/coaching/CoachingStudioPanel";
import type {
  CoachingAvailabilityPayload,
  CoachingAvailabilityWindow,
} from "@/lib/coachingApi";
import { COACHING_TIME_OPTIONS } from "@/lib/coachingVisuals";

const DAYS = [
  { value: 0, label: "Pazartesi" },
  { value: 1, label: "Salı" },
  { value: 2, label: "Çarşamba" },
  { value: 3, label: "Perşembe" },
  { value: 4, label: "Cuma" },
  { value: 5, label: "Cumartesi" },
  { value: 6, label: "Pazar" },
];

/**
 * Coaching availability — deliberately separate from lesson availability.
 *
 * An empty list means the tutor has no coaching slots at all; normal lesson
 * hours are never used as a fallback. The empty state says so explicitly,
 * because "I already set my lesson hours" is the obvious wrong assumption.
 */
export function CoachingAvailabilityEditor({
  windows,
  onCreate,
  onDelete,
  isMutating,
  error,
}: {
  windows: CoachingAvailabilityWindow[];
  onCreate: (payload: CoachingAvailabilityPayload) => void;
  onDelete: (id: string) => void;
  isMutating: boolean;
  error: string | null;
}) {
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault();
    onCreate({
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
    });
  };

  const byDay = DAYS.map((day) => ({
    ...day,
    windows: windows.filter((window) => window.day_of_week === day.value),
  }));

  return (
    <div className="space-y-6">
      {error ? <ErrorMessage message={error} /> : null}

      <CoachingStudioPanel className="overflow-hidden">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(32rem,1.2fr)] lg:items-end">
          <div className="max-w-xl">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-input bg-gold text-gold-ink">
              <CalendarBlank className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight">Koçluk saatlerini ekle</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Bu saatler yalnız 30 dakikalık koçluk görüşmeleri için kullanılır; normal ders müsaitliğin buraya aktarılmaz.
            </p>
          </div>
          <form onSubmit={handleAdd} className="grid gap-3 rounded-card border border-line bg-paper p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <div>
              <Label htmlFor="coaching-day">Gün</Label>
              <select
                id="coaching-day"
                value={dayOfWeek}
                onChange={(event) => setDayOfWeek(Number(event.target.value))}
                className="mt-1 h-10 w-full rounded-input border border-line bg-surface px-3 text-sm text-ink"
              >
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="coaching-start">Başlangıç</Label>
              <select
                id="coaching-start"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="mt-1 h-10 w-full rounded-input border border-line bg-surface px-3 text-sm tabular-nums text-ink"
              >
                {COACHING_TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="coaching-end">Bitiş</Label>
              <select
                id="coaching-end"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="mt-1 h-10 w-full rounded-input border border-line bg-surface px-3 text-sm tabular-nums text-ink"
              >
                {COACHING_TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={isMutating} className="gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Aralık ekle
            </Button>
          </form>
        </div>
        <div className="border-t border-line bg-paper px-5 py-3 sm:px-6">
          <p className="text-xs text-ink-mid">
            Aralıklar otomatik olarak 30 dakikalık koçluk slotlarına bölünür.
            Çakışan aralıklar kabul edilmez; bitişik aralıklar (19.00–20.00 ve
            20.00–21.00) kullanılabilir.
          </p>
        </div>
      </CoachingStudioPanel>

      <section aria-labelledby="coaching-week-heading" className="space-y-3">
        <div>
          <h2 id="coaching-week-heading" className="text-lg font-semibold tracking-tight">Haftalık koçluk planın</h2>
          <p className="mt-1 text-sm text-muted-foreground">Her gün görünür kalır; eklediğin görüşme aralıklarını buradan takip edebilirsin.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {byDay.map((day) => (
            <article
              key={day.value}
              className="min-h-36 rounded-card border border-line bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{day.label}</h3>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {day.windows.length > 0 ? `${day.windows.length} aralık` : "Boş"}
                </span>
              </div>
              {day.windows.length === 0 ? (
                <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  Henüz saat eklenmedi.
                </div>
              ) : (
                <ul className="mt-3 space-y-2">
                  {day.windows.map((window) => (
                    <li
                      key={window.id}
                      className="flex items-center justify-between rounded-input border border-line bg-paper py-1.5 pl-3 pr-1 text-sm tabular-nums"
                    >
                      <span>{window.start_time.slice(0, 5)}–{window.end_time.slice(0, 5)}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(window.id)}
                        disabled={isMutating}
                        className="h-8 w-8"
                      >
                        <Trash className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">
                          {day.label} {window.start_time.slice(0, 5)} aralığını sil
                        </span>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>

      {windows.length === 0 ? (
        <div className="rounded-card border border-line bg-paper px-5 py-4 text-sm leading-6 text-ink-mid">
          <strong className="font-semibold text-foreground">Henüz koçluk müsaitliğin yok.</strong>{" "}
          Koçluk saatlerin normal ders saatlerinden ayrıdır. Müsaitlik eklemeden planını yayınlayamazsın.
        </div>
      ) : null}
    </div>
  );
}
