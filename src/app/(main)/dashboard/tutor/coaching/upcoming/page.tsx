"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarDots } from "@phosphor-icons/react";

import { CoachingRecordGuard as CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingEmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchTutorCoachingSessions } from "@/lib/coachingApi";
import { coachingSessionStatusLabel } from "@/lib/coachingPresentation";
import { coachingDateTimeLabel } from "@/lib/coachingTime";


const JOINABLE_STATUSES = new Set(["scheduled", "in_progress"]);

function UpcomingList() {
  const { data: sessions, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["coaching-tutor-sessions"],
    queryFn: fetchTutorCoachingSessions,
  });

  if (isError) {
    return (
      <CoachingLoadError
        message="Görüşmeler yüklenemedi."
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[8rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return <CoachingEmptyState icon={CalendarDots} title="Yaklaşan görüşme yok" description="Planlanan bir koçluk görüşmesi olduğunda tarihi, hazırlık alanı ve katılım bağlantısı burada görünür." tone="accent" />;
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <Card key={session.id}>
          <CardContent className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {session.student_name ?? "Öğrenci"} ·{" "}
                {coachingDateTimeLabel(session.scheduled_start)}
              </p>
              <Badge variant="secondary" className="mt-1">
                {coachingSessionStatusLabel(session.status)}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/tutor/coaching/sessions/${session.id}/prepare`}>
                  Hazırlan
                </Link>
              </Button>
              {JOINABLE_STATUSES.has(session.status) && (
                <Button asChild size="sm">
                  <Link href={`/session/coaching/${session.id}`}>Katıl</Link>
                </Button>
              )}
              {session.status === "awaiting_report" ? (
                <Button asChild size="sm">
                  <Link href={`/dashboard/tutor/coaching/sessions/${session.id}/report`}>
                    Raporu hazırla
                  </Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function TutorCoachingUpcomingPage() {
  return (
    <CoachingGuard>
      <CoachingPageShell title="Yaklaşan görüşmeler" width="wide" currentHref="/dashboard/tutor/coaching/upcoming" audience="tutor"><UpcomingList /></CoachingPageShell>
    </CoachingGuard>
  );
}
