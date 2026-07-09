"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { confirmBooking } from "@/lib/lessonsApi";
import { useCountdownLabel } from "@/hooks/useCountdown";
import { DisputeDialog } from "./DisputeDialog";
import { formatDate } from "@/lib/utils";
import type { Booking } from "@/types";

// Mirrors backend apps/lessons/models.py AUTO_CONFIRM_HOURS and
// apps/lessons/services.py STUDENT_ABSENCE_DISPUTE_WINDOW — both 24h.
const WINDOW_HOURS = 24;

function isTutorAbsenceDisputable(booking: Booking): boolean {
  if (booking.status !== "completed") return false;
  if (booking.completion_source !== "tutor") return false;
  if (!booking.completed_at) return false;
  const deadline =
    new Date(booking.completed_at).getTime() + WINDOW_HOURS * 3600_000;
  return Date.now() < deadline;
}

export function actionableConfirmDisputeBookings(bookings: Booking[]): Booking[] {
  return bookings.filter(
    (b) => b.status === "awaiting_confirmation" || isTutorAbsenceDisputable(b)
  );
}

function LessonConfirmDisputeRow({
  booking,
  onChanged,
}: {
  booking: Booking;
  onChanged: () => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);

  const isAwaitingConfirmation = booking.status === "awaiting_confirmation";
  const isTutorAbsence = !isAwaitingConfirmation;

  const deadline = isAwaitingConfirmation
    ? booking.awaiting_confirmation_at
      ? new Date(
          new Date(booking.awaiting_confirmation_at).getTime() +
            WINDOW_HOURS * 3600_000
        )
      : null
    : booking.completed_at
      ? new Date(
          new Date(booking.completed_at).getTime() + WINDOW_HOURS * 3600_000
        )
      : null;
  const countdownLabel = useCountdownLabel(deadline);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await confirmBooking(booking.id);
      toast.success("Ders onaylandı.");
      onChanged();
    } catch {
      toast.error("Ders onaylanamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsConfirming(false);
    }
  };

  const tutorLabel = booking.tutor.name
    ? `${booking.tutor.name} ${booking.tutor.surname}`
    : "Hocan";

  return (
    <Card className="border-amber-200 dark:border-amber-900/60">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {booking.subject.name} · {tutorLabel}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatDate(booking.start_time)}
            </p>

            {isAwaitingConfirmation ? (
              <p className="mt-2 text-sm">
                Bu ders tamamlandı olarak işaretlendi. Sorun yoksa onaylayabilirsin.
                {countdownLabel && (
                  <>
                    {" "}
                    Onaylamazsan{" "}
                    <span className="font-medium">{countdownLabel}</span> sonra
                    otomatik onaylanır.
                  </>
                )}
              </p>
            ) : (
              <p className="mt-2 text-sm">
                Hocan bu derste katılmadığını bildirdi ve ders tamamlandı olarak
                işaretlendi. Bu doğru değilse itiraz edebilirsin.
                {countdownLabel && (
                  <>
                    {" "}
                    İtiraz penceresi{" "}
                    <span className="font-medium">{countdownLabel}</span> sonra
                    kapanır.
                  </>
                )}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {isAwaitingConfirmation && (
                <Button size="sm" onClick={handleConfirm} disabled={isConfirming}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Dersi Onayla
                </Button>
              )}
              <Button
                size="sm"
                variant={isAwaitingConfirmation ? "ghost" : "destructive"}
                onClick={() => setDisputeOpen(true)}
                disabled={isConfirming}
              >
                Sorun Bildir
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      <DisputeDialog
        booking={booking}
        isOpen={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        onSuccess={() => {
          toast.success("İtirazın alındı. Admin en kısa sürede inceleyecek.");
          onChanged();
        }}
      />
    </Card>
  );
}

export function LessonConfirmDisputeCard({
  bookings,
  onChanged,
}: {
  bookings: Booking[];
  onChanged: () => void;
}) {
  const actionable = actionableConfirmDisputeBookings(bookings);
  if (actionable.length === 0) return null;

  return (
    <div className="space-y-3">
      {actionable.map((booking) => (
        <LessonConfirmDisputeRow key={booking.id} booking={booking} onChanged={onChanged} />
      ))}
    </div>
  );
}
