"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/shared/InlineError";
import { cn } from "@/lib/utils";
import {
  COACHING_DAY_LABEL,
  changeCoachingRecurringSlot,
  extractCoachingErrorMessage,
} from "@/lib/coachingApi";

/**
 * "Düzenli saati değiştir" — moves every FUTURE occurrence of one
 * recurring slot to a new weekly time. Past and completed sessions are
 * never touched (enforced server-side). The choices are the tutor's other
 * published coaching hours (the only times a student may move to on their
 * own); a clash with one of the future dates is still refused by the server.
 */
export function RecurringSlotChangeDialog({
  purchaseId,
  slotIndex,
  currentDayOfWeek,
  currentStartTime,
  publishedSlots,
}: {
  purchaseId: string;
  slotIndex: number;
  currentDayOfWeek: number;
  currentStartTime: string;
  publishedSlots: { day_of_week: number; start_time: string }[];
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<{ day: number; time: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (choice: { day: number; time: string }) =>
      changeCoachingRecurringSlot({
        purchaseId,
        slotIndex,
        newDayOfWeek: choice.day,
        newStartTime: choice.time,
      }),
    onSuccess: () => {
      setError(null);
      setOpen(false);
      setPicked(null);
      toast.success("Düzenli koçluk saatin güncellendi.");
      queryClient.invalidateQueries({ queryKey: ["coaching-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["coaching-my-recurring-slots"] });
    },
    onError: (err) => setError(extractCoachingErrorMessage(err)),
  });

  const byDay = new Map<number, string[]>();
  for (const slot of publishedSlots) {
    byDay.set(slot.day_of_week, [...(byDay.get(slot.day_of_week) ?? []), slot.start_time]);
  }
  const days = Array.from(byDay.entries()).sort(([a], [b]) => a - b);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setPicked(null);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Düzenli saati değiştir
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100dvw-2rem)] max-w-lg overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle>Düzenli koçluk saatini değiştir</DialogTitle>
          <DialogDescription>
            Şu anki saat: {COACHING_DAY_LABEL[currentDayOfWeek]} {currentStartTime.slice(0, 5)}.
            Değişiklik yalnız henüz gerçekleşmemiş görüşmeleri etkiler. Saatler Türkiye saatidir.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {days.length ? (
            days.map(([day, times]) => (
              <fieldset key={day} className="space-y-2">
                <legend className="text-small font-medium text-ink">{COACHING_DAY_LABEL[day]}</legend>
                <div className="flex flex-wrap gap-2" role="radiogroup">
                  {times.map((time) => {
                    const selected = picked?.day === day && picked.time === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={`${COACHING_DAY_LABEL[day]} ${time}`}
                        onClick={() => setPicked({ day, time })}
                        className={cn(
                          "min-h-11 min-w-[4.5rem] rounded-input border px-3 text-body font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2",
                          selected ? "border-pink bg-pink text-white" : "border-line text-ink hover:border-ink",
                        )}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))
          ) : (
            <p className="rounded-input border border-line p-4 text-body text-ink-mid">
              Hocanın başka yayınlı koçluk saati yok. Farklı bir düzenli saat için hocana mesaj
              atabilirsin; hoca kendi tarafından değiştirebilir.
            </p>
          )}
          <InlineError message={error} />
        </div>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Vazgeç
          </Button>
          <Button
            type="button"
            disabled={!picked || mutation.isPending}
            onClick={() => picked && mutation.mutate(picked)}
          >
            {mutation.isPending ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
