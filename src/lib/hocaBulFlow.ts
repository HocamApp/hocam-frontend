import type {
  MatchAvailabilityWindow,
  MatchSubjectOption,
  MatchingOptions,
} from "@/types";
import type {
  HocaBulAnswerChange,
  HocaBulAnswerState,
  HocaBulApiAnswers,
  HocaBulApiAnswersDraft,
  HocaBulClearedField,
  HocaBulClientAnswers,
  HocaBulExamArea,
  HocaBulGoal,
  HocaBulStepId,
  HocaBulStepTotal,
  HocaBulStepValidation,
  HocaBulVisibleStep,
} from "@/types/hocaBul";

/**
 * The /hoca-bul step machine. Pure by design: no React, no routing, no storage,
 * no user-facing copy. Everything here is a function of its arguments, so the
 * branching and invalidation rules can be tested as plain Node tests.
 *
 * Validation returns codes rather than messages; the UI owns the Turkish text.
 */

const YKS_ORDER: readonly HocaBulStepId[] = [
  "hedef",
  "asama",
  "yks_alan",
  "dersler",
  "zorluk",
  "hoca_yaklasimi",
  "uygun_zamanlar",
  "butce",
  "kontrol",
];

const BASE_ORDER: readonly HocaBulStepId[] = [
  "hedef",
  "asama",
  "dersler",
  "zorluk",
  "hoca_yaklasimi",
  "uygun_zamanlar",
  "butce",
  "kontrol",
];

export const MAX_SUBJECTS = 3;
export const MAX_CHALLENGES = 2;
export const MAX_TEACHING_STYLES = 2;
export const MAX_AVAILABILITY_WINDOWS = 4;
export const MAX_EXAM_AREAS = 3;

function orderFor(goal?: HocaBulGoal): readonly HocaBulStepId[] {
  // Before the goal is answered the shorter order is correct: the YKS-only
  // screen cannot be reached until "hedef" says YKS, and the counter total is
  // re-read from here the moment it does.
  return goal === "YKS" ? YKS_ORDER : BASE_ORDER;
}

export function getVisibleSteps(goal?: HocaBulGoal): HocaBulVisibleStep[] {
  const order = orderFor(goal);
  const total = order.length as HocaBulStepTotal;
  return order.map((id, index) => ({
    id,
    index,
    humanIndex: index + 1,
    total,
    isReview: id === "kontrol",
  }));
}

export function getStepTotal(goal?: HocaBulGoal): HocaBulStepTotal {
  return orderFor(goal).length as HocaBulStepTotal;
}

export function getStepAt(
  goal: HocaBulGoal | undefined,
  index: number
): HocaBulVisibleStep | null {
  return getVisibleSteps(goal)[index] ?? null;
}

export function getStepById(
  goal: HocaBulGoal | undefined,
  stepId: HocaBulStepId
): HocaBulVisibleStep | null {
  return getVisibleSteps(goal).find((step) => step.id === stepId) ?? null;
}

export function isStepVisible(
  goal: HocaBulGoal | undefined,
  stepId: HocaBulStepId
): boolean {
  return orderFor(goal).includes(stepId);
}

// --- Navigation --------------------------------------------------------------

/**
 * "hedef" always advances to "asama" — the YKS branch happens when leaving
 * "asama", not when leaving "hedef".
 */
export function getNextStepId(
  goal: HocaBulGoal | undefined,
  current: HocaBulStepId
): HocaBulStepId | "submit" | null {
  if (current === "kontrol") return "submit";
  const order = orderFor(goal);
  const index = order.indexOf(current);
  if (index === -1) return null;
  return order[index + 1] ?? null;
}

export function getPreviousStepId(
  goal: HocaBulGoal | undefined,
  current: HocaBulStepId
): HocaBulStepId | null {
  const order = orderFor(goal);
  const index = order.indexOf(current);
  if (index <= 0) return null;
  return order[index - 1] ?? null;
}

export function getFirstUnansweredStepId(
  goal: HocaBulGoal | undefined,
  answers: HocaBulApiAnswersDraft,
  client: HocaBulClientAnswers
): HocaBulStepId {
  for (const step of getVisibleSteps(goal)) {
    if (step.isReview) return step.id;
    if (!isStepValid(step.id, answers, client)) return step.id;
  }
  return "kontrol";
}

/**
 * Turns an untrusted ?adim= value into a step the student may actually be on.
 * Never throws and never returns a step beyond the first unanswered one, so a
 * hand-edited URL cannot skip the flow.
 */
export function sanitizeStepParam(
  raw: string | null | undefined,
  goal: HocaBulGoal | undefined,
  answers: HocaBulApiAnswersDraft,
  client: HocaBulClientAnswers
): HocaBulStepId {
  const order = orderFor(goal);
  const furthest = getFirstUnansweredStepId(goal, answers, client);
  const furthestIndex = order.indexOf(furthest);

  const requestedIndex = raw ? order.indexOf(raw as HocaBulStepId) : -1;
  if (requestedIndex === -1) return furthest;

  return order[Math.min(requestedIndex, furthestIndex)] ?? furthest;
}

