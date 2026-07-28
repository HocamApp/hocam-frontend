import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildEntryHref,
  parseEntrySource,
  parseGoalParam,
  resolveEntryState,
} from "@/lib/hocaBulEntryState";
import {
  HOCA_BUL_DRAFT_TTL_MS,
  createDraft,
  draftKey,
  writeDraft,
} from "@/lib/hocaBulDraft";
import {
  HOCA_BUL_PREVIEW_TTL_MS,
  writePreview,
} from "@/lib/hocaBulPreviewCache";
import { buildResultEditHref } from "@/lib/hocaBulResults";
import { createMemoryStorage, type StorageLike } from "@/lib/safeStorage";
import type { MatchingPreview } from "@/types";
import type { HocaBulApiAnswers, HocaBulDraft } from "@/types/hocaBul";

const USER = "student-1";
const NOW = 1_700_000_000_000;

const completeAnswers: HocaBulApiAnswers = {
  goal: "DGS",
  stage: "ongoing",
  subject_keys: ["matematik"],
  challenges: ["foundations"],
  teaching_styles: ["question_speed"],
  availability_windows: ["weekday_evening"],
  budget_segment: "balanced",
  schema_version: 1,
};

const preview: MatchingPreview = { matches: [], candidate_count: 3 };

function seedDraft(
  local: StorageLike,
  seed: Partial<Pick<HocaBulDraft, "answers" | "client" | "stepId">>,
  now = NOW
): void {
  writeDraft(local, createDraft(USER, now, seed));
}

function resolve(
  local: StorageLike | null,
  session: StorageLike | null,
  overrides: { userId?: string | undefined; now?: number } = {}
) {
  return resolveEntryState({
    userId: "userId" in overrides ? overrides.userId : USER,
    local,
    session,
    now: overrides.now ?? NOW,
  });
}

describe("resolveEntryState", () => {
  it("stays loading until the authenticated user id is known", () => {
    const local = createMemoryStorage();
    seedDraft(local, { answers: { goal: "DGS" }, stepId: "asama" });

    assert.deepEqual(resolve(local, createMemoryStorage(), { userId: undefined }), {
      kind: "loading",
    });
  });

  it("is fresh when nothing is stored", () => {
    assert.deepEqual(resolve(createMemoryStorage(), createMemoryStorage()), {
      kind: "fresh",
    });
  });

  it("reports a resumable unfinished draft with its re-derived step", () => {
    const local = createMemoryStorage();
    seedDraft(local, {
      answers: { goal: "DGS", stage: "ongoing" },
      stepId: "dersler",
    });

    assert.deepEqual(resolve(local, createMemoryStorage()), {
      kind: "draft",
      stepId: "dersler",
      humanIndex: 3,
    });
  });

  it("re-derives a stored step that the answers no longer support", () => {
    const local = createMemoryStorage();
    // The draft claims the budget screen, but the stage was never answered.
    seedDraft(local, { answers: { goal: "DGS" }, stepId: "butce" });

    assert.deepEqual(resolve(local, createMemoryStorage()), {
      kind: "draft",
      stepId: "asama",
      humanIndex: 2,
    });
  });

  it("reports a cached result for a completed draft", () => {
    const local = createMemoryStorage();
    const session = createMemoryStorage();
    seedDraft(local, { answers: completeAnswers, stepId: "kontrol" });
    writePreview(session, USER, completeAnswers, preview, NOW);

    assert.deepEqual(resolve(local, session), { kind: "result" });
  });

  it("prefers an unfinished draft over a cached result", () => {
    const local = createMemoryStorage();
    const session = createMemoryStorage();
    seedDraft(local, {
      answers: { goal: "DGS", stage: "ongoing" },
      stepId: "dersler",
    });
    writePreview(session, USER, completeAnswers, preview, NOW);

    assert.deepEqual(resolve(local, session), {
      kind: "draft",
      stepId: "dersler",
      humanIndex: 3,
    });
  });

  it("is fresh once the draft TTL has passed", () => {
    const local = createMemoryStorage();
    seedDraft(local, {
      answers: { goal: "DGS", stage: "ongoing" },
      stepId: "dersler",
    });

    assert.deepEqual(
      resolve(local, createMemoryStorage(), {
        now: NOW + HOCA_BUL_DRAFT_TTL_MS + 1,
      }),
      { kind: "fresh" }
    );
  });

  it("is fresh when the stored draft is not valid JSON", () => {
    const local = createMemoryStorage({
      [draftKey(USER) as string]: "{not json",
    });

    assert.deepEqual(resolve(local, createMemoryStorage()), { kind: "fresh" });
  });

  it("never reads a draft written by another account", () => {
    const local = createMemoryStorage();
    writeDraft(
      local,
      createDraft("student-2", NOW, {
        answers: { goal: "DGS", stage: "ongoing" },
        stepId: "dersler",
      })
    );

    assert.deepEqual(resolve(local, createMemoryStorage()), { kind: "fresh" });
  });

  it("is fresh when the completed draft's cached result has expired", () => {
    const local = createMemoryStorage();
    const session = createMemoryStorage();
    seedDraft(local, { answers: completeAnswers, stepId: "kontrol" });
    writePreview(session, USER, completeAnswers, preview, NOW);

    assert.deepEqual(
      resolve(local, session, { now: NOW + HOCA_BUL_PREVIEW_TTL_MS + 1 }),
      { kind: "fresh" }
    );
  });

  it("is fresh when the cached result belongs to different answers", () => {
    const local = createMemoryStorage();
    const session = createMemoryStorage();
    seedDraft(local, { answers: completeAnswers, stepId: "kontrol" });
    writePreview(
      session,
      USER,
      { ...completeAnswers, budget_segment: "premium" },
      preview,
      NOW
    );

    assert.deepEqual(resolve(local, session), { kind: "fresh" });
  });

  it("is fresh when a completed draft has no cached result at all", () => {
    const local = createMemoryStorage();
    seedDraft(local, { answers: completeAnswers, stepId: "kontrol" });

    assert.deepEqual(resolve(local, createMemoryStorage()), { kind: "fresh" });
  });

  it("degrades to fresh instead of throwing when storage refuses to read", () => {
    const throwing: StorageLike = {
      getItem() {
        throw new Error("storage disabled");
      },
      setItem() {
        throw new Error("storage disabled");
      },
      removeItem() {
        throw new Error("storage disabled");
      },
    };

    assert.deepEqual(resolve(throwing, throwing), { kind: "fresh" });
  });

  it("treats a missing storage object as no stored state", () => {
    assert.deepEqual(resolve(null, null), { kind: "fresh" });
  });
});

