import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  HOCA_BUL_PREVIEW_TTL_MS,
  canonicalizeAnswers,
  getOrFetchPreview,
  hashAnswers,
  previewCacheKey,
  readPreview,
  resetInFlightPreviews,
  writePreview,
} from "./hocaBulPreviewCache";
import { createMemoryStorage } from "./safeStorage";
import type { MatchingPreview } from "@/types";
import type { HocaBulApiAnswers } from "@/types/hocaBul";

const USER = "student-1";
const NOW = 1_700_000_000_000;

const answers: HocaBulApiAnswers = {
  goal: "YKS",
  stage: "grade_12",
  subject_keys: ["matematik", "fizik"],
  challenges: ["foundations", "consistency"],
  teaching_styles: ["question_speed"],
  availability_windows: ["weekday_evening", "weekend_day"],
  budget_segment: "balanced",
  schema_version: 1,
};

const preview: MatchingPreview = { matches: [], candidate_count: 7 };

afterEach(() => {
  resetInFlightPreviews();
});

describe("canonicalization", () => {
  it("emits the request fields in a fixed order", () => {
    assert.equal(
      canonicalizeAnswers(answers),
      JSON.stringify({
        goal: "YKS",
        stage: "grade_12",
        subject_keys: ["fizik", "matematik"],
        challenges: ["consistency", "foundations"],
        teaching_styles: ["question_speed"],
        availability_windows: ["weekday_evening", "weekend_day"],
        budget_segment: "balanced",
        schema_version: 1,
      })
    );
  });

  it("treats multi-select answers as sets, so selection order is not a cache miss", () => {
    const reordered: HocaBulApiAnswers = {
      ...answers,
      subject_keys: ["fizik", "matematik"],
      challenges: ["consistency", "foundations"],
    };
    assert.equal(hashAnswers(answers), hashAnswers(reordered));
  });

  it("ignores everything that is not part of the request identity", () => {
    const polluted = {
      ...answers,
      yks_alan: ["TYT"],
      stepId: "butce",
      updatedAt: NOW,
      token: "secret",
    } as unknown as HocaBulApiAnswers;
    assert.equal(hashAnswers(polluted), hashAnswers(answers));
    assert.equal(canonicalizeAnswers(polluted).includes("secret"), false);
    assert.equal(canonicalizeAnswers(polluted).includes("TYT"), false);
  });

  it("changes the hash when a real answer changes", () => {
    assert.notEqual(
      hashAnswers(answers),
      hashAnswers({ ...answers, budget_segment: "premium" })
    );
  });

  it("is stable across calls", () => {
    assert.equal(hashAnswers(answers), hashAnswers({ ...answers }));
  });
});

describe("cache entries", () => {
  it("round-trips a preview within its fifteen-minute life", () => {
    const storage = createMemoryStorage();
    assert.ok(writePreview(storage, USER, answers, preview, NOW));
    assert.deepEqual(readPreview(storage, USER, answers, NOW + 1000), preview);
    assert.deepEqual(
      readPreview(storage, USER, answers, NOW + HOCA_BUL_PREVIEW_TTL_MS),
      preview
    );
    assert.equal(
      readPreview(storage, USER, answers, NOW + HOCA_BUL_PREVIEW_TTL_MS + 1),
      null
    );
  });

  it("rejects an entry stored for a different account", () => {
    const storage = createMemoryStorage();
    writePreview(storage, USER, answers, preview, NOW);
    assert.equal(readPreview(storage, "student-2", answers, NOW), null);
  });

  it("rejects a malformed response and removes the entry", () => {
    const storage = createMemoryStorage();
    const key = previewCacheKey(USER, hashAnswers(answers));
    storage.setItem(
      key,
      JSON.stringify({
        schemaVersion: 1,
        userId: USER,
        answerHash: hashAnswers(answers),
        canonical: canonicalizeAnswers(answers),
        createdAt: NOW,
        response: { candidate_count: 3 },
      })
    );
    assert.equal(readPreview(storage, USER, answers, NOW), null);
    assert.equal(storage.getItem(key), null);
  });

  it("rejects an entry whose canonical answers do not match the key", () => {
    const storage = createMemoryStorage();
    storage.setItem(
      previewCacheKey(USER, hashAnswers(answers)),
      JSON.stringify({
        schemaVersion: 1,
        userId: USER,
        answerHash: hashAnswers(answers),
        canonical: "{\"goal\":\"DGS\"}",
        createdAt: NOW,
        response: preview,
      })
    );
    assert.equal(readPreview(storage, USER, answers, NOW), null);
  });

  it("survives unusable storage by reporting a miss", () => {
    assert.equal(readPreview(null, USER, answers, NOW), null);
    assert.equal(writePreview(null, USER, answers, preview, NOW), false);
  });
});

describe("getOrFetchPreview", () => {
  it("serves a cached preview without calling the endpoint", async () => {
    const storage = createMemoryStorage();
    writePreview(storage, USER, answers, preview, NOW);
    let calls = 0;

    const result = await getOrFetchPreview({
      storage,
      userId: USER,
      answers,
      now: NOW,
      fetcher: async () => {
        calls += 1;
        return preview;
      },
    });

    assert.equal(calls, 0);
    assert.equal(result.servedFromCache, true);
  });

  it("fetches and caches on a miss", async () => {
    const storage = createMemoryStorage();
    let calls = 0;
    const result = await getOrFetchPreview({
      storage,
      userId: USER,
      answers,
      now: NOW,
      fetcher: async () => {
        calls += 1;
        return preview;
      },
    });

    assert.equal(calls, 1);
    assert.equal(result.servedFromCache, false);
    assert.deepEqual(readPreview(storage, USER, answers), preview);
  });

  it("bypasses a valid entry on an explicit retry and overwrites it", async () => {
    const storage = createMemoryStorage();
    writePreview(storage, USER, answers, preview, NOW);
    const fresh: MatchingPreview = { matches: [], candidate_count: 11 };
    let calls = 0;

    const result = await getOrFetchPreview({
      storage,
      userId: USER,
      answers,
      now: NOW,
      bypassCache: true,
      fetcher: async () => {
        calls += 1;
        return fresh;
      },
    });

    assert.equal(calls, 1);
    assert.equal(result.servedFromCache, false);
    assert.deepEqual(readPreview(storage, USER, answers), fresh);
  });

  it("issues one request when two callers ask at the same time", async () => {
    const storage = createMemoryStorage();
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return preview;
    };

    const [first, second] = await Promise.all([
      getOrFetchPreview({ storage, userId: USER, answers, now: NOW, fetcher }),
      getOrFetchPreview({ storage, userId: USER, answers, now: NOW, fetcher }),
    ]);

    assert.equal(calls, 1);
    assert.deepEqual(first.preview, preview);
    assert.deepEqual(second.preview, preview);
  });
});
