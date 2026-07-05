"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, CheckCircle2, Clock3 } from "lucide-react";
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
import { StatCard } from "@/components/shared/StatCard";
import { BookingCard } from "@/components/lessons/BookingCard";
import { LessonRequestCard } from "@/components/lessons/LessonRequestCard";
import { ReviewModal } from "@/components/lessons/ReviewModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Booking } from "@/types";
import { toast } from "sonner";

function formatHours(hours: number): string {
  if (!hours) return "0";
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

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
  const completedBookings =
    bookings?.filter((b) => (b.status || "").toLowerCase() === "completed") ?? [];
  const completedHours =
    completedBookings.reduce((sum, b) => sum + (b.duration_minutes || 0), 0) / 60;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <header className="flex flex-col gap-4 border-b pb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Öğrenci Panosu
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Ders taleplerini, rezervasyonlarını ve geçmiş derslerini buradan yönet.
              {user?.email && <span className="ml-1">· {user.email}</span>}
            </p>
          </div>
        </header>

        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Ders Özeti</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
              label="Tamamlanan ders"
              value={completedBookings.length}
              detail="Bugüne kadar aldığın dersler"
              isLoading={bookingsLoading}
            />
            <StatCard
              icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
              label="Toplam ders saati"
              value={formatHours(completedHours)}
              detail="Tamamlanan derslerin toplam süresi"
              isLoading={bookingsLoading}
            />
            <StatCard
              icon={<Calendar className="h-4 w-4" aria-hidden="true" />}
              label="Yaklaşan onaylı ders"
              value={upcomingConfirmed.length}
              detail="Onaylanmış, henüz gerçekleşmemiş dersler"
              isLoading={bookingsLoading}
            />
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold tracking-tight">Ders Yönetimi</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ders taleplerin ve rezervasyonların eskisi gibi buradan yönetilir.
            </p>
          </div>

          <Tabs defaultValue="requests">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="requests">
                Ders Taleplerim
                {activeLessonRequests.length > 0 && ` (${activeLessonRequests.length})`}
              </TabsTrigger>
              <TabsTrigger value="bookings">
                Rezervasyonlarım
                {bookings && bookings.length > 0 && ` (${bookings.length})`}
              </TabsTrigger>
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
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-sm font-semibold">Yaklaşan Onaylı Dersler</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {upcomingConfirmed.length}
                      </span>
                    </div>
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
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-sm font-semibold">Onay Bekleyen Rezervasyonlar</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {pendingBookings.length}
                      </span>
                    </div>
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
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-sm font-semibold">Geçmiş Dersler</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {pastBookings.length}
                      </span>
                    </div>
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
        </section>

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
