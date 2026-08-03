/**
 * Pure onboarding-step decisions, extracted for regression tests.
 */

export interface LessonsStepInput {
  verificationApproved: boolean;
  lessonsReady: boolean;
  subjectCount: number;
}

/**
 * The "Dersler ve müsaitlik" step is uncompletable from the onboarding page
 * alone when the profile has no subjects: the embedded availability calendar
 * only edits time rules, while `lessonsReady` also requires at least one
 * subject. In that state the step must surface a visible CTA that routes the
 * tutor to the profile editor (where subjects live) instead of leaving a
 * dead checklist item.
 */
export function shouldShowLessonsEditCta({
  verificationApproved,
  lessonsReady,
  subjectCount,
}: LessonsStepInput): boolean {
  return verificationApproved && !lessonsReady && subjectCount === 0;
}
