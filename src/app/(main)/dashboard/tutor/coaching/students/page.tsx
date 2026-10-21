"use client";

import { useQuery } from "@tanstack/react-query";
import { UserPlus } from "@phosphor-icons/react";

import { CoachingRecordGuard } from "@/components/coaching/CoachingGuard";
import { CoachingEmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingStudentsBoard } from "@/components/coaching/CoachingStudentsBoard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchAcceptanceRequests,
  fetchCoachingCapacity,
  fetchCoachingStudents,
  fetchTutorCoachingRescheduleRequests,
  fetchTutorCoachingSessions,
  fetchTutorCoachingTimeRequests,
} from "@/lib/coachingApi";
import { buildStudentsBoard } from "@/lib/coachingStudents";

function StudentsContent() {
  const studentsQuery = useQuery({
    queryKey: ["coaching-tutor-students"],
    queryFn: fetchCoachingStudents,
  });
  // The same keys the overview, the tab badge and the request pages use, so
  // one answer updates every place that shows it.
  const sessionsQuery = useQuery({
    queryKey: ["coaching-tutor-sessions"],
    queryFn: fetchTutorCoachingSessions,
  });
  const timeRequestsQuery = useQuery({
    queryKey: ["coaching-tutor-time-requests"],
    queryFn: fetchTutorCoachingTimeRequests,
    staleTime: 60_000,
  });
  const rescheduleRequestsQuery = useQuery({
    queryKey: ["coaching-tutor-reschedule-requests"],
    queryFn: fetchTutorCoachingRescheduleRequests,
    staleTime: 60_000,
  });
  const acceptanceQuery = useQuery({
    queryKey: ["tutor-acceptance-requests"],
    queryFn: fetchAcceptanceRequests,
    staleTime: 60_000,
  });
  const capacityQuery = useQuery({
    queryKey: ["coaching-capacity"],
    queryFn: fetchCoachingCapacity,
  });

  if (studentsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (studentsQuery.isError) {
    return (
      <CoachingLoadError
        message="Öğrenciler yüklenemedi."
        onRetry={() => studentsQuery.refetch()}
        isRetrying={studentsQuery.isFetching}
      />
    );
  }

  // What waits on the tutor comes from four sources. If one failed, the card
  // says so rather than leaving that kind out and looking empty.
  const waitingQueries = [sessionsQuery, timeRequestsQuery, rescheduleRequestsQuery, acceptanceQuery];
  const waitingState = waitingQueries.some((query) => query.isLoading)
    ? "loading"
    : waitingQueries.some((query) => query.isError)
      ? "error"
      : "ready";

  const board = buildStudentsBoard({
    students: studentsQuery.data ?? [],
    sessions: sessionsQuery.data ?? [],
    timeRequests: timeRequestsQuery.data ?? [],
    rescheduleRequests: rescheduleRequestsQuery.data ?? [],
    acceptanceRequests: acceptanceQuery.data ?? [],
    now: new Date(),
  });
  const capacity = capacityQuery.data ?? null;

  if (
    board.active.length === 0 &&
    board.pending.length === 0 &&
    board.waiting.length === 0 &&
    waitingState === "ready"
  ) {
    return (
      <CoachingEmptyState
        icon={UserPlus}
        title="Henüz koçluk öğrencin yok"
        description="Bir öğrenci koçluk talebini kabul edip ödemesi aktive olduğunda burada görünecek."
      />
    );
  }

  return (
    <CoachingStudentsBoard
      waiting={board.waiting}
      waitingState={waitingState}
      onRetryWaiting={() => {
        for (const query of waitingQueries) if (query.isError) void query.refetch();
      }}
      active={board.active}
      pending={board.pending}
      nextKnown={sessionsQuery.isSuccess}
      occupiedPlaces={capacity ? capacity.active_students : null}
      maxStudents={capacity ? capacity.max_active_students : null}
    />
  );
}

export default function CoachingStudentsPage() {
  return (
    <CoachingRecordGuard>
      <CoachingPageShell
        title="Öğrenciler"
        width="wide"
        currentHref="/dashboard/tutor/coaching/students"
        audience="tutor"
      >
        <StudentsContent />
      </CoachingPageShell>
    </CoachingRecordGuard>
  );
}
