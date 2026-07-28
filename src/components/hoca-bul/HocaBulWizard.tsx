"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { fetchMatchingOptions } from "@/lib/matchingApi";
import { trackHocaBul } from "@/lib/hocaBulAnalytics";
import {
  clearDraft,
  copyLegacyDraft,
  createDraft,
  readDraft,
  touchDraft,
  writeDraft,
} from "@/lib/hocaBulDraft";
import { pruneAnswersAgainstOptions } from "@/lib/hocaBulFlow";
import { toGoalOptions } from "@/lib/hocaBulOptions";
import { getLocalStorage } from "@/lib/safeStorage";
import type { HocaBulDraft, HocaBulGoal } from "@/types/hocaBul";

import { DevStepPlaceholder } from "./DevStepPlaceholder";
import { DraftResumeDialog } from "./DraftResumeDialog";
import { ExitFlowDialog } from "./ExitFlowDialog";
import { IllustrationPanel } from "./IllustrationPanel";
import { MobileIllustrationBand } from "./MobileIllustrationBand";
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

/**
 * Container for the matching wizard: it owns the reducer, the options query,
 * draft persistence and URL synchronisation, and hands everything else to
 * presentational components.
 *
 * Browser storage is only ever touched from effects, and only once the
 * authenticated user id is known, so nothing is read during server rendering
 * and one account can never see another's draft.
 */
export function HocaBulWizard() {
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

  const goal = state.answers.goal;
  const subjectKeys = useMemo(
    () => state.answers.subject_keys ?? [],
    [state.answers.subject_keys]
  );

  const optionsQuery = useQuery({
    queryKey: ["hoca-bul-options", goal ?? "UNDECIDED", subjectKeys] as const,
    queryFn: () => fetchMatchingOptions(goal ?? "UNDECIDED", subjectKeys),
    enabled: Boolean(userId),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

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
    dispatch({
      type: "hydrate",
      draft,
      urlStepId: searchParams.get(STEP_PARAM),
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
      entry: state.pendingResume ? "resume" : "direct",
    });
  }, [state.answers.goal, state.pendingResume, state.phase]);

  // --- Draft persistence -------------------------------------------------------
  useEffect(() => {
    if (state.phase !== "ready" || !userId || state.pendingResume) return;
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
    userId,
  ]);

  // --- Drop answers the server no longer offers --------------------------------
  useEffect(() => {
    const options = optionsQuery.data;
    if (!options || state.phase !== "ready") return;
    const result = pruneAnswersAgainstOptions(state.answers, state.client, options);
    if (result.dropped.length === 0) return;
    dispatch({ type: "prune", answers: result.answers, client: result.client });
  }, [optionsQuery.data, state.answers, state.client, state.phase]);

  // --- State to URL ------------------------------------------------------------
  useEffect(() => {
    if (state.phase !== "ready" || state.pendingResume) return;
    if (urlStepRef.current === state.stepId) return;

    const isFirstWrite = urlStepRef.current === null;
    urlStepRef.current = state.stepId;
    const href = `?${STEP_PARAM}=${state.stepId}`;

    if (isFirstWrite) {
      router.replace(href, { scroll: false });
      return;
    }
    // Each step gets a history entry so the browser's back button and the
    // in-flow "Geri" control agree with each other.
    router.push(href, { scroll: false });
    pushDepthRef.current += 1;
  }, [router, state.pendingResume, state.phase, state.stepId]);

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

  const handleBack = useCallback(() => {
    if (atFirstStep) {
      trackHocaBul({ event: "hoca_bul_step_back", step_id: state.stepId });
      router.push("/home");
      return;
    }
    trackHocaBul({ event: "hoca_bul_step_back", step_id: state.stepId });
    if (pushDepthRef.current > 0) {
      // Let the browser unwind its own history so back and "Geri" stay in sync.
      router.back();
      return;
    }
    dispatch({ type: "back" });
  }, [atFirstStep, router, state.stepId]);

  const handleNext = useCallback(() => {
    trackHocaBul({
      event: "hoca_bul_step_completed",
      step_id: state.stepId,
      index: step.index,
      total: step.total,
    });
    dispatch({ type: "next" });
  }, [state.stepId, step.index, step.total]);

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

  if (authLoading || state.phase === "hydrating") {
    return <WizardBootSkeleton />;
  }

  const optionsStatus = optionsQuery.isError
    ? "error"
    : optionsQuery.data
      ? "ready"
      : "loading";

  const noticeMessage = state.cleared.includes("subject_keys")
    ? "Hedefini değiştirdiğin için ders seçimini yenilemen gerekiyor."
    : null;

  const reviewNoteId = "hoca-bul-review-note";

  return (
    <MotionConfig reducedMotion="user">
      <WizardShell
        illustration={
          <IllustrationPanel
            stepId={step.id}
            progress={step.humanIndex / step.total}
          />
        }
        mobileIllustration={
          <MobileIllustrationBand
            stepId={step.id}
            progress={step.humanIndex / step.total}
          />
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
            disabled={step.isReview}
            describedById={step.isReview ? reviewNoteId : undefined}
            onPrimary={handleNext}
          />
        }
      >
        <WizardQuestionPanel
          stepId={step.id}
          title={copy.title}
          helper={copy.helper}
          direction={state.direction}
          noticeMessage={noticeMessage}
          // Validation copy is wired through the panel but has nothing to
          // report until the choice components exist.
          validationMessage={null}
        >
          {optionsStatus === "error" ? (
            <WizardOptionsError
              onRetry={() => void optionsQuery.refetch()}
              isRetrying={optionsQuery.isFetching}
            />
          ) : optionsStatus === "loading" ? (
            <WizardOptionsSkeleton />
          ) : (
            <>
              <DevStepPlaceholder
                stepId={step.id}
                humanIndex={step.humanIndex}
                total={step.total}
                optionsStatus={optionsStatus}
                goalOptions={
                  optionsQuery.data ? toGoalOptions(optionsQuery.data) : []
                }
                selectedGoal={state.answers.goal}
                onSelectGoal={handleSelectGoal}
              />
              {step.isReview ? (
                <p id={reviewNoteId} className="mt-4 text-sm text-muted-foreground">
                  Eşleşme gönderimi sonraki aşamada eklenecek.
                </p>
              ) : null}
            </>
          )}
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
