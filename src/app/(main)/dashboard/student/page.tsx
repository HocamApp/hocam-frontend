"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpenCheck,
  Calendar,
  CheckCircle2,
  Clock3,
  FileQuestion,
  FolderOpen,
  Layers3,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchBookingArtifacts,
  fetchBookingQuestions,
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Booking, LessonArtifactKind } from "@/types";
import { toast } from "sonner";

const PAST_BATCH_SIZE = 6;

function formatHours(hours: number): string {
  if (!hours) return "0";
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

function sortByStartAsc(bookings: Booking[]) {
  return [...bookings].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
}

function sortByStartDesc(bookings: Booking[]) {
  return [...bookings].sort(
    (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );
}

function firstNameFromUser(user?: { email?: string } | null) {
  if (!user?.email) return "Öğrenci";
  return user.email.split("@", 1)[0].replace(/[._-]+/g, " ");
}

function artifactKindLabel(kind: LessonArtifactKind) {
  const labels: Record<LessonArtifactKind, string> = {
    whiteboard: "Whiteboard",
    solved_question: "Çözülen soru",
    material: "Materyal",
  };
  return labels[kind] ?? kind;
}

function LessonMaterialsDialog({
  booking,
  open,
  onOpenChange,
}: {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const bookingId = booking?.id;
  const { data: artifacts = [], isLoading: artifactsLoading } = useQuery({
    queryKey: ["booking-artifacts", bookingId],
    queryFn: () => fetchBookingArtifacts(bookingId as string),
    enabled: open && Boolean(bookingId),
  });
  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ["booking-questions", bookingId],
    queryFn: () => fetchBookingQuestions(bookingId as string),
    enabled: open && Boolean(bookingId),
  });
  const isLoading = artifactsLoading || questionsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ders Materyalleri</DialogTitle>
          <DialogDescription>
            {booking
              ? `${booking.subject.name} dersinden kalan whiteboard, soru ve çalışma dosyaları.`
              : "Ders materyalleri"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Paylaşılan materyaller</h3>
              </div>
              {artifacts.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                  Bu derse henüz materyal eklenmemiş. Whiteboard veya çözülen sorular
                  eklendiğinde burada açılıp indirilebilecek.
                </div>
              ) : (
                <div className="space-y-2">
                  {artifacts.map((artifact) => {
                    const href = artifact.file_url || artifact.external_url;
                    return (
                      <div
                        key={artifact.id}
                        className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">{artifact.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {artifactKindLabel(artifact.kind)}
                          </p>
                          {artifact.description && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {artifact.description}
                            </p>
                          )}
                        </div>
                        {href && (
                          <Button asChild size="sm" variant="outline">
                            <a href={href} target="_blank" rel="noreferrer">
                              Aç / İndir
                            </a>
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <FileQuestion className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Soru altyapısı</h3>
              </div>
              {questions.length === 0 ? (
                <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Çözülebilir soru altyapısı hazır. İleride bu derste çözülen sorular,
                  yanlış havuzu ve tekrar çalışmaları buradan büyüyecek.
                </div>
              ) : (
                <div className="space-y-2">
                  {questions.map((item) => (
                    <div key={item.id} className="rounded-lg border bg-card p-4">
                      <p className="text-sm font-medium">{item.question.prompt}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Zorluk: {item.question.difficulty}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StudentDashboardContent() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [withdrawingRequestId, setWithdrawingRequestId] = useState<string | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [materialsBooking, setMaterialsBooking] = useState<Booking | null>(null);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [visiblePastCount, setVisiblePastCount] = useState(PAST_BATCH_SIZE);

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
  const upcomingConfirmed = sortByStartAsc(
    bookings?.filter((b) => {
      const s = (b.status || "").toLowerCase();
      return s === "in_progress" || (s === "confirmed" && new Date(b.start_time) > now);
    }) ?? []
  );
  const pastBookings = sortByStartDesc(
    bookings?.filter((b) => {
      const s = (b.status || "").toLowerCase();
      const isConfirmedPast = s === "confirmed" && new Date(b.start_time) <= now;
      return (
        s === "completed" ||
        s === "cancelled" ||
        s === "awaiting_confirmation" ||
        s === "disputed" ||
        isConfirmedPast
      );
    }) ?? []
  );
  const visiblePastBookings = pastBookings.slice(0, visiblePastCount);
  const completedBookings =
    bookings?.filter((b) => (b.status || "").toLowerCase() === "completed") ?? [];
  const completedHours =
    completedBookings.reduce((sum, b) => sum + (b.duration_minutes || 0), 0) / 60;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <header className="flex flex-col gap-4 border-b pb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Öğrenci Panosu
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Merhaba {firstNameFromUser(user)}. Sıradaki derslerini takip et,
              derse gir ve geçmiş çalışmalarına buradan dön.
            </p>
          </div>
        </header>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Yaklaşan Derslerim</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Panoya girdiğinde en hızlı ulaşman gereken dersler burada.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/tutors">Hoca Bul</Link>
            </Button>
          </div>

          {bookingsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          ) : upcomingConfirmed.length === 0 ? (
            <EmptyState
              title="Yaklaşan onaylı dersin yok"
              description="Bir hoca ile ders planlandığında ilk olarak burada görünecek."
              action={
                <Button asChild>
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

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold tracking-tight">Ders Taleplerim</h2>
            {activeLessonRequests.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {activeLessonRequests.length}
              </span>
            )}
          </div>
          {requestsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : activeLessonRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
              Açık ders talebin yok.
            </div>
          ) : (
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
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold tracking-tight">Geçmiş Dersler</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {pastBookings.length}
            </span>
          </div>
          {bookingsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          ) : pastBookings.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
              Geçmiş derslerin burada birikecek.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {visiblePastBookings.map((b, index) => (
                  <div
                    key={b.id}
                    className="animate-element"
                    style={{ animationDelay: `${Math.min(index, 5) * 45}ms` }}
                  >
                    <BookingCard
                      booking={b}
                      currentUserRole="student"
                      onStatusUpdate={handleStatusUpdate}
                      onMaterialsClick={setMaterialsBooking}
                      onReviewClick={reviewedBookingIds.has(b.id) ? undefined : setReviewBooking}
                      isUpdating={updatingId === b.id}
                    />
                  </div>
                ))}
              </div>
              {visiblePastCount < pastBookings.length && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setVisiblePastCount((count) => count + PAST_BATCH_SIZE)}
                  >
                    Daha fazla göster
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Ders Özeti</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={<Calendar className="h-4 w-4" aria-hidden="true" />}
              label="Yaklaşan ders"
              value={upcomingConfirmed.length}
              detail="Sıradaki onaylı derslerin"
              isLoading={bookingsLoading}
            />
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
          </div>
        </section>

        {reviewBooking && (
          <ReviewModal
            booking={reviewBooking}
            isOpen={!!reviewBooking}
            onClose={() => setReviewBooking(null)}
            onSuccess={() => {
              if (reviewBooking) {
                setReviewedBookingIds((prev) => new Set(prev).add(reviewBooking.id));
              }
              setReviewBooking(null);
              refetchBookings();
            }}
          />
        )}

        <LessonMaterialsDialog
          booking={materialsBooking}
          open={!!materialsBooking}
          onOpenChange={(open) => {
            if (!open) setMaterialsBooking(null);
          }}
        />
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
