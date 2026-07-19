import api from "./api";
import type {
  MatchingAnswers,
  MatchingOptions,
  MatchingPreview,
  SavedMatchingPreference,
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

export async function previewTutorMatches(
  answers: MatchingAnswers
): Promise<MatchingPreview> {
  const response = await api.post<MatchingPreview>("/matching/preview/", answers);
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
