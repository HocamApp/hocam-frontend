import type { CoachingControlQuestion, CoachingOnboardingState } from "./coachingApi";
import { COACHING_SETUP_CHIP_LABELS, COACHING_SETUP_STEPS } from "./coachingSetup";

/**
 * The tutor's coaching introduction as the screen shows it: three steps. The
 * server still counts a fourth ("plan") that asks nothing of the tutor and is not
 * required to finish, so the screen ends the introduction on the contract and a
 * tutor the server left on that old step is shown the contract, already accepted.
 */
export type OnboardingStage = "intro" | "questions" | "contract" | "done";

export function onboardingStage(state: Pick<CoachingOnboardingState, "is_completed" | "current_step_key">): OnboardingStage {
  if (state.is_completed) return "done";
  if (state.current_step_key === "control_questions") return "questions";
  if (state.current_step_key === "contract" || state.current_step_key === "plan") return "contract";
  return "intro";
}

export interface OnboardingStepperStep {
  key: Exclude<OnboardingStage, "done">;
  number: number;
  label: string;
  state: "done" | "current" | "todo";
}

const FLOW: { key: OnboardingStepperStep["key"]; label: string }[] = [
  { key: "intro", label: "Tanıtım" },
  { key: "questions", label: "Hızlı kontrol" },
  { key: "contract", label: "Sözleşme" },
];

export function onboardingStepper(stage: OnboardingStage): OnboardingStepperStep[] {
  const at = stage === "done" ? FLOW.length : FLOW.findIndex((step) => step.key === stage);
  return FLOW.map((step, index) => ({
    key: step.key,
    number: index + 1,
    label: step.label,
    state: index < at ? "done" : index === at ? "current" : "todo",
  }));
}

export interface ControlProgress {
  correct: number;
  total: number;
  remaining: number;
}

/** What the server confirmed as correct; a wrong or missing answer is still to do. */
export function controlProgress(
  questions: readonly CoachingControlQuestion[],
  answers: CoachingOnboardingState["control_question_answers"]
): ControlProgress {
  const correct = questions.filter((question) => answers[question.id]?.is_correct === true).length;
  return { correct, total: questions.length, remaining: questions.length - correct };
}

/** Why the way on is shut, in words; nothing when it is open. */
export function controlGateNote(progress: ControlProgress): string | null {
  return progress.remaining > 0 ? `Sözleşmeye geçmek için ${progress.remaining} soru daha var.` : null;
}

/** What the tutor sets up after the introduction, in the order of the setup. */
export const ONBOARDING_NEXT_LABELS: string[] = COACHING_SETUP_STEPS.map((step) => COACHING_SETUP_CHIP_LABELS[step]);
