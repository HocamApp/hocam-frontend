import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  HOCA_BUL_DRAFT_TTL_MS,
  clearDraft,
  createDraft,
  draftKey,
  readDraft,
  touchDraft,
  writeDraft,
} from "./hocaBulDraft";
import { createMemoryStorage, type StorageLike } from "./safeStorage";

const USER = "student-1";
const OTHER_USER = "student-2";
const NOW = 1_700_000_000_000;

function seededStorage(): StorageLike & { snapshot(): Record<string, string> } {
  return createMemoryStorage();
}

describe("draft keys", () => {
  it("returns no key until the user id is known, so nothing is read before auth", () => {
    assert.equal(draftKey(undefined), null);
    assert.equal(draftKey(""), null);
    assert.equal(draftKey(USER), `hocam:hoca-bul-draft:v1:${USER}`);
  });
});

describe("draft round trip", () => {
  it("writes and reads back the answers and the current step", () => {
    const storage = seededStorage();
    const draft = touchDraft(
      createDraft(USER, NOW),
      { answers: { goal: "DGS" }, stepId: "asama" },
      NOW
    );
    assert.ok(writeDraft(storage, draft));

    const read = readDraft(storage, USER, NOW + 1000);
    assert.equal(read?.stepId, "asama");
    assert.equal(read?.answers.goal, "DGS");
  });

  it("rejects a draft past its seven-day life and clears it", () => {
    const storage = seededStorage();
    writeDraft(storage, createDraft(USER, NOW));

    assert.ok(readDraft(storage, USER, NOW + HOCA_BUL_DRAFT_TTL_MS - 1));
    assert.equal(readDraft(storage, USER, NOW + HOCA_BUL_DRAFT_TTL_MS), null);
    assert.equal(storage.getItem(draftKey(USER) as string), null);
  });

  it("rejects corrupted JSON and an unknown schema version", () => {
    const storage = seededStorage();
    storage.setItem(draftKey(USER) as string, "{not json");
    assert.equal(readDraft(storage, USER, NOW), null);

    storage.setItem(
      draftKey(USER) as string,
      JSON.stringify({ ...createDraft(USER, NOW), meta: { schemaVersion: 2, userId: USER } })
    );
    assert.equal(readDraft(storage, USER, NOW), null);
  });

  it("never restores another account's draft", () => {
    const storage = seededStorage();
    const draft = touchDraft(createDraft(USER, NOW), { answers: { goal: "KPSS" } }, NOW);
    // Same physical key shape, different owner recorded inside.
    storage.setItem(draftKey(OTHER_USER) as string, JSON.stringify(draft));
    assert.equal(readDraft(storage, OTHER_USER, NOW), null);
  });

  it("drops unknown enum values and truncates oversized selections", () => {
    const storage = seededStorage();
    storage.setItem(
      draftKey(USER) as string,
      JSON.stringify({
        ...createDraft(USER, NOW),
        answers: {
          goal: "MARS",
          challenges: ["foundations", "not_a_challenge", "consistency", "speed_accuracy"],
          availability_windows: ["flexible", "weekday_day"],
          subject_keys: ["a", "b", "c", "d"],
        },
      })
    );
    const read = readDraft(storage, USER, NOW);
    assert.equal(read?.answers.goal, undefined);
    assert.deepEqual(read?.answers.challenges, ["foundations", "consistency"]);
    // "flexible" cannot coexist with a concrete window server-side.
    assert.deepEqual(read?.answers.availability_windows, ["flexible"]);
    assert.equal(read?.answers.subject_keys?.length, 3);
  });

  it("deduplicates every stored multi-select before enforcing limits", () => {
    const storage = seededStorage();
    storage.setItem(
      draftKey(USER) as string,
      JSON.stringify({
        ...createDraft(USER, NOW),
        answers: {
          subject_keys: ["matematik", "matematik", "fizik", "kimya"],
          challenges: ["foundations", "foundations", "consistency"],
          teaching_styles: ["question_speed", "question_speed", "high_target"],
          availability_windows: ["weekday_day", "weekday_day", "weekend_day"],
        },
      })
    );
    const read = readDraft(storage, USER, NOW);
    assert.deepEqual(read?.answers.subject_keys, ["matematik", "fizik", "kimya"]);
    assert.deepEqual(read?.answers.challenges, ["foundations", "consistency"]);
    assert.deepEqual(read?.answers.teaching_styles, ["question_speed", "high_target"]);
    assert.deepEqual(read?.answers.availability_windows, ["weekday_day", "weekend_day"]);
  });

  it("normalizes unsure as exclusive and caps concrete stored YKS areas", () => {
    const storage = seededStorage();
    storage.setItem(
      draftKey(USER) as string,
      JSON.stringify({
        ...createDraft(USER, NOW),
        client: { yks_alan: ["TYT", "TYT", "AYT", "YDT", "unsure"] },
      })
    );
    assert.deepEqual(readDraft(storage, USER, NOW)?.client.yks_alan, ["unsure"]);

    storage.setItem(
      draftKey(USER) as string,
      JSON.stringify({
        ...createDraft(USER, NOW),
        client: { yks_alan: ["TYT", "TYT", "AYT", "YDT"] },
      })
    );
    assert.deepEqual(readDraft(storage, USER, NOW)?.client.yks_alan, ["TYT", "AYT", "YDT"]);
  });

  it("retains every valid P3B answer in a complete resumable draft", () => {
    const storage = seededStorage();
    const complete = createDraft(USER, NOW, {
      answers: {
        goal: "DGS",
        stage: "ongoing",
        subject_keys: ["matematik", "fizik"],
        challenges: ["foundations", "consistency"],
        teaching_styles: ["question_speed", "high_target"],
        availability_windows: ["weekday_evening", "weekend_day"],
        budget_segment: "balanced",
      },
      stepId: "kontrol",
    });
    assert.ok(writeDraft(storage, complete));
    const read = readDraft(storage, USER, NOW);
    assert.deepEqual(read?.answers, complete.answers);
    assert.equal(read?.stepId, "kontrol");
  });

  it("clears only its own key", () => {
    const storage = seededStorage();
    writeDraft(storage, createDraft(USER, NOW));
    storage.setItem("unrelated-key", "unrelated-value");
    clearDraft(storage, USER);
    assert.equal(storage.getItem(draftKey(USER) as string), null);
    assert.equal(storage.getItem("unrelated-key"), "unrelated-value");
  });
});
