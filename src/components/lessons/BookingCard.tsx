"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate, formatPrice } from "@/lib/utils";
import { Booking } from "@/types";

interface BookingCardProps {
  booking: Booking;
  currentUserRole: "student" | "tutor";
  onStatusUpdate: (
    bookingId: string,
    status: "confirmed" | "completed" | "cancelled"
  ) => void;
  onReviewClick?: (booking: Booking) => void;
  isUpdating?: boolean;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BookingCard({
  booking,
  currentUserRole,
  onStatusUpdate,
  onReviewClick,
  isUpdating = false,
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

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold">{booking.subject.name}</span>
          <StatusBadge status={booking.status} type="booking" />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Tarih:</span>
          <span>{formatDate(booking.start_time)}</span>
          <span className="text-muted-foreground">Saat:</span>
          <span>{formatTime(booking.start_time)}</span>
          <span className="text-muted-foreground">Süre:</span>
          <span>{booking.duration_minutes} dakika</span>
          <span className="text-muted-foreground">Ücret:</span>
          <span>{formatPrice(booking.price)}</span>
        </div>

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
