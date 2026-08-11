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
  extractCoachingErrorMessage,
  requestCoachingSessionReschedule,
  type CoachingSessionItem,
} from "@/lib/coachingApi";

/**
 * Single-session reschedule (master spec §17).
 *
 * Whether this move ends up free or needs the tutor's approval is decided
 * entirely server-side (the 24h rule + the one-standard-free-reschedule
 * entitlement); this dialog just submits a proposed time and shows
 * whatever the server decided.
 */
export function RescheduleDialog({ session }: { session: CoachingSessionItem }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      requestCoachingSessionReschedule(session.id, { localDate: date, localTime: time }),
    onSuccess: (result) => {
      setError(null);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["coaching-sessions"] });
      if (result.status === "auto_approved") {
        toast.success("Görüşme yeni saate taşındı.");
      } else {
        toast.success("Değişiklik talebi öğretmenine iletildi.");
      }
    },
    onError: (err) => setError(extractCoachingErrorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Yeniden planla
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Görüşmeyi yeniden planla</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Görüşme başına bir ücretsiz yeniden planlama hakkın var. En az 24 saat
            önceden yapılan ilk değişiklik otomatik onaylanır; sonraki değişiklikler
            öğretmen onayına bağlıdır.
          </p>
          {error ? <ErrorMessage message={error} /> : null}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tarih</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Saat</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!date || !time || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Gönderiliyor..." : "Talebi gönder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
