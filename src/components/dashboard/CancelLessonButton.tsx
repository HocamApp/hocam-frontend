"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getBookingErrorMessage, updateBookingStatus } from "@/lib/lessonsApi";
import { msUntilBooking } from "@/lib/bookingTime";
import type { Booking } from "@/types";

// Mirrors the window BookingCard warns on: inside 12 hours a package credit
// is not returned, so a student must be told before, not after.
const LATE_CANCELLATION_MS = 12 * 60 * 60 * 1000;

export function canCancelLesson(booking: Booking): boolean {
  const untilStart = msUntilBooking(booking.start_time);
  return (
    (booking.status === "pending" || booking.status === "confirmed") &&
    Number.isFinite(untilStart) &&
    untilStart > 0
  );
}

/**
 * Cancelling a lesson used to live only in the lessons workspace, which sat
 * behind the settings menu. With that page folded into the dashboard this is
 * the student's only way to call a lesson off, so it travels with the rows
 * rather than staying in a page nobody could find.
 */
export function CancelLessonButton({ booking }: { booking: Booking }) {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const untilStart = msUntilBooking(booking.start_time);
  const isLate =
    Number.isFinite(untilStart) &&
    untilStart > 0 &&
    untilStart < LATE_CANCELLATION_MS;
  const losesCredit = isLate && Boolean(booking.package_purchase);

  const cancelMutation = useMutation({
    mutationFn: () => updateBookingStatus(booking.id, "cancelled"),
    onSuccess: async () => {
      toast.success("Rezervasyon iptal edildi.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["package-purchases"] }),
        queryClient.invalidateQueries({ queryKey: ["profile-me"] }),
      ]);
    },
    onError: (error) =>
      toast.error(getBookingErrorMessage(error, "Ders iptal edilemedi.")),
  });

  const cancel = () => {
    setConfirmOpen(false);
    cancelMutation.mutate();
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0 text-[var(--error)] hover:bg-paper hover:text-[var(--error)]"
        disabled={cancelMutation.isPending}
        // A cancellation that costs a credit is confirmed; one that costs
        // nothing is not, because a confirmation nobody needs teaches people
        // to click through the ones that matter.
        onClick={() => (losesCredit ? setConfirmOpen(true) : cancel())}
      >
        {cancelMutation.isPending ? "İptal ediliyor…" : "İptal et"}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rezervasyonu iptal et</DialogTitle>
            <DialogDescription>
              Derse 12 saatten az kaldığı için kullandığın paket hakkı iade
              edilmeyecek. Devam etmek istiyor musun?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={cancel}
            >
              Rezervasyonu iptal et
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
