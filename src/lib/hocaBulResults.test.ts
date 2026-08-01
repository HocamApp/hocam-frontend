import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SavedMatchingPreference, TutorMatchResult } from "@/types";

import {
  buildResultEditHref,
  caveatTexts,
  createDraftFromPreference,
  reasonTexts,
  splitMatches,
} from "./hocaBulResults";

function match(
  id: string,
  level: TutorMatchResult["match_level"],
  overrides: Partial<TutorMatchResult> = {}
): TutorMatchResult {
  return {
    tutor: {
      id,
      name: "Ada",
      surname: "Yılmaz",
      profile_picture: "",
      university: "Boğaziçi Üniversitesi",
      department: "Matematik",
      hourly_price: 600,
      rating: 4.8,
      total_reviews: 12,
      completed_lessons_count: 30,
      is_verified: true,
      subjects: [],
    },
    score: 91,
    match_level: level,
    reason_codes: [],
    caveat_codes: [],
    matched_subjects: [],
    matched_styles: [],
    nearest_available_at: null,
    ...overrides,
  };
}

const preference: SavedMatchingPreference = {
  goal: "YKS",
  stage: "grade_12",
  subject_keys: ["matematik"],
  challenges: ["foundations"],
  teaching_styles: ["question_speed"],
  availability_windows: ["weekday_evening"],
  budget_segment: "balanced",
  schema_version: 1,
  updated_at: "2026-07-28T12:00:00Z",
};

describe("result grouping", () => {
  it("puts strong matches first while preserving server order inside each group", () => {
    const relaxedA = match("r1", "budget_relaxed");
    const strongA = match("s1", "strong");
    const relaxedB = match("r2", "schedule_relaxed");
    const strongB = match("s2", "strong");

    const grouped = splitMatches([relaxedA, strongA, relaxedB, strongB]);

    assert.deepEqual(grouped.strong.map((item) => item.tutor.id), ["s1", "s2"]);
    assert.deepEqual(grouped.relaxed.map((item) => item.tutor.id), ["r1", "r2"]);
  });
});

describe("API-backed explanation copy", () => {
  it("uses only reason codes and matched API fields", () => {
    const result = reasonTexts(
      match("1", "strong", {
        reason_codes: [
          "subject_match",
          "availability_match",
          "teaching_style_match",
          "budget_match",
        ],
        matched_subjects: ["Matematik", "Fizik"],
        matched_styles: ["question_speed", "foundations_patient"],
      })
    );

    assert.deepEqual(result, [
      "Matematik, Fizik dersinde uyum",
      "seçtiğin saatlerde müsait",
      "Bol soru çözdüren, Sabırla temelden anlatan",
      "bütçene uygun",
    ]);
  });

  it("renders every approved caveat and no fallback claims", () => {
    const result = caveatTexts(
      match("1", "budget_relaxed", {
        caveat_codes: ["budget_relaxed", "schedule_relaxed"],
      })
    );

    assert.deepEqual(result, [
      "Bu hoca seçtiğin bütçe aralığının üzerinde.",
      "Seçtiğin saatlerde yakın bir boşluk bulunamadı; diğer uyumlara göre önerildi.",
    ]);
    assert.deepEqual(reasonTexts(match("2", "strong")), []);
  });

  it("uses matched subject/style fields without requiring redundant reason codes", () => {
    assert.deepEqual(reasonTexts(match("3", "strong", {
      matched_subjects: ["Matematik"],
      matched_styles: ["question_speed"],
    })), ["Matematik dersinde uyum", "Bol soru çözdüren"]);
  });
});

describe("saved-preference fallback", () => {
  it("seeds a complete editable YKS draft without changing the API answers", () => {
    const draft = createDraftFromPreference("student-1", preference, 1000);

    assert.deepEqual(draft.answers, {
      goal: preference.goal,
      stage: preference.stage,
      subject_keys: preference.subject_keys,
      challenges: preference.challenges,
      teaching_styles: preference.teaching_styles,
      availability_windows: preference.availability_windows,
      budget_segment: preference.budget_segment,
      schema_version: 1,
    });
    assert.deepEqual(draft.client.yks_alan, ["unsure"]);
    assert.equal(draft.stepId, "kontrol");
  });
});

describe("result edit URLs", () => {
  it("marks result-origin navigation without adding unsupported filters", () => {
    assert.equal(
      buildResultEditHref("uygun_zamanlar"),
      "/hoca-bul?adim=uygun_zamanlar&kaynak=sonuclar"
    );
    assert.equal(buildResultEditHref("kontrol"), "/hoca-bul?adim=kontrol&kaynak=sonuclar");
  });
});
