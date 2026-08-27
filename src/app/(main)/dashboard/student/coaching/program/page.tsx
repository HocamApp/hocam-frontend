"use client";

import { useQuery } from "@tanstack/react-query";
import { ListChecks } from "@phosphor-icons/react";

import { StudentProgramTasks } from "@/components/coaching/StudentProgramTasks";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { CoachingEmptyState as EmptyState } from "@/components/coaching/CoachingEmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { CoachingLoadingState } from "@/components/coaching/CoachingLoadingState";
import {
  COACHING_FAZ6_QUERY_KEYS,
  extractCoachingErrorMessage,
  fetchCoachingProgram,
  fetchCoachingSchedulingState,
} from "@/lib/coachingApi";

function StudentProgramContent() {
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

  if (stateQuery.isLoading) return <CoachingLoadingState rows={3} />;
  if (stateQuery.isError)
    return (
      <ErrorMessage message={extractCoachingErrorMessage(stateQuery.error)} />
    );
  if (!servicePeriodId)
    return (
      <EmptyState
        icon={ListChecks}
        title="Aktif koçluk dönemin yok"
        description="Programın, çalışma koçluğu dönemin başladığında burada görünür."
        steps={[
          "Koçluk dönemin aktive olur",
          "Öğretmenin çalışma programını hazırlar",
        ]}
      />
    );
  if (programQuery.isLoading) return <CoachingLoadingState rows={3} />;
  if (programQuery.isError)
    return (
      <ErrorMessage message={extractCoachingErrorMessage(programQuery.error)} />
    );
  if (!programQuery.data)
    return (
      <EmptyState
        icon={ListChecks}
        title="Programın henüz hazır değil"
        description="Öğretmenin programını hazırladığında görevlerin burada görünecek."
        steps={[
          "Hedeflerin birlikte belirlenir",
          "Görevler programına eklenir",
        ]}
      />
    );
  return <StudentProgramTasks program={programQuery.data} />;
}

export default function StudentCoachingProgramPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <CoachingPageShell
        title="Çalışma programım"
        description="Öğretmeninle belirlediğin görevleri, hedefleri ve ilerleme durumunu takip et."
        parentHref="/dashboard/student/coaching"
        parentLabel="Çalışma koçluğum"
        eyebrow="Program"
        width="narrow"
        currentHref="/dashboard/student/coaching/program"
        audience="student"
      >
        <StudentProgramContent />
      </CoachingPageShell>
    </RouteGuard>
  );
}
