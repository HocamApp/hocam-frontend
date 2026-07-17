"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpenCheck,
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  Circle,
  Clock3,
  FileQuestion,
  GraduationCap,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Star,
  UserRoundCheck,
  Video,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchBookings } from "@/lib/lessonsApi";
import { fetchAvailability } from "@/lib/dashboardApi";
import { fetchConversations } from "@/lib/messagingApi";
import { fetchTutorEarnings } from "@/lib/paymentsApi";
import { fetchMyTutorProfile } from "@/lib/tutorsApi";
import { trackHomeEvent } from "@/lib/homeAnalytics";
import { parseBookingDate } from "@/lib/utils";
import { HIGHLIGHT_PARAM } from "@/hooks/useHighlightTarget";
import type { Booking } from "@/types";
import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const DAY_NAMES = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

function formatLessonDateTime(startTime: string) {
  return parseBookingDate(startTime).toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isSameLocalDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function canJoinLesson(booking: Booking) {
  return (
    Boolean(booking.room_url) &&
    (booking.status === "in_progress" ||
      Date.now() >= parseBookingDate(booking.start_time).getTime() - 15 * 60 * 1000)
  );
}

function bookingDashboardHref(bookingId: string) {
  return `/dashboard/tutor?tab=bookings&${HIGHLIGHT_PARAM}=${bookingId}`;
}

function SectionHeader({
  headingId,
  title,
  description,
  href,
  action,
}: {
  headingId: string;
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id={headingId} className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {href && action && (
        <Button
          asChild
          variant="ghost"
          className="w-fit shrink-0 px-0 text-primary hover:bg-transparent hover:underline"
        >
          <Link href={href}>
            {action}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      )}
    </div>
  );
}

function Metric({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function NextLessonPreview({
  booking,
  pendingCount,
  isLoading,
  isError,
  onRetry,
}: {
  booking?: Booking;
  pendingCount: number;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (isLoading) {
    return <Skeleton className="h-[390px] w-full rounded-3xl" />;
  }

  if (isError) {
    return (
      <Card className="overflow-hidden rounded-3xl border-primary/15 bg-card/95 shadow-xl shadow-primary/5">
        <CardContent className="flex min-h-[390px] flex-col items-center justify-center p-7 text-center sm:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <RefreshCw className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight">Ders programın yüklenemedi</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Bağlantını kontrol edip programını yeniden yükleyebilirsin.
          </p>
          <Button type="button" variant="outline" className="mt-6 rounded-xl" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Tekrar dene
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!booking) {
    return (
      <Card className="overflow-hidden rounded-3xl border-primary/15 bg-card/95 shadow-xl shadow-primary/5">
        <CardContent className="flex min-h-[390px] flex-col items-center justify-center p-7 text-center sm:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CalendarCheck2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Takvimin hazır
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Sıradaki dersini planla</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Yeni rezervasyonların doğru saatlere gelebilmesi için haftalık müsaitliğini güncel tut.
          </p>
          <Button asChild className="mt-6 rounded-xl">
            <Link
              href="/dashboard/tutor?tab=availability"
              onClick={() =>
                trackHomeEvent("tutor_home_action_clicked", {
                  action: "availability",
                  placement: "hero_preview",
                })
              }
            >
              Müsaitliği düzenle
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const studentName = booking.student.display_name || booking.student.email;
  const lessonHref = bookingDashboardHref(booking.id);
  const joinEnabled = canJoinLesson(booking);

  return (
    <Card className="overflow-hidden rounded-3xl border-primary/15 bg-card/95 shadow-xl shadow-primary/5">
      <CardContent className="p-0">
        <div className="border-b bg-gradient-to-br from-primary/[0.09] via-card to-violet-500/[0.08] p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Sıradaki dersin
            </p>
            <StatusBadge status={booking.status} type="booking" />
          </div>

          <div className="mt-7 flex items-center gap-4">
            <ParticipantAvatar name={studentName} className="h-14 w-14 shrink-0" />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold tracking-tight">
                {booking.subject.name}
              </h2>
              <p className="mt-1 truncate text-sm text-muted-foreground">{studentName}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-2xl border bg-background/80 p-4 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="line-clamp-2">{formatLessonDateTime(booking.start_time)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock3 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{booking.duration_minutes} dakika</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6 sm:p-7">
          {pendingCount > 0 && (
            <Link
              href="/dashboard/tutor?tab=bookings"
              className="group flex items-center gap-3 rounded-xl bg-amber-500/10 px-4 py-3 text-sm transition hover:bg-amber-500/15"
            >
              <Clock3 className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden="true" />
              <span className="font-medium">{pendingCount} işlem senden yanıt bekliyor</span>
              <ArrowRight className="ml-auto h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1 rounded-xl">
              <Link
                href={joinEnabled ? `/session/${booking.id}` : lessonHref}
                onClick={() =>
                  trackHomeEvent("tutor_home_lesson_opened", {
                    booking_id: booking.id,
                    action: joinEnabled ? "join" : "details",
                    placement: "hero_preview",
                  })
                }
              >
                {joinEnabled ? (
                  <Video className="mr-2 h-4 w-4" aria-hidden="true" />
                ) : (
                  <CalendarCheck2 className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                {joinEnabled ? "Derse katıl" : "Dersi görüntüle"}
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 rounded-xl">
              <Link href={booking.conversation_id ? `/messages/${booking.conversation_id}` : "/messages"}>
                <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                Öğrenciye yaz
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionCard({
  icon,
  eyebrow,
  title,
  description,
  href,
  action,
  analyticsAction,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  action: string;
  analyticsAction: string;
}) {
  return (
    <Card className="group h-full rounded-2xl transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
      <CardContent className="flex h-full flex-col p-5 sm:p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {eyebrow}
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <Button
          asChild
          variant="ghost"
          className="mt-auto w-fit px-0 pt-6 text-primary hover:bg-transparent hover:underline"
        >
          <Link
            href={href}
            onClick={() =>
              trackHomeEvent("tutor_home_action_clicked", {
                action: analyticsAction,
                placement: "daily_flow",
              })
            }
          >
            {action}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function UpcomingLessonCard({ booking }: { booking: Booking }) {
  const studentName = booking.student.display_name || booking.student.email;
  const joinEnabled = canJoinLesson(booking);

  return (
    <Card className="min-w-0 rounded-2xl">
      <CardContent className="flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <ParticipantAvatar name={studentName} className="h-11 w-11 shrink-0" />
          <StatusBadge status={booking.status} type="booking" />
        </div>
        <h3 className="mt-5 truncate text-lg font-semibold">{booking.subject.name}</h3>
        <p className="mt-1 truncate text-sm text-muted-foreground">{studentName}</p>
        <div className="mt-5 space-y-2 border-t pt-4 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="line-clamp-1">{formatLessonDateTime(booking.start_time)}</span>
          </p>
          <p className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            {booking.duration_minutes} dakika
          </p>
        </div>
        <Button asChild variant={joinEnabled ? "default" : "outline"} className="mt-5 rounded-xl">
          <Link
            href={joinEnabled ? `/session/${booking.id}` : bookingDashboardHref(booking.id)}
            onClick={() =>
              trackHomeEvent("tutor_home_lesson_opened", {
                booking_id: booking.id,
                action: joinEnabled ? "join" : "details",
                placement: "upcoming_list",
              })
            }
          >
            {joinEnabled ? "Derse katıl" : "Dersi görüntüle"}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

interface StudentSummary {
  id: string;
  name: string;
  totalLessons: number;
  upcomingLessons: number;
  conversationId?: string;
}

function summarizeStudents(bookings: Booking[]): StudentSummary[] {
  const students = new Map<string, StudentSummary>();

  for (const booking of bookings) {
    if (booking.status === "cancelled" || booking.status === "expired") continue;
    const current = students.get(booking.student.id) ?? {
      id: booking.student.id,
      name: booking.student.display_name || booking.student.email,
      totalLessons: 0,
      upcomingLessons: 0,
      conversationId: undefined,
    };
    current.totalLessons += 1;
    if (
      ["pending", "confirmed", "in_progress"].includes(booking.status) &&
      parseBookingDate(booking.start_time).getTime() >= Date.now()
    ) {
      current.upcomingLessons += 1;
    }
    if (booking.conversation_id) current.conversationId = booking.conversation_id;
    students.set(booking.student.id, current);
  }

  return Array.from(students.values())
    .sort((a, b) => b.upcomingLessons - a.upcomingLessons || b.totalLessons - a.totalLessons)
    .slice(0, 3);
}

function StudentSummaryCard({ student }: { student: StudentSummary }) {
  return (
    <Card className="min-w-0 rounded-2xl">
      <CardContent className="flex h-full flex-col p-5 sm:p-6">
        <ParticipantAvatar name={student.name} className="h-12 w-12" />
        <h3 className="mt-4 truncate text-lg font-semibold">{student.name}</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/50 p-3 text-sm">
          <div>
            <p className="text-xl font-semibold">{student.totalLessons}</p>
            <p className="text-xs text-muted-foreground">Toplam ders</p>
          </div>
          <div>
            <p className="text-xl font-semibold">{student.upcomingLessons}</p>
            <p className="text-xs text-muted-foreground">Yaklaşan</p>
          </div>
        </div>
        <Button asChild variant="ghost" className="mt-4 w-fit px-0 text-primary hover:bg-transparent hover:underline">
          <Link href={student.conversationId ? `/messages/${student.conversationId}` : "/messages"}>
            İletişimi sürdür
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function TutorAuthenticatedHome() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const trackedView = useRef(false);

  const profileQuery = useQuery({
    queryKey: ["tutor-me"],
    queryFn: fetchMyTutorProfile,
    enabled: isAuthenticated,
    retry: false,
  });
  const bookingsQuery = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
    enabled: isAuthenticated,
  });
  const availabilityQuery = useQuery({
    queryKey: ["availability"],
    queryFn: fetchAvailability,
    enabled: isAuthenticated,
    retry: false,
  });
  const conversationsQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    enabled: isAuthenticated,
    retry: false,
  });
  const earningsQuery = useQuery({
    queryKey: ["tutor-earnings"],
    queryFn: fetchTutorEarnings,
    enabled: isAuthenticated,
    retry: false,
  });

  const profile = profileQuery.data;
  const bookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data]);
  const availability = useMemo(
    () => availabilityQuery.data ?? [],
    [availabilityQuery.data]
  );

  useEffect(() => {
    if (profile && !profile.is_verified) router.replace("/tutor/onboarding");
  }, [profile, router]);

  const upcomingBookings = useMemo(
    () =>
      [...bookings]
        .filter((booking) => {
          const start = parseBookingDate(booking.start_time).getTime();
          return (
            booking.status === "in_progress" ||
            (booking.status === "confirmed" && start > Date.now())
          );
        })
        .sort(
          (first, second) =>
            parseBookingDate(first.start_time).getTime() -
            parseBookingDate(second.start_time).getTime()
        ),
    [bookings]
  );

  const pendingActionCount = useMemo(
    () =>
      bookings.filter((booking) => {
        if (
          booking.status === "pending" &&
          parseBookingDate(booking.start_time).getTime() > Date.now()
        ) {
          return true;
        }
        return (
          booking.status === "completed" &&
          Boolean(booking.learning_context?.activity_id) &&
          booking.learning_context?.status === "pending_confirmation"
        );
      }).length,
    [bookings]
  );

  const unreadMessageCount = (conversationsQuery.data ?? []).reduce(
    (total, conversation) => total + (conversation.unread_count ?? 0),
    0
  );
  const activeAvailabilityDays = useMemo(
    () =>
      Array.from(
        new Set(
          availability
            .filter((rule) => !rule.is_unavailable)
            .map((rule) => rule.day_of_week)
        )
      ).sort((a, b) => a - b),
    [availability]
  );
  const todayLessonCount = upcomingBookings.filter((booking) =>
    isSameLocalDay(parseBookingDate(booking.start_time), new Date())
  ).length;
  const studentSummaries = useMemo(() => summarizeStudents(bookings), [bookings]);

  const readinessItems = [
    { label: "Profil fotoğrafı", ready: Boolean(profile?.profile_picture) },
    { label: "Detaylı biyografi", ready: Boolean(profile?.bio?.trim()) },
    { label: "Tanıtım videosu", ready: Boolean(profile?.intro_video_url?.trim()) },
    { label: "Haftalık müsaitlik", ready: activeAvailabilityDays.length > 0 },
  ];
  const readyItemCount = readinessItems.filter((item) => item.ready).length;

  useEffect(() => {
    if (
      trackedView.current ||
      profileQuery.isLoading ||
      bookingsQuery.isLoading ||
      conversationsQuery.isLoading
    ) {
      return;
    }
    trackedView.current = true;
    trackHomeEvent("tutor_home_viewed", {
      has_upcoming_lesson: upcomingBookings.length > 0,
      pending_action_count: pendingActionCount,
      unread_message_count: unreadMessageCount,
    });
  }, [
    bookingsQuery.isLoading,
    conversationsQuery.isLoading,
    pendingActionCount,
    profileQuery.isLoading,
    unreadMessageCount,
    upcomingBookings.length,
  ]);

  if (profileQuery.isError) {
    return (
      <div className="overflow-hidden">
        <section className="border-b bg-gradient-to-br from-muted/60 via-background to-violet-500/[0.08]">
          <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <RefreshCw className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
              Hoca çalışma alanın yüklenemedi
            </h1>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">
              Profil bilgilerin şu anda alınamadı. Bağlantını kontrol edip yeniden deneyebilirsin.
            </p>
            <Button type="button" size="lg" className="mt-7 rounded-xl" onClick={() => void profileQuery.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Tekrar dene
            </Button>
          </div>
        </section>
      </div>
    );
  }

  if (!profileQuery.isLoading && !profile) {
    return (
      <div className="overflow-hidden">
        <section className="border-b bg-gradient-to-br from-muted/60 via-background to-violet-500/[0.08]">
          <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
              Hoca profilini tamamlayarak başla
            </h1>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">
              Derslerini ve öğrencilerini yönetebileceğin çalışma alanın, profil kurulumu tamamlandıktan sonra burada olacak.
            </p>
            <Button asChild size="lg" className="mt-7 rounded-xl">
              <Link href="/tutor/setup">Profil kurulumuna git</Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  if (profileQuery.isLoading || !profile || !profile.is_verified) {
    return (
      <div className="mx-auto max-w-7xl space-y-7 px-4 py-14 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-10 min-[880px]:grid-cols-2">
          <Skeleton className="h-[360px] rounded-3xl" />
          <Skeleton className="h-[390px] rounded-3xl" />
        </div>
      </div>
    );
  }

  const firstName = profile.name.trim();
  const nextBooking = upcomingBookings[0];
  const availabilitySummary =
    activeAvailabilityDays.length > 0
      ? activeAvailabilityDays.map((day) => DAY_NAMES[day]).join(", ")
      : "Henüz düzenli saat eklenmedi";

  return (
    <div className="overflow-hidden">
      <section className="relative border-b bg-gradient-to-br from-muted/60 via-background to-violet-500/[0.08]">
        <div className="pointer-events-none absolute left-1/2 top-16 h-80 w-80 rounded-full bg-primary/[0.04] blur-3xl" aria-hidden="true" />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-4 py-14 sm:px-6 sm:py-16 min-[880px]:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] min-[880px]:gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:gap-16 lg:px-8 lg:py-[72px]">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              Merhaba {firstName}, bugünkü akışın burada.
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm">
              Hoca çalışma alanı
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-5xl lg:text-[3.55rem]">
              Derslerini planla, öğrencilerinle ritmi koru.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Yaklaşan derslerini, bekleyen işlemleri ve öğrenci iletişimini tek bakışta gör. Panona ihtiyaç duyduğunda ayrıntılara geç.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-xl">
                <Link
                  href="/dashboard/tutor"
                  onClick={() =>
                    trackHomeEvent("tutor_home_action_clicked", {
                      action: "dashboard",
                      placement: "hero",
                    })
                  }
                >
                  Panomu aç
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <Link
                  href="/dashboard/tutor?tab=availability"
                  onClick={() =>
                    trackHomeEvent("tutor_home_action_clicked", {
                      action: "availability",
                      placement: "hero",
                    })
                  }
                >
                  Müsaitliği düzenle
                </Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-4 border-t pt-6 sm:grid-cols-3">
              <Metric
                icon={<CalendarCheck2 className="h-4 w-4" aria-hidden="true" />}
                value={bookingsQuery.isError ? "—" : `${todayLessonCount} ders`}
                label="Bugünkü program"
              />
              <Metric
                icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
                value={bookingsQuery.isError ? "—" : `${pendingActionCount} işlem`}
                label="Yanıt bekliyor"
              />
              <Metric
                icon={<MessageCircle className="h-4 w-4" aria-hidden="true" />}
                value={conversationsQuery.isError ? "—" : `${unreadMessageCount} mesaj`}
                label="Okunmamış"
              />
            </div>
          </div>

          <NextLessonPreview
            booking={nextBooking}
            pendingCount={pendingActionCount}
            isLoading={bookingsQuery.isLoading}
            isError={bookingsQuery.isError}
            onRetry={() => void bookingsQuery.refetch()}
          />
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6 sm:py-20 lg:space-y-24 lg:px-8 lg:py-24">
        <section aria-labelledby="tutor-home-flow-title" className="space-y-8">
          <SectionHeader
            headingId="tutor-home-flow-title"
            title="Bugünün akışı"
            description="Önce dikkat isteyen işleri tamamla, sonra derslerine odaklan."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <ActionCard
              icon={<Clock3 className="h-5 w-5" aria-hidden="true" />}
              eyebrow="Bekleyen işlemler"
              title={pendingActionCount > 0 ? `${pendingActionCount} işlem seni bekliyor` : "Tüm işlemler güncel"}
              description={
                pendingActionCount > 0
                  ? "Rezervasyon taleplerini, ders onaylarını ve ilerleme kayıtlarını gözden geçir."
                  : "Yeni bir talep geldiğinde panondaki rezervasyon alanında görebilirsin."
              }
              href="/dashboard/tutor?tab=bookings"
              action="Rezervasyonları aç"
              analyticsAction="bookings"
            />
            <ActionCard
              icon={<MessageCircle className="h-5 w-5" aria-hidden="true" />}
              eyebrow="Öğrenci iletişimi"
              title={
                conversationsQuery.isError
                  ? "Mesajlar yüklenemedi"
                  : unreadMessageCount > 0
                    ? `${unreadMessageCount} okunmamış mesaj`
                    : "Mesajların güncel"
              }
              description={
                conversationsQuery.isError
                  ? "Mesaj merkezini açarak öğrenci iletişimini kontrol edebilirsin."
                  : "Ders öncesi soruları yanıtla, çalışma notlarını paylaş ve iletişimi sıcak tut."
              }
              href="/messages"
              action="Mesajlara git"
              analyticsAction="messages"
            />
            <ActionCard
              icon={<Calendar className="h-5 w-5" aria-hidden="true" />}
              eyebrow="Haftalık müsaitlik"
              title={
                availabilityQuery.isError
                  ? "Takvim yüklenemedi"
                  : activeAvailabilityDays.length > 0
                    ? `${activeAvailabilityDays.length} gün açık`
                    : "Takvimini aç"
              }
              description={
                availabilityQuery.isError
                  ? "Panondan haftalık müsaitliğini kontrol edebilirsin."
                  : availabilitySummary
              }
              href="/dashboard/tutor?tab=availability"
              action="Saatleri düzenle"
              analyticsAction="availability"
            />
          </div>
        </section>

        <section aria-labelledby="tutor-home-upcoming-title" className="space-y-8">
          <SectionHeader
            headingId="tutor-home-upcoming-title"
            title="Yaklaşan derslerin"
            description="Önündeki derslere hazırlan ve zamanı geldiğinde doğrudan katıl."
            href="/dashboard/tutor?tab=bookings"
            action="Tüm programı gör"
          />

          {bookingsQuery.isLoading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : bookingsQuery.isError ? (
            <div className="space-y-3">
              <ErrorMessage message="Ders programın şu anda yüklenemedi." />
              <Button variant="outline" onClick={() => void bookingsQuery.refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Tekrar dene
              </Button>
            </div>
          ) : upcomingBookings.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {upcomingBookings.slice(0, 3).map((booking) => (
                <UpcomingLessonCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <CalendarCheck2 className="mx-auto h-7 w-7 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 font-medium">Yaklaşan kesinleşmiş dersin yok</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Müsaitlik saatlerini güncel tutarak yeni rezervasyonlara hazır olabilirsin.
              </p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/dashboard/tutor?tab=availability">Takvimi düzenle</Link>
              </Button>
            </div>
          )}
        </section>

        {studentSummaries.length > 0 && (
          <section aria-labelledby="tutor-home-students-title" className="space-y-8">
            <SectionHeader
              headingId="tutor-home-students-title"
              title="Öğrencilerinle ritmi sürdür"
              description="Aktif öğrencilerinin ders yoğunluğunu gör ve iletişime kaldığın yerden devam et."
              href="/dashboard/tutor?tab=students"
              action="Tüm öğrencileri gör"
            />
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {studentSummaries.map((student) => (
                <StudentSummaryCard key={student.id} student={student} />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="tutor-home-profile-title" className="space-y-8">
          <SectionHeader
            headingId="tutor-home-profile-title"
            title="Hoca profilini güçlü tut"
            description="Görünürlüğünü destekleyen temel bilgileri tamamla ve ders ritmini takip et."
          />

          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="rounded-2xl bg-gradient-to-br from-primary/[0.06] via-card to-card">
              <CardContent className="p-6 sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                      Profil hazırlığı
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                      {readyItemCount}/{readinessItems.length} temel adım hazır
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Eksiklerini tamamlayarak öğrencilerin seni daha iyi tanımasını sağla.
                    </p>
                  </div>
                  <span className="w-fit rounded-full border bg-background px-3 py-1 text-xs font-medium">
                    {profile.is_public ? "Profil yayında" : "Profil gizli"}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {readinessItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-3 rounded-xl border bg-background/70 p-3 text-sm">
                      {item.ready ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      )}
                      <span className={item.ready ? "font-medium" : "text-muted-foreground"}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <Button asChild className="rounded-xl">
                    <Link href="/dashboard/tutor/edit">Profili düzenle</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href={`/tutors/${profile.id}`}>Öğrenci görünümünü aç</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-6 sm:p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">Ders ritmin</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Tamamlanan ders sayını dönemlere göre takip et ve çalışma ritmini gör.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-3xl font-semibold">
                      {earningsQuery.data?.last_30_days.lesson_count ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Son 30 gün</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-3xl font-semibold">
                      {earningsQuery.data?.lifetime.lesson_count ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Toplam ders</p>
                  </div>
                </div>
                <Button asChild variant="ghost" className="mt-5 w-fit px-0 text-primary hover:bg-transparent hover:underline">
                  <Link href="/dashboard/tutor?tab=earnings">
                    Ders geçmişini gör
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section aria-labelledby="tutor-home-tools-title" className="space-y-8">
          <SectionHeader
            headingId="tutor-home-tools-title"
            title="Derse hazırlanırken"
            description="İçeriklerini gözden geçir, geri bildirimlerini takip et ve öğrenci deneyimini güçlendir."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <ActionCard
              icon={<FileQuestion className="h-5 w-5" aria-hidden="true" />}
              eyebrow="Ders içeriği"
              title="Çıkmış soruları incele"
              description="TYT, AYT ve YDT sorularını ders öncesi hazırlığında kaynak olarak kullan."
              href="/cikmis-sorular"
              action="Soru kütüphanesini aç"
              analyticsAction="questions"
            />
            <ActionCard
              icon={<Star className="h-5 w-5" aria-hidden="true" />}
              eyebrow="Geri bildirim"
              title={`${profile.total_reviews} değerlendirme`}
              description={
                profile.total_reviews > 0
                  ? `Genel puanın ${profile.rating.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}. Öğrencilerinin geri bildirimlerini incele.`
                  : "İlk değerlendirmelerin geldiğinde güçlü yönlerini burada takip edebilirsin."
              }
              href="/dashboard/tutor?tab=reviews"
              action="Değerlendirmeleri gör"
              analyticsAction="reviews"
            />
            <ActionCard
              icon={<UserRoundCheck className="h-5 w-5" aria-hidden="true" />}
              eyebrow="Public görünüm"
              title="Profilini öğrenci gözüyle gör"
              description="Biyografinin, uzmanlık alanlarının ve ders bilgilerinin nasıl göründüğünü kontrol et."
              href={`/tutors/${profile.id}`}
              action="Profilimi aç"
              analyticsAction="public_profile"
            />
          </div>
        </section>

        <section className="relative isolate overflow-hidden rounded-3xl bg-primary px-6 py-9 text-primary-foreground sm:px-9 sm:py-10">
          <div className="absolute inset-y-0 right-0 -z-10 hidden w-[48%] lg:block" aria-hidden="true">
            <div
              className="absolute inset-0 bg-cover opacity-45 grayscale"
              style={{
                backgroundImage: 'url("/images/home/blackboard.jpg")',
                backgroundPosition: "38% center",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary/30" />
          </div>

          <div className="relative z-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/10">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
                Her iyi ders, net bir planla başlar.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-foreground/70 sm:text-base">
                Programını gözden geçir, öğrencilerinle iletişimi tamamla ve derse hazır gir.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary" className="mt-7 w-full rounded-xl lg:mt-0 lg:w-auto lg:shrink-0">
              <Link
                href="/dashboard/tutor"
                onClick={() =>
                  trackHomeEvent("tutor_home_action_clicked", {
                    action: "dashboard",
                    placement: "closing_cta",
                  })
                }
              >
                Panoma git
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
