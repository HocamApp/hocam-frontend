"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { EmptyState } from "@/components/shared/EmptyState";
import type {
  CoachingAvailabilityPayload,
  CoachingAvailabilityWindow,
} from "@/lib/coachingApi";

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

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Koçluk saatlerini ekle</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Bu saatler yalnız 30 dakikalık koçluk görüşmeleri için kullanılır; normal ders müsaitliğin buraya aktarılmaz.
            </p>
          </div>
          <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-4 sm:items-end">
            <div>
              <Label htmlFor="coaching-day">Gün</Label>
              <select
                id="coaching-day"
                value={dayOfWeek}
                onChange={(event) => setDayOfWeek(Number(event.target.value))}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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
              <Input
                id="coaching-start"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="coaching-end">Bitiş</Label>
              <Input
                id="coaching-end"
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={isMutating}>
              Aralık ekle
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Aralıklar otomatik olarak 30 dakikalık koçluk slotlarına bölünür.
            Çakışan aralıklar kabul edilmez; bitişik aralıklar (19.00–20.00 ve
            20.00–21.00) kullanılabilir.
          </p>
        </CardContent>
      </Card>

      {windows.length === 0 ? (
        <EmptyState
          title="Henüz koçluk müsaitliğin yok"
          description="Koçluk saatlerin normal ders saatlerinden ayrıdır. Müsaitlik eklemeden planını yayınlayamazsın."
        />
      ) : (
        <div className="space-y-3">
          {byDay
            .filter((day) => day.windows.length > 0)
            .map((day) => (
              <Card key={day.value}>
                <CardContent className="pt-6">
                  <h3 className="text-sm font-semibold">{day.label}</h3>
                  <ul className="mt-2 space-y-2">
                    {day.windows.map((window) => (
                      <li
                        key={window.id}
                        className="flex items-center justify-between rounded-md border p-2 text-sm"
                      >
                        <span>
                          {window.start_time.slice(0, 5)}–{window.end_time.slice(0, 5)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(window.id)}
                          disabled={isMutating}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">
                            {day.label} {window.start_time.slice(0, 5)} aralığını sil
                          </span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
