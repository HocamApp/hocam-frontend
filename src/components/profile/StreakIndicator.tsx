"use client";

import { useEffect, useState } from "react";

import { StreakBadge } from "@/components/ui/streak-badge";
import { useAuth } from "@/hooks/useAuth";
import { fetchStudentStreak, type StudentStreak } from "@/lib/streakApi";

/**
 * The navbar streak, left of the profile menu.
 *
 * Three states, and two of them render nothing:
 *
 * - Not a signed-in student, or the request failed: nothing at all. A broken
 *   box in the navbar is worse than no box.
 * - A streak of zero: also nothing. A badge reading "0 gün" hands a student
 *   a failure on the day they arrive, which is the opposite of what the
 *   mechanic is for. It appears the first time they earn it.
 * - Otherwise the compact badge, with the freeze balance in its tooltip.
 */
export function StreakIndicator() {
  const { isAuthenticated, isStudent } = useAuth();
  const [streak, setStreak] = useState<StudentStreak | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !isStudent) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    fetchStudentStreak()
      .then((data) => {
        if (!cancelled) setStreak(data);
      })
      .catch(() => {
        if (!cancelled) setStreak(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isStudent]);

  if (!isAuthenticated || !isStudent) return null;

  if (isLoading) {
    // Mirrors the badge's own geometry rather than being a generic bar, and
    // holds the navbar's width steady while the request is in flight.
    return (
      <span
        aria-hidden
        className="h-8 w-[74px] animate-skeleton-pulse rounded-pill bg-skeleton motion-reduce:animate-none"
      />
    );
  }

  if (!streak || streak.length === 0) return null;

  const frozen = streak.freezes_left;
  const title = `${streak.length} gündür aralıksız çalışıyorsun. Bu ay ${frozen} dondurma hakkın var.`;

  return <StreakBadge size="compact" length={streak.length} title={title} />;
}
