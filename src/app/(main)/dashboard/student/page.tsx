"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CalendarPlus,
  Clock3,
  Filter,
  Heart,
  Layers3,
  MessageCircle,
  PanelRightOpen,
  Video,
  Wallet,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchBookings, updateBookingStatus } from "@/lib/lessonsApi";
import { fetchPackagePurchases } from "@/lib/paymentsApi";
import { formatDate } from "@/lib/utils";
import {
  computePackageExpiry,
  isPastPackage,
  PackagePurchaseCard,
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
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Booking } from "@/types";
import { toast } from "sonner";

const PAST_BATCH_SIZE = 5;
const ALL_FILTER_VALUE = "__all__";

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

function localDateValue(isoString: string) {
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function StudentDashboardContent() {
  const { user, isAuthenticated } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [materialsBooking, setMaterialsBooking] = useState<Booking | null>(null);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [visiblePastCount, setVisiblePastCount] = useState(PAST_BATCH_SIZE);
  const [pastSubjectFilter, setPastSubjectFilter] = useState(ALL_FILTER_VALUE);
  const [pastTutorFilter, setPastTutorFilter] = useState(ALL_FILTER_VALUE);
  const [pastStartDate, setPastStartDate] = useState("");
  const [pastEndDate, setPastEndDate] = useState("");
  const pastLoadMoreRef = useRef<HTMLDivElement | null>(null);

  const {
    data: bookings,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
    enabled: isAuthenticated,
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
  const pastSubjects = useMemo(
    () =>
      Array.from(new Map(pastBookings.map((booking) => [booking.subject.id, booking.subject])).values()).sort(
        (a, b) => a.name.localeCompare(b.name, "tr")
      ),
    [pastBookings]
  );
  const pastTutors = useMemo(
    () =>
      Array.from(new Map(
        pastBookings.map((booking) => [
          booking.tutor.id,
          `${booking.tutor.name} ${booking.tutor.surname}`.trim() || "Eğitmen bilgisi bekleniyor",
        ])
      ).entries()).sort(([, a], [, b]) => a.localeCompare(b, "tr")),
    [pastBookings]
  );
  const filteredPastBookings = useMemo(
    () =>
      pastBookings.filter((booking) => {
        const bookingDate = localDateValue(booking.start_time);
        return (
          (pastSubjectFilter === ALL_FILTER_VALUE || booking.subject.id === pastSubjectFilter) &&
          (pastTutorFilter === ALL_FILTER_VALUE || booking.tutor.id === pastTutorFilter) &&
          (!pastStartDate || bookingDate >= pastStartDate) &&
          (!pastEndDate || bookingDate <= pastEndDate)
        );
      }),
    [pastBookings, pastSubjectFilter, pastTutorFilter, pastStartDate, pastEndDate]
  );
  const visiblePastBookings = filteredPastBookings.slice(0, visiblePastCount);
  const activePastFilterCount = [
    pastSubjectFilter !== ALL_FILTER_VALUE,
    pastTutorFilter !== ALL_FILTER_VALUE,
    Boolean(pastStartDate),
    Boolean(pastEndDate),
  ].filter(Boolean).length;

  useEffect(() => {
    setVisiblePastCount(PAST_BATCH_SIZE);
  }, [pastSubjectFilter, pastTutorFilter, pastStartDate, pastEndDate]);

  useEffect(() => {
    const target = pastLoadMoreRef.current;
    if (!target || visiblePastCount >= filteredPastBookings.length) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisiblePastCount((count) =>
            Math.min(count + PAST_BATCH_SIZE, filteredPastBookings.length)
          );
        }
      },
      { rootMargin: "240px 0px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [visiblePastCount, filteredPastBookings.length]);

  const clearPastFilters = () => {
    setPastSubjectFilter(ALL_FILTER_VALUE);
    setPastTutorFilter(ALL_FILTER_VALUE);
    setPastStartDate("");
    setPastEndDate("");
  };
  const nextLesson = upcomingConfirmed[0] ?? null;
  const restUpcoming = upcomingConfirmed.slice(1);
  const nextTutorName =
    nextLesson && nextLesson.tutor.name
      ? `${nextLesson.tutor.name} ${nextLesson.tutor.surname}`
      : "Eğitmen bilgisi bekleniyor";
  const nextLessonCountdown = nextLesson ? formatLessonCountdown(nextLesson.start_time) : "";
  const currentPackagePurchases = (packagePurchases ?? []).filter((purchase) => {
    const expiry = computePackageExpiry(purchase);
    return purchase.status === "pending" || !isPastPackage(purchase, expiry);
  });

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
                <PackagePurchaseCard key={purchase.id} purchase={purchase} />
              ))}
            </div>
          )}

          <Button asChild variant="outline" size="sm">
            <Link href="/profile/payments">Tüm ödeme geçmişini gör</Link>
          </Button>
        </section>

        <section id="past-lessons" className="space-y-4 scroll-mt-24">
          <div className="flex w-full items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
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
                {filteredPastBookings.length}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Geçmiş dersleri filtrele">
                    <Filter className="h-4 w-4" />
                    {activePastFilterCount > 0 && (
                      <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                        {activePastFilterCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 space-y-4 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">Geçmiş dersleri filtrele</p>
                    {activePastFilterCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-8 px-2" onClick={clearPastFilters}>
                        <X className="mr-1 h-3.5 w-3.5" /> Temizle
                      </Button>
                    )}
                  </div>
                  <label className="grid gap-1.5 text-sm font-medium">
                    Ders
                    <Select value={pastSubjectFilter} onValueChange={setPastSubjectFilter}>
                      <SelectTrigger><SelectValue placeholder="Tüm dersler" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_FILTER_VALUE}>Tüm dersler</SelectItem>
                        {pastSubjects.map((subject) => <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium">
                    Hoca
                    <Select value={pastTutorFilter} onValueChange={setPastTutorFilter}>
                      <SelectTrigger><SelectValue placeholder="Tüm hocalar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_FILTER_VALUE}>Tüm hocalar</SelectItem>
                        {pastTutors.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1.5 text-sm font-medium">Başlangıç tarihi<Input type="date" value={pastStartDate} onChange={(event) => setPastStartDate(event.target.value)} /></label>
                    <label className="grid gap-1.5 text-sm font-medium">Bitiş tarihi<Input type="date" value={pastEndDate} min={pastStartDate || undefined} onChange={(event) => setPastEndDate(event.target.value)} /></label>
                  </div>
                </PopoverContent>
              </Popover>
            </span>
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
          ) : filteredPastBookings.length === 0 ? (
            <EmptyState
              title="Filtrelerle eşleşen ders yok"
              description="Başka ders, hoca veya tarih aralığı deneyebilirsin."
              action={<Button variant="outline" onClick={clearPastFilters}>Filtreleri temizle</Button>}
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
              {visiblePastCount < filteredPastBookings.length && (
                <div ref={pastLoadMoreRef} className="h-1" aria-label="Daha fazla geçmiş ders yükleniyor" />
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
