"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { LessonItemCard } from "@/components/profile/LessonItemCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { fetchPendingReservations } from "@/lib/profileLessonsApi";
import { getBookingErrorMessage, updateBookingStatus } from "@/lib/lessonsApi";
import type { PendingReservation } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function PendingReservationsContent() {
  const queryClient = useQueryClient();
  const [cancelReservation, setCancelReservation] =
    useState<PendingReservation | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile-pending-reservations"],
    queryFn: fetchPendingReservations,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "confirmed" | "cancelled" }) =>
      updateBookingStatus(id, status),
    onSuccess: (_data, variables) => {
      toast.success(
        variables.status === "confirmed"
          ? "Rezervasyon onaylandı."
          : "Rezervasyon iptal edildi."
      );
      queryClient.invalidateQueries({ queryKey: ["profile-pending-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error) =>
      toast.error(
        getBookingErrorMessage(error, "İşlem gerçekleştirilemedi. Lütfen tekrar deneyin.")
      ),
  });

  return (
    <ProfileScreen
      title="Onay bekleyen rezervasyonlar"
      description="Yanıt bekleyen rezervasyon talepleri."
    >
      {isLoading ? (
        <div className="py-12">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <ErrorMessage message="Rezervasyonlar yüklenemedi. Lütfen tekrar deneyin." />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Bekleyen rezervasyon yok"
          description="Şu anda onay bekleyen bir rezervasyonun bulunmuyor."
        />
      ) : (
        <div className="space-y-3">
          {data.map((reservation) => (
            <LessonItemCard
              key={reservation.id}
              subject={reservation.subject}
              participantName={reservation.participant_name}
              participantRole={reservation.participant_role}
              startTime={reservation.start_time}
              endTime={reservation.end_time}
              status={reservation.status}
              price={reservation.price}
              actions={
                <>
                  {reservation.can_confirm && (
                    <Button
                      size="sm"
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({ id: reservation.id, status: "confirmed" })
                      }
                    >
                      <Check className="mr-1.5 h-4 w-4" />
                      Onayla
                    </Button>
                  )}
                  {reservation.can_cancel && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={mutation.isPending}
                      onClick={() => setCancelReservation(reservation)}
                    >
                      <X className="mr-1.5 h-4 w-4" />
                      İptal Et
                    </Button>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}

      <Dialog
        open={!!cancelReservation}
        onOpenChange={(open) => {
          if (!open) setCancelReservation(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rezervasyonu iptal et</DialogTitle>
            <DialogDescription>
              Ders saatine 12 saatten az kaldıysa kullanılan paket hakkı iade edilmeyebilir.
              Bu rezervasyonu iptal etmek istediğine emin misin?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelReservation(null)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              disabled={mutation.isPending}
              onClick={() => {
                if (!cancelReservation) return;
                const id = cancelReservation.id;
                setCancelReservation(null);
                mutation.mutate({ id, status: "cancelled" });
              }}
            >
              Rezervasyonu İptal Et
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProfileScreen>
  );
}

export default function PendingReservationsPage() {
  return (
    <RouteGuard requireAuth>
      <PendingReservationsContent />
    </RouteGuard>
  );
}
