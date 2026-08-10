import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Booking, PackagePurchase, StudentGoal } from "@/types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface MomentumSummary {
  title: string;
  description: string;
}

/**
 * Derives a lightweight "momentum" line from bookings/package data already
 * loaded on the dashboard when the student has no active learning goal —
 * never fabricated, always traceable to a real booking or package record.
 */
function deriveMomentumSummary(
  bookings: Booking[],
  activePackage: PackagePurchase | undefined,
  activePackageCompletedCount: number
): MomentumSummary | null {
  if (activePackage && activePackageCompletedCount > 0) {
    return {
      title: activePackage.plan.name,
      description: `Bu pakette ${activePackageCompletedCount} / ${activePackage.total_credits} ders tamamlandı.`,
    };
  }

  const completedBookings = bookings.filter(
    (b) => (b.status || "").toLowerCase() === "completed"
  );
  const now = Date.now();
  const recentCompleted = completedBookings.filter(
    (b) => now - new Date(b.start_time).getTime() <= SEVEN_DAYS_MS
  );

  if (recentCompleted.length > 0) {
    const subjects = new Set(recentCompleted.map((b) => b.subject.name));
    const subjectLine =
      subjects.size === 1
        ? ` ${Array.from(subjects)[0]} konusunda öğrenmeye devam ediyorsun.`
        : "";
    return {
      title: "Öğrenmeye devam ediyorsun",
      description: `Son 7 günde ${recentCompleted.length} ders aldın.${subjectLine}`,
    };
  }

  if (completedBookings.length > 0) {
    const mostRecent = [...completedBookings].sort(
      (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    )[0];
    return {
      title: "Son çalıştığın konu",
      description: `Son olarak ${mostRecent.subject.name} konusunu çalıştın. Devam etmeye hazır mısın?`,
    };
  }

  return null;
}

interface LearningMomentumBarProps {
  activeGoal: StudentGoal | null;
  learningLoading: boolean;
  bookings: Booking[];
  activePackage: PackagePurchase | undefined;
  learningHref: string;
}

/** Slim, full-width progress strip — replaces the old card so the dashboard
 * keeps a single dominant hero (the next lesson). */
export function LearningMomentumBar({
  activeGoal,
  learningLoading,
  bookings,
  activePackage,
  learningHref,
}: LearningMomentumBarProps) {
  const activePackageCompletedCount = activePackage
    ? bookings.filter(
        (b) => b.package_purchase === activePackage.id && b.status === "completed"
      ).length
    : 0;
  const momentum = activeGoal
    ? null
    : deriveMomentumSummary(bookings, activePackage, activePackageCompletedCount);
  const now = Date.now();
  const completedThisWeek = bookings.filter(
    (booking) =>
      booking.status === "completed" &&
      now - new Date(booking.start_time).getTime() <= SEVEN_DAYS_MS
  ).length;

  const progressPercent = activeGoal
    ? Math.min(100, Math.max(0, activeGoal.progress))
    : activePackage && activePackage.total_credits > 0
      ? Math.min(100, Math.round((activePackageCompletedCount / activePackage.total_credits) * 100))
      : null;

  return (
    <section
      aria-labelledby="momentum-title"
      className="rounded-2xl border bg-card px-5 py-4 sm:px-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
          aria-hidden="true"
        >
          {activeGoal || momentum ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <BookOpen className="h-5 w-5" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          {learningLoading ? (
            <Skeleton className="h-5 w-56" />
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h2 id="momentum-title" className="truncate font-semibold">
                  {activeGoal
                    ? activeGoal.title
                    : momentum
                      ? momentum.title
                      : "Kendine bir öğrenme hedefi seç"}
                </h2>
                {completedThisWeek > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Son 7 günde {completedThisWeek} ders
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {activeGoal
                  ? `Hedefinin %${activeGoal.progress} kadarı tamamlandı. Sıradaki adıma geçebilirsin.`
                  : momentum
                    ? momentum.description
                    : "Derslerini, hedeflerini ve ilerlemeni tek yerde takip et."}
              </p>
              {progressPercent !== null && (
                <div className="mt-2 flex items-center gap-3">
                  <div
                    className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    %{progressPercent}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <Button asChild variant="outline" className="shrink-0 sm:ml-2">
          <Link href={learningHref}>
            {activeGoal ? "Hedefe devam et" : "Hoca bul"}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
