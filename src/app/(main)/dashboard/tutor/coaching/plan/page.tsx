"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardText } from "@phosphor-icons/react";
import { toast } from "sonner";

import { CoachingAvailabilitySection } from "@/components/coaching/CoachingAvailabilitySection";
import { CoachingEmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingPlanForm } from "@/components/coaching/CoachingPlanForm";
import { CoachingSetupProgress } from "@/components/coaching/CoachingSetupProgress";
import { CoachingStatusCard } from "@/components/coaching/CoachingStatusCard";
import { RevenuePreviewCard } from "@/components/coaching/RevenuePreviewCard";
import { StudentPreviewCard } from "@/components/coaching/StudentPreviewCard";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoachingFlag } from "@/hooks/useCoachingFlag";
import {
  closeCoachingToNewStudents,
  extractCoachingErrorCode,
  extractCoachingErrorMessage,
  fetchCoachingCapacity,
  fetchCoachingOnboarding,
  fetchCoachingPlan,
  fetchCoachingPlanPreview,
  fetchCoachingRevenuePreview,
  fetchCoachingSetupConfig,
  publishCoachingPlan,
  reopenCoachingToNewStudents,
  saveCoachingPlan,
  unpublishCoachingPlan,
  type CoachingPlanPayload,
} from "@/lib/coachingApi";
import { deriveCoachingStatus } from "@/lib/coachingPresentation";
import {
  coachingSetupStepForError,
  readCoachingSetupStep,
  unlockedCoachingSetupSteps,
  type CoachingSetupStep,
} from "@/lib/coachingSetup";

function PlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { checkoutEnabled } = useCoachingFlag();
  const [error, setError] = useState<string | null>(null);
  const startedWithPlan = useRef<boolean | null>(null);
  const requestedStep = readCoachingSetupStep(searchParams.get("step"));

  const onboardingQuery = useQuery({
    queryKey: ["coaching-onboarding"],
    queryFn: fetchCoachingOnboarding,
  });
  const planQuery = useQuery({
    queryKey: ["coaching-plan"],
    queryFn: fetchCoachingPlan,
  });
  const setupQuery = useQuery({
    queryKey: ["coaching-setup-config"],
    queryFn: fetchCoachingSetupConfig,
  });
  const capacityQuery = useQuery({
    queryKey: ["coaching-capacity"],
    queryFn: fetchCoachingCapacity,
    enabled: Boolean(planQuery.data),
  });
  const revenueQuery = useQuery({
    queryKey: ["coaching-revenue-preview"],
    queryFn: fetchCoachingRevenuePreview,
    enabled: Boolean(planQuery.data),
  });
  const previewQuery = useQuery({
    queryKey: ["coaching-plan-preview"],
    queryFn: fetchCoachingPlanPreview,
    enabled: Boolean(planQuery.data),
  });

  if (!planQuery.isLoading && startedWithPlan.current === null) {
    startedWithPlan.current = Boolean(planQuery.data);
  }

  const navigate = (step: CoachingSetupStep) => {
    setError(null);
    router.replace(`/dashboard/tutor/coaching/plan?step=${step}`);
  };
  const refreshPlanTruth = () => {
    for (const queryKey of [
      ["coaching-plan"],
      ["coaching-capacity"],
      ["coaching-revenue-preview"],
      ["coaching-plan-preview"],
    ]) {
      queryClient.invalidateQueries({ queryKey });
    }
  };

  const save = useMutation({
    mutationFn: ({ payload }: { payload: CoachingPlanPayload; next: CoachingSetupStep }) =>
      saveCoachingPlan(payload),
    onSuccess: (_plan, variables) => {
      setError(null);
      refreshPlanTruth();
      toast.success("Plan kaydedildi.");
      navigate(variables.next);
    },
    onError: (mutationError: unknown) => setError(extractCoachingErrorMessage(mutationError)),
  });
  const publish = useMutation({
    mutationFn: publishCoachingPlan,
    onSuccess: () => {
      setError(null);
      refreshPlanTruth();
      toast.success("Koçluk teklifin yayınlandı.");
    },
    onError: (mutationError: unknown) => {
      router.replace(
        `/dashboard/tutor/coaching/plan?step=${coachingSetupStepForError(extractCoachingErrorCode(mutationError))}`
      );
      setError(extractCoachingErrorMessage(mutationError));
    },
  });
  const unpublish = useMutation({
    mutationFn: unpublishCoachingPlan,
    onSuccess: refreshPlanTruth,
    onError: (mutationError: unknown) => setError(extractCoachingErrorMessage(mutationError)),
  });
  const close = useMutation({
    mutationFn: closeCoachingToNewStudents,
    onSuccess: refreshPlanTruth,
    onError: (mutationError: unknown) => setError(extractCoachingErrorMessage(mutationError)),
  });
  const reopen = useMutation({
    mutationFn: reopenCoachingToNewStudents,
    onSuccess: refreshPlanTruth,
    onError: (mutationError: unknown) => setError(extractCoachingErrorMessage(mutationError)),
  });

  if (onboardingQuery.isLoading || planQuery.isLoading || setupQuery.isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }
  if (onboardingQuery.isError || planQuery.isError || setupQuery.isError || !onboardingQuery.data || !setupQuery.data) {
    return <ErrorMessage message="Koçluk kurulum bilgileri yüklenemedi. Lütfen tekrar dene." />;
  }
  if (!onboardingQuery.data?.is_completed) {
    return (
      <CoachingEmptyState
        icon={ClipboardText}
        title="Önce kısa tanıtımı tamamla"
        description="Koçluk teklifini oluşturmadan önce hizmet düzenini gözden geçirmen, hızlı kontrol sorularını yanıtlaman ve sözleşmeyi kabul etmen gerekiyor."
        actions={
          <Button asChild><Link href="/dashboard/tutor/coaching/onboarding">Tanıtıma devam et</Link></Button>
        }
      />
    );
  }

  const plan = planQuery.data ?? null;
  const setupConfig = setupQuery.data;
  const capacity = capacityQuery.data ?? null;
  const unlockedSteps = unlockedCoachingSetupSteps({
    hasPlan: startedWithPlan.current === true,
    weeklySlotCount: capacity?.weekly_slot_count ?? 0,
  });
  const currentStep = unlockedSteps.includes(requestedStep) ? requestedStep : "availability";
  const status = deriveCoachingStatus({
    onboardingComplete: true,
    plan,
    capacity,
    checkoutEnabled,
  });

  return (
    <div className="space-y-7">
      <CoachingSetupProgress currentStep={currentStep} unlockedSteps={unlockedSteps} />

      {["frequency", "price", "exams", "description", "capacity"].includes(currentStep) ? (
        <CoachingPlanForm
          plan={plan}
          setupConfig={setupConfig}
          currentStep={currentStep}
          capacity={capacity}
          onSubmit={(payload, next) => save.mutate({ payload, next })}
          onContinue={navigate}
          isSaving={save.isPending}
          error={error}
        />
      ) : null}

      {currentStep === "availability" ? (
        plan ? (
          <div className="space-y-5">
            {error ? <ErrorMessage message={error} /> : null}
            <CoachingAvailabilitySection />
            <div className="flex justify-end">
              <Button
                onClick={() => navigate("capacity")}
                disabled={(capacity?.weekly_slot_count ?? 0) < 1}
              >
                Kapasiteye devam et
              </Button>
            </div>
          </div>
        ) : (
          <ErrorMessage message="Koçluk müsaitliğini eklemek için önce ilk dört adımı tamamlayıp taslağını kaydet." />
        )
      ) : null}

      {currentStep === "preview" ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
          {previewQuery.data ? <StudentPreviewCard preview={previewQuery.data} /> : <Skeleton className="h-72" />}
          <div className="space-y-5">
            {revenueQuery.data ? <RevenuePreviewCard preview={revenueQuery.data} /> : <Skeleton className="h-56" />}
            <Button className="w-full" onClick={() => navigate("publish")}>Yayınlama adımına devam et</Button>
          </div>
        </div>
      ) : null}

      {currentStep === "publish" ? (
        <div className="space-y-5">
          {error ? <ErrorMessage message={error} /> : null}
          <CoachingStatusCard status={status} />
          <Card className="rounded-card border-line bg-surface shadow-none">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div>
                <h2 className="text-lg font-semibold">Yayın ve öğrenci kabulü</h2>
                <p className="mt-1 text-sm leading-6 text-ink-mid">
                  Teklifin yayında olması, öğrenci kabulünün açık olması, kapasite ve platform genelindeki satış durumu birbirinden bağımsızdır.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!plan?.is_published ? (
                  <Button onClick={() => publish.mutate()} disabled={publish.isPending}>Teklifi yayınla</Button>
                ) : (
                  <>
                    {plan.is_accepting_new_students ? (
                      <Button variant="outline" onClick={() => close.mutate()} disabled={close.isPending}>Yeni öğrenci alımını kapat</Button>
                    ) : (
                      <Button variant="outline" onClick={() => reopen.mutate()} disabled={reopen.isPending}>Yeni öğrenci alımını aç</Button>
                    )}
                    <Button variant="outline" onClick={() => unpublish.mutate()} disabled={unpublish.isPending}>Taslağa al</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

export default function CoachingPlanPage() {
  return (
    <CoachingGuard>
      <CoachingPageShell
        title="Koçluk teklifini hazırla"
        description="Görüşme düzeninden yayınlamaya kadar sekiz adımda ilerle. Koçluk müsaitliği ders müsaitliğinden ayrıdır ve kapasite bu saatlerden hesaplanır."
        parentHref="/dashboard/tutor/coaching"
        parentLabel="Koçluk ana sayfası"
        eyebrow="Teklif kurulumu"
        width="wide"
        currentHref="/dashboard/tutor/coaching/plan"
        audience="tutor"
      >
        <Suspense fallback={<Skeleton className="h-72 w-full" />}>
          <PlanContent />
        </Suspense>
      </CoachingPageShell>
    </CoachingGuard>
  );
}
