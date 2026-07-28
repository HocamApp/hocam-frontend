import {
  applyAnswerChange,
  getFirstUnansweredStepId,
  getNextStepId,
  getPreviousStepId,
  getStepById,
  getStepTotal,
  sanitizeStepParam,
} from "@/lib/hocaBulFlow";
import type { MatchSubjectOption } from "@/types";
import type {
  HocaBulAnswerChange,
  HocaBulApiAnswersDraft,
  HocaBulClearedField,
  HocaBulClientAnswers,
  HocaBulDraft,
  HocaBulInvalidationSource,
  HocaBulStepId,
  HocaBulVisibleStep,
} from "@/types/hocaBul";
import type { WizardDirection } from "./motion";

/**
 * Wizard state. Deliberately a plain reducer in its own module: every rule it
 * needs already lives in hocaBulFlow, so this file only sequences them and can
 * be tested without React, routing or storage.
 */
export interface WizardState {
  /** "hydrating" until the draft has been looked at — nothing renders a step before that. */
  phase: "hydrating" | "ready";
  answers: HocaBulApiAnswersDraft;
  client: HocaBulClientAnswers;
  stepId: HocaBulStepId;
  direction: WizardDirection;
  /** Answers an upstream change invalidated, shown once on the affected step. */
  cleared: HocaBulClearedField[];
  invalidationSource: HocaBulInvalidationSource | null;
  /** A resumable draft waiting for the student's decision. */
  pendingResume: HocaBulDraft | null;
  exitOpen: boolean;
}

export type WizardAction =
  | { type: "hydrate"; draft: HocaBulDraft | null; urlStepId: string | null }
  | { type: "resume" }
  | { type: "restart" }
  | {
      type: "answer";
      change: HocaBulAnswerChange;
      subjects?: MatchSubjectOption[];
    }
  | { type: "next" }
  | { type: "back" }
  | { type: "goToStep"; stepId: HocaBulStepId }
  | { type: "syncUrlStep"; stepId: string | null }
  | {
      type: "prune";
      answers: HocaBulApiAnswersDraft;
      client: HocaBulClientAnswers;
      dropped: HocaBulClearedField[];
    }
  | { type: "setExitOpen"; open: boolean }
  | { type: "dismissCleared" };

export const initialWizardState: WizardState = {
  phase: "hydrating",
  answers: {},
  client: {},
  stepId: "hedef",
  direction: 1,
  cleared: [],
  invalidationSource: null,
  pendingResume: null,
  exitOpen: false,
};

/** A draft is only worth interrupting for when it holds progress past the first step. */
export function draftIsResumable(draft: HocaBulDraft | null): boolean {
  if (!draft) return false;
  if (Object.keys(draft.answers).length === 0) return false;
  return draft.stepId !== "hedef";
}

function directionFor(
  from: HocaBulStepId,
  to: HocaBulStepId,
  answers: HocaBulApiAnswersDraft,
  client: HocaBulClientAnswers
): WizardDirection {
  const goal = answers.goal;
  const fromStep = getStepById(goal, from);
  const toStep = getStepById(goal, to);
  if (!fromStep || !toStep) return 1;
  void client;
  return toStep.index >= fromStep.index ? 1 : -1;
}

export function wizardReducer(
  state: WizardState,
  action: WizardAction
): WizardState {
  switch (action.type) {
    case "hydrate": {
      if (draftIsResumable(action.draft)) {
        // Ask before restoring; the answers stay untouched until the student decides.
        return { ...state, phase: "ready", pendingResume: action.draft };
      }
      const answers = action.draft?.answers ?? {};
      const client = action.draft?.client ?? {};
      return {
        ...state,
        phase: "ready",
        answers,
        client,
        pendingResume: null,
        stepId: sanitizeStepParam(action.urlStepId, answers.goal, answers, client),
      };
    }

    case "resume": {
      const draft = state.pendingResume;
      if (!draft) return { ...state, pendingResume: null };
      const answers = draft.answers;
      const client = draft.client;
      // The stored step can be stale — a later options prune may have invalidated
      // it — so it is re-derived rather than trusted.
      return {
        ...state,
        answers,
        client,
        pendingResume: null,
        direction: 1,
        stepId: sanitizeStepParam(draft.stepId, answers.goal, answers, client),
      };
    }

    case "restart":
      return {
        ...initialWizardState,
        phase: "ready",
      };

    case "answer": {
      const result = applyAnswerChange(
        { answers: state.answers, client: state.client },
        action.change,
        { subjects: action.subjects }
      );
      const stepStillValid = Boolean(
        getStepById(result.answers.goal, state.stepId)
      );
      return {
        ...state,
        answers: result.answers,
        client: result.client,
        cleared: result.cleared,
        invalidationSource: result.cleared.length
          ? invalidationSourceFor(action.change.field)
          : null,
        // Changing the goal can remove the step the student is standing on.
        stepId: stepStillValid
          ? state.stepId
          : getFirstUnansweredStepId(result.answers.goal, result.answers, result.client),
      };
    }

    case "next": {
      const next = getNextStepId(state.answers.goal, state.stepId);
      if (!next || next === "submit") return state;
      return { ...state, stepId: next, direction: 1, cleared: [], invalidationSource: null };
    }

    case "back": {
      const previous = getPreviousStepId(state.answers.goal, state.stepId);
      if (!previous) return state;
      return { ...state, stepId: previous, direction: -1, cleared: [], invalidationSource: null };
    }

    case "goToStep": {
      if (!getStepById(state.answers.goal, action.stepId)) return state;
      return {
        ...state,
        direction: directionFor(state.stepId, action.stepId, state.answers, state.client),
        stepId: action.stepId,
        cleared: [],
        invalidationSource: null,
      };
    }

    case "syncUrlStep": {
      const stepId = sanitizeStepParam(
        action.stepId,
        state.answers.goal,
        state.answers,
        state.client
      );
      if (stepId === state.stepId) return state;
      return {
        ...state,
        direction: directionFor(state.stepId, stepId, state.answers, state.client),
        stepId,
        cleared: [],
        invalidationSource: null,
      };
    }

    case "prune": {
      const stepId = sanitizeStepParam(
        state.stepId,
        action.answers.goal,
        action.answers,
        action.client
      );
      return {
        ...state,
        answers: action.answers,
        client: action.client,
        stepId,
        cleared: action.dropped,
        invalidationSource: action.dropped.length ? "options" : null,
      };
    }

    case "setExitOpen":
      return { ...state, exitOpen: action.open };

    case "dismissCleared":
      return state.cleared.length
        ? { ...state, cleared: [], invalidationSource: null }
        : state;
  }
}

function invalidationSourceFor(
  field: HocaBulAnswerChange["field"]
): HocaBulInvalidationSource | null {
  switch (field) {
    case "goal":
    case "yks_alan":
    case "subject_keys":
      return field;
    default:
      return null;
  }
}

// --- Derived values ------------------------------------------------------------

export function currentVisibleStep(state: WizardState): HocaBulVisibleStep {
  const step = getStepById(state.answers.goal, state.stepId);
  if (step) return step;
  // Only reachable mid-transition, when the goal just changed under the step.
  return {
    id: state.stepId,
    index: 0,
    humanIndex: 1,
    total: getStepTotal(state.answers.goal),
    isReview: state.stepId === "kontrol",
  };
}

export function isFirstStep(state: WizardState): boolean {
  return getPreviousStepId(state.answers.goal, state.stepId) === null;
}
