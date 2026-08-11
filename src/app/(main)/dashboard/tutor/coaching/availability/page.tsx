"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";

import { CoachingAvailabilitySection } from "@/components/coaching/CoachingAvailabilitySection";
import { CoachingEmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCoachingPlan } from "@/lib/coachingApi";

function AvailabilityContent() {
  const planQuery = useQuery({ queryKey: ["coaching-plan"], queryFn: fetchCoachingPlan });
  if (planQuery.isLoading) return <Skeleton className="h-72 w-full" />;
  if (!planQuery.data) {
    return (
      <CoachingEmptyState
        icon={CalendarClock}
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
        description="Bu saatler normal ders müsaitliğinden ayrıdır. Haftalık slot sayısı ve teorik kapasite yalnızca burada tanımladığın koçluk saatlerinden hesaplanır."
        parentHref="/dashboard/tutor/coaching"
        parentLabel="Koçluk ana sayfası"
        eyebrow="Ayarlar"
        width="narrow"
      >
        <AvailabilityContent />
      </CoachingPageShell>
    </CoachingGuard>
  );
}
