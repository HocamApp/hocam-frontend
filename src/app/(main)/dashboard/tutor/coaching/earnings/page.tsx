"use client";

import { useQuery } from "@tanstack/react-query";

import { CoachingEarningsSummary } from "@/components/coaching/CoachingEarningsSummary";
import { CoachingRecordGuard } from "@/components/coaching/CoachingGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { COACHING_FAZ8_QUERY_KEYS, fetchTutorCoachingEarnings } from "@/lib/coachingApi";

function Earnings() {
  const query = useQuery({ queryKey: COACHING_FAZ8_QUERY_KEYS.tutorEarnings(), queryFn: fetchTutorCoachingEarnings });
  if (query.isLoading) return <div className="flex min-h-48 items-center justify-center"><LoadingSpinner /></div>;
  if (!query.data) return <ErrorMessage message="Koçluk kazanç özeti yüklenemedi." />;
  return <CoachingEarningsSummary summary={query.data} />;
}

export default function TutorCoachingEarningsPage() {
  return (
    <CoachingRecordGuard>
      <CoachingPageShell
        title="Koçluk kazançları"
        description="Koçluk hizmetlerinden oluşan platform içi kazanç kayıtlarını finansal durumlarıyla birlikte incele."
        parentHref="/dashboard/tutor/coaching"
        parentLabel="Koçluk ana sayfası"
        eyebrow="Kazançlar"
        width="narrow"
        currentHref="/dashboard/tutor/coaching/earnings"
        audience="tutor"
      >
        <Earnings />
      </CoachingPageShell>
    </CoachingRecordGuard>
  );
}