describe("buildEntryHref", () => {
  it("sends a goal-less start to the wizard's own first question", () => {
    assert.equal(buildEntryHref({ kind: "fresh" }), "/hoca-bul?kaynak=home");
    assert.equal(
      buildEntryHref({ kind: "fresh", goal: null }),
      "/hoca-bul?kaynak=home"
    );
  });

  it("carries a chosen goal as the hedef parameter", () => {
    assert.equal(
      buildEntryHref({ kind: "fresh", goal: "YKS" }),
      "/hoca-bul?hedef=YKS&kaynak=home"
    );
    assert.equal(
      buildEntryHref({ kind: "fresh", goal: "UNDECIDED" }),
      "/hoca-bul?hedef=UNDECIDED&kaynak=home"
    );
  });

  it("continues a draft at its step", () => {
    assert.equal(
      buildEntryHref({ kind: "draft", stepId: "dersler" }),
      "/hoca-bul?adim=dersler&kaynak=home"
    );
  });

  it("links results and preference edits through their existing contracts", () => {
    assert.equal(buildEntryHref({ kind: "result" }), "/hoca-bul/sonuclar");
    assert.equal(
      buildEntryHref({ kind: "resultEdit" }),
      buildResultEditHref("kontrol")
    );
    assert.equal(
      buildEntryHref({ kind: "resultEdit" }),
      "/hoca-bul?adim=kontrol&kaynak=sonuclar"
    );
  });
});

describe("query parameter guards", () => {
  it("accepts only the two known entry sources", () => {
    assert.equal(parseEntrySource("home"), "home");
    assert.equal(parseEntrySource("sonuclar"), "sonuclar");
    assert.equal(parseEntrySource("anywhere"), null);
    assert.equal(parseEntrySource(""), null);
    assert.equal(parseEntrySource(null), null);
  });

  it("accepts only real goals", () => {
    for (const goal of ["YKS", "DGS", "KPSS", "UNDECIDED"] as const) {
      assert.equal(parseGoalParam(goal), goal);
    }
    assert.equal(parseGoalParam("LGS"), null);
    assert.equal(parseGoalParam("yks"), null);
    assert.equal(parseGoalParam(null), null);
  });
});
