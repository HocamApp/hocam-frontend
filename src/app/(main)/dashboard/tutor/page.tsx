"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchLessonRequests,
  fetchBookings,
  updateBookingStatus,
  updateLessonRequestStatus,
} from "@/lib/lessonsApi";
import { EmptyState } from "@/components/shared/EmptyState";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { BookingCard } from "@/components/lessons/BookingCard";
import { LessonRequestCard } from "@/components/lessons/LessonRequestCard";
import { AvailabilityEditor } from "@/components/tutors/AvailabilityEditor";
import { VerificationForm } from "@/components/tutors/VerificationForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";

function TutorDashboardContent() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

  const { data: lessonRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["lesson-requests"],
    queryFn: fetchLessonRequests,
    enabled: isAuthenticated,
  });

  const {
    data: bookings,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
    enabled: isAuthenticated,
  });

  const handleStatusUpdate = async (
    bookingId: string,
    status: "confirmed" | "completed" | "cancelled"
  ) => {
    setUpdatingId(bookingId);
    try {
      await updateBookingStatus(bookingId, status);
      refetchBookings();
    } catch {
      toast.error("Rezervasyon güncellenemedi.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAcceptRequest = async (lessonRequestId: string) => {
    setUpdatingRequestId(lessonRequestId);
    try {
      const updated = await updateLessonRequestStatus(lessonRequestId, "accepted");
      await queryClient.invalidateQueries({ queryKey: ["lesson-requests"] });
      if (updated.conversation_id) {
        window.location.href = `/messages/${updated.conversation_id}`;
      }
    } catch {
      toast.error("Ders talebi güncellenemedi.");
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const handleDeclineRequest = async (lessonRequestId: string) => {
    setUpdatingRequestId(lessonRequestId);
    try {
      await updateLessonRequestStatus(lessonRequestId, "declined");
      await queryClient.invalidateQueries({ queryKey: ["lesson-requests"] });
    } catch {
      toast.error("Ders talebi güncellenemedi.");
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const activeBookings =
    bookings?.filter((b) => {
      const s = (b.status || "").toLowerCase();
      return s === "pending" || s === "confirmed";
    }) ?? [];
  const pastBookings =
    bookings?.filter((b) => {
      const s = (b.status || "").toLowerCase();
      return s === "completed" || s === "cancelled";
    }) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hoca Panosu</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
        <Link
          href="/dashboard/tutor/edit"
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Profili Düzenle
        </Link>
      </header>

      <Tabs defaultValue="requests">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requests">Mesaj İstekleri</TabsTrigger>
          <TabsTrigger value="bookings">Rezervasyonlar</TabsTrigger>
          <TabsTrigger value="availability">Müsaitlik</TabsTrigger>
          <TabsTrigger value="verification">Doğrulama</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          {requestsLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          )}
          {!requestsLoading && (!lessonRequests || lessonRequests.length === 0) && (
            <EmptyState
              title="Henüz mesaj isteğiniz yok"
              description="Öğrenciler profilinizi ziyaret ederek mesaj isteği gönderebilir"
            />
          )}
          {!requestsLoading && lessonRequests.length > 0 && (
            <div className="space-y-3">
              {lessonRequests.map((lr) => (
                <LessonRequestCard
                  key={lr.id}
                  lessonRequest={lr}
                  currentUserRole="tutor"
                  onAccept={handleAcceptRequest}
                  onDecline={handleDeclineRequest}
                  isUpdating={updatingRequestId === lr.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="mt-6">
          {bookingsLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          )}
          {!bookingsLoading && (
            <>
              <h3 className="mb-2 text-sm font-medium">Yaklaşan Dersler</h3>
              {activeBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">Yok</p>
              ) : (
                <div className="mb-6 space-y-3">
                  {activeBookings.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      currentUserRole="tutor"
                      onStatusUpdate={handleStatusUpdate}
                      isUpdating={updatingId === b.id}
                    />
                  ))}
                </div>
              )}

              <h3 className="mb-2 text-sm font-medium">Geçmiş Dersler</h3>
              {pastBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">Yok</p>
              ) : (
                <div className="space-y-3">
                  {pastBookings.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      currentUserRole="tutor"
                      onStatusUpdate={handleStatusUpdate}
                      isUpdating={updatingId === b.id}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="availability" className="mt-6">
          <AvailabilityEditor />
        </TabsContent>

        <TabsContent value="verification" className="mt-6">
          <VerificationForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function TutorDashboardPage() {
  return (
    <RouteGuard requireAuth requireRole="tutor">
      <TutorDashboardContent />
    </RouteGuard>
  );
}
