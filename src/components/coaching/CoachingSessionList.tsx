"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarBlank } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CoachingLoadingState } from "@/components/coaching/CoachingLoadingState";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { RescheduleDialog } from "@/components/coaching/RescheduleDialog";
import { CoachingEmptyState } from "@/components/coaching/CoachingEmptyState";
import { fetchCoachingSessions, type CoachingSessionItem } from "@/lib/coachingApi";
import { coachingSessionStatusLabel } from "@/lib/coachingPresentation";
import { coachingDateTimeLabel } from "@/lib/coachingTime";
import { serverNow } from "@/lib/serverClock";

const JOIN_EARLY_MS = 10 * 60_000;
const SESSION_MS = 30 * 60_000;


/** The student's confirmed koçluk session list — reschedule entry point
 * for each upcoming, still-editable session. */
export function CoachingSessionList() {
  const { data: sessions = [], isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["coaching-sessions"],
    queryFn: fetchCoachingSessions,
  });

  if (isLoading) {
    return <CoachingLoadingState rows={3} />;
  }

  if (isError) {
    return (
      <CoachingLoadError
        message="Görüşmelerin yüklenemedi."
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    );
  }

  if (sessions.length === 0) {
    return (
      <CoachingEmptyState
        icon={CalendarBlank}
        title="Henüz görüşmen oluşturulmadı"
        description="Düzenli koçluk saatlerin onaylandığında planlanan görüşmeler burada görünür."
        steps={["Koçluk saatin belirlenir", "Görüşme takvimine eklenir"]}
      />
    );
  }

  const now = serverNow();
  // sequence_number counts inside one service period, so every weekly
  // session used to read "1. görüşme". Number by time across the plan.
  const ordered = [...sessions]
    .sort((a, b) => Date.parse(a.scheduled_start) - Date.parse(b.scheduled_start))
    .map((session, index) => ({ session, number: index + 1 }));
  // After a cancellation every remaining week is listed as cancelled; keep
  // them out of the way of the sessions that still happen.
  const live = ordered.filter(({ session }) => session.status !== "cancelled");
  const cancelled = ordered.filter(({ session }) => session.status === "cancelled");

  const row = ({ session, number }: { session: CoachingSessionItem; number: number }) => {
    const startsAt = Date.parse(session.scheduled_start);
    const isFuture = startsAt > now;
    const canReschedule = isFuture && session.status === "scheduled";
    // The room opens 10 minutes early (backend session-token rule).
    const canJoin =
      session.status === "in_progress" ||
      (session.status === "scheduled" &&
        now >= startsAt - JOIN_EARLY_MS &&
        now < startsAt + SESSION_MS);
    return (
      <Card key={session.id} className="text-ink" data-session-row="">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-body font-medium tabular-nums">
              {number}. görüşme · {coachingDateTimeLabel(session.scheduled_start)}
            </p>
            <Badge variant="outline" className="mt-2 border-line bg-transparent text-ink">
              {coachingSessionStatusLabel(session.status)}
            </Badge>
            {session.report_overdue && session.report_due_at ? (
              <p className="mt-2 text-small text-error">
                Görüşme raporu gecikti. Son zaman: {coachingDateTimeLabel(session.report_due_at)}
              </p>
            ) : null}
            {session.complaint_eligible ? (
              <Link
                href="/dashboard/student/coaching/complaints"
                className="mt-2 inline-block text-small font-medium text-ink underline underline-offset-4"
              >
                Eksik rapor için desteğe başvur
              </Link>
            ) : null}
            {/* Only a session still waiting for its report can need this. */}
            {!session.complaint_eligible &&
            session.status === "awaiting_report" &&
            session.complaint_eligible_at ? (
              <p className="mt-2 text-small text-ink-mid">
                Eksik rapor desteği {coachingDateTimeLabel(session.complaint_eligible_at)} itibarıyla
                kullanılabilir.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canJoin ? (
              <Button size="sm" asChild>
                <Link href={`/session/coaching/${session.id}`}>Görüşmeye katıl</Link>
              </Button>
            ) : null}
            {canReschedule ? <RescheduleDialog session={session} /> : null}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-2">
      {live.map(row)}
      {cancelled.length > 0 ? (
        <details className="rounded-card border border-line bg-surface">
          <summary className="flex min-h-11 cursor-pointer items-center px-5 text-small font-medium text-ink">
            İptal edilen görüşmeler ({cancelled.length})
          </summary>
          <div className="space-y-2 p-2 pt-0">{cancelled.map(row)}</div>
        </details>
      ) : null}
    </div>
  );
}
