"use client";

import { useState } from "react";
import { Calendar, Clock3, FolderOpen, User, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { cn, formatDate, formatDisputeCategory, formatPrice } from "@/lib/utils";
import { Video } from "lucide-react";
import type { Booking, LearningActivityStatus } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BookingCardProps {
  booking: Booking;
  currentUserRole: "student" | "tutor";
  onStatusUpdate: (
    bookingId: string,
    status: "confirmed" | "completed" | "cancelled"
  ) => void;
  onReviewClick?: (booking: Booking) => void;
  reviewDisabledReason?: string;
  onMaterialsClick?: (booking: Booking) => void;
  onConfirmLearningProgress?: (booking: Booking) => void;
  isUpdating?: boolean;
  isConfirmingLearning?: boolean;
  id?: string;
  className?: string;
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

export function paymentLabel(booking: Booking): string {
  if (booking.is_trial) return "Ücretsiz deneme";
  if (booking.package_purchase) return "Paket hakkı kullanıldı";
  return `Ücret: ${formatPrice(booking.price)}`;
}

export function BookingCard({
  booking,
  currentUserRole,
  onStatusUpdate,
  onReviewClick,
  reviewDisabledReason,
  onMaterialsClick,
  onConfirmLearningProgress,
  isUpdating = false,
  isConfirmingLearning = false,
  id,
  className,
}: BookingCardProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const rawStatus = booking.status;
  const status =
    typeof rawStatus === "string"
      ? rawStatus.trim().toLowerCase()
      : "";

  const isPending = status === "pending";
  const isConfirmed = status === "confirmed";
  const isAwaitingConfirmation = status === "awaiting_confirmation";
  const isCompleted = status === "completed";
  const isDisputed = status === "disputed";
  const isPast = new Date(booking.start_time) <= new Date();
  const isFuture = new Date(booking.start_time) > new Date();
  const canCancel =
    currentUserRole === "student" &&
    (isPending || isConfirmed) &&
    isFuture;
  const isLateCancellation =
    isFuture &&
    new Date(booking.start_time).getTime() - Date.now() < 12 * 60 * 60 * 1000;
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
      ? (isPending && isFuture) ||
        (isConfirmed && (Boolean(booking.room_url) || isFuture)) ||
        isAwaitingConfirmation ||
        isDisputed ||
        canConfirmLearningProgress ||
        isLearningProgressConfirmed ||
        ((isCompleted || isPast) && Boolean(onMaterialsClick))
      : (isConfirmed && isFuture) ||
        canCancel ||
        isAwaitingConfirmation ||
        isDisputed ||
        ((isCompleted || isPast) && Boolean(onMaterialsClick)) ||
        (isCompleted && (Boolean(onReviewClick) || Boolean(reviewDisabledReason)));

  const counterpartLabel =
    currentUserRole === "student"
      ? booking.tutor.name
        ? `${booking.tutor.name} ${booking.tutor.surname}`
        : "Eğitmen bilgisi bekleniyor"
      : booking.student.display_name || booking.student.email;

  return (
    <>
    <Card id={id} className={className}>
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
            {paymentLabel(booking)}
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
              {isPending && isFuture && (
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
                    onClick={() => setCancelOpen(true)}
                    disabled={isUpdating}
                  >
                    İptal Et
                  </Button>
                </>
              )}
              {isConfirmed && (
                <>
                  {booking.room_url && (
                    <Button size="sm" variant="secondary" asChild>
                      <a href={`/session/${booking.id}`}>
                        <Video className="mr-2 h-4 w-4" />
                        Derse Gir
                      </a>
                    </Button>
                  )}
                  {isFuture && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setCancelOpen(true)}
                      disabled={isUpdating}
                    >
                      İptal Et
                    </Button>
                  )}
                </>
              )}
              {isAwaitingConfirmation && (
                <span className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  Onay bekliyor
                </span>
              )}
              {isDisputed && (
                <div className="w-full rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs text-orange-900 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-100">
                  <p className="font-medium">
                    İtiraz inceleniyor
                    {booking.dispute_category
                      ? ` · ${formatDisputeCategory(booking.dispute_category)}`
                      : ""}
                  </p>
                  <p className="mt-0.5">
                    Öğrenci bu ders için bir itiraz bildirdi. İnceleme admin tarafından
                    yapılacak.
                  </p>
                </div>
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
              {(isCompleted || isPast) && onMaterialsClick && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMaterialsClick(booking)}
                  disabled={isUpdating}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Ders Materyalleri
                </Button>
              )}
            </>
          )}

          {currentUserRole === "student" && (
            <>
              {isAwaitingConfirmation && (
                <span className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  Onayın bekleniyor
                </span>
              )}
              {isDisputed && (
                <div className="w-full rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs text-orange-900 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-100">
                  <p className="font-medium">
                    İtirazın inceleniyor
                    {booking.dispute_category
                      ? ` · ${formatDisputeCategory(booking.dispute_category)}`
                      : ""}
                  </p>
                  <p className="mt-0.5">
                    Bildirdiğin sorun admin tarafından değerlendiriliyor. Sonuç
                    belli olduğunda bilgilendirileceksin.
                  </p>
                </div>
              )}
              {isConfirmed && isFuture && booking.room_url && (
                <Button size="sm" variant="default" asChild>
                  <a href={`/session/${booking.id}`}>
                    <Video className="mr-2 h-4 w-4" />
                    Derse Katıl
                  </a>
                </Button>
              )}
              {isConfirmed && isFuture && !booking.room_url && (
                <Button size="sm" variant="outline" disabled>
                  Oda hazırlanıyor...
                </Button>
              )}
              {canCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setCancelOpen(true)}
                  disabled={isUpdating}
                >
                  İptal Et
                </Button>
              )}
              {(isCompleted || isPast) && onMaterialsClick && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMaterialsClick(booking)}
                  disabled={isUpdating}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Ders Materyalleri
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
              {isCompleted && !onReviewClick && reviewDisabledReason && (
                <span className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {reviewDisabledReason}
                </span>
              )}
            </>
          )}
        </div>

      </CardContent>
    </Card>
    <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rezervasyonu iptal et</DialogTitle>
          <DialogDescription>
            {currentUserRole === "student" && booking.package_purchase && isLateCancellation
              ? "Derse 12 saatten az kaldığı için kullandığın paket hakkı iade edilmeyecek. Devam etmek istiyor musun?"
              : currentUserRole === "tutor" && isLateCancellation
                ? "Derse 12 saatten az kaldığı için bu iptal profil ceza puanını etkileyebilir. Devam etmek istiyor musun?"
                : "Bu rezervasyonu iptal etmek istediğine emin misin?"}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCancelOpen(false)}>
            Vazgeç
          </Button>
          <Button
            variant="destructive"
            disabled={isUpdating}
            onClick={() => {
              setCancelOpen(false);
              onStatusUpdate(booking.id, "cancelled");
            }}
          >
            Rezervasyonu İptal Et
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
