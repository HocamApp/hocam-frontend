"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  FileQuestion,
  Target,
  WalletCards,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchTutors, fetchSubjects } from "@/lib/tutorsApi";
import { fetchLearningDashboard } from "@/lib/learningApi";
import { fetchBookings } from "@/lib/lessonsApi";
import { fetchPackagePurchases } from "@/lib/paymentsApi";
import { fetchProfileMe } from "@/lib/profileApi";
import { fetchQuestionMetadata } from "@/lib/questionsApi";
import { goalPackageHref } from "@/lib/learning";
import {
  computePackageExpiry,
  isPastPackage,
} from "@/components/payments/PackagePurchaseCard";
import { trackHomeEvent } from "@/lib/homeAnalytics";
import { HOCA_BUL_ENABLED } from "@/lib/featureFlags";
import { cn, formatDate } from "@/lib/utils";
import type { Booking, PackagePurchase, ProfileStudent, StudentGoal } from "@/types";
import { HomeSubjectSearch } from "@/components/home/HomeSubjectSearch";
import { HocaBulEntryCard } from "@/components/home/HocaBulEntryCard";
import { HomeHeroCarousel } from "@/components/home/HomeHeroCarousel";
import { HomeBand } from "@/components/home/HomeBand";
import { ScribbleLayers } from "@/components/decor/ScribbleLayer";
import { HOME_SCRIBBLES } from "@/lib/scribblePlacements";
import { HomeExploreCarousel } from "@/components/home/HomeExploreCarousel";
import { HomeTeacherRail } from "@/components/home/HomeTeacherRail";
import { HomeTabbedDiscovery } from "@/components/home/HomeTabbedDiscovery";
import { HomeGoalCards } from "@/components/home/HomeGoalCards";
import { HomeTopicLinks } from "@/components/home/HomeTopicLinks";
import { HomePromoStrip } from "@/components/home/HomePromoStrip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function ContinueCard({
  icon,
  eyebrow,
  title,
  description,
  meta,
  progress,
  href,
  action,
  contentType,
  contentId,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  meta?: string;
  progress?: number;
  href: string;
  action: string;
  contentType: string;
  contentId: string;
}) {
  return (
    <Card className="group h-full overflow-hidden rounded-2xl border-primary/15 bg-gradient-to-br from-primary/[0.06] via-card to-card shadow-sm">
      <CardContent className="flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {eyebrow}
            </p>
            <h3 className="mt-1.5 text-lg font-semibold tracking-tight">{title}</h3>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {typeof progress === "number" && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>İlerleme</span>
              <span>%{Math.round(progress)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
          {meta && <p className="text-xs font-medium text-muted-foreground">{meta}</p>}
          <Button asChild variant="outline" className="rounded-xl sm:ml-auto">
            <Link
              href={href}
              onClick={() =>
                trackHomeEvent("home_continue_clicked", {
                  content_type: contentType,
                  content_id: contentId,
                })
              }
            >
              {action}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatLessonDateTime(booking: Booking) {
  const date = new Date(booking.start_time);
  return date.toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function firstUpcomingBooking(bookings: Booking[]) {
  const now = Date.now();
  return [...bookings]
    .filter((booking) => {
      const status = booking.status.toLowerCase();
      return (
        status === "in_progress" ||
        (status === "confirmed" && new Date(booking.start_time).getTime() > now)
      );
    })
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )[0];
}

function firstActiveGoal(goals: StudentGoal[]) {
  return goals.find((goal) => goal.status === "active");
}

function firstActivePackage(purchases: PackagePurchase[]) {
  return purchases.find((purchase) => {
    const expiry = computePackageExpiry(purchase);
    return (
      purchase.status === "paid" &&
      purchase.remaining_credits > 0 &&
      !isPastPackage(purchase, expiry)
    );
  });
}

export function AuthenticatedHome() {
  const { isAuthenticated } = useAuth();
  const trackedView = useRef(false);

  const profileQuery = useQuery({
    queryKey: ["profile-me"],
    queryFn: fetchProfileMe,
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: false,
  });
  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
    enabled: isAuthenticated,
    staleTime: Infinity,
  });
  const tutorsQuery = useQuery({
    queryKey: ["home-tutors"],
    queryFn: () => fetchTutors({ ordering: "-rating" }, 1, 8),
    enabled: isAuthenticated,
  });
  const learningQuery = useQuery({
    queryKey: ["learning-dashboard"],
    queryFn: fetchLearningDashboard,
    enabled: isAuthenticated,
    retry: false,
  });
  const bookingsQuery = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
    enabled: isAuthenticated,
  });
  const packagesQuery = useQuery({
    queryKey: ["package-purchases"],
    queryFn: fetchPackagePurchases,
    enabled: isAuthenticated,
    retry: false,
  });
  const questionsQuery = useQuery({
    queryKey: ["question-metadata"],
    queryFn: fetchQuestionMetadata,
    enabled: isAuthenticated,
    retry: false,
  });

  const studentProfile = useMemo(() => {
    const profile = profileQuery.data?.profile;
    if (!profile || !("target_exam_type" in profile)) return null;
    return profile as ProfileStudent;
  }, [profileQuery.data?.profile]);

  const activeGoal = firstActiveGoal(learningQuery.data?.goals ?? []);
  const upcomingBooking = firstUpcomingBooking(bookingsQuery.data ?? []);
  const activePackage = firstActivePackage(packagesQuery.data ?? []);

  useEffect(() => {
    if (trackedView.current || learningQuery.isLoading || bookingsQuery.isLoading) return;
    trackedView.current = true;
    const hasActivity = Boolean(activeGoal || upcomingBooking || activePackage);
    trackHomeEvent("authenticated_home_viewed", {
      student_state: hasActivity ? "active" : "new_or_inactive",
      has_active_goal: Boolean(activeGoal),
      has_upcoming_lesson: Boolean(upcomingBooking),
    });
  }, [
    activeGoal,
    activePackage,
    bookingsQuery.isLoading,
    learningQuery.isLoading,
    upcomingBooking,
  ]);

  const continuationCards: ReactNode[] = [];
  if (upcomingBooking) {
    const tutorName = `${upcomingBooking.tutor.name} ${upcomingBooking.tutor.surname}`.trim();
    continuationCards.push(
      <ContinueCard
        key={`lesson-${upcomingBooking.id}`}
        icon={<CalendarCheck2 className="h-5 w-5" aria-hidden="true" />}
        eyebrow="Sıradaki dersin"
        title={upcomingBooking.subject.name}
        description={`${tutorName || "Hoca bilgisi bekleniyor"} ile ${upcomingBooking.duration_minutes} dakikalık ders`}
        meta={formatLessonDateTime(upcomingBooking)}
        href="/profile/lessons/upcoming"
        action="Dersi görüntüle"
        contentType="lesson"
        contentId={upcomingBooking.id}
      />
    );
  }
  if (activeGoal && continuationCards.length < 2) {
    const nextMilestone = activeGoal.milestones.find(
      (milestone) => milestone.status !== "completed"
    );
    continuationCards.push(
      <ContinueCard
        key={`goal-${activeGoal.id}`}
        icon={<Target className="h-5 w-5" aria-hidden="true" />}
        eyebrow="Aktif hedefin"
        title={activeGoal.title}
        description={nextMilestone?.title ?? "Hedef yolculuğundaki ilerlemeni görüntüle."}
        progress={activeGoal.progress}
        href={goalPackageHref(activeGoal.id)}
        action="Yola devam et"
        contentType="goal"
        contentId={activeGoal.id}
      />
    );
  }
  if (activePackage && continuationCards.length < 2) {
    const expiry = computePackageExpiry(activePackage);
    continuationCards.push(
      <ContinueCard
        key={`package-${activePackage.id}`}
        icon={<WalletCards className="h-5 w-5" aria-hidden="true" />}
        eyebrow="Aktif ders paketin"
        title={`${activePackage.tutor.name} ${activePackage.tutor.surname}`}
        description={`${activePackage.remaining_credits} ders kredisi kaldı.`}
        meta={expiry ? `Süre sonu ${formatDate(expiry.termEndDate.toISOString())}` : undefined}
        href="/dashboard/student"
        action="Paketi görüntüle"
        contentType="package"
        contentId={activePackage.id}
      />
    );
  }

  const questionResourcesEnabled = questionsQuery.data?.enabled !== false;

  return (
    <div className="overflow-hidden">
      <div className="relative isolate">
        <ScribbleLayers layers={HOME_SCRIBBLES.hero} />
        <HomeHeroCarousel greetingName={studentProfile?.name?.trim() || undefined} />
      </div>

      {/* The matching entry replaces the subject search rather than joining it:
          two competing "find a tutor" starting points on one screen is the
          thing this flow exists to remove. Flag off, the home is unchanged. */}
      {HOCA_BUL_ENABLED && (
        <HomeBand tinted scribbles={HOME_SCRIBBLES.hocaBul}>
          <HocaBulEntryCard />
        </HomeBand>
      )}

      <section aria-label="Hoca arama" className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
          {!HOCA_BUL_ENABLED && (
            <HomeSubjectSearch
              subjects={subjectsQuery.data}
              isLoading={subjectsQuery.isLoading}
              isError={subjectsQuery.isError}
            />
          )}

          <div
            className={cn(
              "flex flex-wrap items-center gap-x-5 gap-y-2 text-sm",
              !HOCA_BUL_ENABLED && "mt-4"
            )}
          >
            {questionResourcesEnabled && (
              <>
                <Link
                  href="/cikmis-sorular"
                  onClick={() =>
                    trackHomeEvent("home_question_link_clicked", { placement: "hero" })
                  }
                  className="inline-flex items-center text-muted-foreground hover:text-foreground hover:underline"
                >
                  <FileQuestion className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Çıkmış sorulara göz at
                </Link>
                <Link
                  href="/dashboard/student/learning/yanlis-sorular"
                  onClick={() =>
                    trackHomeEvent("home_practice_opened", { resource: "wrong_questions" })
                  }
                  className="inline-flex items-center text-muted-foreground hover:text-foreground hover:underline"
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Yanlış sorularım
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Sections alternate between the page surface and a tinted band so the
          page reads as chapters instead of one long white column. Vertical
          rhythm now lives in the band padding rather than a large space-y. */}
      {continuationCards.length > 0 && (
        <HomeBand>
          <section aria-labelledby="home-continue-title" className="space-y-6">
            <h2
              id="home-continue-title"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Kaldığın yerden devam et
            </h2>
            <div className="grid gap-5 md:grid-cols-2">{continuationCards}</div>
          </section>
        </HomeBand>
      )}

      <HomeBand tinted scribbles={HOME_SCRIBBLES.explore}>
        <HomeExploreCarousel />
      </HomeBand>

      <HomeBand scribbles={HOME_SCRIBBLES.teacherRail}>
        <HomeTeacherRail
          tutors={tutorsQuery.data?.results ?? []}
          isLoading={tutorsQuery.isLoading}
          isError={tutorsQuery.isError}
          onRetry={() => void tutorsQuery.refetch()}
        />
      </HomeBand>

      <HomeBand tinted scribbles={HOME_SCRIBBLES.tabbedDiscovery}>
        <HomeTabbedDiscovery isAuthenticated={isAuthenticated} />
      </HomeBand>

      <HomeBand scribbles={HOME_SCRIBBLES.goalCards}>
        <HomeGoalCards />
      </HomeBand>

      <HomeBand tinted scribbles={HOME_SCRIBBLES.topicLinks}>
        <HomeTopicLinks />
      </HomeBand>

      <HomeBand scribbles={HOME_SCRIBBLES.promoStrip}>
        <HomePromoStrip />
      </HomeBand>
    </div>
  );
}
