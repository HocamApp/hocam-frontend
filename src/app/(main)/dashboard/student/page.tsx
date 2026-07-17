"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  MessageCircle,
  Wallet,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useCountdownLabel } from "@/hooks/useCountdown";
import {
  HIGHLIGHT_CLASSNAME,
  useHighlightTarget,
} from "@/hooks/useHighlightTarget";
import { fetchBookings } from "@/lib/lessonsApi";
import { fetchPackagePurchases } from "@/lib/paymentsApi";
import { fetchLearningDashboard } from "@/lib/learningApi";
import { goalPackageHref } from "@/lib/learning";
import { cn, formatDate } from "@/lib/utils";
import {
  computePackageExpiry,
  isPastPackage,
  PackageLearningCard,
  PackageLearningDetailsSheet,
} from "@/components/payments/PackagePurchaseCard";
import {
  actionableConfirmDisputeBookings,
  LessonConfirmDisputeCard,
} from "@/components/lessons/LessonConfirmDisputeCard";
import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import { LessonJoinButton } from "@/components/lessons/LessonJoinButton";
import { LearningMomentumCard } from "@/components/dashboard/student/LearningMomentumCard";
import { AISupportChatWidget } from "@/components/ai/AISupportChatWidget";
import { STUDENT_DASHBOARD_ASSISTANT } from "@/components/ai/pageAssistantContent";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { RouteGuard } from "@/components/shared/RouteGuard";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Booking, PackagePurchase } from "@/types";

const DASHBOARD_PREVIEW_COUNT = 3;
const LESSON_COUNTDOWN_WINDOW_MS = 60 * 60 * 1000;

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sortByStart(bookings: Booking[], direction: "asc" | "desc" = "asc") {
  return [...bookings].sort((a, b) => {
    const difference =
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    return direction === "asc" ? difference : -difference;
  });
}

