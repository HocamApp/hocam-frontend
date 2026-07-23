"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  fetchTutorialProgress,
  updateTutorialProgress,
  completeTutorial,
  TutorTutorialProgress,
} from "@/lib/tutorsApi";
import {
  TUTORIAL_STEP_IDS,
  TutorialLocalState,
  TutorialStepId,
  allStepsCompleted,
  canNavigateTo,
  markStepCompleted,
  seedFromServer,
} from "@/lib/liveLessonTutorialSteps";

/**
 * Local step state + server persistence for the live-lesson tutorial.
 *
 * - Mount: GET progress and resume from the server's current_step (skipped in
 *   replay mode, which never reads or writes progress).
 * - Step changes: fire-and-forget PATCH. The server merge is monotonic, so
 *   out-of-order or lost writes are harmless; the next PATCH heals.
 * - Completion: explicit idempotent POST via `complete`.
 */
export function useTutorialProgress({ replay }: { replay: boolean }) {
  const [state, setState] = useState<TutorialLocalState>({
    stepIndex: 0,
    completedSteps: [],
  });
  const [seeded, setSeeded] = useState(replay);

  const progressQuery = useQuery<TutorTutorialProgress>({
    queryKey: ["tutor-tutorial"],
    queryFn: fetchTutorialProgress,
    enabled: !replay,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (replay || seeded || !progressQuery.data) return;
    setState(
      seedFromServer(
        progressQuery.data.completed_steps,
        progressQuery.data.current_step
      )
    );
    setSeeded(true);
  }, [replay, seeded, progressQuery.data]);

  const patchMutation = useMutation({
    mutationFn: updateTutorialProgress,
    retry: 2,
  });
  const completeMutation = useMutation({ mutationFn: completeTutorial });

  const persist = useCallback(
    (next: TutorialLocalState) => {
      if (replay) return;
      patchMutation.mutate({
        current_step: TUTORIAL_STEP_IDS[next.stepIndex],
        completed_steps: next.completedSteps,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [replay]
  );

  const completeStep = useCallback(
    (id: TutorialStepId) => {
      setState((prev) => {
        const next = markStepCompleted(prev, id);
        if (next !== prev) persist(next);
        return next;
      });
    },
    [persist]
  );

  const goToStep = useCallback(
    (index: number) => {
      setState((prev) => {
        if (index === prev.stepIndex || !canNavigateTo(prev, index)) return prev;
        const next = { ...prev, stepIndex: index };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  return {
    state,
    /** True once resume seeding finished (immediately true in replay mode). */
    isReady: seeded && (replay || !progressQuery.isLoading),
    loadError: !replay && progressQuery.isError,
    retryLoad: progressQuery.refetch,
    completeStep,
    goToStep,
    allDone: allStepsCompleted(state),
    completeMutation,
  };
}
