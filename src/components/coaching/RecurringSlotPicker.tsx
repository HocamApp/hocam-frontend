"use client";

import { Badge } from "@/components/ui/badge";
import { COACHING_DAY_LABEL, type CoachingAvailableSlot } from "@/lib/coachingApi";
import { cn } from "@/lib/utils";

export interface PickedSlot {
  slot_index: number;
  day_of_week: number;
  start_time: string;
}

/**
 * The self-service recurring-slot picker.
 *
 * Frequency and the 30-minute session length are never editable here —
 * they come from the tutor's published plan and are shown read-only.
 * `requiredCount` (1 for weekly/biweekly, 2 for twice-weekly) decides how
 * many of `availableSlots` the student must pick before submitting; the
 * caller owns selection state and passes it back in so a slot already
 * locked in via an accepted tutor proposal (`lockedSlots`) can be shown
 * without letting the student pick over it.
 */
export function RecurringSlotPicker({
  requiredCount,
  availableSlots,
  lockedSlots,
  selected,
  onChange,
}: {
  requiredCount: number;
  availableSlots: CoachingAvailableSlot[];
  lockedSlots: Record<number, { day_of_week: number; start_time: string }>;
  selected: PickedSlot[];
  onChange: (next: PickedSlot[]) => void;
}) {
  const openIndexes = Array.from({ length: requiredCount }, (_, i) => i).filter(
    (i) => !(i in lockedSlots)
  );
  const nextOpenIndex = openIndexes.find(
    (i) => !selected.some((s) => s.slot_index === i)
  );

  const isSelected = (day: number, time: string) =>
    selected.some((s) => s.day_of_week === day && s.start_time === time);

  const toggle = (day: number, time: string) => {
    const existing = selected.find((s) => s.day_of_week === day && s.start_time === time);
    if (existing) {
      onChange(selected.filter((s) => s !== existing));
      return;
    }
    if (nextOpenIndex === undefined) return; // all open slots already filled
    onChange([...selected, { slot_index: nextOpenIndex, day_of_week: day, start_time: time }]);
  };

  return (
    <div className="space-y-4">
      {Object.entries(lockedSlots).length > 0 && (
        <div className="space-y-2">
          {Object.entries(lockedSlots).map(([index, slot]) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 p-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {COACHING_DAY_LABEL[slot.day_of_week]} {slot.start_time.slice(0, 5)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Öğretmenin önerisiyle onaylandı
                </p>
              </div>
              <Badge variant="secondary">Sabit</Badge>
            </div>
          ))}
        </div>
      )}

      {availableSlots.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Şu anda uygun saat listelenmiyor. Aşağıdan öğretmeninden saat talep edebilirsin.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {availableSlots.map((slot) => {
            const active = isSelected(slot.day_of_week, slot.start_time);
            const disabled = !active && nextOpenIndex === undefined;
            return (
              <button
                key={`${slot.day_of_week}-${slot.start_time}`}
                type="button"
                aria-pressed={active}
                disabled={disabled}
                onClick={() => toggle(slot.day_of_week, slot.start_time)}
                className={cn(
                  "rounded-lg border p-3 text-left text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  active
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : disabled
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-muted/40"
                )}
              >
                <p className="font-medium">{COACHING_DAY_LABEL[slot.day_of_week]}</p>
                <p className="text-muted-foreground">{slot.start_time.slice(0, 5)}</p>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {selected.length + Object.keys(lockedSlots).length} / {requiredCount} saat seçildi ·
        her görüşme 30 dakikadır.
      </p>
    </div>
  );
}
