import { createDraft } from "@/lib/hocaBulDraft";
import { TEACHING_STYLE_LABELS } from "@/lib/hocaBulOptions";
import type {
  SavedMatchingPreference,
  TutorMatchResult,
} from "@/types";
import type { HocaBulDraft, HocaBulStepId } from "@/types/hocaBul";

export function splitMatches(matches: readonly TutorMatchResult[]): {
  strong: TutorMatchResult[];
  relaxed: TutorMatchResult[];
} {
  return {
    strong: matches.filter((match) => match.match_level === "strong"),
    relaxed: matches.filter((match) => match.match_level !== "strong"),
  };
}

export function reasonTexts(match: TutorMatchResult): string[] {
  const reasons: string[] = [];
  if (match.matched_subjects.length > 0) {
    reasons.push(`${match.matched_subjects.join(", ")} dersinde uyum`);
  }
  if (match.reason_codes.includes("availability_match")) {
    reasons.push("seçtiğin saatlerde müsait");
  }
  if (match.matched_styles.length > 0) {
    reasons.push(
      match.matched_styles.map((style) => TEACHING_STYLE_LABELS[style]).join(", ")
    );
  }
  if (match.reason_codes.includes("budget_match")) {
    reasons.push("bütçene uygun");
  }
  return reasons;
}

const CAVEAT_TEXT = {
  budget_relaxed: "Bu hoca seçtiğin bütçe aralığının üzerinde.",
  schedule_relaxed:
    "Seçtiğin saatlerde yakın bir boşluk bulunamadı; diğer uyumlara göre önerildi.",
} as const;

export function caveatTexts(match: TutorMatchResult): string[] {
  return match.caveat_codes.map((code) => CAVEAT_TEXT[code]);
}

export function createDraftFromPreference(
  userId: string,
  preference: SavedMatchingPreference,
  now = Date.now()
): HocaBulDraft {
  return createDraft(userId, now, {
    answers: {
      goal: preference.goal,
      stage: preference.stage,
      subject_keys: [...preference.subject_keys],
      challenges: [...preference.challenges],
      teaching_styles: [...preference.teaching_styles],
      availability_windows: [...preference.availability_windows],
      budget_segment: preference.budget_segment,
      schema_version: 1,
    },
    client: preference.goal === "YKS" ? { yks_alan: ["unsure"] } : {},
    stepId: "kontrol",
  });
}

export function buildResultEditHref(stepId: HocaBulStepId): string {
  const params = new URLSearchParams({ adim: stepId, kaynak: "sonuclar" });
  return `/hoca-bul?${params.toString()}`;
}
