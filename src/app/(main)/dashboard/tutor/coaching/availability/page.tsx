"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarDots } from "@phosphor-icons/react";

import { CoachingAvailabilitySection } from "@/components/coaching/CoachingAvailabilitySection";
import { CoachingEmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCoachingPlan } from "@/lib/coachingApi";

function AvailabilityContent() {
  const planQuery = useQuery({ queryKey: ["coaching-plan"], queryFn: fetchCoachingPlan });
  if (planQuery.isLoading) return <Skeleton className="h-72 w-full" />;
  if (planQuery.isError) {
    return (
      <CoachingLoadError
        message="Koçluk teklifin yüklenemedi."
        onRetry={() => planQuery.refetch()}
        isRetrying={planQuery.isFetching}
      />
    );
  }
  if (!planQuery.data) {
    return (
      <CoachingEmptyState
        icon={CalendarDots}
        title="Önce bir koçluk teklifi oluştur"
        description="Koçluk müsaitliği teklifine bağlıdır. İlk dört kurulum adımını tamamladıktan sonra yalnızca koçluk için ayırdığın saatleri ekleyebilirsin."
        actions={<Button asChild><Link href="/dashboard/tutor/coaching/plan?step=frequency">Teklif oluştur</Link></Button>}
      />
    );
  }
  return <CoachingAvailabilitySection />;
}

export default function CoachingAvailabilityPage() {
  return (
    <CoachingGuard>
      <CoachingPageShell
        title="Koçluk müsaitliği ve kapasite"
        width="wide"
        currentHref="/dashboard/tutor/coaching/availability"
        audience="tutor"
      >
        <AvailabilityContent />
      </CoachingPageShell>
    </CoachingGuard>
  );
}
