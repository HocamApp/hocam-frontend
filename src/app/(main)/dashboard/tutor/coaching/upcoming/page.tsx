"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDots } from "@phosphor-icons/react";

import { CoachingRecordGuard as CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingEmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingSessionsBoard } from "@/components/coaching/CoachingSessionsBoard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { fetchTutorCoachingSessions } from "@/lib/coachingApi";
import { buildTutorSessions } from "@/lib/coachingSessions";

function UpcomingList() {
  // Each press of "daha göster" lists the next 14 days.
  const [windows, setWindows] = useState(1);
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

  // `now` is read here, per render: Katıl opens 15 minutes before a meeting, and
  // the list is refetched often enough (focus, navigation) for that to stay true.
  const board = buildTutorSessions({ sessions: sessions ?? [], now: new Date(), windows });

  if (!board.next && board.reports.length === 0) {
    return <CoachingEmptyState icon={CalendarDots} title="Yaklaşan görüşme yok" description="Planlanan bir koçluk görüşmesi olduğunda tarihi, hazırlık alanı ve katılım bağlantısı burada görünür." tone="accent" />;
  }

  return (
    <CoachingSessionsBoard
      next={board.next}
      days={board.days}
      reports={board.reports}
      total={board.total}
      hidden={board.hidden}
      onShowMore={() => setWindows((count) => count + 1)}
    />
  );
}

export default function TutorCoachingUpcomingPage() {
  return (
    <CoachingGuard>
      <CoachingPageShell title="Görüşmeler" width="wide" currentHref="/dashboard/tutor/coaching/upcoming" audience="tutor"><UpcomingList /></CoachingPageShell>
    </CoachingGuard>
  );
}
