"use client";

import { useQuery } from "@tanstack/react-query";
import { NotePencil } from "@phosphor-icons/react";

import { CoachingRecordGuard as CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingEmptyState as EmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingRecordsBoard } from "@/components/coaching/CoachingRecordsBoard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  COACHING_FAZ6_QUERY_KEYS,
  COACHING_FAZ8_QUERY_KEYS,
  coachingDisputeCategoryLabel,
  coachingDisputeStatusLabel,
  fetchCoachingReports,
  fetchTutorCoachingDisputes,
  fetchTutorCoachingSessions,
} from "@/lib/coachingApi";
import { istanbulDateKey } from "@/lib/coachingOverview";
import { buildCoachingRecords } from "@/lib/coachingRecords";

function TutorRecordsContent() {
  const reportsQuery = useQuery({
    queryKey: COACHING_FAZ6_QUERY_KEYS.tutorReportList(),
    queryFn: fetchCoachingReports,
  });
  // Meetings waiting for a report, and the names and dates the report list may not carry.
  const sessionsQuery = useQuery({
    queryKey: ["coaching-tutor-sessions"],
    queryFn: fetchTutorCoachingSessions,
  });
  const disputesQuery = useQuery({
    queryKey: COACHING_FAZ8_QUERY_KEYS.tutorDisputes(),
    queryFn: fetchTutorCoachingDisputes,
  });

  if (reportsQuery.isLoading || sessionsQuery.isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  // Without both lists the page cannot say what is owed, so it says it could
  // not load rather than showing a calendar that looks empty.
  if (reportsQuery.isError || sessionsQuery.isError) {
    return (
      <CoachingLoadError
        message="Raporlar yüklenemedi."
        onRetry={() => {
          if (reportsQuery.isError) void reportsQuery.refetch();
          if (sessionsQuery.isError) void sessionsQuery.refetch();
        }}
        isRetrying={reportsQuery.isFetching || sessionsQuery.isFetching}
      />
    );
  }

  const now = new Date();
  const records = buildCoachingRecords({
    sessions: sessionsQuery.data ?? [],
    reports: reportsQuery.data ?? [],
    now,
  });
  const disputes = (disputesQuery.data ?? []).map((item) => ({
    id: item.id,
    title: coachingDisputeCategoryLabel(item.category),
    status: coachingDisputeStatusLabel(item.status),
    href: `/dashboard/tutor/coaching/complaints/${item.id}`,
  }));
  const disputesState = disputesQuery.isLoading ? "loading" : disputesQuery.isError ? "error" : "ready";

  if (records.items.length === 0 && disputes.length === 0 && disputesState === "ready") {
    return (
      <EmptyState
        icon={NotePencil}
        title="Henüz rapor yok"
        description="Bir görüşme bitince raporu yazman için burada görünür. Taslaklar ve yayınladığın raporlar da burada, günlerine göre durur."
        tone="accent"
      />
    );
  }

  return (
    <CoachingRecordsBoard
      records={records}
      today={istanbulDateKey(now)}
      disputes={disputes}
      disputesState={disputesState}
      onRetryDisputes={() => void disputesQuery.refetch()}
    />
  );
}

export default function TutorCoachingReportsPage() {
  return (
    <CoachingGuard>
      <CoachingPageShell
        title="Kayıtlar"
        width="wide"
        currentHref="/dashboard/tutor/coaching/reports"
        audience="tutor"
      >
        <TutorRecordsContent />
      </CoachingPageShell>
    </CoachingGuard>
  );
}
