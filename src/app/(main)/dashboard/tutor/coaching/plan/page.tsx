"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingPlanForm } from "@/components/coaching/CoachingPlanForm";
import { RevenuePreviewCard } from "@/components/coaching/RevenuePreviewCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import {
  closeCoachingToNewStudents,
  extractCoachingErrorMessage,
  fetchCoachingOnboarding,
  fetchCoachingPlan,
  fetchCoachingRevenuePreview,
  publishCoachingPlan,
  reopenCoachingToNewStudents,
  saveCoachingPlan,
  unpublishCoachingPlan,
  type CoachingPlanPayload,
} from "@/lib/coachingApi";

function PlanContent() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: onboarding, isLoading: onboardingLoading } = useQuery({
    queryKey: ["coaching-onboarding"],
    queryFn: fetchCoachingOnboarding,
  });
  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ["coaching-plan"],
    queryFn: fetchCoachingPlan,
  });
  const { data: revenue } = useQuery({
    queryKey: ["coaching-revenue-preview"],
    queryFn: fetchCoachingRevenuePreview,
    enabled: Boolean(plan),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["coaching-plan"] });
    queryClient.invalidateQueries({ queryKey: ["coaching-capacity"] });
    queryClient.invalidateQueries({ queryKey: ["coaching-revenue-preview"] });
  };

  const mutationOptions = {
    onSuccess: () => {
      setError(null);
      refresh();
    },
    onError: (err: unknown) => setError(extractCoachingErrorMessage(err)),
  };

  const save = useMutation({
    mutationFn: (payload: CoachingPlanPayload) => saveCoachingPlan(payload),
    ...mutationOptions,
  });
  const publish = useMutation({ mutationFn: publishCoachingPlan, ...mutationOptions });
  const unpublish = useMutation({
    mutationFn: unpublishCoachingPlan,
    ...mutationOptions,
  });
  const close = useMutation({
    mutationFn: closeCoachingToNewStudents,
    ...mutationOptions,
  });
  const reopen = useMutation({
    mutationFn: reopenCoachingToNewStudents,
    ...mutationOptions,
  });

  if (onboardingLoading || planLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!onboarding?.is_completed) {
    return (
      <EmptyState
        title="Önce onboarding'i tamamla"
        description="Koçluk planı oluşturabilmek için kısa tanıtımı, kontrol sorularını ve sözleşme kabulünü tamamlaman gerekiyor."
        action={
          <Button asChild>
            <Link href="/dashboard/tutor/coaching/onboarding">
              Onboarding&apos;e git
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {plan ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={plan.is_published ? "default" : "secondary"}>
                  {plan.is_published ? "Yayında" : "Taslak"}
                </Badge>
                {plan.is_published && !plan.is_accepting_new_students ? (
                  <Badge variant="secondary">Yeni öğrenci alımı kapalı</Badge>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {plan.is_published ? (
                  <>
                    {plan.is_accepting_new_students ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => close.mutate()}
                        disabled={close.isPending}
                      >
                        Yeni öğrenci alımını kapat
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reopen.mutate()}
                        disabled={reopen.isPending}
                      >
                        Yeni öğrenci alımını aç
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => unpublish.mutate()}
                      disabled={unpublish.isPending}
                    >
                      Taslağa al
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => publish.mutate()}
                    disabled={publish.isPending}
                  >
                    Planı yayınla
                  </Button>
                )}
              </div>
            </div>

            {plan.is_published ? (
              <p className="text-xs text-muted-foreground">
                &quot;Yeni öğrenci alımını kapat&quot; mevcut öğrencilerini
                etkilemez ve plan ayarlarını silmez.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Yayınlamak için koçluk müsaitliği eklemen ve kapasitenin
                müsaitliğine uyması gerekir.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {error ? <ErrorMessage message={error} /> : null}

      <CoachingPlanForm
        plan={plan ?? null}
        priceCapMinor={plan?.price_cap_minor ?? null}
        onSubmit={(payload) => save.mutate(payload)}
        isSaving={save.isPending}
        error={null}
      />

      {revenue ? <RevenuePreviewCard preview={revenue} /> : null}
    </div>
  );
}

export default function CoachingPlanPage() {
  return (
    <CoachingGuard>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Plan ve fiyat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sıklık, görüşme başına fiyat, hedef sınav grupları ve kapasiteni
          belirle.
        </p>
        <div className="mt-6">
          <PlanContent />
        </div>
      </div>
    </CoachingGuard>
  );
}
