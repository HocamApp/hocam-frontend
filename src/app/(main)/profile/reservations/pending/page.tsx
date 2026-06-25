"use client";

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
import { updateBookingStatus } from "@/lib/lessonsApi";

function PendingReservationsContent() {
  const queryClient = useQueryClient();
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
    onError: () => toast.error("İşlem gerçekleştirilemedi. Lütfen tekrar deneyin."),
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
                      onClick={() =>
                        mutation.mutate({ id: reservation.id, status: "cancelled" })
                      }
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
