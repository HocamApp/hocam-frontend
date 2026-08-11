import type { CoachingFrequency, CoachingPlanPayload } from "./coachingApi";
import { isCoachingExamGroup } from "./coachingPresentation";

export const COACHING_SETUP_STEPS = [
  "frequency",
  "price",
  "exams",
  "description",
  "availability",
  "capacity",
  "preview",
  "publish",
] as const;

export type CoachingSetupStep = (typeof COACHING_SETUP_STEPS)[number];

export function readCoachingSetupStep(value: string | null): CoachingSetupStep {
  return COACHING_SETUP_STEPS.includes(value as CoachingSetupStep)
    ? (value as CoachingSetupStep)
    : "frequency";
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
