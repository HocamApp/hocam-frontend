"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Booking, LearningActivityStatus } from "@/types";

interface BookingCardProps {
  booking: Booking;
  currentUserRole: "student" | "tutor";
  onStatusUpdate: (
    bookingId: string,
    status: "confirmed" | "completed" | "cancelled"
  ) => void;
  onReviewClick?: (booking: Booking) => void;
  onConfirmLearningProgress?: (booking: Booking) => void;
  isUpdating?: boolean;
  isConfirmingLearning?: boolean;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLearningActivityStatus(status: LearningActivityStatus): string {
  const labels: Record<LearningActivityStatus, string> = {
    planned: "Planlandı",
    pending_confirmation: "Onay bekliyor",
    confirmed: "Onaylandı",
    cancelled: "İptal edildi",
  };

  return labels[status] ?? status;
}

export function BookingCard({
  booking,
  currentUserRole,
  onStatusUpdate,
  onReviewClick,
  onConfirmLearningProgress,
  isUpdating = false,
  isConfirmingLearning = false,
}: BookingCardProps) {
  const rawStatus = booking.status;
  const status =
    typeof rawStatus === "string"
      ? rawStatus.trim().toLowerCase()
      : "";

  const isPending = status === "pending";
  const isConfirmed = status === "confirmed";
  const isCompleted = status === "completed";
  const isCancelled = status === "cancelled";
  const isFuture = new Date(booking.start_time) > new Date();
  const canCancel =
    currentUserRole === "student" && !isCompleted && !isCancelled;
  const learningContext = booking.learning_context;
  const canConfirmLearningProgress =
    currentUserRole === "tutor" &&
    isCompleted &&
    Boolean(learningContext?.activity_id) &&
    learningContext?.status === "pending_confirmation";
  const isLearningProgressConfirmed =
    currentUserRole === "tutor" &&
    isCompleted &&
    learningContext?.status === "confirmed";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold">{booking.subject.name}</span>
          <StatusBadge status={booking.status} type="booking" />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          {currentUserRole === "student" && (
            <>
              <span className="text-muted-foreground">Eğitmen:</span>
              <span>
                {booking.tutor.name
                  ? `${booking.tutor.name} ${booking.tutor.surname}`
                  : "—"}
              </span>
            </>
          )}
          {currentUserRole === "tutor" && (
            <>
              <span className="text-muted-foreground">Öğrenci:</span>
              <span>{booking.student.email}</span>
            </>
          )}
          <span className="text-muted-foreground">Tarih:</span>
          <span>{formatDate(booking.start_time)}</span>
          <span className="text-muted-foreground">Saat:</span>
          <span>{formatTime(booking.start_time)}</span>
          <span className="text-muted-foreground">Süre:</span>
          <span>{booking.duration_minutes} dakika</span>
          <span className="text-muted-foreground">Ücret:</span>
          <span>{formatPrice(booking.price)}</span>
        </div>

        {learningContext && (
          <div className="mt-3 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            <div className="grid gap-1">
              {learningContext.goal?.title && (
                <p>
                  <span className="font-medium text-foreground">Hedef:</span>{" "}
                  {learningContext.goal.title}
                </p>
              )}
              {learningContext.milestone?.title && (
                <p>
                  <span className="font-medium text-foreground">Milestone:</span>{" "}
                  {learningContext.milestone.title}
                </p>
              )}
              {learningContext.topic?.title && (
                <p>
                  <span className="font-medium text-foreground">Konu:</span>{" "}
                  {learningContext.topic.title}
                </p>
              )}
              <p>
                <span className="font-medium text-foreground">İlerleme durumu:</span>{" "}
                {formatLearningActivityStatus(learningContext.status)}
              </p>
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {currentUserRole === "tutor" && (
            <>
              {isPending && (
                <>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onStatusUpdate(booking.id, "confirmed")}
                    disabled={isUpdating}
                  >
                    Onayla
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onStatusUpdate(booking.id, "cancelled")}
                    disabled={isUpdating}
                  >
                    İptal Et
                  </Button>
                </>
              )}
              {isConfirmed && (
                <>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onStatusUpdate(booking.id, "completed")}
                    disabled={isUpdating}
                  >
                    Tamamlandı
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onStatusUpdate(booking.id, "cancelled")}
                    disabled={isUpdating}
                  >
                    İptal Et
                  </Button>
                </>
              )}
              {canConfirmLearningProgress && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onConfirmLearningProgress?.(booking)}
                  disabled={isConfirmingLearning}
                >
                  İlerlemeyi Onayla
                </Button>
              )}
              {isLearningProgressConfirmed && (
                <span className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  İlerleme onaylandı
                </span>
              )}
            </>
          )}

          {currentUserRole === "student" && (
            <>
              {isConfirmed && isFuture && (
                <Button size="sm" variant="outline" disabled>
                  Derse Katıl
                </Button>
              )}
              {canCancel && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onStatusUpdate(booking.id, "cancelled")}
                  disabled={isUpdating}
                >
                  İptal Et
                </Button>
              )}
              {isCompleted && onReviewClick && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReviewClick(booking)}
                  disabled={isUpdating}
                >
                  Değerlendirme Yaz
                </Button>
              )}
            </>
          )}
        </div>

        {currentUserRole === "student" && isConfirmed && isFuture && (
          <p className="mt-2 text-xs text-muted-foreground">
            Ders bağlantısı, dersten önce burada görünecek.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
