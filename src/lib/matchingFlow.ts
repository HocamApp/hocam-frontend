import type {
  MatchAvailabilityWindow,
  MatchChallenge,
  MatchingAnswers,
  TutorTeachingStyle,
} from "@/types";

export type MatchPhase = "intro" | "questions" | "matching" | "results";
export type MotionDirection = 1 | -1;
export type SceneStopState = "empty" | "preview" | "committed";

export interface MatchingSceneLabels {
  goal?: string;
  stage?: string;
  subjects?: Record<string, string>;
  budget?: string;
}

export interface MatchingSceneState {
  stops: SceneStopState[];
  goal?: string;
  stage?: string;
  subjects: string[];
  challenges: MatchChallenge[];
  teachingStyles: TutorTeachingStyle[];
  availabilityWindows: MatchAvailabilityWindow[];
  budget?: string;
  isComplete: boolean;
}

export function toggleLimited<T extends string>(
  values: T[],
  value: T,
  maximum: number
): T[] {
  if (values.includes(value)) return values.filter((item) => item !== value);
  if (values.length >= maximum) return values;
  return [...values, value];
}

export function selectAvailabilityWindow(
  values: MatchAvailabilityWindow[],
  value: MatchAvailabilityWindow
): MatchAvailabilityWindow[] {
  if (value === "flexible") {
    return values.length === 1 && values[0] === "flexible" ? [] : ["flexible"];
  }

  return toggleLimited(
    values.filter((item) => item !== "flexible"),
    value,
    4
  );
}

export function answersForGoal(
  goal: MatchingAnswers["goal"]
): Partial<MatchingAnswers> {
  return { goal, schema_version: 1 };
}

export function hasAnswerForStep(
  answers: Partial<MatchingAnswers>,
  step: number
): boolean {
  if (step === 0) return Boolean(answers.goal);
  if (step === 1) return Boolean(answers.stage);
  if (step === 2) return Boolean(answers.subject_keys?.length);
  if (step === 3) return Boolean(answers.challenges?.length);
  if (step === 4) return Boolean(answers.teaching_styles?.length);
  if (step === 5) return Boolean(answers.availability_windows?.length);
  if (step === 6) return Boolean(answers.budget_segment);
  return false;
}

export function deriveMatchingSceneState(
  answers: Partial<MatchingAnswers>,
  activeStep: number,
  labels: MatchingSceneLabels = {},
  revealAll = false
): MatchingSceneState {
  const visibleThrough = revealAll ? 6 : activeStep;
  const isVisible = (step: number) => visibleThrough >= step;

  return {
    stops: Array.from({ length: 7 }, (_, index): SceneStopState => {
      if (revealAll || index < activeStep) return "committed";
      if (index === activeStep && hasAnswerForStep(answers, index)) return "preview";
      return "empty";
    }),
    goal: isVisible(0) && answers.goal
      ? labels.goal ?? (answers.goal === "UNDECIDED" ? "Keşif" : answers.goal)
      : undefined,
    stage: isVisible(1) && answers.stage ? labels.stage ?? answers.stage : undefined,
    subjects: isVisible(2)
      ? (answers.subject_keys ?? []).slice(0, 3).map((key) => labels.subjects?.[key] ?? key)
      : [],
    challenges: isVisible(3) ? (answers.challenges ?? []).slice(0, 2) : [],
    teachingStyles: isVisible(4) ? (answers.teaching_styles ?? []).slice(0, 2) : [],
    availabilityWindows: isVisible(5) ? (answers.availability_windows ?? []) : [],
    budget:
      isVisible(6) && answers.budget_segment
        ? labels.budget ?? answers.budget_segment
        : undefined,
    isComplete: revealAll || activeStep > 6,
  };
}
