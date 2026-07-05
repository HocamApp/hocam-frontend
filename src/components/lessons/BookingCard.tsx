"use client";

import { Calendar, Clock3, User, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { cn, formatDate, formatPrice } from "@/lib/utils";
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
  const hasActions =
    currentUserRole === "tutor"
      ? isPending || isConfirmed || canConfirmLearningProgress || isLearningProgressConfirmed
      : (isConfirmed && isFuture) || canCancel || (isCompleted && Boolean(onReviewClick));

  const counterpartLabel =
    currentUserRole === "student"
      ? booking.tutor.name
        ? `${booking.tutor.name} ${booking.tutor.surname}`
        : "Eğitmen bilgisi bekleniyor"
      : booking.student.email;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{booking.subject.name}</p>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{counterpartLabel}</span>
            </p>
          </div>
          <div className="shrink-0">
            <StatusBadge status={booking.status} type="booking" />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(booking.start_time)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            {formatTime(booking.start_time)} · {booking.duration_minutes} dk
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
            {formatPrice(booking.price)}
          </span>
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

        <div
          className={cn(
            "flex flex-wrap items-center gap-2",
            hasActions ? "mt-4 border-t pt-3" : "mt-3"
          )}
        >
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
