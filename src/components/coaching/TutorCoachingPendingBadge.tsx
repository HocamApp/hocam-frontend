"use client";

import { useTutorCoachingPendingWork } from "./useTutorCoachingPendingWork";

/** Count on the tutor's "Talepler" tab; nothing when nothing waits. */
export function TutorCoachingPendingBadge() {
  const { total } = useTutorCoachingPendingWork();
  if (!total) return null;
  return (
    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-pill bg-pink px-1.5 text-label font-medium leading-5 text-white">
      {total}
      <span className="sr-only"> bekleyen istek</span>
    </span>
  );
}
