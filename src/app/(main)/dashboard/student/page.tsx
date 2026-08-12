"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  MessageCircle,
  Search,
  Sparkles,
  WalletCards,
} from "lucide-react";
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
import { StudentMessagesPreview } from "@/components/dashboard/student/StudentMessagesPreview";
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
    <header className="flex items-center gap-4">
      <ParticipantAvatar
        name={name}
        avatarUrl={avatarUrl}
        shape="circle"
        className="h-14 w-14 border-4 border-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:h-16 sm:w-16"
      />
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold leading-tight tracking-[-0.03em] text-slate-950 sm:text-3xl">
          {greeting()}, {name} <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">{summary}</p>
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

      <section className="relative isolate overflow-hidden rounded-[32px] border border-[#f6c9d8] bg-[#fff4f7] px-6 py-8 sm:px-10 sm:py-10 lg:min-h-[390px] lg:px-12 lg:py-12">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#ffd420]/25 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-28 left-[38%] h-60 w-60 rounded-full bg-[#69f0ba]/20 blur-3xl" aria-hidden="true" />
        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#e9004f] shadow-sm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              İlk adım
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-4xl lg:text-5xl">
              İlk dersine hazır mısın?
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              Sana uygun hocayı bul, ücretsiz tanışma dersini planla ve öğrenmeye başla.
            </p>
            <Button asChild size="lg" className="mt-7 rounded-xl bg-[#e9004f] px-6 text-white shadow-[0_12px_30px_rgba(233,0,79,0.22)] hover:bg-[#cf0046]">
              <Link href="/tutors">
                Hoca bul
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="relative mx-auto h-[230px] w-[230px] sm:h-[280px] sm:w-[280px] lg:h-[310px] lg:w-[310px]">
            <div className="absolute inset-4 rounded-full bg-white/80 shadow-[0_24px_70px_rgba(93,18,43,0.08)]" aria-hidden="true" />
            <Image
              src="/images/dashboard/student-empty-mascot.png"
              alt="Defterini tutan Hocam maskotu"
              fill
              sizes="(min-width: 1024px) 310px, 280px"
              className="object-contain"
              priority
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="getting-started-title" className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e9004f]">Nasıl çalışır?</p>
            <h2 id="getting-started-title" className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Üç adımda ilk dersin</h2>
          </div>
          <span className="text-sm text-slate-500">Gerisi panelinde seni bekler.</span>
        </div>
        <ol className="mt-7 grid gap-5 md:grid-cols-3">
          {steps.map(([number, title, description], index) => (
            <li key={number} className="relative flex gap-4">
              <span className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                index === 0 ? "bg-[#e9004f] text-white" : index === 1 ? "bg-[#fff0aa] text-slate-900" : "bg-[#c9f9e6] text-slate-900"
              )}>
                {number}
              </span>
              <div>
                <h3 className="font-semibold text-slate-950">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
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
    <section aria-label="Yaklaşan ders bildirimi" className="flex flex-col gap-4 rounded-[24px] border border-[#f6a9c2] bg-[#fff0f5] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e9004f] text-white shadow-[0_10px_24px_rgba(233,0,79,0.22)]">
          <Clock3 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-slate-950">Dersin birazdan başlıyor</p>
          <p className="mt-0.5 truncate text-sm text-slate-600">
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
        className="shrink-0 rounded-xl bg-[#e9004f] text-white hover:bg-[#cf0046]"
      />
    </section>
  );
}

