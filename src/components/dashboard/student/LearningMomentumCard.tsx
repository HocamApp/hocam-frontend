import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Target } from "lucide-react";
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

interface LearningMomentumCardProps {
  activeGoal: StudentGoal | null;
  learningLoading: boolean;
  bookings: Booking[];
  activePackage: PackagePurchase | undefined;
  learningHref: string;
}

export function LearningMomentumCard({
  activeGoal,
  learningLoading,
  bookings,
  activePackage,
  learningHref,
}: LearningMomentumCardProps) {
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

  return (
    <section className="h-full rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Bu haftaki ilerlemen
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Öğrenme ritmin</h2>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Target className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-2xl font-semibold tabular-nums">{completedThisWeek}</p>
            <p className="mt-1 text-xs text-muted-foreground">Son 7 günde ders</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-2xl font-semibold tabular-nums">
              {activeGoal ? `%${activeGoal.progress}` : activePackageCompletedCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeGoal ? "Aktif hedef ilerlemesi" : "Pakette tamamlanan"}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
            aria-hidden="true"
          >
            {activeGoal || momentum ? <CheckCircle2 className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            {learningLoading ? (
              <Skeleton className="mt-2 h-5 w-56" />
            ) : activeGoal ? (
              <>
                <h2 className="mt-1 truncate font-semibold">{activeGoal.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hedefinin %{activeGoal.progress} kadarı tamamlandı. Sıradaki adıma geçebilirsin.
                </p>
              </>
            ) : momentum ? (
              <>
                <h2 className="mt-1 truncate font-semibold">{momentum.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{momentum.description}</p>
              </>
            ) : (
              <>
                <h2 className="mt-1 font-semibold">Kendine bir öğrenme hedefi seç</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hazır hedef paketleriyle çalışmalarını adım adım takip et.
                </p>
              </>
            )}
          </div>
        </div>
        <Button asChild variant="outline" className="mt-auto w-full bg-background sm:w-fit">
          <Link href={learningHref}>
            {activeGoal ? "Hedefe devam et" : "Hedefleri keşfet"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
