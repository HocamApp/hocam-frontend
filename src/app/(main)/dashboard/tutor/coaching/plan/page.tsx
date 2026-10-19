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
import { CoachingPlanSummary } from "@/components/coaching/CoachingPlanSummary";
import { CoachingPublishActions } from "@/components/coaching/CoachingPublishActions";
import { CoachingReviewStep } from "@/components/coaching/CoachingReviewStep";
import { CoachingSetupProgress } from "@/components/coaching/CoachingSetupProgress";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { buildCoachingSettingRows } from "@/lib/coachingPlanSummary";
import {
  COACHING_SETUP_STEPS,
  coachingSetupDoneSteps,
  coachingSetupStepDone,
  coachingSetupStepForError,
  isCoachingSetupComplete,
  readCoachingSetupStep,
  unlockedCoachingSetupSteps,
  type CoachingSetupStep,
} from "@/lib/coachingSetup";

const PLAN_HREF = "/dashboard/tutor/coaching/plan";

/** A step to open, or the summary of a finished setup. */
type Destination = CoachingSetupStep | "summary";

function PlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const startedWithPlan = useRef<boolean | null>(null);
  const stepParam = searchParams.get("step");
  const requestedStep = readCoachingSetupStep(stepParam);

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

  const navigate = (destination: Destination) => {
    setError(null);
    router.replace(destination === "summary" ? PLAN_HREF : `${PLAN_HREF}?step=${destination}`);
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
    mutationFn: ({ payload }: { payload: CoachingPlanPayload; next: Destination }) =>
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
      navigate("summary");
    },
    onError: (mutationError: unknown) => {
      router.replace(
        `${PLAN_HREF}?step=${coachingSetupStepForError(extractCoachingErrorCode(mutationError))}`
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

  if (
    onboardingQuery.isLoading ||
    planQuery.isLoading ||
    setupQuery.isLoading ||
    // The hours decide whether setup is finished, so wait for them rather than
    // flash the first step at someone whose setup is done.
    (Boolean(planQuery.data) && capacityQuery.isLoading)
  ) {
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
  const snapshot = { plan, weeklySlotCount: capacity?.weekly_slot_count ?? 0 };
  const setupComplete = isCoachingSetupComplete(snapshot);
  const rows = plan
    ? buildCoachingSettingRows({ plan, setupConfig, capacity, revenue: revenueQuery.data ?? null })
    : [];

  const publishActions = plan ? (
    <CoachingPublishActions
      plan={plan}
      pending={publish.isPending || unpublish.isPending || close.isPending || reopen.isPending}
      onPublish={() => publish.mutate()}
      onUnpublish={() => unpublish.mutate()}
      onClose={() => close.mutate()}
      onReopen={() => reopen.mutate()}
    />
  ) : null;

  // A finished setup opens on its summary; the wizard is for the first setup,
  // or for the one setting a tutor chose to change (`?step=`).
  if (plan && setupComplete && stepParam === null) {
    return (
      <CoachingPlanSummary
        plan={plan}
        rows={rows}
        capacity={capacity}
        error={error}
        actions={publishActions}
      />
    );
  }

  const unlockedSteps = unlockedCoachingSetupSteps({
    hasPlan: startedWithPlan.current === true,
    weeklySlotCount: capacity?.weekly_slot_count ?? 0,
  });
  const currentStep = unlockedSteps.includes(requestedStep) ? requestedStep : "availability";
  const doneSteps = coachingSetupDoneSteps({
    snapshot,
    currentStep,
    firstSetup: startedWithPlan.current === false,
  });
  const chipValues = Object.fromEntries(
    rows.flatMap((row) => (row.chip ? [[row.step, row.chip] as const] : []))
  );
  // Someone who arrived with a finished setup is changing one thing: saving
  // takes them back to the summary instead of on to the next step.
  const returnsToSummary = startedWithPlan.current === true && setupComplete;
  const missingSteps = COACHING_SETUP_STEPS.filter(
    (step) => step !== "publish" && !coachingSetupStepDone(step, snapshot)
  );

  return (
    <div className="space-y-7">
      <CoachingSetupProgress
        currentStep={currentStep}
        doneSteps={doneSteps}
        unlockedSteps={unlockedSteps}
        chipValues={chipValues}
      />

      {["frequency", "price", "exams", "description", "capacity"].includes(currentStep) ? (
        <CoachingPlanForm
          plan={plan}
          setupConfig={setupConfig}
          currentStep={currentStep}
          capacity={capacity}
          onSubmit={(payload, next) => save.mutate({ payload, next: returnsToSummary ? "summary" : next })}
          onContinue={navigate}
          isSaving={save.isPending}
          error={error}
          savesToSummary={returnsToSummary}
        />
      ) : null}

      {currentStep === "availability" ? (
        plan ? (
          <div className="space-y-5">
            {error ? <ErrorMessage message={error} /> : null}
            <CoachingAvailabilitySection />
            <div className="flex justify-end">
              <Button
                onClick={() => navigate(returnsToSummary ? "summary" : "capacity")}
                disabled={(capacity?.weekly_slot_count ?? 0) < 1}
              >
                {returnsToSummary ? "Tamam" : "Kapasiteye devam et"}
              </Button>
            </div>
          </div>
        ) : (
          <ErrorMessage message="Koçluk müsaitliğini eklemek için önce ilk dört adımı tamamlayıp taslağını kaydet." />
        )
      ) : null}

      {currentStep === "publish" ? (
        plan ? (
          <CoachingReviewStep
            plan={plan}
            preview={previewQuery.data ?? null}
            revenue={revenueQuery.data ?? null}
            rows={rows}
            missingSteps={missingSteps}
            error={error}
            actions={publishActions}
          />
        ) : (
          <ErrorMessage message="Teklifi yayınlamak için önce planını kaydet." />
        )
      ) : null}
    </div>
  );
}

export default function CoachingPlanPage() {
  return (
    <CoachingGuard>
      <CoachingPageShell
        title="Teklif ayarları"
        width="wide"
        currentHref={PLAN_HREF}
        audience="tutor"
      >
        <Suspense fallback={<Skeleton className="h-72 w-full" />}>
          <PlanContent />
        </Suspense>
      </CoachingPageShell>
    </CoachingGuard>
  );
}