function NextLessonCard({ booking }: { booking: Booking }) {
  const name = tutorName(booking);
  return (
    <section aria-labelledby="next-lesson-title" className="relative isolate overflow-hidden rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8">
      <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[#fff0f5]" aria-hidden="true" />
      <div className="relative z-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e9004f]">Sıradaki dersin</p>
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <ParticipantAvatar name={name} avatarUrl={booking.tutor.profile_picture} className="h-16 w-16 shrink-0 rounded-2xl sm:h-20 sm:w-20" />
            <div className="min-w-0">
              <h2 id="next-lesson-title" className="truncate text-2xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-3xl">
                {booking.subject.name}
              </h2>
              <p className="mt-1 truncate text-base font-medium text-slate-600">{name}</p>
              <p className="mt-1 text-sm text-slate-400">{booking.subject.exam_type} · {booking.duration_minutes} dakika</p>
            </div>
          </div>
          <div className="shrink-0 rounded-2xl border border-slate-200 bg-[#fbfaf8] px-5 py-4 sm:min-w-[210px]">
            <p className="text-sm font-semibold capitalize text-slate-950">{formatLessonDay(booking.start_time, true)}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.03em] text-slate-950">{formatTime(booking.start_time)}</p>
          </div>
        </div>
        <div className="mt-7 flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
          <Button asChild size="lg" className="rounded-xl bg-slate-950 text-white hover:bg-slate-800">
            <Link href="/profile/lessons?tab=upcoming">Dersi görüntüle</Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="justify-start text-slate-600">
            <Link href={booking.conversation_id ? `/messages/${booking.conversation_id}` : "/messages"}>
              <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
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
    <section aria-labelledby="upcoming-lessons-title" className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e9004f]">Programın</p>
          <h2 id="upcoming-lessons-title" className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-950">Sonraki 3 ders</h2>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-slate-600">
          <Link href="/profile/lessons">
            Takvimi aç
            <ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {bookings.length > 0 ? (
        <ol className="mt-5 divide-y divide-slate-100">
          {bookings.map((booking, index) => (
            <li key={booking.id}>
              <Link href="/profile/lessons?tab=upcoming" className="group grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl py-4 transition-colors hover:bg-[#fbfaf8] sm:grid-cols-[54px_minmax(0,1fr)_auto]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700 sm:h-11 sm:w-11">
                  {index + 2}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-950">{booking.subject.name}</span>
                  <span className="mt-0.5 block truncate text-sm text-slate-500">{tutorName(booking)}</span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-semibold capitalize text-slate-800">{formatLessonDay(booking.start_time)}</span>
                  <span className="mt-0.5 block text-sm tabular-nums text-slate-500">{formatTime(booking.start_time)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#fbfaf8] px-4 py-5 text-sm text-slate-500">
          <CalendarDays className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
          Sıradaki dersinden sonra planlanmış başka bir dersin yok.
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
}: {
  activePackage?: PackagePurchase;
  pendingPackage?: PackagePurchase;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onSelect: (purchase: PackagePurchase) => void;
}) {
  if (loading) return <Skeleton className="h-[154px] w-full rounded-[28px]" />;
  if (error) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
        <ErrorMessage message="Ders hakların yüklenemedi." />
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>Tekrar dene</Button>
      </section>
    );
  }
  if (!activePackage && !pendingPackage) return null;

  if (pendingPackage && !activePackage) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff0f5] text-[#e9004f]"><Clock3 className="h-5 w-5" /></span>
          <div>
            <p className="font-semibold text-slate-950">Paket talebin inceleniyor</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">Senden ek bir işlem beklenmiyor.</p>
            <Link href="/profile/payments" className="mt-3 inline-flex items-center text-sm font-semibold text-slate-700 hover:text-[#e9004f]">Detayları gör <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    );
  }

  if (!activePackage) return null;
  const daysLeft = packageDaysLeft(activePackage);
  const needsRenewal = activePackage.remaining_credits <= RENEW_CREDITS_THRESHOLD || (daysLeft !== null && daysLeft <= RENEW_DAYS_THRESHOLD);

  return (
    <section className={cn("rounded-[28px] border bg-white p-5 sm:p-6", needsRenewal ? "border-amber-300" : "border-slate-200")}>
      <button type="button" onClick={() => onSelect(activePackage)} className="w-full text-left">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e9004f]">Ders hakların</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              {activePackage.remaining_credits} <span className="text-lg font-medium text-slate-500">ders kaldı</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">{activePackage.tutor.name} {activePackage.tutor.surname}{daysLeft !== null ? ` · ${daysLeft} gün` : ""}</p>
          </div>
          <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", needsRenewal ? "bg-amber-100 text-amber-800" : "bg-[#c9f9e6] text-emerald-800")}>
            <WalletCards className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
      </button>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <button type="button" onClick={() => onSelect(activePackage)} className="text-sm font-semibold text-slate-700 hover:text-[#e9004f]">Paket detayları</button>
        {needsRenewal && <Button asChild size="sm" className="bg-[#e9004f] text-white hover:bg-[#cf0046]"><Link href="/tutors">Ders hakkı al</Link></Button>}
      </div>
    </section>
  );
}

function StudentDashboardContent() {
  const { user, isAuthenticated } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<PackagePurchase | null>(null);

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
    <div className="space-y-7 sm:space-y-8">
      <DashboardGreeting name={name} avatarUrl={avatarUrl} summary={weekLessonSummary(upcomingBookings)} />

      {bookingsQuery.isError && (
        <div className="space-y-3">
          <ErrorMessage title="Derslerin yüklenemedi" message="Ders bilgilerine şu anda ulaşamıyoruz. Bağlantını kontrol edip tekrar deneyebilirsin." />
          <Button variant="outline" onClick={() => void bookingsQuery.refetch()}>Tekrar dene</Button>
        </div>
      )}

      {isUrgentLesson && nextLesson && <UrgentLessonBanner booking={nextLesson} />}

      {actionableBookings.length > 0 && (
        <section aria-labelledby="attention-title" className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800"><Check className="h-4 w-4" /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">İşlem gerekiyor</p>
              <h2 id="attention-title" className="font-semibold text-slate-950">Tamamlanmayı bekleyen derslerin</h2>
            </div>
          </div>
          <LessonConfirmDisputeCard bookings={allBookings} onChanged={() => void bookingsQuery.refetch()} />
        </section>
      )}

      {bookingsQuery.isLoading ? (
        <Skeleton className="h-[330px] w-full rounded-[32px]" />
      ) : nextLesson ? (
        <NextLessonCard booking={nextLesson} />
      ) : (
        <section className="flex flex-col gap-5 rounded-[28px] border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e9004f]">Sıradaki adım</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Yeni bir ders planla</h2>
            <p className="mt-2 text-sm text-slate-500">Şu anda yaklaşan bir dersin yok. Hocalarına göz atarak programına devam edebilirsin.</p>
          </div>
          <Button asChild size="lg" className="shrink-0 rounded-xl bg-[#e9004f] text-white hover:bg-[#cf0046]">
            <Link href="/tutors"><Search className="mr-2 h-4 w-4" />Hoca bul</Link>
          </Button>
        </section>
      )}

      {nextLesson && (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.42fr)_minmax(290px,0.78fr)]">
          <UpcomingLessons bookings={followingLessons} />
          <div className="space-y-5">
            <StudentMessagesPreview />
            <CreditSummary
              activePackage={activePackage}
              pendingPackage={pendingPackage}
              loading={packagesQuery.isLoading}
              error={packagesQuery.isError}
              onRetry={() => void packagesQuery.refetch()}
              onSelect={setSelectedPackage}
            />
          </div>
        </div>
      )}

      {!nextLesson && hasAccountActivity && (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <StudentMessagesPreview />
          <CreditSummary
            activePackage={activePackage}
            pendingPackage={pendingPackage}
            loading={packagesQuery.isLoading}
            error={packagesQuery.isError}
            onRetry={() => void packagesQuery.refetch()}
            onSelect={setSelectedPackage}
          />
        </div>
      )}

      <PackageLearningDetailsSheet
        purchase={selectedPackage}
        bookings={allBookings}
        open={!!selectedPackage}
        onOpenChange={(open) => { if (!open) setSelectedPackage(null); }}
      />
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <div className="min-h-full bg-[#fbfaf8]">
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
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