// --- Validation ---------------------------------------------------------------

function sizeValidation(
  count: number,
  max: number
): HocaBulStepValidation {
  if (count === 0) return { ok: false, code: "required" };
  if (count > max) return { ok: false, code: "max_exceeded" };
  return { ok: true };
}

export function validateStep(
  stepId: HocaBulStepId,
  answers: HocaBulApiAnswersDraft,
  client: HocaBulClientAnswers
): HocaBulStepValidation {
  switch (stepId) {
    case "hedef":
      return answers.goal ? { ok: true } : { ok: false, code: "required" };
    case "asama":
      return answers.stage ? { ok: true } : { ok: false, code: "required" };
    case "yks_alan":
      return sizeValidation(client.yks_alan?.length ?? 0, MAX_EXAM_AREAS);
    case "dersler":
      return sizeValidation(answers.subject_keys?.length ?? 0, MAX_SUBJECTS);
    case "zorluk":
      return sizeValidation(answers.challenges?.length ?? 0, MAX_CHALLENGES);
    case "hoca_yaklasimi":
      return sizeValidation(
        answers.teaching_styles?.length ?? 0,
        MAX_TEACHING_STYLES
      );
    case "uygun_zamanlar": {
      const windows = answers.availability_windows ?? [];
      if (windows.includes("flexible") && windows.length > 1) {
        return { ok: false, code: "flexible_conflict" };
      }
      return sizeValidation(windows.length, MAX_AVAILABILITY_WINDOWS);
    }
    case "butce":
      return answers.budget_segment
        ? { ok: true }
        : { ok: false, code: "required" };
    case "kontrol":
      return isFlowComplete(answers.goal, answers, client)
        ? { ok: true }
        : { ok: false, code: "required" };
  }
}

export function isStepValid(
  stepId: HocaBulStepId,
  answers: HocaBulApiAnswersDraft,
  client: HocaBulClientAnswers
): boolean {
  return validateStep(stepId, answers, client).ok;
}

export function isFlowComplete(
  goal: HocaBulGoal | undefined,
  answers: HocaBulApiAnswersDraft,
  client: HocaBulClientAnswers
): boolean {
  return getVisibleSteps(goal)
    .filter((step) => !step.isReview)
    .every((step) => isStepValid(step.id, answers, client));
}

// --- Selection helpers ---------------------------------------------------------

export function toggleWithLimit<T extends string>(
  values: T[],
  value: T,
  max: number
): { values: T[]; limitHit: boolean } {
  if (values.includes(value)) {
    return { values: values.filter((item) => item !== value), limitHit: false };
  }
  if (values.length >= max) return { values, limitHit: true };
  return { values: [...values, value], limitHit: false };
}

/** "flexible" is exclusive in both directions — the server rejects it alongside a concrete window. */
export function toggleAvailability(
  values: MatchAvailabilityWindow[],
  value: MatchAvailabilityWindow
): { values: MatchAvailabilityWindow[]; limitHit: boolean } {
  if (value === "flexible") {
    const alreadyOnlyFlexible =
      values.length === 1 && values[0] === "flexible";
    return { values: alreadyOnlyFlexible ? [] : ["flexible"], limitHit: false };
  }
  return toggleWithLimit(
    values.filter((item) => item !== "flexible"),
    value,
    MAX_AVAILABILITY_WINDOWS
  );
}

/** "unsure" means "do not filter", so it cannot coexist with a concrete area. */
export function toggleExamArea(
  values: HocaBulExamArea[],
  value: HocaBulExamArea
): { values: HocaBulExamArea[]; limitHit: boolean } {
  if (value === "unsure") {
    const alreadyOnlyUnsure = values.length === 1 && values[0] === "unsure";
    return { values: alreadyOnlyUnsure ? [] : ["unsure"], limitHit: false };
  }
  return toggleWithLimit(
    values.filter((item) => item !== "unsure"),
    value,
    MAX_EXAM_AREAS
  );
}

// --- Invalidation ---------------------------------------------------------------

/**
 * Subject groups, stage vocabulary and budget bands are all derived server-side
 * from the goal and the selected subjects, so changing an upstream answer must
 * drop what it invalidates instead of silently sending a stale value.
 */
export function pruneSubjectsForAreas(
  keys: string[],
  subjects: MatchSubjectOption[],
  areas?: HocaBulExamArea[]
): string[] {
  if (!areas || areas.length === 0 || areas.includes("unsure")) return keys;
  const allowed = new Set(areas);
  return keys.filter((key) => {
    const subject = subjects.find((item) => item.key === key);
    if (!subject) return true; // options not loaded yet; pruneAnswersAgainstOptions handles it
    return subject.exam_types.some((examType) =>
      allowed.has(examType as HocaBulExamArea)
    );
  });
}

