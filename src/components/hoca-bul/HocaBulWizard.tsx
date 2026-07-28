"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { fetchMatchingOptions } from "@/lib/matchingApi";
import { trackHocaBul } from "@/lib/hocaBulAnalytics";
import { parseEntrySource, parseGoalParam } from "@/lib/hocaBulEntryState";
import {
  clearDraft,
  copyLegacyDraft,
  createDraft,
  readDraft,
  touchDraft,
  writeDraft,
} from "@/lib/hocaBulDraft";
import {
  isStepValid,
  getFirstUnansweredStepId,
  getValidatedMatchingAnswers,
  MAX_AVAILABILITY_WINDOWS,
  MAX_CHALLENGES,
  MAX_EXAM_AREAS,
  MAX_SUBJECTS,
  MAX_TEACHING_STYLES,
  pruneAnswersAgainstOptions,
  toggleAvailability,
  toggleExamArea,
} from "@/lib/hocaBulFlow";
import {
  buildReviewRows,
  toAvailabilityOptions,
  toBudgetOptions,
  toChallengeOptions,
  toExamAreaOptions,
  toGoalOptions,
  toStageOptions,
  toSubjectOptions,
  toTeachingStyleOptions,
} from "@/lib/hocaBulOptions";
import { getLocalStorage } from "@/lib/safeStorage";
import type {
  MatchAvailabilityWindow,
  MatchBudgetSegment,
  MatchChallenge,
  TutorTeachingStyle,
} from "@/types";
import type {
  HocaBulDraft,
  HocaBulApiAnswers,
  HocaBulExamArea,
  HocaBulGoal,
  HocaBulStepId,
} from "@/types/hocaBul";

import { DraftResumeDialog } from "./DraftResumeDialog";
import { ExitFlowDialog } from "./ExitFlowDialog";
import { toIllustrationState } from "./illustrations/illustrationState";
import { IllustrationPanel } from "./IllustrationPanel";
import { MobileIllustrationBand } from "./MobileIllustrationBand";
import { ReviewSummary } from "./ReviewSummary";
import { MultiSelectGroup, SingleSelectGroup } from "./SelectionGroups";
import { STEP_COPY, STEP_SHORT_LABEL } from "./stepCopy";
import { WizardFooter } from "./WizardFooter";
import { WizardHeader } from "./WizardHeader";
import { WizardOptionsError } from "./WizardOptionsError";
import {
  WizardBootSkeleton,
  WizardOptionsSkeleton,
} from "./WizardOptionsSkeleton";
import { WizardQuestionPanel } from "./WizardQuestionPanel";
import { WizardShell } from "./WizardShell";
import {
  currentVisibleStep,
  initialWizardState,
  isFirstStep,
  wizardReducer,
} from "./wizardReducer";

const STEP_PARAM = "adim";
/** Where the student came from. Only the closed HocaBulEntrySource set counts. */
const SOURCE_PARAM = "kaynak";
/** Goal already answered before the flow opened, named after the step it fills. */
const GOAL_PARAM = "hedef";

/**
 * Container for the matching wizard: it owns the reducer, the options query,
 * draft persistence and URL synchronisation, and hands everything else to
 * presentational components.
 *
 * Browser storage is only ever touched from effects, and only once the
 * authenticated user id is known, so nothing is read during server rendering
 * and one account can never see another's draft.
 */
export interface HocaBulWizardProps {
  onComplete?: (answers: HocaBulApiAnswers) => void;
  completionPending?: boolean;
}

