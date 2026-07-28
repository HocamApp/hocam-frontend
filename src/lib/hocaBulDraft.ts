import {
  MATCHING_DRAFT_KEY,
  parseMatchingDraft,
} from "@/lib/matchingDraft";
import {
  AVAILABILITY_ORDER,
  CHALLENGE_ORDER,
  TEACHING_STYLE_ORDER,
} from "@/lib/hocaBulOptions";
import {
  MAX_AVAILABILITY_WINDOWS,
  MAX_CHALLENGES,
  MAX_EXAM_AREAS,
  MAX_SUBJECTS,
  MAX_TEACHING_STYLES,
} from "@/lib/hocaBulFlow";
import { readJson, removeKey, writeJson, type StorageLike } from "@/lib/safeStorage";
import type {
  MatchAvailabilityWindow,
  MatchBudgetSegment,
  MatchChallenge,
  TutorTeachingStyle,
} from "@/types";
import type {
  HocaBulApiAnswersDraft,
  HocaBulClientAnswers,
  HocaBulDraft,
  HocaBulGoal,
  HocaBulStepId,
} from "@/types/hocaBul";

/**
 * Draft persistence for /hoca-bul.
 *
 * Deliberately a separate module from matchingDraft.ts: that one is still
 * imported by the live /match page, so it is read here and never modified.
 */

export const HOCA_BUL_DRAFT_KEY_PREFIX = "hocam:hoca-bul-draft:v1";
export const HOCA_BUL_LEGACY_MARKER_PREFIX = "hocam:hoca-bul-legacy-copy:v1";
export const HOCA_BUL_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const GOALS: HocaBulGoal[] = ["YKS", "DGS", "KPSS", "UNDECIDED"];
const BUDGET_SEGMENTS: MatchBudgetSegment[] = [
  "economical",
  "balanced",
  "premium",
  "flexible",
];
const STEP_IDS: HocaBulStepId[] = [
  "hedef",
  "asama",
  "yks_alan",
  "dersler",
  "zorluk",
  "hoca_yaklasimi",
  "uygun_zamanlar",
  "butce",
  "kontrol",
];

/** Returns null until the authenticated user id is known, so nothing is read or written too early. */
export function draftKey(userId: string | undefined | null): string | null {
  if (!userId) return null;
  return `${HOCA_BUL_DRAFT_KEY_PREFIX}:${userId}`;
}

export function legacyDraftKey(userId: string | undefined | null): string | null {
  if (!userId) return null;
  return `${MATCHING_DRAFT_KEY}:${userId}`;
}

export function legacyMarkerKey(userId: string | undefined | null): string | null {
  if (!userId) return null;
  return `${HOCA_BUL_LEGACY_MARKER_PREFIX}:${userId}`;
}

