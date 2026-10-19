"use client";

import { useQuery } from "@tanstack/react-query";

import { CoachingGuard } from "@/components/coaching/CoachingGuard";
import { TutorCoachingDashboard } from "@/components/coaching/TutorCoachingDashboard";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoachingFlag } from "@/hooks/useCoachingFlag";
import {
  extractCoachingErrorMessage,
  fetchAcceptanceRequests,
  fetchCoachingCapacity,
  fetchCoachingOnboarding,
  fetchCoachingPlan,
  fetchTutorCoachingRescheduleRequests,
  fetchTutorCoachingSessions,
  fetchTutorCoachingTimeRequests,
} from "@/lib/coachingApi";
import { buildCoachingTodos, buildCoachingWeek } from "@/lib/coachingOverview";
import { deriveCoachingStatus } from "@/lib/coachingPresentation";

function CoachingOverview() {
  const { checkoutEnabled } = useCoachingFlag();
  const onboardingQuery = useQuery({
    queryKey: ["coaching-onboarding"],
    queryFn: fetchCoachingOnboarding,
  });
  const planQuery = useQuery({
    queryKey: ["coaching-plan"],
    queryFn: fetchCoachingPlan,
  });
  const hasPlan = Boolean(planQuery.data);
  const capacityQuery = useQuery({
    queryKey: ["coaching-capacity"],
    queryFn: fetchCoachingCapacity,
    enabled: hasPlan,
  });
  // The same keys the tab badge and the request pages use, so one answer
  // updates every place that shows it.
  const sessionsQuery = useQuery({
    queryKey: ["coaching-tutor-sessions"],
    queryFn: fetchTutorCoachingSessions,
    enabled: hasPlan,
  });
  const requestsQuery = useQuery({
    queryKey: ["tutor-acceptance-requests"],
    queryFn: fetchAcceptanceRequests,
    enabled: hasPlan,
  });
  const timeRequestsQuery = useQuery({
    queryKey: ["coaching-tutor-time-requests"],
    queryFn: fetchTutorCoachingTimeRequests,
    enabled: hasPlan,
    staleTime: 60_000,
  });
  const rescheduleRequestsQuery = useQuery({
    queryKey: ["coaching-tutor-reschedule-requests"],
    queryFn: fetchTutorCoachingRescheduleRequests,
    enabled: hasPlan,
    staleTime: 60_000,
  });

  if (onboardingQuery.isLoading || planQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-8 sm:px-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (onboardingQuery.isError || planQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <ErrorMessage
          message={extractCoachingErrorMessage(onboardingQuery.error ?? planQuery.error)}
        />
      </div>
    );
  }

  const plan = planQuery.data ?? null;
  const capacity = capacityQuery.data ?? null;
  const status = deriveCoachingStatus({
    onboardingComplete: Boolean(onboardingQuery.data?.is_completed),
    plan,
    capacity,
    checkoutEnabled,
  });

  // A list that failed to load is not an empty list: if any source behind the
  // to-dos failed, the card says so instead of quietly leaving that kind out.
  const todoQueries = [sessionsQuery, requestsQuery, timeRequestsQuery, rescheduleRequestsQuery];
  const todoState = todoQueries.some((query) => query.isLoading)
    ? "loading"
    : todoQueries.some((query) => query.isError)
      ? "error"
      : "ready";
  const weekState = sessionsQuery.isLoading ? "loading" : sessionsQuery.isError ? "error" : "ready";

  const now = new Date();
  const sessions = sessionsQuery.data ?? [];

  return (
    <TutorCoachingDashboard
      status={status}
      lists={
        hasPlan
          ? {
              todos: buildCoachingTodos({
                sessions,
                acceptanceRequests: requestsQuery.data ?? [],
                rescheduleRequests: rescheduleRequestsQuery.data ?? [],
                timeRequests: timeRequestsQuery.data ?? [],
                now,
              }),
              todoState,
              week: buildCoachingWeek({ sessions, now }),
              weekState,
              offer:
                plan && capacity
                  ? {
                      published: plan.is_published,
                      acceptingNewStudents: plan.is_accepting_new_students,
                      activeStudents: capacity.active_students,
                      maxStudents: plan.max_active_students,
                    }
                  : null,
              onRetryTodos: () => {
                for (const query of todoQueries) if (query.isError) void query.refetch();
              },
              onRetryWeek: () => void sessionsQuery.refetch(),
              isRetrying: todoQueries.some((query) => query.isFetching) && todoState === "error",
            }
          : null
      }
    />
  );
}

export default function CoachingDashboardPage() {
  return (
    <CoachingGuard>
      <CoachingOverview />
    </CoachingGuard>
  );
}
