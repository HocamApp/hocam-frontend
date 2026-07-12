"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarPlus,
  Clock3,
  Heart,
  Layers3,
  MessageCircle,
  PanelRightOpen,
  Target,
  Video,
  Wallet,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchBookings,
  getBookingErrorMessage,
  updateBookingStatus,
} from "@/lib/lessonsApi";
import { fetchPackagePurchases } from "@/lib/paymentsApi";
import { fetchLearningDashboard } from "@/lib/learningApi";
import { goalPackageHref } from "@/lib/learning";
import { cn, formatDate } from "@/lib/utils";
import { useCountdownLabel } from "@/hooks/useCountdown";
import { useHighlightTarget, HIGHLIGHT_CLASSNAME, HIGHLIGHT_PARAM } from "@/hooks/useHighlightTarget";
import {
  computePackageExpiry,
  isPastPackage,
  PackageLearningCard,
  PackageLearningDetailsSheet,
} from "@/components/payments/PackagePurchaseCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { RouteGuard } from "@/components/shared/RouteGuard";
import StatusBadge from "@/components/shared/StatusBadge";
import { BookingCard, paymentLabel } from "@/components/lessons/BookingCard";
import {
  LessonConfirmDisputeCard,
} from "@/components/lessons/LessonConfirmDisputeCard";
import { LessonMaterialsDialog } from "@/components/lessons/LessonMaterialsDialog";
import { ReviewModal } from "@/components/lessons/ReviewModal";
import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Booking, PackagePurchase } from "@/types";
import { toast } from "sonner";

