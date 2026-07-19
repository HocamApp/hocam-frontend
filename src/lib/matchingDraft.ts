import type { MatchingAnswers } from "@/types";

export const MATCHING_DRAFT_KEY = "hocam:matching-draft:v1";
export const MATCHING_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface MatchingDraft {
  answers: Partial<MatchingAnswers>;
  step: number;
  expiresAt: number;
}

export function createMatchingDraft(
  answers: Partial<MatchingAnswers>,
  step: number,
  now = Date.now()
): MatchingDraft {
  return { answers, step, expiresAt: now + MATCHING_DRAFT_TTL_MS };
}

export function parseMatchingDraft(raw: string | null, now = Date.now()): MatchingDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<MatchingDraft>;
    if (
      !parsed.answers ||
      typeof parsed.answers !== "object" ||
      typeof parsed.step !== "number" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= now
    ) {
      return null;
    }
    return parsed as MatchingDraft;
  } catch {
    return null;
  }
}

export function isCompleteMatchingAnswers(
  answers: Partial<MatchingAnswers>
): answers is MatchingAnswers {
  return Boolean(
    answers.goal &&
      answers.stage &&
      answers.subject_keys?.length &&
      answers.challenges?.length &&
      answers.teaching_styles?.length &&
      answers.availability_windows?.length &&
      answers.budget_segment &&
      answers.schema_version === 1
  );
}
