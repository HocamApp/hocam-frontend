"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { cn } from "@/lib/utils";
import {
  COACHING_DAY_LABEL,
  changeCoachingRecurringSlot,
  extractCoachingErrorMessage,
  fetchCoachingRecurringSlotOptions,
} from "@/lib/coachingApi";
import { groupSlotsByDay } from "@/lib/coachingStudentSchedule";

/**
 * "Düzenli saati değiştir": moves every FUTURE occurrence of one recurring
 * slot to a new weekly time. Past and completed sessions are never touched
 * (enforced server-side). The choices come from the server when the dialog
 * opens: the tutor's other published coaching hours, without the ones one of
 * the future weeks would clash on, so the student is not offered an hour that
 * is refused after Kaydet. The server still decides on submit.
 */
export function RecurringSlotChangeDialog({
  purchaseId,
  slotIndex,
  currentDayOfWeek,
  currentStartTime,
}: {
  purchaseId: string;
  slotIndex: number;
  currentDayOfWeek: number;
  currentStartTime: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<{ day: number; time: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const optionsQuery = useQuery({
    queryKey: ["coaching-recurring-slot-options", purchaseId, slotIndex],
    queryFn: () => fetchCoachingRecurringSlotOptions(slotIndex),
    enabled: open,
  });
  const days = useMemo(() => groupSlotsByDay(optionsQuery.data ?? []), [optionsQuery.data]);

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
      queryClient.invalidateQueries({ queryKey: ["coaching-recurring-slot-options"] });
    },
    onError: (err) => setError(extractCoachingErrorMessage(err)),
  });

  const current = `${COACHING_DAY_LABEL[currentDayOfWeek] ?? ""} ${currentStartTime.slice(0, 5)}`;

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
        <Button size="sm" variant="gold" className="min-h-11" aria-label={`${current} saatini değiştir`}>
          Değiştir
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100dvw-2rem)] max-w-lg overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle>Düzenli koçluk saatini değiştir</DialogTitle>
          <DialogDescription>
            Şu anki saat: {current}. Değişiklik yalnız henüz gerçekleşmemiş görüşmeleri etkiler. Saatler Türkiye
            saatidir.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {optionsQuery.isLoading ? (
            <div className="h-24 animate-pulse rounded-input bg-skeleton" aria-label="Uygun saatler yükleniyor" />
          ) : optionsQuery.isError ? (
            <CoachingLoadError
              message="Uygun saatler yüklenemedi."
              onRetry={() => optionsQuery.refetch()}
              isRetrying={optionsQuery.isFetching}
            />
          ) : days.length ? (
            days.map((group) => (
              <fieldset key={group.day} className="space-y-2">
                <legend className="text-small font-medium text-ink">{group.label}</legend>
                <div className="flex flex-wrap gap-2" role="radiogroup">
                  {group.times.map((time) => {
                    const selected = picked?.day === group.day && picked.time === time.value;
                    return (
                      <button
                        key={time.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={`${group.label} ${time.label}`}
                        onClick={() => setPicked({ day: group.day, time: time.value })}
                        className={cn(
                          "min-h-11 min-w-[4.5rem] rounded-input border px-3 text-body font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2",
                          selected ? "border-pink-deep bg-pink-deep text-white" : "border-line text-ink hover:border-ink",
                        )}
                      >
                        {time.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))
          ) : (
            <p className="rounded-input border border-line p-4 text-body text-ink-mid">
              Şu an geçebileceğin başka bir koçluk saati yok. Farklı bir düzenli saat için hocana mesaj atabilirsin;
              hoca kendi tarafından değiştirebilir.
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
