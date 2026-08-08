"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import {
  COACHING_DAY_LABEL,
  changeCoachingRecurringSlot,
  extractCoachingErrorMessage,
} from "@/lib/coachingApi";

/**
 * "Düzenli saati değiştir" — moves every FUTURE occurrence of one
 * recurring slot to a new day/time. Past and completed sessions are never
 * touched (enforced server-side). Self-service: the new time must land
 * inside the tutor's published coaching availability — the server is the
 * one source of truth for that, so this form does not pre-validate it
 * beyond basic required-field checks.
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
  const [dayOfWeek, setDayOfWeek] = useState(String(currentDayOfWeek));
  const [startTime, setStartTime] = useState(currentStartTime.slice(0, 5));
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      changeCoachingRecurringSlot({
        purchaseId,
        slotIndex,
        newDayOfWeek: Number(dayOfWeek),
        newStartTime: startTime,
      }),
    onSuccess: () => {
      setError(null);
      setOpen(false);
      toast.success("Düzenli koçluk saatin güncellendi.");
      queryClient.invalidateQueries({ queryKey: ["coaching-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["coaching-my-recurring-slots"] });
    },
    onError: (err) => setError(extractCoachingErrorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Düzenli saati değiştir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Düzenli koçluk saatini değiştir</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Bu değişiklik yalnız henüz gerçekleşmemiş görüşmeleri etkiler; geçmiş ve
            tamamlanmış görüşmelerin tarihleri değişmez. Yeni saat öğretmenin
            yayınladığı koçluk müsaitliği içinde olmalıdır.
          </p>
          {error ? <ErrorMessage message={error} /> : null}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Gün</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
              >
                {Object.entries(COACHING_DAY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Saat</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
