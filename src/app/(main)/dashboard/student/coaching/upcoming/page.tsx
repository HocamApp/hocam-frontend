"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarBlank } from "@phosphor-icons/react";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingLoadingState } from "@/components/coaching/CoachingLoadingState";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { CoachingEmptyState } from "@/components/coaching/CoachingEmptyState";
import { StudentSessionsBoard } from "@/components/coaching/StudentSessionsBoard";
import { useServerNow } from "@/hooks/useServerNow";
import { COACHING_SESSION_QUERY_KEYS, fetchCoachingSessions } from "@/lib/coachingApi";
import { buildStudentSessions } from "@/lib/coachingStudentSessions";

function SessionsContent() {
  const now = useServerNow();
  const query = useQuery({
    queryKey: COACHING_SESSION_QUERY_KEYS.studentList(),
    queryFn: fetchCoachingSessions,
  });
  const sessions = query.data;
  const model = useMemo(() => (sessions ? buildStudentSessions({ sessions, now }) : null), [sessions, now]);

  if (query.isLoading) return <CoachingLoadingState rows={3} />;

  if (query.isError || !model) {
    return (
      <CoachingLoadError
        message="Görüşmelerin yüklenemedi."
        onRetry={() => query.refetch()}
        isRetrying={query.isFetching}
      />
    );
  }

  if (sessions && sessions.length === 0) {
    return (
      <CoachingEmptyState
        icon={CalendarBlank}
        title="Henüz görüşmen oluşturulmadı"
        description="Düzenli koçluk saatlerin onaylandığında planlanan görüşmeler burada görünür."
        steps={["Koçluk saatin belirlenir", "Görüşme takvimine eklenir"]}
      />
    );
  }

  return <StudentSessionsBoard model={model} />;
}

export default function StudentCoachingUpcomingPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <CoachingPageShell
        title="Görüşmeler"
        width="narrow"
        currentHref="/dashboard/student/coaching/upcoming"
        audience="student"
      >
        <SessionsContent />
      </CoachingPageShell>
    </RouteGuard>
  );
}
