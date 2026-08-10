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
import { cn, formatDate } from "@/lib/utils";
import {
  computePackageExpiry,
  isPastPackage,
  PackageLearningDetailsSheet,
} from "@/components/payments/PackagePurchaseCard";
import {
  actionableConfirmDisputeBookings,
  LessonConfirmDisputeCard,
} from "@/components/lessons/LessonConfirmDisputeCard";
import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import { LessonJoinButton } from "@/components/lessons/LessonJoinButton";
import { StudentMessagesPreview } from "@/components/dashboard/student/StudentMessagesPreview";
import { AISupportChatWidget } from "@/components/ai/AISupportChatWidget";
import { STUDENT_DASHBOARD_ASSISTANT } from "@/components/ai/pageAssistantContent";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { RouteGuard } from "@/components/shared/RouteGuard";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Booking, PackagePurchase } from "@/types";

const LESSON_COUNTDOWN_WINDOW_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Renew nudge thresholds: a week or less left, or nearly out of credits. */
const RENEW_DAYS_THRESHOLD = 7;
const RENEW_CREDITS_THRESHOLD = 2;

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sortByStart(bookings: Booking[]) {
  return [...bookings].sort((a, b) => {
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
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

function packageDaysLeft(purchase: PackagePurchase): number | null {
  const expiry = computePackageExpiry(purchase);
  if (!expiry) return null;
  if (expiry.isInGrace) return expiry.graceDaysLeft;
  return Math.max(
    0,
    Math.ceil((expiry.termEndDate.getTime() - Date.now()) / DAY_MS)
  );
}

/** Glanceable package-credit strip near the top of the dashboard — Preply-style
 * "hours left" psychology. Clicking the summary opens the package details sheet. */
function CreditStatusStrip({
  activePackage,
  pendingPackage,
  loading,
  error,
  onRetry,
  onSelect,
}: {
  activePackage: PackagePurchase | undefined;
  pendingPackage: PackagePurchase | undefined;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onSelect: (purchase: PackagePurchase) => void;
}) {
  if (loading) {
    return <Skeleton className="h-[68px] w-full rounded-2xl" />;
  }

  if (error) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <ErrorMessage message="Paket bilgilerin yüklenemedi." />
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tekrar dene
        </Button>
      </div>
    );
  }

  if (activePackage) {
    const daysLeft = packageDaysLeft(activePackage);
    const needsRenewal =
      activePackage.remaining_credits <= RENEW_CREDITS_THRESHOLD ||
      (daysLeft !== null && daysLeft <= RENEW_DAYS_THRESHOLD);

    return (
      <div
        className={cn(
          "flex flex-col gap-3 rounded-2xl border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
          needsRenewal &&
            "border-amber-300 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20"
        )}
      >
        <button
          type="button"
          onClick={() => onSelect(activePackage)}
          className="flex min-w-0 items-center gap-3 rounded-lg text-left transition-colors hover:bg-muted/50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold tabular-nums">
              {activePackage.remaining_credits} ders hakkın
              {daysLeft !== null ? ` · ${daysLeft} gün kaldı` : ""}
            </span>
            <span className="block truncate text-sm text-muted-foreground">
              {activePackage.plan.name} — detaylar için tıkla
            </span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {needsRenewal && (
            <Button asChild size="sm">
              <Link href="/tutors">Paketini yenile</Link>
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link href="/profile/payments">
              Tüm paketler
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (pendingPackage) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">Paket talebin inceleniyor</p>
            <p className="truncate text-sm text-muted-foreground">
              {pendingPackage.tutor.name} {pendingPackage.tutor.surname} ile paket talebin alındı. Senden ek bir işlem beklenmiyor.
            </p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link href="/profile/payments">
            Tüm paketler
            <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dashed px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Wallet className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold">Aktif paketin yok</p>
          <p className="text-sm text-muted-foreground">
            Bir hocanın profilinden sana uygun ders planını inceleyebilirsin.
          </p>
        </div>
      </div>
      <Button asChild size="sm" className="shrink-0">
        <Link href="/tutors">Hoca bul</Link>
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

  const hasActionItems = actionableBookings.length > 0;

  return (
    <div className="min-h-full bg-[#fbfaf8]">
      <div className="mx-auto w-full min-w-0 max-w-6xl overflow-x-clip px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="space-y-8">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Panelim</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
              {greeting()}, {firstNameFromUser(user)} 👋
            </h1>
            <p className="mt-2 text-sm text-slate-500">Bugün bilmen gereken her şey burada.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="bg-white" size="lg">
              <Link href="/profile/lessons?view=calendar">
                <Calendar className="mr-2 h-4 w-4" />
                Takvimim
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/tutors">
                <CalendarPlus className="mr-2 h-4 w-4" />
                Hoca bul
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

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
          <section aria-labelledby="next-lesson-title">
            {bookingsLoading ? (
              <Skeleton className="h-[360px] w-full rounded-[28px]" />
            ) : nextLesson ? (
              <Card
                id={`booking-${nextLesson.id}`}
                className={cn(
                  "h-full overflow-hidden rounded-[28px] border-slate-200 bg-white shadow-none",
                  highlightedBookingId === nextLesson.id && HIGHLIGHT_CLASSNAME
                )}
              >
                <CardContent className="flex min-h-[360px] h-full flex-col p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        Bir sonraki dersin
                      </p>
                      <h2 id="next-lesson-title" className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                        {nextLesson.subject.name}
                      </h2>
                    </div>
                    <StatusBadge status={nextLesson.status} type="booking" />
                  </div>

                  <div className="mt-7 flex items-center gap-4">
                    <ParticipantAvatar
                      name={nextTutorName}
                      avatarUrl={nextLesson.tutor.profile_picture}
                      className="h-14 w-14 shrink-0 sm:h-16 sm:w-16"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-slate-950">{nextTutorName}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {nextLesson.subject.exam_type} · {nextLesson.duration_minutes} dakika
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 grid gap-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-slate-700" aria-hidden="true" />
                      <div>
                        <p className="text-xs text-slate-500">Tarih</p>
                        <p className="font-semibold text-slate-950">{formatLessonDay(nextLesson.start_time)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock3 className="h-5 w-5 text-slate-700" aria-hidden="true" />
                      <div>
                        <p className="text-xs text-slate-500">Saat</p>
                        <p className="font-semibold text-slate-950">
                          {formatTime(nextLesson.start_time)}
                          {shouldShowLessonCountdown && lessonCountdown
                            ? ` · ${lessonCountdown} kaldı`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-2 pt-7 sm:flex-row">
                    <LessonJoinButton
                      bookingId={nextLesson.id}
                      startTime={nextLesson.start_time}
                      durationMinutes={nextLesson.duration_minutes}
                      status={nextLesson.status}
                      roomUrl={nextLesson.room_url}
                      size="lg"
                    />
                    <Button asChild variant="outline" size="lg">
                      <Link href={nextLesson.conversation_id ? `/messages/${nextLesson.conversation_id}` : "/messages"}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Mesaj gönder
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full rounded-[28px] border-slate-200 bg-white shadow-none">
                <CardContent className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
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

          <section aria-labelledby="attention-title" className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                      Önceliklerin
                    </p>
                    <h2 id="attention-title" className="mt-2 text-xl font-semibold tracking-[-0.02em] text-slate-950">
                      İşlem gerektirenler
                    </h2>
                  </div>
                  <span className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-2xl",
                    hasActionItems ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                  )}>
                    {hasActionItems ? <AlertCircle className="h-5 w-5" aria-hidden="true" /> : <CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  {!hasActionItems && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                      <p className="font-semibold text-emerald-950">Her şey yolunda</p>
                      <p className="mt-1 text-sm leading-6 text-emerald-800/80">Şu anda senden beklenen bir işlem yok.</p>
                    </div>
                  )}
                  {actionableBookings.length > 0 && (
                    <LessonConfirmDisputeCard
                      bookings={allBookings}
                      onChanged={() => void refetchBookings()}
                    />
                  )}

                  {pendingBookings.length > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
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
                </div>
          </section>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-7" aria-labelledby="package-title">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Ders hakların</p>
                <h2 id="package-title" className="mt-2 text-xl font-semibold tracking-[-0.02em] text-slate-950">Paketin</h2>
              </div>
              <Wallet className="h-5 w-5 text-slate-700" aria-hidden="true" />
            </div>
            <CreditStatusStrip
              activePackage={activePackage}
              pendingPackage={pendingPackage}
              loading={packagePurchasesLoading}
              error={packagePurchasesError}
              onRetry={() => void refetchPackages()}
              onSelect={setSelectedPackage}
            />
          </section>

          <StudentMessagesPreview />
        </div>

        <section id="lessons" className="scroll-mt-24 flex flex-col gap-5 rounded-[28px] border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Derslerin</p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-slate-950">Programını tek yerden yönet</h2>
            <p className="mt-2 text-sm text-slate-500">
              {upcomingBookings.length} yaklaşan ders · {pendingBookings.length} hoca onayı bekleyen rezervasyon
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0 bg-white">
            <Link href="/profile/lessons">
              Derslerimi aç
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
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
