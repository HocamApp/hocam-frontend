"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ListChecks } from "@phosphor-icons/react";

import { CoachingEmptyState as EmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { CoachingLoadingState } from "@/components/coaching/CoachingLoadingState";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { StudentProgramBoard } from "@/components/coaching/StudentProgramBoard";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { useProgramTaskToggle } from "@/hooks/useProgramTaskToggle";
import { useServerNow } from "@/hooks/useServerNow";
import {
  COACHING_FAZ6_QUERY_KEYS,
  fetchCoachingProgram,
  fetchCoachingSchedulingState,
} from "@/lib/coachingApi";
import { buildStudentProgram } from "@/lib/coachingStudentProgram";

function StudentProgramContent() {
  const now = useServerNow();
  const stateQuery = useQuery({
    queryKey: ["coaching-scheduling-state"],
    queryFn: fetchCoachingSchedulingState,
  });
  const servicePeriodId = stateQuery.data?.service_period_id ?? null;
  const programQuery = useQuery({
    queryKey: servicePeriodId
      ? COACHING_FAZ6_QUERY_KEYS.program(servicePeriodId)
      : ["coaching-program", "none"],
    queryFn: () => fetchCoachingProgram(servicePeriodId!),
    enabled: Boolean(servicePeriodId),
  });
  const { toggle, busyTaskId } = useProgramTaskToggle(servicePeriodId);

  const program = programQuery.data;
  const model = useMemo(() => (program ? buildStudentProgram({ program, now }) : null), [program, now]);

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
  // No period: the coaching has not started yet, or it has ended and the server
  // no longer names one. A finished coaching's program cannot be opened from here.
  if (!servicePeriodId) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Aktif koçluk dönemin yok"
        description="Programın, koçluk dönemin başladığında burada görünür. Koçluğun sona erdiyse geçmiş raporların Raporlar sekmesinde kalır."
        steps={["Koçluk saatlerin seçilir, dönem başlar", "Hocan çalışma programını hazırlar"]}
      />
    );
  }
  if (programQuery.isLoading) return <CoachingLoadingState rows={3} />;
  if (programQuery.isError) {
    return (
      <CoachingLoadError
        message="Programın yüklenemedi."
        onRetry={() => programQuery.refetch()}
        isRetrying={programQuery.isFetching}
      />
    );
  }
  if (!model) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Programın henüz hazır değil"
        description="Hocan programını hazırladığında görevlerin burada görünecek."
        steps={["Hedeflerin birlikte belirlenir", "Görevler programına eklenir"]}
      />
    );
  }
  return <StudentProgramBoard model={model} busyTaskId={busyTaskId} onToggle={toggle} />;
}

export default function StudentCoachingProgramPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <CoachingPageShell
        title="Koçluk Programım"
        width="narrow"
        currentHref="/dashboard/student/coaching/program"
        audience="student"
      >
        <StudentProgramContent />
      </CoachingPageShell>
    </RouteGuard>
  );
}
