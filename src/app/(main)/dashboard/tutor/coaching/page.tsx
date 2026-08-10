"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CapacityPreviewCard } from "@/components/coaching/CapacityPreviewCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  fetchCoachingCapacity,
  fetchCoachingOnboarding,
  fetchCoachingPlan,
} from "@/lib/coachingApi";

function CoachingOverview() {
  const { data: onboarding, isLoading: onboardingLoading } = useQuery({
    queryKey: ["coaching-onboarding"],
    queryFn: fetchCoachingOnboarding,
  });
  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ["coaching-plan"],
    queryFn: fetchCoachingPlan,
  });
  const { data: capacity } = useQuery({
    queryKey: ["coaching-capacity"],
    queryFn: fetchCoachingCapacity,
    enabled: Boolean(plan),
  });

  if (onboardingLoading || planLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!onboarding?.is_completed) {
    return (
      <EmptyState
        title="Koçluk vermeye henüz başlamadın"
        description="Çalışma koçluğu, ders paketine bağlı ayrı bir hizmettir. Kısa bir tanıtımdan sonra planını oluşturabilirsin."
        action={
          <Button asChild>
            <Link href="/dashboard/tutor/coaching/onboarding">
              Koçluk vermeye başla
            </Link>
          </Button>
        }
      />
    );
  }

  if (!plan) {
    return (
      <EmptyState
        title="Koçluk planın yok"
        description="Onboarding'i tamamladın. Şimdi sıklık, fiyat ve hedef sınav gruplarını belirleyerek planını oluştur."
        action={
          <Button asChild>
            <Link href="/dashboard/tutor/coaching/plan">Plan oluştur</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Koçluk planın</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {plan.session_duration_minutes} dakikalık görüşme ·{" "}
                {plan.price_per_session_display} / görüşme
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={plan.is_published ? "default" : "secondary"}>
                {plan.is_published ? "Yayında" : "Taslak"}
              </Badge>
              {plan.is_published && !plan.is_accepting_new_students ? (
                <Badge variant="secondary">Yeni öğrenci alımı kapalı</Badge>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/tutor/coaching/plan">Plan ve fiyat</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/tutor/coaching/availability">
                Müsaitlik ve kapasite
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/tutor/coaching/preview">
                Öğrenci görünümü
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/tutor/coaching/students">
                Koçluk öğrencilerim
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/tutor/coaching/upcoming">
                Yaklaşan görüşmeler
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/tutor/coaching/reports">
                Raporlar
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/tutor/coaching/complaints">
                Başvurular
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/tutor/coaching/earnings">
                Hakedişler
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/tutor/coaching/time-requests">
                Saat talepleri
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/tutor/coaching/reschedule-requests">
                Değişiklik talepleri
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {capacity ? <CapacityPreviewCard capacity={capacity} /> : null}
    </div>
  );
}

export default function CoachingDashboardPage() {
  return (
    <CoachingGuard>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Koçluk</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Çalışma koçluğu planını, müsaitliğini ve kapasiteni buradan yönet.
        </p>
        <div className="mt-6">
          <CoachingOverview />
        </div>
      </div>
    </CoachingGuard>
  );
}
