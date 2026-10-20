"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap } from "@phosphor-icons/react";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingLoadingState } from "@/components/coaching/CoachingLoadingState";
import { CoachingEmptyState as EmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import {
  StudentCoachingHistory,
  StudentCoachingOverview,
  type StudentCoachingHeaderModel,
  type StudentNextStepModel,
  type StudentOverviewProblem,
} from "@/components/coaching/StudentCoachingOverview";
import { useProgramTaskToggle } from "@/hooks/useProgramTaskToggle";
import { useServerNow } from "@/hooks/useServerNow";
import {
  COACHING_FAZ6_QUERY_KEYS,
  COACHING_FAZ8_QUERY_KEYS,
  COACHING_SESSION_QUERY_KEYS,
  coachingFrequencyLabel,
  coachingServiceStatusLabel,
  fetchCoachingProgram,
  fetchCoachingReports,
  fetchCoachingSchedulingState,
  fetchCoachingSessions,
  fetchStudentCoachingDisputes,
  type CoachingSchedulingState,
} from "@/lib/coachingApi";
import { studentCoachingNextStep } from "@/lib/coachingPresentation";
import {
  buildStudentCoachingProgress,
  buildStudentCoachingTimeline,
  buildStudentReportRows,
} from "@/lib/coachingStudentOverview";
import { coachingDateTimeLabel } from "@/lib/coachingTime";
import { fetchCoachingPurchaseConversation } from "@/lib/messagingApi";

const BASE = "/dashboard/student/coaching";
/** A coaching that is over: the server still answers for it while a refund obligation is open. */
const ENDED_STATUSES = new Set(["cancelled", "rejected", "refunded", "completed"]);

function nextStepFor(state: CoachingSchedulingState): StudentNextStepModel {
  const step = studentCoachingNextStep(state.service_status, undefined);
  if (step.kind === "pick_schedule") {
    return {
      text: "Koçluğun başlaması için haftalık görüşme saatlerini seçmen gerekiyor.",
      pickSchedule: {
        href: `${BASE}/schedule`,
        deadline: state.slot_selection_deadline_at
          ? coachingDateTimeLabel(state.slot_selection_deadline_at)
          : null,
      },
    };
  }
  return {
    text: step.kind === "message" ? step.text : "Koçluk durumun güncelleniyor.",
    pickSchedule: null,
  };
}

/** A student without a running coaching: past reports when there are any, otherwise the empty state. */
function NoCoachingContent() {
  const reportsQuery = useQuery({
    queryKey: COACHING_FAZ6_QUERY_KEYS.studentReportList(),
    queryFn: fetchCoachingReports,
  });

  if (reportsQuery.isLoading) return <CoachingLoadingState rows={2} />;
  if (reportsQuery.isError) {
    return (
      <CoachingLoadError
        message="Geçmiş raporların yüklenemedi. Bağlantını kontrol edip tekrar dene."
        onRetry={() => reportsQuery.refetch()}
        isRetrying={reportsQuery.isFetching}
      />
    );
  }

  const rows = buildStudentReportRows({ reports: reportsQuery.data ?? [] });
  if (rows.length > 0) return <StudentCoachingHistory rows={rows} seeAllHref={`${BASE}/reports`} />;

  return (
    <EmptyState
      icon={GraduationCap}
      title="Henüz bir çalışma koçluğun yok"
      description="Ders paketine çalışma koçluğu eklediğin talep öğretmenin tarafından kabul edildikten sonra koçluk alanın burada açılır."
      steps={["Ders paketi ve koçluk talebin hocana gider", "Hocan kabul edince koçluk alanın açılır"]}
    />
  );
}

function RunningCoachingContent({ state }: { state: CoachingSchedulingState }) {
  const now = useServerNow();

  const running = state.service_status === "active" || state.service_status === "cancellation_pending";
  const ended = ENDED_STATUSES.has(state.service_status);
  const servicePeriodId = state.service_period_id;

  const sessionsQuery = useQuery({
    queryKey: COACHING_SESSION_QUERY_KEYS.studentList(),
    queryFn: fetchCoachingSessions,
    enabled: running,
  });
  const programQuery = useQuery({
    queryKey: servicePeriodId ? COACHING_FAZ6_QUERY_KEYS.program(servicePeriodId) : ["coaching-program", "none"],
    queryFn: () => fetchCoachingProgram(servicePeriodId!),
    enabled: running && Boolean(servicePeriodId),
  });
  const reportsQuery = useQuery({
    queryKey: COACHING_FAZ6_QUERY_KEYS.studentReportList(),
    queryFn: fetchCoachingReports,
    enabled: running || ended,
  });
  const disputesQuery = useQuery({
    queryKey: COACHING_FAZ8_QUERY_KEYS.studentDisputes(),
    queryFn: fetchStudentCoachingDisputes,
    enabled: running,
  });
  // The coaching thread itself, so "Hocana yaz" opens it instead of the inbox.
  // It also names the coach; if it cannot be read the page still works.
  const conversationQuery = useQuery({
    queryKey: ["coaching-purchase-conversation", state.id],
    queryFn: () => fetchCoachingPurchaseConversation(state.id),
    staleTime: 10 * 60_000,
  });

  const { toggle, busyTaskId } = useProgramTaskToggle(servicePeriodId);

  const sessions = sessionsQuery.data;
  const progress = useMemo(
    () => (sessions ? buildStudentCoachingProgress({ sessions, totalSessions: state.total_sessions }) : null),
    [sessions, state.total_sessions],
  );
  const timeline = useMemo(
    () =>
      buildStudentCoachingTimeline({
        sessions: sessions ?? [],
        tasks: programQuery.data?.tasks ?? [],
        disputes: disputesQuery.data ?? [],
        reports: reportsQuery.data ?? [],
        now,
      }),
    [sessions, programQuery.data, disputesQuery.data, reportsQuery.data, now],
  );

  // With no meetings to count, the step is the sentence for a winding-down or finished coaching.
  const endStep = studentCoachingNextStep(state.service_status, []);
  const other = conversationQuery.data?.other_participant;
  const header: StudentCoachingHeaderModel = {
    name: other?.display_name || null,
    avatarUrl: other?.avatar_url ?? null,
    statusLabel: coachingServiceStatusLabel(state.service_status),
    subtitle: [coachingFrequencyLabel(state.frequency), `${state.weeks} hafta`, progress?.range]
      .filter(Boolean)
      .join(" · "),
    messagesHref: conversationQuery.data?.id ? `/messages/${conversationQuery.data.id}` : "/messages",
    unread: conversationQuery.data?.unread_count ?? null,
    notice:
      (state.service_status === "cancellation_pending" || ended) && endStep.kind === "message"
        ? endStep.text
        : null,
  };

  const problems: StudentOverviewProblem[] = [];
  if (sessionsQuery.isError) problems.push({ id: "sessions", section: "ahead", message: "Görüşmelerin yüklenemedi." });
  if (programQuery.isError) problems.push({ id: "program", section: "ahead", message: "Görevlerin yüklenemedi." });
  if (disputesQuery.isError) problems.push({ id: "disputes", section: "ahead", message: "Sorun bildirimlerin yüklenemedi." });
  if (reportsQuery.isError) problems.push({ id: "reports", section: "past", message: "Raporların yüklenemedi." });

  const retriers: Record<string, () => unknown> = {
    sessions: () => sessionsQuery.refetch(),
    program: () => programQuery.refetch(),
    disputes: () => disputesQuery.refetch(),
    reports: () => reportsQuery.refetch(),
  };
  const isRetrying = [sessionsQuery, programQuery, disputesQuery, reportsQuery].some(
    (query) => query.isError && query.isFetching,
  );

  // Rows appear as each read arrives; the skeleton shows only while nothing can be listed yet.
  const aheadLoading =
    timeline.ahead.length === 0 &&
    (sessionsQuery.isLoading || programQuery.isLoading || disputesQuery.isLoading);
  const pastLoading = timeline.past.length === 0 && (reportsQuery.isLoading || disputesQuery.isLoading);

  return (
    <StudentCoachingOverview
      header={header}
      progress={progress}
      nextStep={running || ended ? null : nextStepFor(state)}
      history={
        ended
          ? { rows: buildStudentReportRows({ reports: reportsQuery.data ?? [] }), seeAllHref: `${BASE}/reports` }
          : null
      }
      ahead={timeline.ahead}
      hidden={timeline.hidden}
      aheadLoading={aheadLoading}
      past={timeline.past}
      pastLoading={pastLoading}
      programHint={running && (!servicePeriodId || programQuery.data === null)}
      problems={problems}
      onRetry={(id) => retriers[id]?.()}
      isRetrying={isRetrying}
      onComplete={toggle}
      completingTaskId={busyTaskId}
    />
  );
}

function OverviewContent() {
  const stateQuery = useQuery({
    queryKey: ["coaching-scheduling-state"],
    queryFn: fetchCoachingSchedulingState,
  });

  if (stateQuery.isLoading) return <CoachingLoadingState rows={3} />;

  if (stateQuery.isError) {
    return (
      <CoachingLoadError
        message="Koçluk bilgilerin yüklenemedi. Bağlantını kontrol edip tekrar dene."
        onRetry={() => stateQuery.refetch()}
        isRetrying={stateQuery.isFetching}
      />
    );
  }

  if (!stateQuery.data) return <NoCoachingContent />;
  return <RunningCoachingContent state={stateQuery.data} />;
}

export default function StudentCoachingOverviewPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <CoachingPageShell
        title="Genel bakış"
        width="narrow"
        currentHref="/dashboard/student/coaching"
        audience="student"
      >
        <OverviewContent />
      </CoachingPageShell>
    </RouteGuard>
  );
}
