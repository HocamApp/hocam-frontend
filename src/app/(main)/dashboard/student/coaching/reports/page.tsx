"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardText } from "@phosphor-icons/react";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { CoachingEmptyState as EmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { CoachingLoadingState } from "@/components/coaching/CoachingLoadingState";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { StudentReportCards } from "@/components/coaching/StudentReportCards";
import {
  COACHING_FAZ6_QUERY_KEYS,
  COACHING_SESSION_QUERY_KEYS,
  fetchCoachingReports,
  fetchCoachingSessions,
} from "@/lib/coachingApi";
import { buildStudentReportCards } from "@/lib/coachingStudentReports";

function StudentReportsContent() {
  const reportsQuery = useQuery({
    queryKey: COACHING_FAZ6_QUERY_KEYS.studentReportList(),
    queryFn: fetchCoachingReports,
  });
  // The meetings give each card its number. They are only a nicety: when they
  // cannot be read (or the coaching is over) the card names the day instead.
  const sessionsQuery = useQuery({
    queryKey: COACHING_SESSION_QUERY_KEYS.studentList(),
    queryFn: fetchCoachingSessions,
  });

  const reports = reportsQuery.data;
  const sessions = sessionsQuery.data;
  const cards = useMemo(
    () => (reports ? buildStudentReportCards({ reports, sessions: sessions ?? [] }) : []),
    [reports, sessions],
  );

  if (reportsQuery.isLoading) return <CoachingLoadingState rows={3} />;
  if (reportsQuery.isError) {
    return (
      <CoachingLoadError
        message="Raporların yüklenemedi."
        onRetry={() => reportsQuery.refetch()}
        isRetrying={reportsQuery.isFetching}
      />
    );
  }
  if (cards.length === 0) {
    return (
      <EmptyState
        icon={ClipboardText}
        title="Henüz yayınlanmış raporun yok"
        description="Hocan raporu yayınladığında en son sürüm burada görünecek."
        steps={["Koçluk görüşmen tamamlanır", "Öğretmenin raporu yayınlar"]}
      />
    );
  }
  return <StudentReportCards cards={cards} />;
}

export default function StudentCoachingReportsPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <CoachingPageShell
        title="Raporlar"
        width="narrow"
        currentHref="/dashboard/student/coaching/reports"
        audience="student"
      >
        <StudentReportsContent />
      </CoachingPageShell>
    </RouteGuard>
  );
}
