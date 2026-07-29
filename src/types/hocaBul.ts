import type {
  MatchAvailabilityWindow,
  MatchBudgetSegment,
  MatchChallenge,
  MatchGoal,
  MatchingAnswers,
  MatchingPreview,
  TutorMatchResult,
  TutorTeachingStyle,
} from "@/types";

/**
 * Types for the /hoca-bul matching flow. They live here rather than in
 * types/api.ts because only the answers group below is an API contract — the
 * rest is client state that the backend never sees.
 */

// --- A. Answers the backend accepts -----------------------------------------

/** Exactly the fields MatchingAnswersSerializer validates. Alias, not a copy. */
export type HocaBulApiAnswers = MatchingAnswers;

/** Working state while the student is still answering. */
export type HocaBulApiAnswersDraft = Partial<HocaBulApiAnswers>;

export type HocaBulGoal = MatchGoal;

// --- B. Client-only answers (never serialized to the API) -------------------

/**
 * "unsure" is a client sentinel with no server counterpart — the other three
 * are real Subject.exam_type values.
 */
export type HocaBulExamArea = "TYT" | "AYT" | "YDT" | "unsure";

export interface HocaBulClientAnswers {
  /** YKS-only filter over the subject list. Never sent to /matching/. */
  yks_alan?: HocaBulExamArea[];
}

// --- C. UI and navigation metadata ------------------------------------------

/**
 * ASCII ids ("asama", not "aşama") so they are safe in URLs and identifiers.
 * Turkish labels live in the copy layer.
 */
export type HocaBulStepId =
  | "hedef"
  | "asama"
  | "yks_alan"
  | "dersler"
  | "zorluk"
  | "hoca_yaklasimi"
  | "uygun_zamanlar"
  | "butce"
  | "kontrol";

/** 8 steps for DGS/KPSS/UNDECIDED, 9 for YKS. Fixed once the goal is answered. */
export type HocaBulStepTotal = 8 | 9;

export interface HocaBulVisibleStep {
  id: HocaBulStepId;
  /** 0-based position in the branch's visible order. */
  index: number;
  /** 1-based, for the "{n} / {total}" counter. */
  humanIndex: number;
  total: HocaBulStepTotal;
  isReview: boolean;
}

/**
 * Values ?kaynak= is allowed to carry. Both suppress the resume dialog, so the
 * parameter is parsed against this closed set rather than compared inline — an
 * arbitrary query value must never be able to skip a question the student has
 * not answered.
 */
export type HocaBulEntrySource = "sonuclar" | "home";

export type HocaBulValidationCode =
  | "required"
  | "max_exceeded"
  | "exclusive_conflict"
  | "flexible_conflict"
  | "stale_options";

export type HocaBulStepValidation =
  | { ok: true }
  | { ok: false; code: HocaBulValidationCode };

/** Fields an answer change can clear. Drives the "seçimini yenile" notice. */
export type HocaBulClearedField =
  | "stage"
  | "yks_alan"
  | "subject_keys"
  | "budget_segment";

export type HocaBulInvalidationSource =
  | "goal"
  | "yks_alan"
  | "subject_keys"
  | "options";

export interface HocaBulAnswerState {
  answers: HocaBulApiAnswersDraft;
  client: HocaBulClientAnswers;
}

export type HocaBulAnswerChange =
  | { field: "goal"; value: HocaBulGoal }
  | { field: "stage"; value: string }
  | { field: "yks_alan"; value: HocaBulExamArea[] }
  | { field: "subject_keys"; value: string[] }
  | { field: "challenges"; value: MatchChallenge[] }
  | { field: "teaching_styles"; value: TutorTeachingStyle[] }
  | { field: "availability_windows"; value: MatchAvailabilityWindow[] }
  | { field: "budget_segment"; value: MatchBudgetSegment };

export interface HocaBulReviewRow {
  stepId: Exclude<HocaBulStepId, "kontrol">;
  /** Turkish section label, e.g. "Dersler". */
  label: string;
  /** Already-localized answer, e.g. "Matematik, Fizik". */
  value: string;
  /** Optional secondary copy, currently used for the selected budget range. */
  detail?: string;
  /** True for yks_alan — shown to the student, never sent to the server. */
  isClientOnly: boolean;
}

// --- D. Persisted state and cached server responses -------------------------

export interface HocaBulDraftMetadata {
  schemaVersion: 1;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export interface HocaBulDraft {
  meta: HocaBulDraftMetadata;
  answers: HocaBulApiAnswersDraft;
  client: HocaBulClientAnswers;
  stepId: HocaBulStepId;
  expiresAt: number;
}

export interface HocaBulPreviewCacheEntry {
  schemaVersion: 1;
  userId: string;
  answerHash: string;
  /** Canonical JSON of the answers; re-checked on read so a hash collision cannot serve the wrong result. */
  canonical: string;
  createdAt: number;
  response: MatchingPreview;
}

// --- Analytics ---------------------------------------------------------------

export type HocaBulAnalyticsPayload =
  | {
      event: "hoca_bul_started";
      goal?: HocaBulGoal;
      entry: "home_card" | "direct" | "resume";
    }
  | {
      event: "hoca_bul_step_completed";
      step_id: HocaBulStepId;
      index: number;
      total: HocaBulStepTotal;
    }
  | { event: "hoca_bul_step_back"; step_id: HocaBulStepId }
  | {
      event: "hoca_bul_abandoned";
      step_id: HocaBulStepId;
      reason: "exit_dialog" | "unload";
    }
  | {
      event: "hoca_bul_submitted";
      goal: HocaBulGoal;
      subject_count: number;
      served_from_cache: boolean;
    }
  | {
      event: "hoca_bul_results_viewed";
      match_count: number;
      candidate_count: number;
      has_relaxed: boolean;
    }
  | {
      event: "hoca_bul_result_opened";
      tutor_id: string;
      position: number;
      match_level: TutorMatchResult["match_level"];
    }
  | { event: "hoca_bul_all_tutors_clicked"; candidate_count: number }
  | { event: "hoca_bul_no_results"; goal: HocaBulGoal }
  | {
      event: "home_matching_started";
      /** Only present when the student picked a goal chip on the home card. */
      goal?: HocaBulGoal;
      /** Which card variant was clicked. */
      state: "fresh" | "draft" | "result";
    };

export type HocaBulAnalyticsEvent = HocaBulAnalyticsPayload["event"];