function startOfDay(date: Date): Date {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function formatLessonDay(startTime: string): string {
  const diffDays = Math.round(
    (startOfDay(new Date(startTime)).getTime() - startOfDay(new Date()).getTime()) /
      86_400_000
  );
  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Yarın";
  return formatDate(startTime);
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

function firstNameFromUser(user?: { email?: string } | null) {
  if (!user?.email) return "Öğrenci";
  const name = user.email.split("@", 1)[0].replace(/[._-]+/g, " ");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function previewWithHighlight(bookings: Booking[], highlightedId: string | null) {
  const preview = bookings.slice(0, DASHBOARD_PREVIEW_COUNT);
  const highlighted = highlightedId
    ? bookings.find((booking) => booking.id === highlightedId)
    : undefined;
  if (!highlighted || preview.some((booking) => booking.id === highlighted.id)) {
    return preview;
  }
  return [...preview.slice(0, DASHBOARD_PREVIEW_COUNT - 1), highlighted];
}

function CompactBookingRow({
  booking,
  highlighted,
}: {
  booking: Booking;
  highlighted: boolean;
}) {
  const tutorName = booking.tutor.name
    ? `${booking.tutor.name} ${booking.tutor.surname}`
    : "Eğitmen bilgisi bekleniyor";

  return (
    <article
      id={`booking-${booking.id}`}
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between",
        highlighted && HIGHLIGHT_CLASSNAME
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <ParticipantAvatar
          name={tutorName}
          avatarUrl={booking.tutor.profile_picture}
          className="h-10 w-10 shrink-0"
        />
        <div className="min-w-0">
          <p className="truncate font-semibold">{booking.subject.name}</p>
          <p className="truncate text-sm text-muted-foreground">{tutorName}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDate(booking.start_time)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              {formatTime(booking.start_time)}
            </span>
          </p>
        </div>
      </div>
      <StatusBadge status={booking.status} type="booking" />
    </article>
  );
}

function LessonPreview({
  bookings,
  highlightedId,
  emptyTitle,
  emptyDescription,
  href,
  linkLabel,
}: {
  bookings: Booking[];
  highlightedId: string | null;
  emptyTitle: string;
  emptyDescription: string;
  href: string;
  linkLabel: string;
}) {
  const preview = previewWithHighlight(bookings, highlightedId);

  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="font-medium">{emptyTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {preview.map((booking) => (
        <CompactBookingRow
          key={booking.id}
          booking={booking}
          highlighted={highlightedId === booking.id}
        />
      ))}
      <Button asChild variant="ghost" className="w-full">
        <Link href={href}>
          {linkLabel}
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}

function StudentDashboardContent() {
  const { user, isAuthenticated } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<PackagePurchase | null>(null);

  const {
    data: bookings,
    isLoading: bookingsLoading,
    isError: bookingsError,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
    enabled: isAuthenticated,
  });
  const highlightedBookingId = useHighlightTarget(!bookingsLoading && !!bookings);

  const {
    data: learningDashboard,
    isLoading: learningLoading,
  } = useQuery({
    queryKey: ["learning-dashboard"],
    queryFn: fetchLearningDashboard,
    enabled: isAuthenticated,
    retry: false,
  });

  const {
    data: packagePurchases,
    isLoading: packagePurchasesLoading,
    isError: packagePurchasesError,
    refetch: refetchPackages,
  } = useQuery({
    queryKey: ["package-purchases"],
    queryFn: fetchPackagePurchases,
    enabled: isAuthenticated,
  });

  const now = new Date();
  const allBookings = bookings ?? [];
  const upcomingBookings = sortByStart(
    allBookings.filter((booking) => {
      const status = booking.status.toLowerCase();
      return (
        status === "in_progress" ||
        (status === "confirmed" && new Date(booking.start_time) > now)
      );
    })
  );
  const pendingBookings = sortByStart(
    allBookings.filter(
      (booking) =>
        booking.status === "pending" && new Date(booking.start_time) > now
    )
  );
  const pastBookings = sortByStart(
    allBookings.filter((booking) => {
      const status = booking.status.toLowerCase();
      return (
        status === "completed" ||
        status === "cancelled" ||
        status === "expired" ||
        status === "disputed" ||
        status === "awaiting_confirmation" ||
        (new Date(booking.start_time) <= now && status !== "in_progress")
      );
    }),
    "desc"
  );
  const nextLesson = upcomingBookings[0] ?? null;
  const actionableBookings = actionableConfirmDisputeBookings(allBookings);

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
  const featuredPackage = activePackage ?? pendingPackage;
  const activeGoal =
    learningDashboard?.goals.find((goal) => goal.status === "active") ?? null;
  const learningHref = activeGoal
    ? goalPackageHref(activeGoal.id)
    : "/dashboard/student/learning";

  const nextTutorName = nextLesson?.tutor.name
    ? `${nextLesson.tutor.name} ${nextLesson.tutor.surname}`
    : "Eğitmen bilgisi bekleniyor";
  const lessonCountdown = useCountdownLabel(
    nextLesson ? new Date(nextLesson.start_time) : null
  );
  const shouldShowLessonCountdown = Boolean(
    nextLesson &&
      new Date(nextLesson.start_time).getTime() - Date.now() <=
        LESSON_COUNTDOWN_WINDOW_MS
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Öğrenci panelin</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              {greeting()}, {firstNameFromUser(user)} 👋
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Bir sonraki dersin ve bugün tamamlaman gereken işlemler burada.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" size="lg">
              <Link href="/profile/lessons?view=calendar">
                <Calendar className="mr-2 h-4 w-4" />
                Takvimim
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/tutors">
                <CalendarPlus className="mr-2 h-4 w-4" />
                Yeni ders bul
              </Link>
            </Button>
          </div>
        </header>

        {bookingsError && (
          <div className="space-y-3">
            <ErrorMessage
              title="Derslerin yüklenemedi"
              message="Ders bilgilerine şu anda ulaşamıyoruz. Bağlantını kontrol edip tekrar deneyebilirsin."
            />
            <Button variant="outline" onClick={() => void refetchBookings()}>
              Tekrar dene
            </Button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
          <section aria-labelledby="next-lesson-title">
            {bookingsLoading ? (
              <Skeleton className="h-[330px] w-full rounded-2xl" />
            ) : nextLesson ? (
              <Card
                id={`booking-${nextLesson.id}`}
                className={cn(
                  "h-full overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-br from-primary/[0.09] via-card to-card shadow-sm",
                  highlightedBookingId === nextLesson.id && HIGHLIGHT_CLASSNAME
                )}
              >
                <CardContent className="flex h-full flex-col p-5 sm:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                        Bir sonraki dersin
                      </p>
                      <h2 id="next-lesson-title" className="mt-2 text-2xl font-semibold tracking-tight">
                        {nextLesson.subject.name}
                      </h2>
                    </div>
                    <StatusBadge status={nextLesson.status} type="booking" />
                  </div>

                  <div className="mt-6 flex items-center gap-4">
                    <ParticipantAvatar
                      name={nextTutorName}
                      avatarUrl={nextLesson.tutor.profile_picture}
                      className="h-14 w-14 shrink-0 sm:h-16 sm:w-16"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold">{nextTutorName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {nextLesson.subject.exam_type} · {nextLesson.duration_minutes} dakika
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 rounded-xl border bg-background/70 p-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tarih</p>
                        <p className="font-medium">{formatLessonDay(nextLesson.start_time)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock3 className="h-5 w-5 text-primary" aria-hidden="true" />
                      <div>
                        <p className="text-xs text-muted-foreground">Saat</p>
                        <p className="font-medium">
                          {formatTime(nextLesson.start_time)}
                          {shouldShowLessonCountdown && lessonCountdown
                            ? ` · ${lessonCountdown} kaldı`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row">
                    <LessonJoinButton
                      bookingId={nextLesson.id}
                      startTime={nextLesson.start_time}
                      durationMinutes={nextLesson.duration_minutes}
                      status={nextLesson.status}
                      roomUrl={nextLesson.room_url}
                      size="lg"
                    />
                    <Button asChild variant="outline" size="lg">
                      <Link href="/messages">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Mesaj gönder
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full rounded-2xl border-dashed">
                <CardContent className="flex min-h-[330px] flex-col items-center justify-center p-7 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CalendarPlus className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h2 id="next-lesson-title" className="mt-4 text-xl font-semibold">
                    Henüz yaklaşan bir dersin yok
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Hedefine uygun doğrulanmış bir hoca bul ve ilk dersini planla.
                  </p>
                  <Button asChild className="mt-5">
                    <Link href="/tutors">Hoca bul</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>

          <section aria-labelledby="attention-title" className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Önceliklerin
                </p>
                <h2 id="attention-title" className="mt-1 text-lg font-semibold tracking-tight">
                  İşlem gerektirenler
                </h2>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {actionableBookings.length > 0 && (
                <LessonConfirmDisputeCard
                  bookings={allBookings}
                  onChanged={() => void refetchBookings()}
                />
              )}

              {pendingBookings.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                  <div className="flex items-start gap-3">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
                    <div>
                      <p className="font-medium">
                        Hoca onayı bekleniyor · {pendingBookings.length}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">
                        Taleplerin hocalara gönderildi. Şu anda senden bir işlem beklenmiyor.
                      </p>
                      <Button asChild variant="link" size="sm" className="mt-1 h-auto px-0">
                        <Link href="/profile/lessons?tab=upcoming">Rezervasyonları gör</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {pendingPackage && (
                <div className="rounded-xl border p-4">
                  <p className="font-medium">Paket talebin inceleniyor</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {pendingPackage.tutor.name} {pendingPackage.tutor.surname} ile paket talebin alındı. Senden ek bir işlem beklenmiyor.
                  </p>
                </div>
              )}

              {actionableBookings.length === 0 &&
                pendingBookings.length === 0 &&
                !pendingPackage && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                      <div>
                        <p className="font-medium">Her şey yolunda</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Şu anda senden beklenen bir işlem yok.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <LearningMomentumCard
            activeGoal={activeGoal}
            learningLoading={learningLoading}
            bookings={allBookings}
            activePackage={activePackage}
            learningHref={learningHref}
          />

          <section id="my-packages" className="scroll-mt-24 rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Ders hakların
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">Aktif paketlerin</h2>
              </div>
              <Wallet className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>

            <div className="mt-5">
              {packagePurchasesLoading ? (
                <Skeleton className="h-44 w-full rounded-xl" />
              ) : packagePurchasesError ? (
                <div className="space-y-3">
                  <ErrorMessage message="Paket bilgilerin yüklenemedi." />
                  <Button variant="outline" size="sm" onClick={() => void refetchPackages()}>
                    Tekrar dene
                  </Button>
                </div>
              ) : featuredPackage ? (
                <>
                  <PackageLearningCard
                    purchase={featuredPackage}
                    completedLessonCount={allBookings.filter(
                      (booking) =>
                        booking.package_purchase === featuredPackage.id &&
                        booking.status === "completed"
                    ).length}
                    scheduledLessonCount={allBookings.filter(
                      (booking) =>
                        booking.package_purchase === featuredPackage.id &&
                        new Date(booking.start_time) > now &&
                        booking.status !== "cancelled"
                    ).length}
                    onClick={() => setSelectedPackage(featuredPackage)}
                  />
                  {currentPackagePurchases.length > 1 && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Ayrıca {currentPackagePurchases.length - 1} güncel paketin daha var.
                    </p>
                  )}
                </>
              ) : (
                <EmptyState
                  title="Aktif paketin yok"
                  description="Bir hocanın profilinden sana uygun ders planını inceleyebilirsin."
                  action={<Button asChild><Link href="/tutors">Hoca bul</Link></Button>}
                />
              )}
            </div>
            <Button asChild variant="ghost" className="mt-3 w-full">
              <Link href="/profile/payments">
                Tüm paketleri gör
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </section>
        </div>

        <section id="lessons" className="scroll-mt-24 rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Kısa görünüm
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">Derslerim</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Dashboard yalnızca en güncel üç kaydı gösterir.
              </p>
            </div>
          </div>

          {bookingsLoading ? (
            <div className="mt-5 space-y-3">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <Tabs defaultValue={actionableBookings.length > 0 ? "past" : "upcoming"} className="mt-5">
              <TabsList className="grid h-auto w-full grid-cols-3 sm:w-fit">
                <TabsTrigger value="upcoming" className="px-2 text-xs sm:px-3 sm:text-sm">
                  Yaklaşan <span className="ml-1.5 text-xs">{upcomingBookings.length}</span>
                </TabsTrigger>
                <TabsTrigger value="pending" className="px-2 text-xs sm:px-3 sm:text-sm">
                  Onay<span className="hidden sm:inline"> bekleyen</span>{" "}
                  <span className="ml-1 text-xs">{pendingBookings.length}</span>
                </TabsTrigger>
                <TabsTrigger value="past" className="px-2 text-xs sm:px-3 sm:text-sm">
                  Geçmiş <span className="ml-1.5 text-xs">{pastBookings.length}</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming" className="mt-4">
                <LessonPreview
                  bookings={upcomingBookings}
                  highlightedId={highlightedBookingId}
                  emptyTitle="Yaklaşan dersin yok"
                  emptyDescription="Yeni bir ders planladığında burada görünecek."
                  href="/profile/lessons?tab=upcoming"
                  linkLabel="Tüm yaklaşan dersleri gör"
                />
              </TabsContent>
              <TabsContent value="pending" className="mt-4">
                <LessonPreview
                  bookings={pendingBookings}
                  highlightedId={highlightedBookingId}
                  emptyTitle="Onay bekleyen rezervasyonun yok"
                  emptyDescription="Hoca onayı bekleyen talepler burada görünür."
                  href="/profile/lessons?tab=upcoming"
                  linkLabel="Tüm rezervasyonları gör"
                />
              </TabsContent>
              <TabsContent value="past" className="mt-4">
                <LessonPreview
                  bookings={pastBookings}
                  highlightedId={highlightedBookingId}
                  emptyTitle="Henüz geçmiş dersin yok"
                  emptyDescription="Tamamladığın dersler burada birikecek."
                  href="/profile/lessons?tab=history"
                  linkLabel="Tüm ders geçmişini gör"
                />
              </TabsContent>
            </Tabs>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-2xl bg-primary px-5 py-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <p className="text-sm font-medium text-primary-foreground/70">Önerilen sonraki adım</p>
            <h2 className="mt-1 text-xl font-semibold">
              {activeGoal ? "Aktif hedefindeki sıradaki adıma geç" : "Çalışma hedefini netleştir"}
            </h2>
          </div>
          <Button asChild variant="secondary" size="lg" className="shrink-0">
            <Link href={learningHref}>
              {activeGoal ? "Hedefe devam et" : "Hedefleri keşfet"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

        <PackageLearningDetailsSheet
          purchase={selectedPackage}
          bookings={allBookings}
          open={!!selectedPackage}
          onOpenChange={(open) => {
            if (!open) setSelectedPackage(null);
          }}
        />
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <>
        <StudentDashboardContent />
        <AISupportChatWidget
          title={STUDENT_DASHBOARD_ASSISTANT.title}
          welcomeMessage={STUDENT_DASHBOARD_ASSISTANT.welcomeMessage}
          attentionMessages={STUDENT_DASHBOARD_ASSISTANT.attentionMessages}
          starterPrompts={STUDENT_DASHBOARD_ASSISTANT.starterPrompts}
        />
      </>
    </RouteGuard>
  );
}
