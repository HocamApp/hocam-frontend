"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, Layers3, Star, Video, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionCardTitle } from "@/components/profile/SectionCardTitle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { LessonItemCard } from "@/components/profile/LessonItemCard";
import { ProfileMenuRow } from "@/components/profile/ProfileMenuRow";
import { fetchPastLessons, fetchUpcomingLessons } from "@/lib/profileLessonsApi";
import { fetchPackagePurchases } from "@/lib/paymentsApi";
import { fetchLearningDashboard } from "@/lib/learningApi";
import { goalPackageHref } from "@/lib/learning";

interface StudentLearningSummaryProps {
  pendingReviewsCount: number;
  pendingBookingsCount: number;
}

/**
 * Compact "who am I as a learner on Hocam" card for the student profile —
 * next lesson, active package count, lesson history, and the goal CTA. All
 * queries reuse the exact keys/functions the dashboard and history pages
 * already use, so navigating between pages doesn't refetch within the
 * shared 5-minute staleTime.
 */
export function StudentLearningSummary({
  pendingReviewsCount,
  pendingBookingsCount,
}: StudentLearningSummaryProps) {
  const router = useRouter();

  const {
    data: upcomingLessons,
    isLoading: upcomingLoading,
    isError: upcomingError,
  } = useQuery({
    queryKey: ["profile-upcoming-lessons"],
    queryFn: fetchUpcomingLessons,
  });

  const {
    data: pastLessons,
    isLoading: pastLoading,
    isError: pastError,
  } = useQuery({
    queryKey: ["profile-past-lessons"],
    queryFn: fetchPastLessons,
  });

  const {
    data: packagePurchases,
    isLoading: packagesLoading,
    isError: packagesError,
  } = useQuery({
    queryKey: ["package-purchases"],
    queryFn: fetchPackagePurchases,
  });

  const { data: learningDashboard } = useQuery({
    queryKey: ["learning-dashboard"],
    queryFn: fetchLearningDashboard,
    retry: false,
  });

  const nextLesson = upcomingLessons?.[0];
  const hasMoreUpcoming = (upcomingLessons?.length ?? 0) > 1;

  const activePackageCount = (packagePurchases ?? []).filter(
    (purchase) => purchase.status === "paid" && purchase.remaining_credits > 0
  ).length;

  // Past-lesson history can run into the hundreds for long-tenured
  // students, and this component re-renders on unrelated profile-page
  // state (name edits, toggles) — worth memoizing the sort.
  const mostRecentPastLesson = useMemo(() => {
    if (!pastLessons || pastLessons.length === 0) return undefined;
    return [...pastLessons].sort(
      (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    )[0];
  }, [pastLessons]);
  const pastLessonCount = pastLessons?.length ?? 0;

  const activeGoal = learningDashboard?.goals.find((goal) => goal.status === "active") ?? null;
  const learningHref = activeGoal
    ? goalPackageHref(activeGoal.id)
    : "/dashboard/student/learning";

  const packageDetail = packagesError
    ? "Paketler yüklenemedi"
    : packagesLoading
      ? "Yükleniyor…"
      : activePackageCount > 0
        ? "Kullanılabilir ders hakkın var"
        : "Şu anda aktif paketin yok";

  const historyDetail = pastError
    ? "Geçmiş dersler yüklenemedi"
    : pastLoading
      ? "Yükleniyor…"
      : mostRecentPastLesson
        ? `Son çalışılan: ${mostRecentPastLesson.subject.name}`
        : "Henüz tamamlanmış dersin yok";

  return (
    <Card>
      <CardHeader>
        <SectionCardTitle className="text-base">Hocam&apos;daki öğrenme durumun</SectionCardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : upcomingError ? (
          <p className="text-sm text-muted-foreground">
            Dersler yüklenemedi. Lütfen tekrar deneyin.
          </p>
        ) : !nextLesson ? (
          <EmptyState
            title="Henüz yaklaşan dersiniz yok"
            description="Yeni bir ders planlamak için hoca listesine göz atabilirsiniz."
            action={
              <Button asChild size="sm">
                <Link href="/tutors">Hoca bul</Link>
              </Button>
            }
          />
        ) : (
          <>
            <LessonItemCard
              subject={nextLesson.subject}
              participantName={nextLesson.participant_name}
              participantRole={nextLesson.participant_role}
              startTime={nextLesson.start_time}
              endTime={nextLesson.end_time}
              status={nextLesson.status}
              price={nextLesson.price}
              actions={
                nextLesson.can_join ? (
                  <Button asChild size="sm">
                    <a href={`/session/${nextLesson.id}`}>
                      <Video className="mr-2 h-4 w-4" aria-hidden="true" />
                      Derse Katıl
                    </a>
                  </Button>
                ) : undefined
              }
            />
            {hasMoreUpcoming && (
              <Link
                href="/profile/lessons/upcoming"
                className="inline-block text-sm font-medium text-primary hover:underline"
              >
                Tümünü gör
              </Link>
            )}
          </>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard
            icon={<Wallet className="h-4 w-4" aria-hidden="true" />}
            label="Aktif paket"
            value={packagesError ? "–" : activePackageCount}
            detail={packageDetail}
            isLoading={packagesLoading}
          />
          <StatCard
            icon={<Layers3 className="h-4 w-4" aria-hidden="true" />}
            label="Geçmiş ders"
            value={pastError ? "–" : pastLessonCount}
            detail={historyDetail}
            isLoading={pastLoading}
          />
        </div>

        {(pendingReviewsCount > 0 || pendingBookingsCount > 0) && (
          <div className="space-y-1 border-t border-border pt-2">
            {pendingReviewsCount > 0 && (
              <ProfileMenuRow
                icon={<Star className="h-4 w-4" aria-hidden="true" />}
                label={`${pendingReviewsCount} değerlendirme bekliyor`}
                showChevron
                onClick={() => router.push("/profile/reviews/pending")}
              />
            )}
            {pendingBookingsCount > 0 && (
              <ProfileMenuRow
                icon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
                label={`${pendingBookingsCount} rezervasyon onay bekliyor`}
                showChevron
                onClick={() => router.push("/profile/reservations/pending")}
              />
            )}
          </div>
        )}

        <Button asChild variant="outline" className="w-full">
          <Link href={learningHref}>
            {activeGoal ? "Öğrenmeye devam et" : "Hedefleri keşfet"}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