export function createDraft(
  userId: string,
  now = Date.now(),
  seed: Partial<Pick<HocaBulDraft, "answers" | "client" | "stepId">> = {}
): HocaBulDraft {
  return {
    meta: {
      schemaVersion: 1,
      userId,
      createdAt: now,
      updatedAt: now,
    },
    answers: seed.answers ?? {},
    client: seed.client ?? {},
    stepId: seed.stepId ?? "hedef",
    expiresAt: now + HOCA_BUL_DRAFT_TTL_MS,
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function keepKnown<T extends string>(
  value: unknown,
  allowed: readonly T[],
  max: number
): T[] | undefined {
  if (!isStringArray(value)) return undefined;
  const kept = Array.from(new Set(
    value.filter((item): item is T => (allowed as readonly string[]).includes(item))
  ));
  if (kept.length === 0) return undefined;
  return kept.slice(0, max);
}

/** Any failure is treated as "no draft" — a corrupt value must never block the flow. */
export function parseDraft(
  raw: unknown,
  userId: string,
  now = Date.now()
): HocaBulDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<HocaBulDraft>;
  const meta = candidate.meta;

  if (!meta || typeof meta !== "object") return null;
  if (meta.schemaVersion !== 1) return null;
  // Never restore another account's answers, even on a shared device.
  if (meta.userId !== userId) return null;
  if (typeof candidate.expiresAt !== "number" || candidate.expiresAt <= now) {
    return null;
  }
  if (!candidate.stepId || !STEP_IDS.includes(candidate.stepId)) return null;
  if (!candidate.answers || typeof candidate.answers !== "object") return null;

  const answers = sanitizeAnswers(candidate.answers);
  const client = sanitizeClient(candidate.client);

  return {
    meta: {
      schemaVersion: 1,
      userId,
      createdAt: typeof meta.createdAt === "number" ? meta.createdAt : now,
      updatedAt: typeof meta.updatedAt === "number" ? meta.updatedAt : now,
      legacyCopy: meta.legacyCopy,
    },
    answers,
    client,
    stepId: candidate.stepId,
    expiresAt: candidate.expiresAt,
  };
}

function sanitizeAnswers(raw: unknown): HocaBulApiAnswersDraft {
  const source = raw as Record<string, unknown>;
  const answers: HocaBulApiAnswersDraft = {};

  if (typeof source.goal === "string" && GOALS.includes(source.goal as HocaBulGoal)) {
    answers.goal = source.goal as HocaBulGoal;
  }
  if (typeof source.stage === "string" && source.stage) {
    answers.stage = source.stage;
  }
  if (isStringArray(source.subject_keys) && source.subject_keys.length) {
    answers.subject_keys = Array.from(new Set(source.subject_keys)).slice(0, MAX_SUBJECTS);
  }
  const challenges = keepKnown<MatchChallenge>(
    source.challenges,
    CHALLENGE_ORDER,
    MAX_CHALLENGES
  );
  if (challenges) answers.challenges = challenges;

  const styles = keepKnown<TutorTeachingStyle>(
    source.teaching_styles,
    TEACHING_STYLE_ORDER,
    MAX_TEACHING_STYLES
  );
  if (styles) answers.teaching_styles = styles;

  const windows = keepKnown<MatchAvailabilityWindow>(
    source.availability_windows,
    AVAILABILITY_ORDER,
    MAX_AVAILABILITY_WINDOWS
  );
  if (windows) {
    // The server rejects "flexible" alongside a concrete window.
    answers.availability_windows = windows.includes("flexible")
      ? ["flexible"]
      : windows;
  }

  if (
    typeof source.budget_segment === "string" &&
    BUDGET_SEGMENTS.includes(source.budget_segment as MatchBudgetSegment)
  ) {
    answers.budget_segment = source.budget_segment as MatchBudgetSegment;
  }

  return answers;
}

function sanitizeClient(raw: unknown): HocaBulClientAnswers {
  if (!raw || typeof raw !== "object") return {};
  const source = raw as Record<string, unknown>;
  if (!isStringArray(source.yks_alan) || source.yks_alan.length === 0) return {};
  const allowed = ["TYT", "AYT", "YDT", "unsure"];
  const kept = source.yks_alan.filter((area) => allowed.includes(area));
  if (kept.length === 0) return {};
  const unique = Array.from(new Set(kept));
  return {
    yks_alan: (unique.includes("unsure")
      ? ["unsure"]
      : unique.slice(0, MAX_EXAM_AREAS)) as HocaBulClientAnswers["yks_alan"],
  };
}

export function readDraft(
  storage: StorageLike | null,
  userId: string | undefined | null,
  now = Date.now()
): HocaBulDraft | null {
  const key = draftKey(userId);
  if (!key || !userId) return null;
  const parsed = parseDraft(readJson(storage, key), userId, now);
  if (!parsed) {
    removeKey(storage, key);
    return null;
  }
  return parsed;
}

export function writeDraft(
  storage: StorageLike | null,
  draft: HocaBulDraft
): boolean {
  const key = draftKey(draft.meta.userId);
  if (!key) return false;
  return writeJson(storage, key, draft);
}

export function touchDraft(
  draft: HocaBulDraft,
  patch: Partial<Pick<HocaBulDraft, "answers" | "client" | "stepId">>,
  now = Date.now()
): HocaBulDraft {
  return {
    ...draft,
    ...patch,
    meta: { ...draft.meta, updatedAt: now },
  };
}

export function clearDraft(
  storage: StorageLike | null,
  userId: string | undefined | null
): void {
  const key = draftKey(userId);
  if (!key) return;
  removeKey(storage, key);
}

// --- Legacy /match draft ------------------------------------------------------

export interface LegacyCopyResult {
  draft: HocaBulDraft | null;
  copied: boolean;
  /** True when a previous run already handled the legacy draft. */
  alreadyAttempted: boolean;
}

/**
 * Reads the legacy /match draft once and maps the compatible answers into a new
 * hoca-bul draft.
 *
 * The legacy key is only ever read. It is never deleted, rewritten or marked,
 * so /match can still resume from it byte-for-byte until it is retired. The
 * "already attempted" flag therefore lives in hoca-bul's own data.
 */
export function copyLegacyDraft(
  storage: StorageLike | null,
  userId: string | undefined | null,
  now = Date.now()
): LegacyCopyResult {
  if (!userId) return { draft: null, copied: false, alreadyAttempted: false };

  const existing = readDraft(storage, userId, now);
  if (existing?.meta.legacyCopy) {
    return { draft: existing, copied: false, alreadyAttempted: true };
  }
  const markerKey = legacyMarkerKey(userId);
  if (!existing && markerKey && readJson(storage, markerKey)) {
    return { draft: null, copied: false, alreadyAttempted: true };
  }

  const sourceKey = legacyDraftKey(userId);
  const legacyRaw = sourceKey && storage ? storage.getItem(sourceKey) : null;
  const legacy = parseMatchingDraft(legacyRaw, now);

  const seedAnswers = legacy ? sanitizeAnswers(legacy.answers) : {};
  // The legacy numeric step index does not map onto the new order; the caller
  // recomputes the resume point from the answers instead. An in-progress
  // hoca-bul draft always wins over the older /match one.
  const copied = !existing && Object.keys(seedAnswers).length > 0;

  const draft: HocaBulDraft = {
    ...(existing ?? createDraft(userId, now)),
    answers: existing ? existing.answers : seedAnswers,
    client: existing?.client ?? {},
  };
  draft.meta = {
    ...draft.meta,
    updatedAt: now,
    legacyCopy: { attemptedAt: now, copied, sourceKeyVersion: "v1" },
  };

  const stored = writeDraft(storage, draft);
  if (!stored && markerKey) {
    writeJson(storage, markerKey, { attemptedAt: now, copied });
  }

  return { draft, copied, alreadyAttempted: false };
}
