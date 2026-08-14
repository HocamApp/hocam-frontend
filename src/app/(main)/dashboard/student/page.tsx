"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  CalendarDays,
  Check,
  Clock3,
  FolderOpen,
  MessageCircle,
  Search,
  Sparkles,
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
    <header className="flex items-center gap-4">
      <ParticipantAvatar
        name={name}
        avatarUrl={avatarUrl}
        shape="circle"
        className="h-12 w-12 border-2 border-slate-200"
      />
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold leading-tight tracking-[-0.025em] text-slate-950 sm:text-3xl">
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
    <div className="space-y-7">
      <DashboardGreeting name={name} avatarUrl={avatarUrl} summary="Hocam’a hoş geldin. Başlamak sandığından kolay." />

      <section className="relative isolate overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-8 sm:px-8 sm:py-10 lg:min-h-[330px] lg:px-10">
        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#e9004f]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              İlk adım
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              İlk dersine hazır mısın?
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              Sana uygun hocayı bul, ücretsiz tanışma dersini planla ve öğrenmeye başla.
            </p>
            <Button asChild size="lg" className="mt-7 bg-[#e9004f] px-6 text-white hover:bg-[#cf0046]">
              <Link href="/tutors">
                Hoca bul
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="relative mx-auto h-[240px] w-[240px] sm:h-[280px] sm:w-[280px] lg:h-[300px] lg:w-[300px]">
            <div
              className="absolute -bottom-12 right-2 h-[270px] w-[190px] rotate-[-5deg] rounded-[58%_42%_22%_78%/42%_35%_65%_58%] bg-[#f7dfe7]"
              aria-hidden="true"
            />
            <Image
              src="/images/dashboard/student-empty-mascot-long-neck.png"
              alt="Hocam'ın uzun boyunlu ördek maskotu"
              fill
              sizes="(min-width: 1024px) 300px, 280px"
              className="translate-x-3 translate-y-5 scale-[1.12] object-contain object-bottom drop-shadow-[0_10px_14px_rgba(15,23,42,0.12)]"
              priority
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="getting-started-title" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="getting-started-title" className="text-xl font-semibold tracking-[-0.02em] text-slate-950">Üç adımda ilk dersin</h2>
          </div>
          <span className="text-sm text-slate-500">Gerisi panelinde seni bekler.</span>
        </div>
        <ol className="mt-7 grid gap-5 md:grid-cols-3">
          {steps.map(([number, title, description], index) => (
            <li key={number} className="relative flex gap-4">
              <span className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                index === 0 ? "border-[#e9004f] text-[#e9004f]" : "border-slate-200 text-slate-600"
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
    <section aria-label="Yaklaşan ders bildirimi" className="flex flex-col gap-4 rounded-xl border border-[#f6a9c2] bg-[#fff5f8] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e9004f] text-white">
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
        className="shrink-0 bg-[#e9004f] text-white hover:bg-[#cf0046]"
      />
    </section>
  );
}

function NextLessonCard({ booking }: { booking: Booking }) {
  const name = tutorName(booking);
  return (
    <section aria-labelledby="next-lesson-title" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Sıradaki dersin</p>
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <ParticipantAvatar name={name} avatarUrl={booking.tutor.profile_picture} className="h-14 w-14 shrink-0 sm:h-16 sm:w-16" />
            <div className="min-w-0">
              <h2 id="next-lesson-title" className="truncate text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                {booking.subject.name}
              </h2>
              <p className="mt-1 truncate text-base font-medium text-slate-600">{name}</p>
              <p className="mt-1 text-sm text-slate-400">{booking.subject.exam_type} · {booking.duration_minutes} dakika</p>
            </div>
          </div>
          <div className="shrink-0 rounded-xl border border-slate-200 px-4 py-3 sm:min-w-[190px]">
            <p className="text-sm font-semibold capitalize text-slate-950">{formatLessonDay(booking.start_time, true)}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.03em] text-slate-950">{formatTime(booking.start_time)}</p>
          </div>
        </div>
        <div className="mt-7 flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
          <Button asChild size="lg">
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
    <section aria-labelledby="upcoming-lessons-title" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="upcoming-lessons-title" className="text-xl font-semibold tracking-[-0.02em] text-slate-950">Sonraki 3 ders</h2>
        <Button asChild variant="ghost" size="sm" className="text-slate-600">
          <Link href="/profile/lessons">
            Takvimi aç
            <ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {bookings.length > 0 ? (
        <ol className="mt-5 divide-y divide-slate-100">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <Link href="/profile/lessons?tab=upcoming" className="group grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg py-3.5 transition-colors hover:bg-slate-50">
                <ParticipantAvatar name={tutorName(booking)} avatarUrl={booking.tutor.profile_picture} className="h-10 w-10" />
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
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
          <CalendarDays className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
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
    <section aria-labelledby="recent-lessons-title" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="recent-lessons-title" className="text-xl font-semibold tracking-[-0.02em] text-slate-950">Son derslerin</h2>
          <p className="mt-1 text-sm text-slate-500">Notlarına, dosyalarına ve çözülen sorulara dön.</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0 text-slate-600">
          <Link href="/profile/lessons?tab=history">
            <BookOpenText className="mr-1.5 h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Tüm geçmiş dersler</span>
            <span className="sm:hidden">Tümü</span>
            <ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {bookings.length > 0 ? (
        <ol className="mt-4 divide-y divide-slate-100">
          {bookings.map((booking) => (
            <li key={booking.id} className="flex items-center gap-3 py-3.5">
              <ParticipantAvatar name={tutorName(booking)} avatarUrl={booking.tutor.profile_picture} className="h-10 w-10 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-950">{booking.subject.name}</p>
                <p className="mt-0.5 truncate text-sm text-slate-500">{tutorName(booking)} · {formatLessonDay(booking.start_time)}</p>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0 text-slate-700" onClick={() => onOpen(booking)}>
                <FolderOpen className="mr-1.5 h-4 w-4" aria-hidden="true" />
                İçeriği aç
              </Button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-5 rounded-xl bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
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
  if (loading) return <Skeleton className="h-[154px] w-full rounded-2xl" />;
  if (error) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <ErrorMessage message="Ders hakların yüklenemedi." />
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>Tekrar dene</Button>
      </section>
    );
  }
  if (!activePackage && !pendingPackage) return null;

  if (pendingPackage && !activePackage) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600"><Clock3 className="h-5 w-5" /></span>
          <div>
            <p className="font-semibold text-slate-950">Paket talebin inceleniyor</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">Senden ek bir işlem beklenmiyor.</p>
            <Link href="/profile/payments" className="mt-3 inline-flex items-center text-sm font-semibold text-slate-700 hover:text-slate-950">Detayları gör <ArrowRight className="ml-1 h-4 w-4" /></Link>
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
    <section className={cn("relative overflow-hidden rounded-2xl border bg-white", needsRenewal ? "border-amber-300" : "border-slate-200")}>
      <button type="button" onClick={() => onSelect(activePackage)} className="group grid w-full gap-6 p-5 text-left sm:p-7 lg:grid-cols-[minmax(230px,0.8fr)_minmax(320px,1.2fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative shrink-0">
            <div className="absolute -inset-2 rounded-full bg-slate-50" aria-hidden="true" />
            <ParticipantAvatar name={tutor} avatarUrl={activePackage.tutor.profile_picture} className="relative h-16 w-16 border-2 border-white shadow-sm" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">Ders paketin</p>
            <p className="mt-1 truncate text-lg font-semibold text-slate-950">{activePackage.plan.name}</p>
            <p className="mt-1 truncate text-sm text-slate-500">{tutor}{daysLeft !== null ? ` · ${daysLeft} gün` : ""}</p>
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between gap-4">
            <p className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              {activePackage.remaining_credits} <span className="text-lg font-medium text-slate-500">ders kaldı</span>
            </p>
            <p className="text-sm text-slate-500">{usedCredits} / {activePackage.total_credits} kullanıldı</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`Paketin yüzde ${progress} kadarı kullanıldı`}>
            <div className={cn("h-full rounded-full", needsRenewal ? "bg-amber-500" : "bg-slate-900")} style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-sm text-slate-500">{scheduledCount > 0 ? `${scheduledCount} ders planlandı` : "Yeni derslerini istediğin zaman planlayabilirsin."}</p>
        </div>

        <span className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 font-semibold text-slate-700 group-hover:text-slate-950 lg:border-l lg:border-t-0 lg:py-3 lg:pl-6 lg:pt-3">
          Paket detayları
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </button>
      {needsRenewal && (
        <div className="flex items-center justify-between border-t border-amber-200 bg-amber-50 px-5 py-3 text-sm sm:px-7">
          <span className="font-medium text-amber-900">Paketin yakında yenilenmeli.</span>
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
    <div className="space-y-6 sm:space-y-7">
      <DashboardGreeting name={name} avatarUrl={avatarUrl} summary={weekLessonSummary(upcomingBookings)} />

      {bookingsQuery.isError && (
        <div className="space-y-3">
          <ErrorMessage title="Derslerin yüklenemedi" message="Ders bilgilerine şu anda ulaşamıyoruz. Bağlantını kontrol edip tekrar deneyebilirsin." />
          <Button variant="outline" onClick={() => void bookingsQuery.refetch()}>Tekrar dene</Button>
        </div>
      )}

      {isUrgentLesson && nextLesson && <UrgentLessonBanner booking={nextLesson} />}

      {actionableBookings.length > 0 && (
        <section aria-labelledby="attention-title" className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6">
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
        <Skeleton className="h-[280px] w-full rounded-2xl" />
      ) : nextLesson ? (
        <NextLessonCard booking={nextLesson} />
      ) : (
        <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Yaklaşan dersin yok</h2>
            <p className="mt-1 text-sm text-slate-500">Hazır olduğunda mevcut hocanla yeni bir ders planlayabilirsin.</p>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/tutors"><Search className="mr-2 h-4 w-4" />Ders planla</Link>
          </Button>
        </section>
      )}

      {nextLesson && (
        <div className="grid items-start gap-5 lg:grid-cols-2">
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
      <div className="min-h-full bg-white">
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
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
