"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Compass } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { useCoachingFlag } from "@/hooks/useCoachingFlag";
import {
  coachingServiceStatusLabel,
  fetchCoachingSchedulingState,
  fetchCoachingSessions,
} from "@/lib/coachingApi";

function formatSessionMoment(date: string, time: string): string {
  const parsed = new Date(`${date}T${time}`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * A line about coaching, on the page a student actually opens.
 *
 * Coaching is a paid service with its own nav tab, and the dashboard did not
 * mention it once — so an active coaching period was invisible unless you went
 * looking for it. This only says what state the service is in and when the
 * next meeting is; the tab itself owns everything else.
 */
export function CoachingSummarySection() {
  const { enabled } = useCoachingFlag();

  const stateQuery = useQuery({
    queryKey: ["coaching-scheduling-state"],
    queryFn: fetchCoachingSchedulingState,
    enabled,
    retry: false,
  });
  const state = stateQuery.data ?? null;

  const sessionsQuery = useQuery({
    queryKey: ["coaching-sessions"],
    queryFn: fetchCoachingSessions,
    enabled: enabled && state?.service_status === "active",
    retry: false,
  });

  // No coaching record is the ordinary case, and an empty state advertising a
  // service the student has not bought belongs on the coaching tab, not here.
  if (!enabled || stateQuery.isLoading || !state) return null;

  const nextSession = (sessionsQuery.data ?? [])
    .filter((session) => session.status === "scheduled")
    .sort(
      (a, b) =>
        Date.parse(a.scheduled_start) - Date.parse(b.scheduled_start),
    )[0];

  return (
    <section
      aria-labelledby="coaching-summary-title"
      className="rounded-card border border-line bg-surface p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input border border-line bg-paper text-ink">
            <Compass className="size-4" weight="regular" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-label text-ink-mid">Çalışma koçluğun</p>
            <h2 id="coaching-summary-title" className="text-h3-m text-ink">
              {coachingServiceStatusLabel(state.service_status)}
            </h2>
            <p className="mt-0.5 text-small text-ink-mid">
              {nextSession
                ? `Sıradaki görüşmen: ${formatSessionMoment(
                    nextSession.scheduled_local_date,
                    nextSession.scheduled_local_time,
                  )}`
                : "Planlanmış görüşmen göründüğünde burada yazacak."}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/dashboard/student/coaching">
            Koçluğu aç
            <ArrowRight className="ml-1.5 size-4" weight="regular" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
