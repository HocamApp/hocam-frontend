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
import { fetchCoachingSessions } from "@/lib/coachingApi";
import { coachingSessionStatusLabel } from "@/lib/coachingPresentation";
import { coachingDateTimeLabel } from "@/lib/coachingTime";
import { serverNow } from "@/lib/serverClock";

const JOINABLE_STATUSES = new Set(["scheduled", "in_progress"]);


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

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        const isFuture = new Date(session.scheduled_start).getTime() > now;
        const canReschedule = isFuture && session.status === "scheduled";
        return (
          <Card key={session.id} className="text-ink">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-body font-medium tabular-nums">
                  {session.sequence_number}. görüşme ·{" "}
                  {coachingDateTimeLabel(session.scheduled_start)}
                </p>
                <Badge
                  variant="outline"
                  className="mt-2 border-line bg-transparent text-ink"
                >
                  {coachingSessionStatusLabel(session.status)}
                </Badge>
                {session.report_overdue && session.report_due_at ? (
                  <p className="mt-2 text-small text-error">
                    Görüşme raporu gecikti. Son zaman:{" "}
                    {coachingDateTimeLabel(session.report_due_at)}
                  </p>
                ) : null}
                {session.complaint_eligible ? (
                  <Link
                    href="/support"
                    className="mt-2 inline-block text-small font-medium text-pink underline underline-offset-4"
                  >
                    Eksik rapor için desteğe başvur
                  </Link>
                ) : null}
                {!session.complaint_eligible &&
                session.complaint_eligible_at ? (
                  <p className="mt-2 text-small text-ink-mid">
                    Eksik rapor desteği{" "}
                    {coachingDateTimeLabel(session.complaint_eligible_at)}{" "}
                    itibarıyla kullanılabilir.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {JOINABLE_STATUSES.has(session.status) && (
                  <Button size="sm" asChild>
                    <Link href={`/session/coaching/${session.id}`}>Katıl</Link>
                  </Button>
                )}
                {canReschedule ? <RescheduleDialog session={session} /> : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
