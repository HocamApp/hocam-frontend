import api from "./api";
import type {
  MatchingAnswers,
  MatchingOptions,
  MatchingPreview,
  SavedMatchingPreference,
  RecommendationControlReason,
  TutorRecommendationControl,
} from "@/types";


export async function fetchMatchingOptions(
  goal: MatchingAnswers["goal"] = "UNDECIDED",
  subjectKeys: string[] = []
): Promise<MatchingOptions> {
  const response = await api.get<MatchingOptions>("/matching/options/", {
    params: {
      goal,
      ...(subjectKeys.length ? { subject_keys: subjectKeys.join(",") } : {}),
    },
  });
  return response.data;
}

interface PreviewTutorMatchOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export function previewTutorMatches(
  answers: MatchingAnswers
): Promise<MatchingPreview>;
export function previewTutorMatches(
  answers: MatchingAnswers,
  options: PreviewTutorMatchOptions
): Promise<MatchingPreview>;
export async function previewTutorMatches(
  answers: MatchingAnswers,
  options: PreviewTutorMatchOptions = {}
): Promise<MatchingPreview> {
  const response = await api.post<MatchingPreview>("/matching/preview/", answers, {
    signal: options.signal,
    timeout: options.timeoutMs,
  });
  return response.data;
}

export async function saveMatchingPreferences(
  answers: MatchingAnswers
): Promise<SavedMatchingPreference> {
  const response = await api.put<{ preference: SavedMatchingPreference }>(
    "/matching/preferences/me/",
    answers
  );
  return response.data.preference;
}

export async function fetchMatchingPreferences(): Promise<SavedMatchingPreference | null> {
  const response = await api.get<{ preference: SavedMatchingPreference | null }>(
    "/matching/preferences/me/"
  );
  return response.data.preference;
}

export async function hideTutorRecommendation(
  tutor: string,
  reason: RecommendationControlReason
): Promise<TutorRecommendationControl> {
  const response = await api.post<TutorRecommendationControl>(
    "/matching/recommendation-controls/",
    { tutor, reason, hidden: true }
  );
  return response.data;
}

export async function fetchRecommendationControls(): Promise<TutorRecommendationControl[]> {
  const response = await api.get<TutorRecommendationControl[]>("/matching/recommendation-controls/");
  return response.data;
}

export async function restoreTutorRecommendation(controlId: string): Promise<void> {
  await api.delete(`/matching/recommendation-controls/${controlId}/`);
}

/**
 * Master Spec §14.6 — the coaching checkout screen's inline exam-target
 * picker. Updates only the goal field; never touches subjects/stage.
 */
export async function updateMatchingGoal(
  goal: "YKS" | "DGS" | "KPSS"
): Promise<{ goal: string }> {
  const response = await api.patch<{ goal: string }>("/matching/goal/", { goal });
  return response.data;
}
