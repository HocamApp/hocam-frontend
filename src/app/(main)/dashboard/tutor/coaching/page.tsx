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
  fetchCoachingStudents,
  fetchTutorCoachingSessions,
} from "@/lib/coachingApi";
import { deriveCoachingMetrics, deriveCoachingStatus } from "@/lib/coachingPresentation";

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
  const studentsQuery = useQuery({
    queryKey: ["coaching-students"],
    queryFn: fetchCoachingStudents,
    enabled: hasPlan,
  });
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

  if (onboardingQuery.isLoading || planQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-8 sm:px-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
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

  const rawMetrics = deriveCoachingMetrics({
    students: studentsQuery.data ?? [],
    sessions: sessionsQuery.data ?? [],
    requests: requestsQuery.data ?? [],
  });
  const metrics = {
    activeStudents: studentsQuery.isSuccess ? rawMetrics.activeStudents : null,
    upcomingSessions: sessionsQuery.isSuccess ? rawMetrics.upcomingSessions : null,
    pendingReports: sessionsQuery.isSuccess ? rawMetrics.pendingReports : null,
    pendingRequests: requestsQuery.isSuccess ? rawMetrics.pendingRequests : null,
  };
  const status = deriveCoachingStatus({
    onboardingComplete: Boolean(onboardingQuery.data?.is_completed),
    plan: planQuery.data ?? null,
    capacity: capacityQuery.data ?? null,
    checkoutEnabled,
  });

  return <TutorCoachingDashboard status={status} metrics={metrics} />;
}

export default function CoachingDashboardPage() {
  return (
    <CoachingGuard>
      <CoachingOverview />
    </CoachingGuard>
  );
}