export function applyAnswerChange(
  state: HocaBulAnswerState,
  change: HocaBulAnswerChange,
  context: { subjects?: MatchSubjectOption[] } = {}
): HocaBulAnswerState & { cleared: HocaBulClearedField[] } {
  const answers: HocaBulApiAnswersDraft = { ...state.answers };
  const client: HocaBulClientAnswers = { ...state.client };
  const cleared: HocaBulClearedField[] = [];

  switch (change.field) {
    case "goal": {
      if (answers.goal === change.value) {
        answers.goal = change.value;
        break;
      }
      answers.goal = change.value;
      if (answers.stage !== undefined) {
        delete answers.stage;
        cleared.push("stage");
      }
      if (client.yks_alan !== undefined) {
        delete client.yks_alan;
        cleared.push("yks_alan");
      }
      if (answers.subject_keys !== undefined) {
        delete answers.subject_keys;
        cleared.push("subject_keys");
      }
      if (answers.budget_segment !== undefined) {
        delete answers.budget_segment;
        cleared.push("budget_segment");
      }
      break;
    }
    case "yks_alan": {
      client.yks_alan = change.value;
      const currentKeys = answers.subject_keys ?? [];
      const nextKeys = pruneSubjectsForAreas(
        currentKeys,
        context.subjects ?? [],
        change.value
      );
      if (nextKeys.length !== currentKeys.length) {
        answers.subject_keys = nextKeys;
        cleared.push("subject_keys");
        if (answers.budget_segment !== undefined) {
          delete answers.budget_segment;
          cleared.push("budget_segment");
        }
      }
      break;
    }
    case "subject_keys": {
      const changed =
        (answers.subject_keys ?? []).join("|") !== change.value.join("|");
      answers.subject_keys = change.value;
      if (changed && answers.budget_segment !== undefined) {
        delete answers.budget_segment;
        cleared.push("budget_segment");
      }
      break;
    }
    case "stage":
      answers.stage = change.value;
      break;
    case "challenges":
      answers.challenges = change.value;
      break;
    case "teaching_styles":
      answers.teaching_styles = change.value;
      break;
    case "availability_windows":
      answers.availability_windows = change.value;
      break;
    case "budget_segment":
      answers.budget_segment = change.value;
      break;
  }

  return { answers, client, cleared };
}

/**
 * Drops answers the server no longer offers — a subject whose last tutor went
 * private, a budget band that disappeared after a subject change, a stage that
 * does not belong to the current goal.
 */
export function pruneAnswersAgainstOptions(
  answers: HocaBulApiAnswersDraft,
  client: HocaBulClientAnswers,
  options: MatchingOptions
): {
  answers: HocaBulApiAnswersDraft;
  client: HocaBulClientAnswers;
  dropped: HocaBulClearedField[];
} {
  const next: HocaBulApiAnswersDraft = { ...answers };
  const nextClient: HocaBulClientAnswers = { ...client };
  const dropped: HocaBulClearedField[] = [];

  if (next.goal && !options.goals.some((goal) => goal.value === next.goal)) {
    delete next.goal;
  }

  const stages = next.goal ? options.stages[next.goal] ?? [] : [];
  if (next.stage && !stages.some((stage) => stage.value === next.stage)) {
    delete next.stage;
    dropped.push("stage");
  }

  if (next.subject_keys) {
    const available = new Set(options.subjects.map((subject) => subject.key));
    const kept = next.subject_keys.filter((key) => available.has(key));
    if (kept.length !== next.subject_keys.length) {
      next.subject_keys = kept;
      dropped.push("subject_keys");
    }
  }

  if (nextClient.yks_alan && next.goal !== "YKS") {
    delete nextClient.yks_alan;
    dropped.push("yks_alan");
  }

  if (
    next.budget_segment &&
    !options.budget_ranges.some((band) => band.id === next.budget_segment)
  ) {
    delete next.budget_segment;
    dropped.push("budget_segment");
  }

  return { answers: next, client: nextClient, dropped };
}

// --- Serialization ---------------------------------------------------------------

/** The exact key set MatchingAnswersSerializer accepts. Frozen so tests can assert it. */
export const MATCHING_ANSWER_KEYS = [
  "availability_windows",
  "budget_segment",
  "challenges",
  "goal",
  "schema_version",
  "stage",
  "subject_keys",
  "teaching_styles",
] as const;

/**
 * The only path from wizard state into a request body. Built by explicit
 * assignment rather than spreading state, so a client-only answer (yks_alan) or
 * a piece of UI metadata cannot reach the server even by accident.
 *
 * Returns null while the flow is incomplete; the review step keeps its submit
 * action disabled until this produces a value.
 */
export function toMatchingAnswers(
  answers: HocaBulApiAnswersDraft
): HocaBulApiAnswers | null {
  const {
    goal,
    stage,
    subject_keys,
    challenges,
    teaching_styles,
    availability_windows,
    budget_segment,
  } = answers;

  if (
    !goal ||
    !stage ||
    !subject_keys?.length ||
    !challenges?.length ||
    !teaching_styles?.length ||
    !availability_windows?.length ||
    !budget_segment
  ) {
    return null;
  }

  return {
    goal,
    stage,
    subject_keys: [...subject_keys],
    challenges: [...challenges],
    teaching_styles: [...teaching_styles],
    availability_windows: [...availability_windows],
    budget_segment,
    schema_version: 1,
  };
}