export function HocaBulWizard({
  onComplete,
  completionPending = false,
}: HocaBulWizardProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id;

  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);

  const draftRef = useRef<HocaBulDraft | null>(null);
  const hydratedForUserRef = useRef<string | null>(null);
  const urlStepRef = useRef<string | null>(null);
  const pushDepthRef = useRef(0);
  const startedRef = useRef(false);
  const entrySourceRef = useRef<ReturnType<typeof parseEntrySource>>(null);
  const completionLockRef = useRef(false);
  const completionWasPendingRef = useRef(false);
  const [completionLocked, setCompletionLocked] = useState(false);
  const reviewNavigationRef = useRef<"idle" | "push" | "replace" | "return">("idle");

  const goal = state.answers.goal;
  const subjectKeys = useMemo(
    () => state.answers.subject_keys ?? [],
    [state.answers.subject_keys]
  );

  const optionsQuery = useQuery({
    queryKey: ["hoca-bul-options", goal ?? "UNDECIDED", subjectKeys] as const,
    queryFn: () => fetchMatchingOptions(goal ?? "UNDECIDED", subjectKeys),
    enabled:
      Boolean(userId) &&
      state.phase === "ready" &&
      !state.pendingResume,
    staleTime: 60_000,
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === (goal ?? "UNDECIDED")
        ? previousData
        : undefined,
  });

  const freshPruneResult = useMemo(() => {
    if (
      state.phase !== "ready" ||
      !optionsQuery.data ||
      optionsQuery.isPlaceholderData
    ) {
      return null;
    }
    return pruneAnswersAgainstOptions(
      state.answers,
      state.client,
      optionsQuery.data
    );
  }, [
    optionsQuery.data,
    optionsQuery.isPlaceholderData,
    state.answers,
    state.client,
    state.phase,
  ]);
  const freshPrunePending = Boolean(
    freshPruneResult &&
      (freshPruneResult.dropped.length > 0 ||
        freshPruneResult.answers.goal !== state.answers.goal)
  );

  useEffect(() => {
    if (completionPending) {
      completionWasPendingRef.current = true;
      return;
    }
    if (!completionWasPendingRef.current) return;
    completionWasPendingRef.current = false;
    completionLockRef.current = false;
    setCompletionLocked(false);
  }, [completionPending]);

  // --- Draft hydration ---------------------------------------------------------
  useEffect(() => {
    if (!userId || hydratedForUserRef.current === userId) return;
    hydratedForUserRef.current = userId;

    const storage = getLocalStorage();
    // Reads the legacy /match draft once and copies what still applies. That
    // key is never written to or deleted here.
    const legacy = copyLegacyDraft(storage, userId);
    if (!legacy.alreadyAttempted) {
      trackHocaBul({
        event: "hoca_bul_legacy_draft_copied",
        copied: legacy.copied,
      });
    }

    const draft = readDraft(storage, userId);
    draftRef.current = draft ?? createDraft(userId);
    // Both known sources mean the student just came from a screen that already
    // showed them their progress, so re-asking "resume?" would be a second
    // question about the same decision.
    const source = parseEntrySource(searchParams.get(SOURCE_PARAM));
    entrySourceRef.current = source;
    dispatch({
      type: "hydrate",
      draft,
      urlStepId: searchParams.get(STEP_PARAM),
      skipResume: source !== null,
      prefillGoal: parseGoalParam(searchParams.get(GOAL_PARAM)) ?? undefined,
    });
    // searchParams is read once on purpose: later URL changes go through the
    // synchronisation effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (state.phase !== "ready" || startedRef.current) return;
    startedRef.current = true;
    trackHocaBul({
      event: "hoca_bul_started",
      goal: state.answers.goal,
      entry: state.pendingResume
        ? "resume"
        : entrySourceRef.current === "home"
          ? "home_card"
          : "direct",
    });
  }, [state.answers.goal, state.pendingResume, state.phase]);

  // --- Draft persistence -------------------------------------------------------
  useEffect(() => {
    if (
      state.phase !== "ready" ||
      !userId ||
      state.pendingResume ||
      freshPrunePending
    ) return;
    const base = draftRef.current ?? createDraft(userId);
    const next = touchDraft(base, {
      answers: state.answers,
      client: state.client,
      stepId: state.stepId,
    });
    draftRef.current = next;
    writeDraft(getLocalStorage(), next);
  }, [
    state.answers,
    state.client,
    state.stepId,
    state.phase,
    state.pendingResume,
    freshPruneResult,
    freshPrunePending,
    userId,
  ]);

  // --- Drop answers the server no longer offers --------------------------------
  useEffect(() => {
    if (!freshPruneResult || !freshPrunePending) return;
    dispatch({
      type: "prune",
      answers: freshPruneResult.answers,
      client: freshPruneResult.client,
      dropped: freshPruneResult.dropped,
    });
  }, [freshPrunePending, freshPruneResult]);

  // --- State to URL ------------------------------------------------------------
  useEffect(() => {
    if (state.phase !== "ready" || state.pendingResume) return;
    if (urlStepRef.current === state.stepId) return;

    const isFirstWrite = urlStepRef.current === null;
    urlStepRef.current = state.stepId;
    const href = `?${STEP_PARAM}=${state.stepId}`;

    if (reviewNavigationRef.current === "return" && state.stepId === "kontrol") {
      urlStepRef.current = "kontrol";
      reviewNavigationRef.current = "idle";
      if (pushDepthRef.current > 0) pushDepthRef.current -= 1;
      router.back();
      return;
    }

    if (isFirstWrite) {
      router.replace(href, { scroll: false });
      return;
    }
    if (state.reviewEditActive) {
      if (reviewNavigationRef.current === "push") {
        router.push(href, { scroll: false });
        pushDepthRef.current += 1;
        reviewNavigationRef.current = "replace";
      } else {
        router.replace(href, { scroll: false });
      }
      return;
    }
    // Each step gets a history entry so the browser's back button and the
    // in-flow "Geri" control agree with each other.
    router.push(href, { scroll: false });
    pushDepthRef.current += 1;
  }, [router, state.pendingResume, state.phase, state.reviewEditActive, state.stepId]);

  // --- URL to state ------------------------------------------------------------
  useEffect(() => {
    if (state.phase !== "ready") return;
    const param = searchParams.get(STEP_PARAM);
    // Only a browser-initiated change can differ from what this component last
    // wrote, so this cannot ping-pong with the effect above.
    if (param === urlStepRef.current) return;
    urlStepRef.current = param;
    if (pushDepthRef.current > 0) pushDepthRef.current -= 1;
    dispatch({ type: "syncUrlStep", stepId: param });
  }, [searchParams, state.phase]);

  // --- Escape opens the exit dialog --------------------------------------------
  useEffect(() => {
    if (state.phase !== "ready" || state.pendingResume || state.exitOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      dispatch({ type: "setExitOpen", open: true });
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [state.exitOpen, state.pendingResume, state.phase]);

  const step = currentVisibleStep(state);
  const copy = STEP_COPY[step.id];
  const atFirstStep = isFirstStep(state);

  // The only thing the artwork ever sees. A small typed projection rather than
  // the wizard state itself, so an illustration cannot read an answer it has no
  // business reading — or write one at all.
  const illustrationState = useMemo(
    () => toIllustrationState(step.id, state.answers, state.client),
    [step.id, state.answers, state.client]
  );

  const handleBack = useCallback(() => {
    if (atFirstStep) {
      trackHocaBul({ event: "hoca_bul_step_back", step_id: state.stepId });
      router.push("/home");
      return;
    }
    trackHocaBul({ event: "hoca_bul_step_back", step_id: state.stepId });
    if (state.reviewEditActive) {
      if (pushDepthRef.current > 0) reviewNavigationRef.current = "return";
      dispatch({ type: "back" });
      return;
    }
    if (pushDepthRef.current > 0) {
      // Let the browser unwind its own history so back and "Geri" stay in sync.
      router.back();
      return;
    }
    dispatch({ type: "back" });
  }, [atFirstStep, router, state.reviewEditActive, state.stepId]);

  const handleNext = useCallback(() => {
    trackHocaBul({
      event: "hoca_bul_step_completed",
      step_id: state.stepId,
      index: step.index,
      total: step.total,
    });
    if (
      state.reviewEditActive &&
      getFirstUnansweredStepId(state.answers.goal, state.answers, state.client) ===
        "kontrol" &&
      pushDepthRef.current > 0
    ) {
      reviewNavigationRef.current = "return";
    }
    dispatch({ type: "next" });
  }, [state.answers, state.client, state.reviewEditActive, state.stepId, step.index, step.total]);

  const handleEditFromReview = useCallback(
    (stepId: Exclude<HocaBulStepId, "kontrol">) => {
      reviewNavigationRef.current = "push";
      dispatch({ type: "editFromReview", stepId });
    },
    []
  );

  const handleResume = useCallback(() => {
    const draft = state.pendingResume;
    if (draft) {
      draftRef.current = draft;
      trackHocaBul({
        event: "hoca_bul_draft_resumed",
        step_id: draft.stepId,
        age_hours: Math.max(
          0,
          Math.round((Date.now() - draft.meta.createdAt) / 3_600_000)
        ),
      });
    }
    dispatch({ type: "resume" });
  }, [state.pendingResume]);

  const handleRestart = useCallback(() => {
    if (userId) {
      // Clears this flow's own key only — the legacy /match draft and every
      // other stored value are left exactly as they are.
      clearDraft(getLocalStorage(), userId);
      draftRef.current = createDraft(userId);
    }
    urlStepRef.current = null;
    dispatch({ type: "restart" });
  }, [userId]);

  const handleExitConfirm = useCallback(() => {
    trackHocaBul({
      event: "hoca_bul_abandoned",
      step_id: state.stepId,
      reason: "exit_dialog",
    });
    dispatch({ type: "setExitOpen", open: false });
    router.push("/home");
  }, [router, state.stepId]);

  const handleSelectGoal = useCallback((nextGoal: HocaBulGoal) => {
    dispatch({ type: "answer", change: { field: "goal", value: nextGoal } });
  }, []);

  const handleSelectStage = useCallback((stage: string) => {
    dispatch({ type: "answer", change: { field: "stage", value: stage } });
  }, []);

  const handleSelectExamAreas = useCallback(
    (areas: HocaBulExamArea[]) => {
      dispatch({
        type: "answer",
        change: { field: "yks_alan", value: areas },
        subjects: optionsQuery.data?.subjects,
      });
    },
    [optionsQuery.data?.subjects]
  );

  const handleSelectSubjects = useCallback((values: string[]) => {
    dispatch({ type: "answer", change: { field: "subject_keys", value: values } });
  }, []);

  const handleSelectChallenges = useCallback((values: MatchChallenge[]) => {
    dispatch({ type: "answer", change: { field: "challenges", value: values } });
  }, []);

  const handleSelectTeachingStyles = useCallback((values: TutorTeachingStyle[]) => {
    dispatch({ type: "answer", change: { field: "teaching_styles", value: values } });
  }, []);

  const handleSelectAvailability = useCallback((values: MatchAvailabilityWindow[]) => {
    dispatch({ type: "answer", change: { field: "availability_windows", value: values } });
  }, []);

  const handleSelectBudget = useCallback((value: MatchBudgetSegment) => {
    dispatch({ type: "answer", change: { field: "budget_segment", value } });
  }, []);

  if (authLoading || state.phase === "hydrating") {
    return <WizardBootSkeleton />;
  }

  const needsFreshOptions =
    (step.id === "butce" || step.id === "kontrol") &&
    optionsQuery.isPlaceholderData;
  const optionsStatus = optionsQuery.isError
    ? "error"
    : optionsQuery.data && !needsFreshOptions
      ? "ready"
      : "loading";

  const noticeMessage = (() => {
    if (!state.cleared.length || !state.invalidationSource) return null;
    if (
      state.invalidationSource === "goal" &&
      state.cleared.includes("subject_keys")
    ) {
      return "Hedefini değiştirdiğin için ders seçimini yenilemen gerekiyor.";
    }
    if (
      state.invalidationSource === "yks_alan" &&
      state.cleared.includes("subject_keys")
    ) {
      return "YKS alanını değiştirdiğin için artık uygun olmayan ders seçimlerin kaldırıldı.";
    }
    if (
      state.invalidationSource === "subject_keys" &&
      state.cleared.includes("budget_segment")
    ) {
      return "Ders seçimin değiştiği için bütçe seçimini yenilemen gerekiyor.";
    }
    if (state.invalidationSource === "options") {
      return state.cleared.includes("budget_segment")
        ? "Artık uygun olmayan seçimlerin kaldırıldı. Bütçeni yeniden seçmen gerekiyor."
        : "Artık uygun olmayan seçimlerin kaldırıldı.";
    }
    return null;
  })();

  const reviewNoteId = "hoca-bul-review-note";
  const helperId = `hoca-bul-${step.id}-helper`;
  const validationId = `hoca-bul-${step.id}-validation`;
  const currentStepIsValid = isStepValid(step.id, state.answers, state.client);
  const validationMessage =
    step.id === "uygun_zamanlar" && !currentStepIsValid
      ? "Devam etmek için en az bir zaman aralığı seç."
      : null;
  const describedBy = [helperId, validationMessage ? validationId : null]
    .filter(Boolean)
    .join(" ");

  const validatedPayload =
    step.id === "kontrol" &&
    optionsStatus === "ready" &&
    optionsQuery.data &&
    !freshPrunePending
      ? getValidatedMatchingAnswers(state.answers, state.client, optionsQuery.data)
      : null;
  const reviewRows =
    validatedPayload && optionsQuery.data
      ? buildReviewRows(state.answers, state.client, optionsQuery.data)
      : null;

  const handleComplete = () => {
    if (
      !onComplete ||
      !validatedPayload ||
      !reviewRows ||
      completionPending ||
      completionLockRef.current
    ) {
      return;
    }
    completionLockRef.current = true;
    setCompletionLocked(true);
    onComplete(validatedPayload);
  };

  const renderQuestion = () => {
    const options = optionsQuery.data;
    if (!options) return null;
    switch (step.id) {
      case "hedef":
        return (
          <SingleSelectGroup
            label={copy.title}
            options={toGoalOptions(options)}
            value={state.answers.goal}
            onValueChange={handleSelectGoal}
            describedBy={describedBy}
          />
        );
      case "asama":
        return (
            <SingleSelectGroup
              label={copy.title}
              options={toStageOptions(options, state.answers.goal)}
              value={state.answers.stage}
              onValueChange={handleSelectStage}
              describedBy={describedBy}
            />
          );
      case "yks_alan":
        return state.answers.goal === "YKS" ? (
              <MultiSelectGroup
                label={copy.title}
                options={toExamAreaOptions(options.subjects)}
                values={state.client.yks_alan ?? []}
                onValuesChange={handleSelectExamAreas}
                maximum={MAX_EXAM_AREAS}
                describedBy={describedBy}
                limitMessage="En fazla 3 alan seçebilirsin."
                onToggle={(value, values) =>
                  toggleExamArea([...values], value).values
                }
              />
            ) : null;
      case "dersler": {
        const subjectOptions = toSubjectOptions(options, state.client.yks_alan);
        if (!subjectOptions.length) {
          return (
            <div role="status" className="rounded-xl border border-border bg-muted/40 p-5">
              <p className="text-sm text-foreground">
                Bu hedef için şu anda uygun ders bulunamadı.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 min-h-11 rounded-xl"
                onClick={() => dispatch({ type: "goToStep", stepId: "hedef" })}
              >
                Hedefimi değiştir
              </Button>
            </div>
          );
        }
        return (
          <MultiSelectGroup
            label={copy.title}
            options={subjectOptions}
            values={state.answers.subject_keys ?? []}
            onValuesChange={handleSelectSubjects}
            maximum={MAX_SUBJECTS}
            describedBy={describedBy}
            limitMessage="En fazla üç ders seçebilirsin."
          />
        );
      }
      case "zorluk":
        return (
          <MultiSelectGroup
            label={copy.title}
            options={toChallengeOptions()}
            values={state.answers.challenges ?? []}
            onValuesChange={handleSelectChallenges}
            maximum={MAX_CHALLENGES}
            describedBy={describedBy}
            limitMessage="En fazla iki seçenek seçebilirsin."
          />
        );
      case "hoca_yaklasimi":
        return (
          <MultiSelectGroup
            label={copy.title}
            options={toTeachingStyleOptions()}
            values={state.answers.teaching_styles ?? []}
            onValuesChange={handleSelectTeachingStyles}
            maximum={MAX_TEACHING_STYLES}
            describedBy={describedBy}
            limitMessage="En fazla iki seçenek seçebilirsin."
          />
        );
      case "uygun_zamanlar":
        return (
          <MultiSelectGroup
            label={copy.title}
            options={toAvailabilityOptions()}
            values={state.answers.availability_windows ?? []}
            onValuesChange={handleSelectAvailability}
            maximum={MAX_AVAILABILITY_WINDOWS}
            describedBy={describedBy}
            onToggle={(value, values) =>
              toggleAvailability([...values], value).values
            }
          />
        );
      case "butce":
        return (
          <SingleSelectGroup
            label={copy.title}
            options={toBudgetOptions(options)}
            value={state.answers.budget_segment}
            onValueChange={handleSelectBudget}
            describedBy={describedBy}
          />
        );
      case "kontrol":
        return reviewRows ? (
          <ReviewSummary rows={reviewRows} onEdit={handleEditFromReview} />
        ) : null;
    }
  };

  const question = renderQuestion();
  const budgetIsCurrent =
    step.id !== "butce" ||
    (!optionsQuery.isPlaceholderData &&
      Boolean(
        state.answers.budget_segment &&
        optionsQuery.data?.budget_ranges.some(
          (band) => band.id === state.answers.budget_segment
        )
      ));
  const continueDisabled =
    step.isReview
      ? !onComplete ||
        !validatedPayload ||
        !reviewRows ||
        completionPending ||
        completionLocked
      : optionsStatus !== "ready" ||
        !currentStepIsValid ||
        !budgetIsCurrent;
  const reviewNote =
    optionsStatus === "loading"
      ? "Yanıtların güncel seçeneklerle doğrulanıyor."
      : optionsStatus === "error"
        ? "Seçenekler yüklenemediği için eşleşmeler henüz gösterilemiyor."
        : !validatedPayload || !reviewRows
          ? "Eksik veya geçersiz yanıtlarını tamamlaman gerekiyor."
          : !onComplete
            ? "Eşleşmeleri gösterme adımı henüz kullanıma hazır değil."
            : null;

  return (
    <MotionConfig reducedMotion="user">
      <WizardShell
        illustration={<IllustrationPanel state={illustrationState} />}
        mobileIllustration={
          <MobileIllustrationBand state={illustrationState} />
        }
        header={
          <WizardHeader
            humanIndex={step.humanIndex}
            total={step.total}
            backLabel={atFirstStep ? "Çıkış" : "Geri"}
            onBack={handleBack}
            onExit={() => dispatch({ type: "setExitOpen", open: true })}
          />
        }
        footer={
          <WizardFooter
            label={step.isReview ? "Eşleşmelerimi gör" : "Devam et"}
            loading={step.isReview && completionPending}
            loadingLabel="Eşleşmeler hazırlanıyor…"
            disabled={continueDisabled}
            describedById={
              step.isReview
                ? reviewNote
                  ? reviewNoteId
                  : undefined
                : validationMessage
                  ? validationId
                  : undefined
            }
            onPrimary={step.isReview ? handleComplete : handleNext}
          />
        }
      >
        <WizardQuestionPanel
          stepId={step.id}
          title={copy.title}
          helper={copy.helper}
          direction={state.direction}
          noticeMessage={noticeMessage}
          validationMessage={validationMessage}
        >
          {optionsStatus === "error" ? (
            <WizardOptionsError
              onRetry={() => void optionsQuery.refetch()}
              isRetrying={optionsQuery.isFetching}
            />
          ) : optionsStatus === "loading" ? (
            <WizardOptionsSkeleton />
          ) : (
            question
          )}
          {step.isReview && reviewNote ? (
            <p id={reviewNoteId} className="mt-4 text-sm text-muted-foreground">
              {reviewNote}
            </p>
          ) : null}
        </WizardQuestionPanel>
      </WizardShell>

      <DraftResumeDialog
        open={Boolean(state.pendingResume)}
        stepLabel={
          state.pendingResume
            ? STEP_SHORT_LABEL[state.pendingResume.stepId]
            : STEP_SHORT_LABEL.hedef
        }
        onResume={handleResume}
        onRestart={handleRestart}
      />

      <ExitFlowDialog
        open={state.exitOpen}
        onOpenChange={(open) => dispatch({ type: "setExitOpen", open })}
        onConfirm={handleExitConfirm}
      />
    </MotionConfig>
  );
}
