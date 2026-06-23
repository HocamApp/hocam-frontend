"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchLessonRequests,
  fetchBookings,
  updateBookingStatus,
  withdrawLessonRequest,
} from "@/lib/lessonsApi";
import { EmptyState } from "@/components/shared/EmptyState";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { BookingCard } from "@/components/lessons/BookingCard";
import { LessonRequestCard } from "@/components/lessons/LessonRequestCard";
import { ReviewModal } from "@/components/lessons/ReviewModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Booking } from "@/types";
import { toast } from "sonner";

function StudentDashboardContent() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [withdrawingRequestId, setWithdrawingRequestId] = useState<string | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());

  const { data: lessonRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["lesson-requests"],
    queryFn: fetchLessonRequests,
    enabled: isAuthenticated,
  });

  const activeLessonRequests = lessonRequests.filter((lr) => {
    const s = (lr.status || "").toLowerCase();
    return s === "pending" || s === "accepted";
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

  const handleWithdrawRequest = async (lessonRequestId: string) => {
    setWithdrawingRequestId(lessonRequestId);
    try {
      await withdrawLessonRequest(lessonRequestId);
      await queryClient.invalidateQueries({ queryKey: ["lesson-requests"] });
    } catch {
      toast.error("Ders talebi geri alınamadı.");
    } finally {
      setWithdrawingRequestId(null);
    }
  };

  const now = new Date();
  const upcomingConfirmed =
    bookings?.filter((b) => {
      const s = (b.status || "").toLowerCase();
      return s === "confirmed" && new Date(b.start_time) > now;
    }) ?? [];
  const pendingBookings =
    bookings?.filter((b) => (b.status || "").toLowerCase() === "pending") ?? [];
  const pastBookings =
    bookings?.filter((b) => {
      const s = (b.status || "").toLowerCase();
      const isConfirmedPast =
        s === "confirmed" && new Date(b.start_time) <= now;
      return s === "completed" || s === "cancelled" || isConfirmedPast;
    }) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Öğrenci Panosu</h1>
        <p className="text-muted-foreground">{user?.email}</p>
      </header>

      <Tabs defaultValue="requests">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests">Ders Taleplerim</TabsTrigger>
          <TabsTrigger value="bookings">Rezervasyonlarım</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          {requestsLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          )}
          {!requestsLoading && activeLessonRequests.length === 0 && (
            <EmptyState
              title="Henüz ders talebiniz yok"
              description="Bir hoca profili ziyaret ederek ders talebi gönderin"
              action={
                <Button asChild>
                  <Link href="/tutors">Hoca Bul</Link>
                </Button>
              }
            />
          )}
          {!requestsLoading && activeLessonRequests.length > 0 && (
            <div className="space-y-3">
              {activeLessonRequests.map((lr) => (
                <LessonRequestCard
                  key={lr.id}
                  lessonRequest={lr}
                  currentUserRole="student"
                  onWithdraw={handleWithdrawRequest}
                  isWithdrawing={withdrawingRequestId === lr.id}
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
              <section className="mb-8">
                <h3 className="mb-3 text-sm font-semibold">Yaklaşan Onaylı Dersler</h3>
                {upcomingConfirmed.length === 0 ? (
                  <EmptyState
                    title="Yaklaşan onaylı dersiniz yok"
                    description="Hoca ile rezervasyon oluşturulduktan ve onaylandıktan sonra burada görünecek"
                    action={
                      <Button asChild variant="outline" size="sm">
                        <Link href="/tutors">Hoca Bul</Link>
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {upcomingConfirmed.map((b) => (
                      <BookingCard
                        key={b.id}
                        booking={b}
                        currentUserRole="student"
                        onStatusUpdate={handleStatusUpdate}
                        isUpdating={updatingId === b.id}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="mb-8">
                <h3 className="mb-3 text-sm font-semibold">Onay Bekleyen Rezervasyonlar</h3>
                {pendingBookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Yok</p>
                ) : (
                  <div className="space-y-3">
                    {pendingBookings.map((b) => (
                      <BookingCard
                        key={b.id}
                        booking={b}
                        currentUserRole="student"
                        onStatusUpdate={handleStatusUpdate}
                        isUpdating={updatingId === b.id}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold">Geçmiş Dersler</h3>
                {pastBookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Yok</p>
                ) : (
                  <div className="space-y-3">
                    {pastBookings.map((b) => (
                      <BookingCard
                        key={b.id}
                        booking={b}
                        currentUserRole="student"
                        onStatusUpdate={handleStatusUpdate}
                        onReviewClick={reviewedBookingIds.has(b.id) ? undefined : setReviewBooking}
                        isUpdating={updatingId === b.id}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </TabsContent>
      </Tabs>

      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          isOpen={!!reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => {
            if (reviewBooking) setReviewedBookingIds((prev) => new Set(prev).add(reviewBooking.id));
            setReviewBooking(null);
            refetchBookings();
          }}
        />
      )}
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <StudentDashboardContent />
    </RouteGuard>
  );
}
