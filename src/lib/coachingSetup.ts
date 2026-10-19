import type { CoachingFrequency, CoachingPlan, CoachingPlanPayload } from "./coachingApi";
import { isCoachingExamGroup } from "./coachingPresentation";

export const COACHING_SETUP_STEPS = [
  "frequency",
  "price",
  "exams",
  "description",
  "availability",
  "capacity",
  "publish",
] as const;

export type CoachingSetupStep = (typeof COACHING_SETUP_STEPS)[number];

/** The heading of each step, in the words the tutor sees on the page. */
export const COACHING_SETUP_STEP_TITLES: Record<CoachingSetupStep, string> = {
  frequency: "Görüşme düzeni",
  price: "Koçluk fiyatı",
  exams: "Koçluk verdiğin sınavlar",
  description: "Kısa açıklama",
  availability: "Koçluk saatlerin",
  capacity: "Kapasite",
  publish: "Gözden geçir ve yayınla",
};

/** The same steps as one or two words, for the chips under the progress bar. */
export const COACHING_SETUP_CHIP_LABELS: Record<CoachingSetupStep, string> = {
  frequency: "Görüşme düzeni",
  price: "Fiyat",
  exams: "Sınavlar",
  description: "Açıklama",
  availability: "Saatler",
  capacity: "Kapasite",
  publish: "Yayın",
};

const ERROR_STEP: Record<string, CoachingSetupStep> = {
  availability_required: "availability",
  capacity_required: "capacity",
  capacity_exceeds_theoretical: "capacity",
  price_exceeds_cap: "price",
  plan_incomplete: "frequency",
};

export function coachingSetupStepForError(code: string | null): CoachingSetupStep {
  return (code && ERROR_STEP[code]) || "publish";
}

export function readCoachingSetupStep(value: string | null): CoachingSetupStep {
  // The student-view step was folded into review-and-publish; old links land there.
  if (value === "preview") return "publish";
  return COACHING_SETUP_STEPS.includes(value as CoachingSetupStep)
    ? (value as CoachingSetupStep)
    : "frequency";
}

/** What the setup has saved so far: the plan row, and the hours on the calendar. */
export interface CoachingSetupSnapshot {
  plan: CoachingPlan | null;
  weeklySlotCount: number;
}

/**
 * Whether a step's data is saved. Progress is read from this, not from which
 * step the tutor happens to be looking at, so a tutor who comes back to edit
 * one setting still sees every other step as done.
 *
 * The description is optional, so a saved plan is all it takes; a price of
 * zero means free and counts as set.
 */
export function coachingSetupStepDone(
  step: CoachingSetupStep,
  { plan, weeklySlotCount }: CoachingSetupSnapshot
): boolean {
  if (!plan) return false;
  switch (step) {
    case "frequency":
    case "price":
    case "description":
      return true;
    case "exams":
      return plan.target_exam_types.length > 0;
    case "availability":
      return weeklySlotCount > 0;
    case "capacity":
      return weeklySlotCount > 0 && plan.max_active_students >= 1;
    case "publish":
      return plan.is_published;
  }
}

/** Everything before publishing is saved: the tutor is set up, whether or not live. */
export function isCoachingSetupComplete(snapshot: CoachingSetupSnapshot): boolean {
  return COACHING_SETUP_STEPS.filter((step) => step !== "publish").every((step) =>
    coachingSetupStepDone(step, snapshot)
  );
}

/**
 * The steps to draw as done. A returning tutor is read from saved data alone.
 * A first setup has no plan row until the description step, so the steps
 * already walked count too, provided their own data holds (hours still have to
 * exist for the availability step to count).
 */
export function coachingSetupDoneSteps({
  snapshot,
  currentStep,
  firstSetup,
}: {
  snapshot: CoachingSetupSnapshot;
  currentStep: CoachingSetupStep;
  firstSetup: boolean;
}): CoachingSetupStep[] {
  const currentIndex = COACHING_SETUP_STEPS.indexOf(currentStep);
  return COACHING_SETUP_STEPS.filter((step, index) => {
    if (coachingSetupStepDone(step, snapshot)) return !firstSetup || index < currentIndex;
    if (!firstSetup || snapshot.plan) return false;
    // No plan row yet: only the three steps that have nothing to save can count.
    return index < currentIndex && (step === "frequency" || step === "price" || step === "exams");
  });
}

export function unlockedCoachingSetupSteps(input: {
  hasPlan: boolean;
  weeklySlotCount: number;
}): readonly CoachingSetupStep[] {
  if (input.hasPlan || input.weeklySlotCount > 0) return COACHING_SETUP_STEPS;
  return COACHING_SETUP_STEPS.slice(0, 5);
}

export interface CoachingPlanDraft {
  frequency: CoachingFrequency;
  priceMinor: number;
  maxActiveStudents: number;
  examTypes: string[];
  description: string;
}

export function buildCoachingPlanPayload(draft: CoachingPlanDraft): CoachingPlanPayload {
  const targetExamTypes = draft.examTypes.filter(isCoachingExamGroup);
  if (targetExamTypes.length === 0) {
    throw new Error("En az bir sınav seçmelisin.");
  }
  return {
    frequency: draft.frequency,
    price_per_session_minor: draft.priceMinor,
    max_active_students: draft.maxActiveStudents,
    target_exam_types: targetExamTypes,
    description: draft.description.trim(),
  };
}
