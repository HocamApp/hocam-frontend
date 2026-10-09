"use client";

import { useId, useMemo, useState } from "react";
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
  extractCoachingErrorMessage,
  fetchCoachingRescheduleOptions,
  requestCoachingSessionReschedule,
  type CoachingRescheduleOption,
  type CoachingSessionItem,
} from "@/lib/coachingApi";
import { coachingDateTimeLabel, coachingLocalDateHeading } from "@/lib/coachingTime";

type Choice = { localDate: string; localTime: string };

function groupByDay(options: CoachingRescheduleOption[]) {
  const days = new Map<string, CoachingRescheduleOption[]>();
  for (const option of options) {
    const list = days.get(option.local_date) ?? [];
    list.push(option);
    days.set(option.local_date, list);
  }
  return Array.from(days.entries());
}

/**
 * Single-session reschedule (master spec §17), Preply-style: the student
 * picks from the tutor's free coaching hours inside the session's own week.
 * A time outside that list can still be proposed; it always goes to the
 * tutor. Whether a move applies at once is the server's decision (24h rule,
 * one free change, published availability); this dialog only says what the
 * server reported and submits the choice.
 */
export function RescheduleDialog({ session }: { session: CoachingSessionItem }) {
  const queryClient = useQueryClient();
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [custom, setCustom] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  const optionsQuery = useQuery({
    queryKey: ["coaching-reschedule-options", session.id],
    queryFn: () => fetchCoachingRescheduleOptions(session.id),
    enabled: open,
  });

  const days = useMemo(
    () => groupByDay(optionsQuery.data?.options ?? []),
    [optionsQuery.data],
  );

  const target: Choice | null = custom
    ? customDate && customTime
      ? { localDate: customDate, localTime: customTime }
      : null
    : choice;

  const mutation = useMutation({
    mutationFn: (picked: Choice) =>
      requestCoachingSessionReschedule(session.id, {
        localDate: picked.localDate,
        localTime: picked.localTime,
      }),
    onSuccess: (result) => {
      // Clear the pick too: the old choice is now the session's own time.
      reset(false);
      queryClient.invalidateQueries({ queryKey: ["coaching-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["coaching-reschedule-options", session.id] });
      toast.success(
        result.status === "auto_approved"
          ? "Görüşme yeni saate taşındı."
          : "Değişiklik talebin hocana iletildi. Yanıtını bildirim olarak alacaksın.",
      );
    },
    onError: (err) => setError(extractCoachingErrorMessage(err)),
  });

  const reset = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setChoice(null);
      setCustom(false);
      setCustomDate("");
      setCustomTime("");
      setError(null);
    }
  };

  const periodWindow = optionsQuery.data?.window ?? session.reschedule_window;
  const appliesNow = optionsQuery.data?.free_change_applies_now ?? false;

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          aria-label={`${coachingDateTimeLabel(session.scheduled_start)} görüşmesini yeniden planla`}
        >
          Yeniden planla
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100dvw-2rem)] max-w-lg overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle>Görüşmeyi yeniden planla</DialogTitle>
          <DialogDescription>
            Şu anki saat: {coachingDateTimeLabel(session.scheduled_start)}. Görüşme yalnız kendi
            haftası içinde taşınabilir. Saatler Türkiye saatidir.
          </DialogDescription>
        </DialogHeader>

        {optionsQuery.isLoading ? (
          <div className="h-24 animate-pulse rounded-input bg-skeleton" aria-label="Uygun saatler yükleniyor" />
        ) : optionsQuery.isError ? (
          <CoachingLoadError
            message="Uygun saatler yüklenemedi."
            onRetry={() => optionsQuery.refetch()}
            isRetrying={optionsQuery.isFetching}
          />
        ) : (
          <div className="space-y-4">
            <p className="text-small text-ink-mid">
              {appliesNow
                ? "Listeden seçtiğin saat hemen geçerli olur; bu görüşmenin ücretsiz değişiklik hakkını kullanır."
                : "Bu görüşme için değişiklik hocanın onayına gider (24 saatten az kaldı ya da ücretsiz hakkın kullanıldı)."}
            </p>

            {!custom ? (
              days.length ? (
                <div className="space-y-3">
                  {days.map(([day, options]) => (
                    <fieldset key={day} className="space-y-2">
                      <legend className="text-small font-medium text-ink">
                        {coachingLocalDateHeading(day)}
                      </legend>
                      <div className="flex flex-wrap gap-2" role="radiogroup">
                        {options.map((option) => {
                          const selected =
                            choice?.localDate === option.local_date &&
                            choice?.localTime === option.local_time;
                          return (
                            <button
                              key={option.start}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              aria-label={`${coachingLocalDateHeading(day)} ${option.local_time}`}
                              onClick={() =>
                                setChoice({ localDate: option.local_date, localTime: option.local_time })
                              }
                              className={cn(
                                "min-h-11 min-w-[4.5rem] rounded-input border px-3 text-body font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2",
                                selected
                                  ? "border-pink-deep bg-pink-deep text-white"
                                  : "border-line text-ink hover:border-ink",
                              )}
                            >
                              {option.local_time}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  ))}
                </div>
              ) : (
                <p className="rounded-input border border-line p-4 text-body text-ink-mid">
                  Bu hafta hocanın boş koçluk saati kalmadı. Başka bir saat önerebilirsin; öneri
                  hocanın onayına gider.
                </p>
              )
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor={`${ids}-date`} className="text-small font-medium text-ink">
                    Tarih
                  </label>
                  <input
                    id={`${ids}-date`}
                    type="date"
                    min={periodWindow?.starts_on}
                    max={periodWindow?.ends_on}
                    value={customDate}
                    onChange={(event) => setCustomDate(event.target.value)}
                    className="min-h-11 w-full rounded-input border border-line bg-surface px-3 text-body text-ink"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor={`${ids}-time`} className="text-small font-medium text-ink">
                    Saat
                  </label>
                  <input
                    id={`${ids}-time`}
                    type="time"
                    step={1800}
                    value={customTime}
                    onChange={(event) => setCustomTime(event.target.value)}
                    className="min-h-11 w-full rounded-input border border-line bg-surface px-3 text-body text-ink"
                  />
                </div>
                <p className="text-small text-ink-mid sm:col-span-2">
                  Listede olmayan saatler her zaman hocanın onayına gider.
                </p>
              </div>
            )}

            <button
              type="button"
              className="text-small font-medium text-ink underline underline-offset-4"
              onClick={() => {
                setCustom((value) => !value);
                setError(null);
              }}
            >
              {custom ? "Hocanın boş saatlerine dön" : "Listede uygun saat yok mu? Başka bir saat öner"}
            </button>

            <InlineError message={error} />
          </div>
        )}

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => reset(false)}>
            Vazgeç
          </Button>
          <Button
            type="button"
            disabled={!target || mutation.isPending}
            onClick={() => target && mutation.mutate(target)}
          >
            {mutation.isPending
              ? "Gönderiliyor…"
              : custom || !appliesNow
                ? "Talebi gönder"
                : "Saati değiştir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
