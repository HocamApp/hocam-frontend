"use client";

import { useQuery } from "@tanstack/react-query";

import { StudentProgramTasks } from "@/components/coaching/StudentProgramTasks";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
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
    queryKey: servicePeriodId ? COACHING_FAZ6_QUERY_KEYS.program(servicePeriodId) : ["coaching-program", "none"],
    queryFn: () => fetchCoachingProgram(servicePeriodId!),
    enabled: Boolean(servicePeriodId),
  });

  if (stateQuery.isLoading) return <div className="flex min-h-48 items-center justify-center"><LoadingSpinner /></div>;
  if (stateQuery.isError) return <ErrorMessage message={extractCoachingErrorMessage(stateQuery.error)} />;
  if (!servicePeriodId) return <EmptyState title="Aktif koçluk dönemi yok" description="Programın, aktif çalışma koçluğu döneminde burada görünür." />;
  if (programQuery.isLoading) return <div className="flex min-h-48 items-center justify-center"><LoadingSpinner /></div>;
  if (programQuery.isError) return <ErrorMessage message={extractCoachingErrorMessage(programQuery.error)} />;
  if (!programQuery.data) return <EmptyState title="Programın henüz hazır değil" description="Öğretmenin programını hazırladığında görevlerin burada görünecek." />;
  return <StudentProgramTasks program={programQuery.data} />;
}

export default function StudentCoachingProgramPage() {
  return <RouteGuard requireAuth requireRole="student"><div className="mx-auto max-w-3xl px-4 py-8"><h1 className="mb-6 text-2xl font-semibold">Programım</h1><StudentProgramContent /></div></RouteGuard>;
}
