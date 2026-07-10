"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Heart,
  Layers3,
  MessageCircle,
  PanelRightOpen,
  Video,
  Wallet,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchBookings, updateBookingStatus } from "@/lib/lessonsApi";
import { fetchPackagePurchases } from "@/lib/paymentsApi";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { StatCard } from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import { BookingCard, paymentLabel } from "@/components/lessons/BookingCard";
import {
  LessonConfirmDisputeCard,
  actionableConfirmDisputeBookings,
} from "@/components/lessons/LessonConfirmDisputeCard";
import { LessonMaterialsDialog } from "@/components/lessons/LessonMaterialsDialog";
import { ReviewModal } from "@/components/lessons/ReviewModal";
import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Booking } from "@/types";
import { toast } from "sonner";

const PAST_BATCH_SIZE = 6;

function formatHours(hours: number): string {
  if (!hours) return "0";
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
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

// "Bugün"/"Yarın" must follow calendar-day boundaries in the user's local
// timezone (the app treats booking start_time as local, never UTC — see
// CLAUDE.md), not a raw 24h/48h cutoff, so a late-night lesson still reads
// as "Bugün" instead of misclassifying across midnight.
function startOfDay(date: Date): Date {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function formatLessonCountdown(startTime: string): string {
  const diffDays = Math.round(
    (startOfDay(new Date(startTime)).getTime() - startOfDay(new Date()).getTime()) /
      (24 * 60 * 60 * 1000)
  );
  if (diffDays < 0) return "";
  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Yarın";
  return `Derse ${diffDays} gün kaldı`;
}

// Keep in sync with Booking.REVIEW_WINDOW_DAYS on the backend (single
// source of truth there — this only mirrors it for instant UI feedback;
// the server has the final say via ReviewCreateView).
const REVIEW_WINDOW_DAYS = 3;

function reviewDeadlineForBooking(booking: Booking) {
  const completedAt = booking.completed_at
    ? new Date(booking.completed_at)
    : new Date(
        new Date(booking.start_time).getTime() +
          (booking.duration_minutes || 0) * 60 * 1000
      );
  return new Date(completedAt.getTime() + REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

function canReviewBooking(booking: Booking, reviewedBookingIds: Set<string>) {
  if ((booking.status || "").toLowerCase() !== "completed") return false;
  if (reviewedBookingIds.has(booking.id)) return false;
  return Date.now() <= reviewDeadlineForBooking(booking).getTime();
}

function firstNameFromUser(user?: { email?: string } | null) {
  if (!user?.email) return "Öğrenci";
  return user.email.split("@", 1)[0].replace(/[._-]+/g, " ");
}

function StudentDashboardContent() {
  const { user, isAuthenticated } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [materialsBooking, setMaterialsBooking] = useState<Booking | null>(null);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [visiblePastCount, setVisiblePastCount] = useState(PAST_BATCH_SIZE);
  const [isPastOpen, setIsPastOpen] = useState(true);

  const {
    data: bookings,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
    enabled: isAuthenticated,
  });

  const { data: packagePurchases, isLoading: packagePurchasesLoading } = useQuery({
    queryKey: ["package-purchases"],
    queryFn: fetchPackagePurchases,
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

  const nextLesson = upcomingConfirmed[0] ?? null;
  const restUpcoming = upcomingConfirmed.slice(1);
  const nextTutorName =
    nextLesson && nextLesson.tutor.name
      ? `${nextLesson.tutor.name} ${nextLesson.tutor.surname}`
      : "Eğitmen bilgisi bekleniyor";
  const nextLessonCountdown = nextLesson ? formatLessonCountdown(nextLesson.start_time) : "";

  const activePackagePurchases = (packagePurchases ?? []).filter(
    (p) => p.status === "paid" && p.remaining_credits > 0
  );
  const remainingCredits = activePackagePurchases.reduce(
    (sum, p) => sum + p.remaining_credits,
    0
  );

  const pendingActionBookings = actionableConfirmDisputeBookings(bookings ?? []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Merhaba {firstNameFromUser(user)} 👋
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Bugün ders durumun burada. Yaklaşan derslerini takip edebilir, kalan
              haklarını görebilir ve yeni ders planlayabilirsin.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href="/tutors">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Yeni Ders Planla
            </Link>
          </Button>
        </header>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={<Calendar className="h-4 w-4" aria-hidden="true" />}
            label="Yaklaşan ders"
            value={upcomingConfirmed.length}
            detail={nextLesson ? formatDate(nextLesson.start_time) : "Planlanmış ders yok"}
            isLoading={bookingsLoading}
          />
          <StatCard
            icon={<Wallet className="h-4 w-4" aria-hidden="true" />}
            label="Kalan ders hakkı"
            value={remainingCredits}
            detail={
              activePackagePurchases.length > 0
                ? `${activePackagePurchases.length} aktif paket`
                : "Aktif paketin yok"
            }
            isLoading={packagePurchasesLoading}
          />
          <StatCard
            icon={<AlertCircle className="h-4 w-4" aria-hidden="true" />}
            label="Bekleyen işlem"
            value={pendingActionBookings.length}
            detail={
              pendingActionBookings.length > 0
                ? "Onayını bekleyen ders var"
                : "Bekleyen işlem yok"
            }
            isLoading={bookingsLoading}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
            label="Geçmiş ders"
            value={completedBookings.length}
            detail={`${formatHours(completedHours)} saat toplam`}
            isLoading={bookingsLoading}
          />
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_230px]">
          <main className="space-y-8">
        <LessonConfirmDisputeCard
          bookings={bookings ?? []}
          onChanged={refetchBookings}
        />

        <section id="upcoming-lessons" className="space-y-4 scroll-mt-24">
          <h2 className="text-lg font-semibold tracking-tight">Yaklaşan Derslerim</h2>

          {bookingsLoading ? (
            <Skeleton className="h-56 w-full rounded-xl" />
          ) : nextLesson ? (
            <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <ParticipantAvatar name={nextTutorName} className="h-12 w-12 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-primary">
                        Sıradaki dersin
                      </p>
                      <p className="truncate text-lg font-semibold">
                        {nextLesson.subject.name}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {nextTutorName}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusBadge status={nextLesson.status} type="booking" />
                    {nextLessonCountdown && (
                      <span className="text-xs font-medium text-primary">
                        {nextLessonCountdown}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    {formatDate(nextLesson.start_time)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4" aria-hidden="true" />
                    {formatTime(nextLesson.start_time)} · {nextLesson.duration_minutes} dk
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                    {paymentLabel(nextLesson)}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
                  {nextLesson.room_url ? (
                    <Button asChild size="lg">
                      <a href={`/session/${nextLesson.id}`}>
                        <Video className="mr-2 h-4 w-4" />
                        Derse Katıl
                      </a>
                    </Button>
                  ) : (
                    <Button size="lg" variant="outline" disabled>
                      Oda hazırlanıyor...
                    </Button>
                  )}
                  <Button asChild variant="outline">
                    <Link href="/messages">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Mesaj Gönder
                    </Link>
                  </Button>
                  {/* nextLesson is always "confirmed" or "in_progress" per
                      upcomingConfirmed's filter, so cancel is always
                      available here — mirrors BookingCard's canCancel for
                      the same two states. */}
                  <Button
                    variant="outline"
                    className="ml-auto border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleStatusUpdate(nextLesson.id, "cancelled")}
                    disabled={updatingId === nextLesson.id}
                  >
                    İptal Et
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              title="Henüz planlanmış dersin yok."
              description="Hedef sınavına uygun doğrulanmış mentorları keşfederek ilk dersini planlayabilirsin."
              action={
                <Button asChild>
                  <Link href="/tutors">Hoca Bul</Link>
                </Button>
              }
            />
          )}

          {restUpcoming.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Diğer yaklaşan derslerin
              </h3>
              <div className="space-y-3">
                {restUpcoming.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    currentUserRole="student"
                    onStatusUpdate={handleStatusUpdate}
                    isUpdating={updatingId === b.id}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        <section id="past-lessons" className="space-y-4 scroll-mt-24">
          <button
            type="button"
            onClick={() => setIsPastOpen((open) => !open)}
            className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/40"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Layers3 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                <span className="block text-base font-semibold tracking-tight">
                  Geçmiş Dersler
                </span>
                <span className="block text-sm text-muted-foreground">
                  Materyaller, değerlendirmeler ve ders geçmişin tek hatta.
                </span>
              </span>
            </span>
            <span className="ml-3 flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {pastBookings.length}
              </span>
              {isPastOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </span>
          </button>
          {bookingsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          ) : !isPastOpen ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
              Geçmiş dersler kapalı. Açmak için başlığa dokun.
            </div>
          ) : pastBookings.length === 0 ? (
            <EmptyState
              title="Henüz geçmiş dersin yok"
              description="Tamamladığın dersler burada birikecek."
            />
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
                      onReviewClick={
                        canReviewBooking(b, reviewedBookingIds) ? setReviewBooking : undefined
                      }
                      reviewDisabledReason={
                        (b.status || "").toLowerCase() === "completed" &&
                        !reviewedBookingIds.has(b.id) &&
                        !canReviewBooking(b, reviewedBookingIds)
                          ? "Değerlendirme süresi doldu"
                          : undefined
                      }
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
          </main>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-2 rounded-lg border bg-card p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <PanelRightOpen className="h-4 w-4 text-muted-foreground" />
                Hızlı erişim
              </div>
              <Button asChild variant="outline" size="sm" className="w-full justify-start">
                <Link href="/tutors">
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Yeni Ders Planla
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="w-full justify-start">
                <Link href="/tutors?favorites=1">
                  <Heart className="mr-2 h-4 w-4" />
                  Hocalarım
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="w-full justify-start">
                <Link href="/messages">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Mesajlar
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="w-full justify-start">
                <Link href="/profile/payments">
                  <Wallet className="mr-2 h-4 w-4" />
                  Paketlerim
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setIsPastOpen(true);
                  document
                    .getElementById("past-lessons")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <Layers3 className="mr-2 h-4 w-4" />
                Geçmiş dersler
              </Button>
            </div>
          </aside>
        </div>

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
