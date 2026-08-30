"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowSquareOut,
  BookOpenText,
  CalendarDots,
  ChatCircle,
  Check,
  Clock,
  FolderOpen,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useCountdownLabel } from "@/hooks/useCountdown";
import { fetchBookings } from "@/lib/lessonsApi";
import { fetchPackagePurchases } from "@/lib/paymentsApi";
import { fetchProfileMe } from "@/lib/profileApi";
import { fetchConversations } from "@/lib/messagingApi";
import { cn } from "@/lib/utils";
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
import { LessonMaterialsDialog } from "@/components/lessons/LessonMaterialsDialog";
import { AISupportChatWidget } from "@/components/ai/AISupportChatWidget";
import { STUDENT_DASHBOARD_ASSISTANT } from "@/components/ai/pageAssistantContent";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Booking, PackagePurchase, ProfileStudent } from "@/types";

const URGENT_LESSON_WINDOW_MS = 30 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const RENEW_DAYS_THRESHOLD = 7;
const RENEW_CREDITS_THRESHOLD = 2;

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sortByStart(bookings: Booking[]) {
  return [...bookings].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
}

function startOfDay(date: Date): Date {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function formatLessonDay(startTime: string, long = false): string {
  const date = new Date(startTime);
  const diffDays = Math.round(
    (startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / DAY_MS
  );
  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Yarın";
  return date.toLocaleDateString("tr-TR", {
    weekday: long ? "long" : "short",
    day: "numeric",
    month: "long",
  });
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

function emailFirstName(email?: string): string {
  if (!email) return "Öğrenci";
  const name = email.split("@", 1)[0].replace(/[._-]+/g, " ");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function packageDaysLeft(purchase: PackagePurchase): number | null {
  const expiry = computePackageExpiry(purchase);
  if (!expiry) return null;
  if (expiry.isInGrace) return expiry.graceDaysLeft;
  return Math.max(0, Math.ceil((expiry.termEndDate.getTime() - Date.now()) / DAY_MS));
}

function tutorName(booking: Booking): string {
  return booking.tutor.name
    ? `${booking.tutor.name} ${booking.tutor.surname}`.trim()
    : "Hoca bilgisi bekleniyor";
}

function weekLessonSummary(bookings: Booking[]): string {
  const weekEnd = Date.now() + 7 * DAY_MS;
  const count = bookings.filter(
    (booking) => new Date(booking.start_time).getTime() <= weekEnd
  ).length;
  if (count === 0) return "Sıradaki dersin hazır olduğunda burada olacak.";
  return `Önündeki 7 günde ${count} dersin var.`;
}

function DashboardGreeting({
  name,
  avatarUrl,
  summary,
}: {
  name: string;
  avatarUrl?: string | null;
  summary: string;
}) {
  return (
    <header className="flex items-center gap-4 sm:gap-6">
      <ParticipantAvatar
        name={name}
        avatarUrl={avatarUrl}
        shape="circle"
        className="h-12 w-12 border border-line sm:h-16 sm:w-16"
      />
      <div className="min-w-0">
        <h1 className="break-words text-balance text-h1-m text-ink md:text-h1">
          {greeting()}, {name}
        </h1>
        <p className="mt-2 text-small text-ink-mid">{summary}</p>
      </div>
    </header>
  );
}

function EmptyStudentDashboard({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string | null;
}) {
  const steps = [
    ["1", "Hocanı bul", "Hedeflerine uygun doğrulanmış hocaları keşfet."],
    ["2", "Tanışma dersini planla", "Ücretsiz ilk dersin için uygun zamanı seç."],
    ["3", "Dersine buradan katıl", "Programını ve derslerini panelinden takip et."],
  ] as const;

  return (
    <div className="space-y-8">
      <DashboardGreeting name={name} avatarUrl={avatarUrl} summary="Hocam’a hoş geldin. Başlamak sandığından kolay." />

      <section className="relative isolate overflow-hidden rounded-modal bg-pink-pale px-6 py-8 sm:px-8 sm:py-12 lg:min-h-[330px] lg:px-12">
        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(240px,5fr)]">
          <div className="max-w-xl">
            <p className="text-label text-ink-mid">İlk adım</p>
            <h2 className="mt-4 text-balance text-h1-m text-ink md:text-h1">
              İlk dersine hazır mısın?
            </h2>
            <p className="mt-4 max-w-[60ch] text-body text-ink-mid sm:text-body-l">
              Sana uygun hocayı bul, ücretsiz tanışma dersini planla ve öğrenmeye başla.
            </p>
            <Button asChild size="lg" className="mt-8 px-8">
              <Link href="/tutors">
                Hoca bul
                <ArrowRight className="ml-2 size-4" weight="regular" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="relative mx-auto h-[240px] w-[240px] sm:h-[280px] sm:w-[280px] lg:h-[300px] lg:w-[300px]">
            <Image
              src="/images/dashboard/student-empty-mascot-long-neck.png"
              alt="Hocam'ın uzun boyunlu ördek maskotu"
              fill
              sizes="(min-width: 1024px) 300px, 280px"
              className="object-contain object-bottom"
              priority
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="getting-started-title" className="rounded-card border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="getting-started-title" className="text-h2-m text-ink md:text-h2">Üç adımda ilk dersin</h2>
          </div>
          <span className="text-small text-ink-mid">Gerisi panelinde seni bekler.</span>
        </div>
        <ol className="mt-8 divide-y divide-line border-y border-line">
          {steps.map(([number, title, description], index) => (
            <li key={number} className="flex gap-4 py-4 sm:items-center sm:gap-6">
              <span className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border text-label tabular-nums",
                index === 0 ? "border-ink bg-ink text-white" : "border-line text-ink"
              )}>
                {number}
              </span>
              <div className="sm:grid sm:flex-1 sm:grid-cols-[minmax(180px,1fr)_minmax(0,2fr)] sm:items-baseline sm:gap-6">
                <h3 className="text-body font-medium text-ink">{title}</h3>
                <p className="mt-1 text-small text-ink-mid sm:mt-0">{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function UrgentLessonBanner({ booking }: { booking: Booking }) {
  const countdown = useCountdownLabel(new Date(booking.start_time));
  return (
    <section aria-label="Yaklaşan ders bildirimi" className="flex flex-col gap-4 rounded-card border border-ink bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-ink text-white">
          <Clock className="size-5" weight="regular" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-body font-medium text-ink">Dersin birazdan başlıyor</p>
          <p className="mt-1 truncate text-small text-ink-mid">
            {booking.subject.name} · {tutorName(booking)} · {formatTime(booking.start_time)}
            {countdown ? ` · ${countdown} kaldı` : ""}
          </p>
        </div>
      </div>
      <LessonJoinButton
        bookingId={booking.id}
        startTime={booking.start_time}
        durationMinutes={booking.duration_minutes}
        status={booking.status}
        roomUrl={booking.room_url}
        size="lg"
        className="shrink-0"
      />
    </section>
  );
}

function NextLessonCard({ booking }: { booking: Booking }) {
  const name = tutorName(booking);
  return (
    <section aria-labelledby="next-lesson-title" className="rounded-card border border-line bg-surface p-6 sm:p-8">
      <div>
        <p className="text-label text-ink-mid">Sıradaki dersin</p>
        <div className="mt-4 grid gap-6 sm:grid-cols-[minmax(0,7fr)_minmax(180px,5fr)] sm:items-center lg:grid-cols-[minmax(0,8fr)_minmax(220px,4fr)]">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <ParticipantAvatar name={name} avatarUrl={booking.tutor.profile_picture} className="h-14 w-14 shrink-0 border border-line sm:h-16 sm:w-16" />
            <div className="min-w-0">
              <h2 id="next-lesson-title" className="truncate text-h2-m text-ink md:text-h2">
                {booking.subject.name}
              </h2>
              <p className="mt-1 truncate text-body font-medium text-ink">{name}</p>
              <p className="mt-1 text-small text-ink-mid">{booking.subject.exam_type} · {booking.duration_minutes} dakika</p>
            </div>
          </div>
          <div className="rounded-input border border-line bg-paper px-4 py-4 sm:px-6">
            <p className="text-label capitalize text-ink-mid">{formatLessonDay(booking.start_time, true)}</p>
            <p className="mt-1 text-h2-m font-bold tabular-nums text-ink md:text-h2">{formatTime(booking.start_time)}</p>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
          <Button asChild size="lg" className="text-white hover:text-white">
            <Link href="/profile/lessons?tab=upcoming">Dersi görüntüle</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="justify-start">
            <Link href={booking.conversation_id ? `/messages/${booking.conversation_id}` : "/messages"}>
              <ChatCircle className="mr-2 size-4" weight="regular" aria-hidden="true" />
              Hocana yaz
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function UpcomingLessons({ bookings }: { bookings: Booking[] }) {
  return (
    <section aria-labelledby="upcoming-lessons-title" className="rounded-card border border-line bg-surface p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="upcoming-lessons-title" className="text-h3-m text-ink md:text-h3">Sonraki 3 ders</h2>
        <Button asChild variant="ghost" size="sm">
          <Link href="/profile/lessons">
            Takvimi aç
            <ArrowSquareOut className="ml-1 size-4" weight="regular" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {bookings.length > 0 ? (
        <ol className="mt-6 divide-y divide-line">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <Link href="/profile/lessons?tab=upcoming" className="grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 rounded-input py-4 transition-colors [transition-duration:120ms] hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2">
                <ParticipantAvatar name={tutorName(booking)} avatarUrl={booking.tutor.profile_picture} className="h-10 w-10 border border-line" />
                <span className="min-w-0">
                  <span className="block truncate text-body font-medium text-ink">{booking.subject.name}</span>
                  <span className="mt-0.5 block truncate text-small text-ink-mid">{tutorName(booking)}</span>
                </span>
                <span className="text-right">
                  <span className="block text-small font-medium capitalize text-ink">{formatLessonDay(booking.start_time)}</span>
                  <span className="mt-0.5 block text-small tabular-nums text-ink-mid">{formatTime(booking.start_time)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-6 flex items-center gap-3 border-y border-line py-4 text-small text-ink-mid">
          <CalendarDots className="size-5 shrink-0" weight="regular" aria-hidden="true" />
          Sıradaki dersinden sonra planlanmış başka bir dersin yok.
        </div>
      )}
    </section>
  );
}

function RecentLessonContent({
  bookings,
  onOpen,
}: {
  bookings: Booking[];
  onOpen: (booking: Booking) => void;
}) {
  return (
    <section aria-labelledby="recent-lessons-title" className="rounded-card border border-line bg-surface p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="recent-lessons-title" className="text-h3-m text-ink md:text-h3">Son derslerin</h2>
          <p className="mt-1 text-small text-ink-mid">Notlarına, dosyalarına ve çözülen sorulara dön.</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link href="/profile/lessons?tab=history">
            <BookOpenText className="mr-1.5 size-4" weight="regular" aria-hidden="true" />
            <span className="hidden sm:inline">Tüm geçmiş dersler</span>
            <span className="sm:hidden">Tümü</span>
            <ArrowSquareOut className="ml-1 size-4" weight="regular" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {bookings.length > 0 ? (
        <ol className="mt-4 divide-y divide-line">
          {bookings.map((booking) => (
            <li key={booking.id} className="flex items-center gap-3 py-4">
              <ParticipantAvatar name={tutorName(booking)} avatarUrl={booking.tutor.profile_picture} className="h-10 w-10 shrink-0 border border-line" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-medium text-ink">{booking.subject.name}</p>
                <p className="mt-0.5 truncate text-small text-ink-mid">{tutorName(booking)} · {formatLessonDay(booking.start_time)}</p>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0" onClick={() => onOpen(booking)}>
                <FolderOpen className="mr-1.5 size-4" weight="regular" aria-hidden="true" />
                İçeriği aç
              </Button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-6 border-y border-line py-4 text-small text-ink-mid">
          Tamamladığın derslerin içerikleri burada birikecek.
        </div>
      )}
    </section>
  );
}

function CreditSummary({
  activePackage,
  pendingPackage,
  loading,
  error,
  onRetry,
  onSelect,
  bookings,
}: {
  activePackage?: PackagePurchase;
  pendingPackage?: PackagePurchase;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onSelect: (purchase: PackagePurchase) => void;
  bookings: Booking[];
}) {
  if (loading) return <Skeleton className="h-[154px] w-full rounded-card" />;
  if (error) {
    return (
      <section className="rounded-card border border-line bg-surface p-6">
        <ErrorMessage message="Ders hakların yüklenemedi." />
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>Tekrar dene</Button>
      </section>
    );
  }
  if (!activePackage && !pendingPackage) return null;

  if (pendingPackage && !activePackage) {
    return (
      <section className="rounded-card border border-line bg-surface p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-ink text-white dark:bg-[var(--ink-on-light)]"><Clock className="size-5" weight="regular" aria-hidden="true" /></span>
          <div>
            <p className="text-body font-medium text-ink">Paket talebin inceleniyor</p>
            <p className="mt-1 text-small text-ink-mid">Senden ek bir işlem beklenmiyor.</p>
            <Link href="/profile/payments" className="mt-3 inline-flex items-center text-small font-medium text-ink transition-colors [transition-duration:120ms] hover:text-pink">Detayları gör <ArrowRight className="ml-1 size-4" weight="regular" aria-hidden="true" /></Link>
          </div>
        </div>
      </section>
    );
  }

  if (!activePackage) return null;
  const daysLeft = packageDaysLeft(activePackage);
  const needsRenewal = activePackage.remaining_credits <= RENEW_CREDITS_THRESHOLD || (daysLeft !== null && daysLeft <= RENEW_DAYS_THRESHOLD);
  const usedCredits = Math.max(0, activePackage.total_credits - activePackage.remaining_credits);
  const progress = activePackage.total_credits > 0
    ? Math.min(100, Math.round((usedCredits / activePackage.total_credits) * 100))
    : 0;
  const scheduledCount = bookings.filter((booking) =>
    booking.package_purchase === activePackage.id &&
    (booking.status === "confirmed" || booking.status === "in_progress") &&
    new Date(booking.start_time).getTime() > Date.now()
  ).length;
  const tutor = `${activePackage.tutor.name} ${activePackage.tutor.surname}`.trim();

  return (
    <section className={cn("relative overflow-hidden rounded-card border bg-surface", needsRenewal ? "border-ink" : "border-line")}>
      <button type="button" onClick={() => onSelect(activePackage)} className="grid w-full gap-6 p-6 text-left transition-colors [transition-duration:120ms] hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink sm:p-8 lg:grid-cols-[minmax(230px,0.8fr)_minmax(320px,1.2fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <ParticipantAvatar name={tutor} avatarUrl={activePackage.tutor.profile_picture} className="h-16 w-16 shrink-0 border border-line" />
          <div className="min-w-0">
            <p className="text-label text-ink-mid">Ders paketin</p>
            <p className="mt-1 truncate text-h3-m text-ink">{activePackage.plan.name}</p>
            <p className="mt-1 truncate text-small text-ink-mid">{tutor}{daysLeft !== null ? ` · ${daysLeft} gün` : ""}</p>
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <p className="text-h2-m font-bold tabular-nums text-ink md:text-h2">
              {activePackage.remaining_credits} <span className="text-body font-normal text-ink-mid">ders kaldı</span>
            </p>
            <p className="text-small tabular-nums text-ink-mid">{usedCredits} / {activePackage.total_credits} kullanıldı</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-pill bg-line" aria-label={`Paketin yüzde ${progress} kadarı kullanıldı`}>
            <div className={cn("h-full rounded-pill", needsRenewal ? "bg-pink" : "bg-ink")} style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-small text-ink-mid">{scheduledCount > 0 ? `${scheduledCount} ders planlandı` : "Yeni derslerini istediğin zaman planlayabilirsin."}</p>
        </div>

        <span className="flex items-center justify-between gap-3 border-t border-line pt-4 text-body font-medium text-ink lg:border-l lg:border-t-0 lg:py-3 lg:pl-6 lg:pt-3">
          Paket detayları
          <ArrowRight className="size-4" weight="regular" aria-hidden="true" />
        </span>
      </button>
      {needsRenewal && (
        <div className="flex flex-col gap-3 border-t border-ink bg-ink px-6 py-4 text-small text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="font-medium">Paketin yakında yenilenmeli.</span>
          <Button asChild size="sm"><Link href="/tutors">Ders hakkı al</Link></Button>
        </div>
      )}
    </section>
  );
}

function StudentDashboardContent() {
  const { user, isAuthenticated } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<PackagePurchase | null>(null);
  const [materialsBooking, setMaterialsBooking] = useState<Booking | null>(null);

  const bookingsQuery = useQuery({ queryKey: ["bookings"], queryFn: fetchBookings, enabled: isAuthenticated });
  const packagesQuery = useQuery({ queryKey: ["package-purchases"], queryFn: fetchPackagePurchases, enabled: isAuthenticated });
  const profileQuery = useQuery({ queryKey: ["profile-me"], queryFn: fetchProfileMe, enabled: isAuthenticated, staleTime: 60_000, retry: false });
  const conversationsQuery = useQuery({ queryKey: ["conversations"], queryFn: fetchConversations, enabled: isAuthenticated });

  const studentProfile = useMemo(() => {
    const profile = profileQuery.data?.profile;
    return profile && "target_exam_type" in profile ? (profile as ProfileStudent) : null;
  }, [profileQuery.data?.profile]);

  const allBookings = bookingsQuery.data ?? [];
  const now = Date.now();
  const upcomingBookings = sortByStart(allBookings.filter((booking) => {
    const start = new Date(booking.start_time).getTime();
    return booking.status === "in_progress" || (booking.status === "confirmed" && start > now);
  }));
  const nextLesson = upcomingBookings[0] ?? null;
  const followingLessons = upcomingBookings.slice(1, 4);
  const recentLessons = [...allBookings]
    .filter((booking) => booking.status === "completed")
    .sort((a, b) => new Date(b.completed_at || b.start_time).getTime() - new Date(a.completed_at || a.start_time).getTime())
    .slice(0, 3);
  const actionableBookings = actionableConfirmDisputeBookings(allBookings);

  const currentPackages = (packagesQuery.data ?? []).filter((purchase) => {
    const expiry = computePackageExpiry(purchase);
    return purchase.status === "pending" || !isPastPackage(purchase, expiry);
  });
  const activePackage = currentPackages.find((purchase) => purchase.status === "paid" && purchase.remaining_credits > 0);
  const pendingPackage = currentPackages.find((purchase) => purchase.status === "pending");

  const hasLessonActivity = allBookings.some(
    (booking) => booking.status !== "cancelled" && booking.status !== "expired"
  );
  const hasAccountActivity = hasLessonActivity || currentPackages.length > 0 || (conversationsQuery.data?.length ?? 0) > 0;
  const isEmptyAccount =
    !bookingsQuery.isLoading &&
    !packagesQuery.isLoading &&
    !conversationsQuery.isLoading &&
    !bookingsQuery.isError &&
    !packagesQuery.isError &&
    !hasAccountActivity;
  const name = studentProfile?.name?.trim() || emailFirstName(user?.email);
  const avatarUrl = studentProfile?.avatar_url;
  const isUrgentLesson = Boolean(nextLesson && (nextLesson.status === "in_progress" || new Date(nextLesson.start_time).getTime() - now <= URGENT_LESSON_WINDOW_MS));

  if (isEmptyAccount) {
    return <EmptyStudentDashboard name={name} avatarUrl={avatarUrl} />;
  }

  return (
    <div className="space-y-8">
      <DashboardGreeting name={name} avatarUrl={avatarUrl} summary={weekLessonSummary(upcomingBookings)} />

      {bookingsQuery.isError && (
        <div className="space-y-3">
          <ErrorMessage title="Derslerin yüklenemedi" message="Ders bilgilerine şu anda ulaşamıyoruz. Bağlantını kontrol edip tekrar deneyebilirsin." />
          <Button variant="outline" onClick={() => void bookingsQuery.refetch()}>Tekrar dene</Button>
        </div>
      )}

      {isUrgentLesson && nextLesson && <UrgentLessonBanner booking={nextLesson} />}

      {actionableBookings.length > 0 && (
        <section aria-labelledby="attention-title" className="rounded-card border border-ink bg-surface p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-input bg-ink text-white"><Check className="size-4" weight="regular" aria-hidden="true" /></span>
            <div>
              <p className="text-label text-ink-mid">İşlem gerekiyor</p>
              <h2 id="attention-title" className="text-h3-m text-ink">Tamamlanmayı bekleyen derslerin</h2>
            </div>
          </div>
          <LessonConfirmDisputeCard bookings={allBookings} onChanged={() => void bookingsQuery.refetch()} />
        </section>
      )}

      {bookingsQuery.isLoading ? (
        <Skeleton className="h-[280px] w-full rounded-card" />
      ) : nextLesson ? (
        <NextLessonCard booking={nextLesson} />
      ) : (
        <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <h2 className="text-h3-m text-ink md:text-h3">Yaklaşan dersin yok</h2>
            <p className="mt-1 text-small text-ink-mid">Hazır olduğunda mevcut hocanla yeni bir ders planlayabilirsin.</p>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/tutors"><MagnifyingGlass className="mr-2 size-4" weight="regular" aria-hidden="true" />Ders planla</Link>
          </Button>
        </section>
      )}

      {nextLesson && (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <UpcomingLessons bookings={followingLessons} />
          <RecentLessonContent bookings={recentLessons} onOpen={setMaterialsBooking} />
        </div>
      )}

      {!nextLesson && hasAccountActivity && (
        <RecentLessonContent bookings={recentLessons} onOpen={setMaterialsBooking} />
      )}

      {hasAccountActivity && (
        <CreditSummary
          activePackage={activePackage}
          pendingPackage={pendingPackage}
          loading={packagesQuery.isLoading}
          error={packagesQuery.isError}
          onRetry={() => void packagesQuery.refetch()}
          onSelect={setSelectedPackage}
          bookings={allBookings}
        />
      )}

      <PackageLearningDetailsSheet
        purchase={selectedPackage}
        bookings={allBookings}
        open={!!selectedPackage}
        onOpenChange={(open) => { if (!open) setSelectedPackage(null); }}
      />
      <LessonMaterialsDialog
        booking={materialsBooking}
        open={Boolean(materialsBooking)}
        onOpenChange={(open) => { if (!open) setMaterialsBooking(null); }}
      />
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <div className="min-h-full bg-paper text-ink">
        <main className="mx-auto w-full max-w-[75rem] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <StudentDashboardContent />
        </main>
      </div>
      <AISupportChatWidget
        title={STUDENT_DASHBOARD_ASSISTANT.title}
        welcomeMessage={STUDENT_DASHBOARD_ASSISTANT.welcomeMessage}
        attentionMessages={STUDENT_DASHBOARD_ASSISTANT.attentionMessages}
        starterPrompts={STUDENT_DASHBOARD_ASSISTANT.starterPrompts}
      />
    </RouteGuard>
  );
}