const RECENT_LESSON_COUNT = 5;

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
  const [selectedPackage, setSelectedPackage] = useState<PackagePurchase | null>(null);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);

  const {
    data: bookings,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
    enabled: isAuthenticated,
  });
  const highlightedBookingId = useHighlightTarget(!bookingsLoading && !!bookings);
  // /api/bookings/ already returns the student's entire booking history
  // unfiltered — no separate by-id fetch needed to reach a booking outside
  // the past-lessons preview slice, it's already sitting in `bookings`.
  const searchParams = useSearchParams();
  const highlightBookingId = searchParams.get(HIGHLIGHT_PARAM);
  const highlightTargetBooking = highlightBookingId
    ? bookings?.find((b) => b.id === highlightBookingId)
    : undefined;

  const { data: learningDashboard, isLoading: learningLoading } = useQuery({
    queryKey: ["learning-dashboard"],
    queryFn: fetchLearningDashboard,
    enabled: isAuthenticated,
    retry: false,
  });

  const {
    data: packagePurchases,
    isLoading: packagePurchasesLoading,
    isError: packagePurchasesError,
  } = useQuery({
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
    } catch (error) {
      toast.error(getBookingErrorMessage(error, "Rezervasyon güncellenemedi."));
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
  const pendingBookings = sortByStartAsc(
    bookings?.filter(
      (b) =>
        (b.status || "").toLowerCase() === "pending" &&
        new Date(b.start_time) > now
    ) ?? []
  );
  const pastBookings = sortByStartDesc(
    bookings?.filter((b) => {
      const s = (b.status || "").toLowerCase();
      const isConfirmedPast = s === "confirmed" && new Date(b.start_time) <= now;
      return (
        s === "expired" ||
        (s === "pending" && new Date(b.start_time) <= now) ||
        s === "completed" ||
        s === "cancelled" ||
        s === "awaiting_confirmation" ||
        s === "disputed" ||
        isConfirmedPast
      );
    }) ?? []
  );
  const baseRecentPastBookings = pastBookings.slice(0, RECENT_LESSON_COUNT);
  // If the notification's target booking is an older past lesson that fell
  // outside this preview slice, splice it back in (keeping its natural
  // chronological position) so useHighlightTarget can find and flash it —
  // without touching the slice when there's no highlight param. Upcoming
  // and pending sections render every booking already, so no cap to bypass.
  const recentPastBookings =
    highlightTargetBooking &&
    pastBookings.some((b) => b.id === highlightTargetBooking.id) &&
    !baseRecentPastBookings.some((b) => b.id === highlightTargetBooking.id)
      ? pastBookings.filter(
          (b, index) => index < baseRecentPastBookings.length || b.id === highlightTargetBooking.id
        )
      : baseRecentPastBookings;
  const nextLesson = upcomingConfirmed[0] ?? null;
  const restUpcoming = upcomingConfirmed.slice(1);
  const nextTutorName =
    nextLesson && nextLesson.tutor.name
      ? `${nextLesson.tutor.name} ${nextLesson.tutor.surname}`
      : "Eğitmen bilgisi bekleniyor";
  const nextLessonCountdown = nextLesson ? formatLessonCountdown(nextLesson.start_time) : "";
  const liveCountdown = useCountdownLabel(nextLesson ? new Date(nextLesson.start_time) : null);
  const isNextLessonWithinDay = nextLesson
    ? new Date(nextLesson.start_time).getTime() - Date.now() <= 24 * 60 * 60 * 1000
    : false;
  const currentPackagePurchases = (packagePurchases ?? []).filter((purchase) => {
    const expiry = computePackageExpiry(purchase);
    return purchase.status === "pending" || !isPastPackage(purchase, expiry);
  });
  const activePackage = currentPackagePurchases.find(
    (purchase) => purchase.status === "paid" && purchase.remaining_credits > 0
  );
  const pendingPackage = currentPackagePurchases.find(
    (purchase) => purchase.status === "pending"
  );
  const activeGoal = learningDashboard?.goals.find((goal) => goal.status === "active") ?? null;
  const learningHref = activeGoal
    ? goalPackageHref(activeGoal.id)
    : "/dashboard/student/learning";

  const headerMessage = nextLesson
    ? `${formatDate(nextLesson.start_time)} saat ${formatTime(nextLesson.start_time)} için ${nextLesson.subject.name} dersin planlandı.`
    : activePackage
      ? `${activePackage.remaining_credits} ders hakkın hazır. Sonraki dersini planlayarak devam edebilirsin.`
      : pendingPackage
        ? "Paket talebin inceleniyor. Bu sırada doğrulanmış hocaları keşfedebilirsin."
        : "Doğrulanmış bir hoca bularak ilk dersini planlayabilirsin.";
  const headerAction = nextLesson?.room_url
    ? { href: `/session/${nextLesson.id}`, label: "Derse Katıl", icon: Video }
    : activePackage
      ? {
          href: `/tutors/${activePackage.tutor.id}`,
          label: "Sonraki Dersi Planla",
          icon: CalendarPlus,
        }
      : { href: "/tutors", label: "Hoca Bul", icon: CalendarPlus };
  const HeaderActionIcon = headerAction.icon;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Merhaba {firstNameFromUser(user)} 👋
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              {headerMessage}
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href={headerAction.href}>
              <HeaderActionIcon className="mr-2 h-4 w-4" />
              {headerAction.label}
            </Link>
          </Button>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_230px]">
          <main className="space-y-8">
        <LessonConfirmDisputeCard
          bookings={bookings ?? []}
          onChanged={refetchBookings}
        />

        {pendingBookings.length > 0 && (
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Onay Bekleyen Rezervasyonlar
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Hoca onayladığında dersin yaklaşan derslerine taşınacak.
              </p>
            </div>
            <div className="space-y-3">
              {pendingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  id={`booking-${booking.id}`}
                  className={
                    highlightedBookingId === booking.id ? HIGHLIGHT_CLASSNAME : undefined
                  }
                  booking={booking}
                  currentUserRole="student"
                  onStatusUpdate={handleStatusUpdate}
                  isUpdating={updatingId === booking.id}
                />
              ))}
            </div>
          </section>
        )}

        <section id="upcoming-lessons" className="space-y-4 scroll-mt-24">
          <h2 className="text-lg font-semibold tracking-tight">Yaklaşan Derslerim</h2>

          {bookingsLoading ? (
            <Skeleton className="h-56 w-full rounded-xl" />
          ) : nextLesson ? (
            <Card
              id={`booking-${nextLesson.id}`}
              className={cn(
                "overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card",
                highlightedBookingId === nextLesson.id && HIGHLIGHT_CLASSNAME
              )}
            >
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <ParticipantAvatar
                      name={nextTutorName}
                      avatarUrl={nextLesson.tutor.profile_picture}
                      className="h-12 w-12 shrink-0"
                    />
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
                    {(isNextLessonWithinDay ? liveCountdown : nextLessonCountdown) && (
                      <span className="text-xs font-medium text-primary">
                        {isNextLessonWithinDay && liveCountdown
                          ? `Dersine ${liveCountdown} kaldı`
                          : nextLessonCountdown}
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
                    onClick={() => setCancelBooking(nextLesson)}
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
                    id={`booking-${b.id}`}
                    className={highlightedBookingId === b.id ? HIGHLIGHT_CLASSNAME : undefined}
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

        <section id="my-packages" className="space-y-4 scroll-mt-24">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Paketlerim</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Güncel paketlerini ve kalan ders haklarını buradan takip edebilirsin.
              </p>
            </div>
          </div>

          {packagePurchasesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((index) => <Skeleton key={index} className="h-40 w-full rounded-lg" />)}
            </div>
          ) : packagePurchasesError ? (
            <ErrorMessage message="Paketlerin yüklenemedi. Lütfen tekrar deneyin." />
          ) : currentPackagePurchases.length === 0 ? (
            <EmptyState
              title="Güncel paketin yok"
              description="Bir hocanın profilinden avantajlı ders paketi talebinde bulunabilirsin."
              action={<Button asChild><Link href="/tutors">Hoca Bul</Link></Button>}
            />
          ) : (
            <div className="space-y-3">
              {currentPackagePurchases.map((purchase) => (
                <PackageLearningCard
                  key={purchase.id}
                  purchase={purchase}
                  completedLessonCount={
                    (bookings ?? []).filter(
                      (booking) =>
                        booking.package_purchase === purchase.id && booking.status === "completed"
                    ).length
                  }
                  scheduledLessonCount={
                    (bookings ?? []).filter(
                      (booking) =>
                        booking.package_purchase === purchase.id &&
                        new Date(booking.start_time) > new Date() &&
                        booking.status !== "cancelled"
                    ).length
                  }
                  onClick={() => setSelectedPackage(purchase)}
                />
              ))}
            </div>
          )}

          <Button asChild variant="outline" size="sm">
            <Link href="/profile/payments">Tüm ödeme geçmişini gör</Link>
          </Button>
        </section>

        <section className="rounded-2xl border bg-primary/5 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {activeGoal ? <Target className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  Öğrenmeye devam et
                </p>
                {learningLoading ? (
                  <Skeleton className="mt-2 h-5 w-56" />
                ) : activeGoal ? (
                  <>
                    <h2 className="mt-1 truncate font-semibold">{activeGoal.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Hedefinin %{activeGoal.progress} kadarı tamamlandı. Sıradaki adıma geçebilirsin.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="mt-1 font-semibold">Kendine bir öğrenme hedefi seç</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Hazır hedef paketleriyle çalışmalarını adım adım takip et.
                    </p>
                  </>
                )}
              </div>
            </div>
            <Button asChild variant="outline" className="shrink-0 bg-background">
              <Link href={learningHref}>
                {activeGoal ? "Hedefe devam et" : "Hedefleri keşfet"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section id="past-lessons" className="space-y-4 scroll-mt-24">
          <div className="flex w-full items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
            <span className="flex min-w-0 items-center gap-2">
              <Layers3 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                <span className="block text-base font-semibold tracking-tight">
                  Son Derslerin
                </span>
                <span className="block text-sm text-muted-foreground">
                  Materyallere ulaş, dersini değerlendir veya aynı hocayla devam et.
                </span>
              </span>
            </span>
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link href="/profile/lessons/history">
                Tümünü gör
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {bookingsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          ) : pastBookings.length === 0 ? (
            <EmptyState
              title="Henüz geçmiş dersin yok"
              description="Tamamladığın dersler burada birikecek."
            />
          ) : (
            <div className="space-y-3">
              {recentPastBookings.map((b, index) => (
                <div
                  key={b.id}
                  id={`booking-${b.id}`}
                  className={cn(
                    "animate-element",
                    highlightedBookingId === b.id && HIGHLIGHT_CLASSNAME
                  )}
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
              {pastBookings.length > recentPastBookings.length && (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/profile/lessons/history">
                    {pastBookings.length - recentPastBookings.length} dersi daha görüntüle
                  </Link>
                </Button>
              )}
            </div>
          )}
        </section>
          </main>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-2 rounded-lg border bg-card p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <PanelRightOpen className="h-4 w-4 text-muted-foreground" />
                Hızlı erişim
              </div>
              <Button asChild variant="ghost" size="sm" className="w-full justify-start">
                <Link href="/tutors?favorites=1">
                  <Heart className="mr-2 h-4 w-4" />
                  Hocalarım
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  document
                    .getElementById("my-packages")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Paketlerim
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
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

        <PackageLearningDetailsSheet
          purchase={selectedPackage}
          bookings={bookings ?? []}
          open={!!selectedPackage}
          onOpenChange={(open) => {
            if (!open) setSelectedPackage(null);
          }}
        />

        <Dialog
          open={!!cancelBooking}
          onOpenChange={(open) => {
            if (!open) setCancelBooking(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rezervasyonu iptal et</DialogTitle>
              <DialogDescription>
                {cancelBooking?.package_purchase &&
                new Date(cancelBooking.start_time).getTime() - Date.now() <
                  12 * 60 * 60 * 1000
                  ? "Derse 12 saatten az kaldığı için kullandığın paket hakkı iade edilmeyecek. Devam etmek istiyor musun?"
                  : "Bu rezervasyonu iptal etmek istediğine emin misin?"}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelBooking(null)}>
                Vazgeç
              </Button>
              <Button
                variant="destructive"
                disabled={!!cancelBooking && updatingId === cancelBooking.id}
                onClick={() => {
                  if (!cancelBooking) return;
                  const bookingId = cancelBooking.id;
                  setCancelBooking(null);
                  void handleStatusUpdate(bookingId, "cancelled");
                }}
              >
                Rezervasyonu İptal Et
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
