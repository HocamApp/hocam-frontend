import { readDraft } from "@/lib/hocaBulDraft";
import {
  getStepById,
  isFlowComplete,
  sanitizeStepParam,
  toMatchingAnswers,
} from "@/lib/hocaBulFlow";
import { readPreview } from "@/lib/hocaBulPreviewCache";
import { buildResultEditHref } from "@/lib/hocaBulResults";
import { draftIsResumable } from "@/components/hoca-bul/wizardReducer";
import type { StorageLike } from "@/lib/safeStorage";
import type {
  HocaBulEntrySource,
  HocaBulGoal,
  HocaBulStepId,
} from "@/types/hocaBul";

/**
 * Everything the home entry card needs to decide what to say and where to go,
 * with no React, no routing and no globals: storage is injected, so the same
 * function that runs in the browser runs in a plain Node test.
 *
 * It owns no validation of its own. Whether a draft is trustworthy, whether it
 * is worth resuming, whether the flow is finished and whether a cached result
 * still matches the answers are all questions the existing modules already
 * answer, and they are asked here rather than re-implemented.
 */

export type HocaBulEntryState =
  | { kind: "loading" }
  | { kind: "fresh" }
  | { kind: "draft"; stepId: HocaBulStepId; humanIndex: number }
  | { kind: "result" };

export interface ResolveEntryStateArgs {
  userId: string | undefined;
  local: StorageLike | null;
  session: StorageLike | null;
  now?: number;
}

/**
 * Resolution order. A draft deliberately wins over a cached result: an
 * unfinished answer set is the more recent intent, and offering "see your
 * matches" over it would discard work the student can still finish.
 */
export function resolveEntryState({
  userId,
  local,
  session,
  now = Date.now(),
}: ResolveEntryStateArgs): HocaBulEntryState {
  if (!userId) return { kind: "loading" };

  // Expired, corrupt and cross-user drafts are already rejected in here.
  const draft = readDraft(local, userId, now);
  if (!draft) return { kind: "fresh" };

  const { answers, client } = draft;
  const complete = isFlowComplete(answers.goal, answers, client);

  if (draftIsResumable(draft) && !complete) {
    // The stored step can be stale, so the resume point is re-derived the same
    // way the wizard itself derives it.
    const stepId = sanitizeStepParam(draft.stepId, answers.goal, answers, client);
    return {
      kind: "draft",
      stepId,
      humanIndex: getStepById(answers.goal, stepId)?.humanIndex ?? 1,
    };
  }

  if (complete) {
    const payload = toMatchingAnswers(answers);
    // readPreview re-checks the TTL, the user scope and the canonical answers,
    // so a hit here means the cached result really belongs to this answer set.
    if (payload && readPreview(session, userId, payload, now)) {
      return { kind: "result" };
    }
  }

  return { kind: "fresh" };
}

// --- URL contracts -------------------------------------------------------------

const GOALS: readonly HocaBulGoal[] = ["YKS", "DGS", "KPSS", "UNDECIDED"];
const ENTRY_SOURCES: readonly HocaBulEntrySource[] = ["sonuclar", "home"];

/** Anything outside the closed set is treated as no source at all. */
export function parseEntrySource(
  raw: string | null | undefined
): HocaBulEntrySource | null {
  if (!raw) return null;
  return ENTRY_SOURCES.includes(raw as HocaBulEntrySource)
    ? (raw as HocaBulEntrySource)
    : null;
}

/** Guards ?hedef= against the goal enum; an unknown value prefills nothing. */
export function parseGoalParam(
  raw: string | null | undefined
): HocaBulGoal | null {
  if (!raw) return null;
  return GOALS.includes(raw as HocaBulGoal) ? (raw as HocaBulGoal) : null;
}

export type HocaBulEntryIntent =
  | { kind: "fresh"; goal?: HocaBulGoal | null }
  | { kind: "draft"; stepId: HocaBulStepId }
  | { kind: "result" }
  | { kind: "resultEdit" };

/** The single place home-card destinations are built, so no caller hand-writes one. */
export function buildEntryHref(intent: HocaBulEntryIntent): string {
  switch (intent.kind) {
    case "fresh": {
      const params = new URLSearchParams();
      if (intent.goal) params.set("hedef", intent.goal);
      params.set("kaynak", "home");
      return `/hoca-bul?${params.toString()}`;
    }
    case "draft": {
      const params = new URLSearchParams({
        adim: intent.stepId,
        kaynak: "home",
      });
      return `/hoca-bul?${params.toString()}`;
    }
    case "result":
      return "/hoca-bul/sonuclar";
    case "resultEdit":
      // The results route's own contract; reused rather than restated.
      return buildResultEditHref("kontrol");
  }
}
