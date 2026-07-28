import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  currentVisibleStep,
  draftIsResumable,
  initialWizardState,
  isFirstStep,
  wizardReducer,
  type WizardState,
} from "./wizardReducer";
import type { HocaBulDraft } from "@/types/hocaBul";

const NOW = 1_700_000_000_000;

function draft(overrides: Partial<HocaBulDraft> = {}): HocaBulDraft {
  return {
    meta: { schemaVersion: 1, userId: "student-1", createdAt: NOW, updatedAt: NOW },
    answers: { goal: "YKS", stage: "grade_12" },
    client: { yks_alan: ["TYT"] },
    stepId: "dersler",
    expiresAt: NOW + 1000,
    ...overrides,
  };
}

function ready(overrides: Partial<WizardState> = {}): WizardState {
  return { ...initialWizardState, phase: "ready", ...overrides };
}

describe("hydration", () => {
  it("starts at the first step when there is no draft", () => {
    const state = wizardReducer(initialWizardState, {
      type: "hydrate",
      draft: null,
      urlStepId: null,
    });
    assert.equal(state.phase, "ready");
    assert.equal(state.stepId, "hedef");
    assert.equal(state.pendingResume, null);
  });

  it("asks before restoring a draft that holds progress", () => {
    const state = wizardReducer(initialWizardState, {
      type: "hydrate",
      draft: draft(),
      urlStepId: null,
    });
    assert.equal(state.phase, "ready");
    assert.ok(state.pendingResume);
    // Answers stay untouched until the student chooses.
    assert.deepEqual(state.answers, {});
  });

  it("does not interrupt for a draft that never got past the first step", () => {
    const untouched = draft({ stepId: "hedef", answers: {}, client: {} });
    assert.equal(draftIsResumable(untouched), false);
    const state = wizardReducer(initialWizardState, {
      type: "hydrate",
      draft: untouched,
      urlStepId: null,
    });
    assert.equal(state.pendingResume, null);
    assert.equal(state.stepId, "hedef");
  });

  it("ignores a URL step the answers do not justify", () => {
    const state = wizardReducer(initialWizardState, {
      type: "hydrate",
      draft: null,
      urlStepId: "butce",
    });
    assert.equal(state.stepId, "hedef");
  });
});

describe("resume and restart", () => {
  it("restores the answers and lands on a step the answers support", () => {
    const withPrompt = wizardReducer(initialWizardState, {
      type: "hydrate",
      draft: draft(),
      urlStepId: null,
    });
    const resumed = wizardReducer(withPrompt, { type: "resume" });

    assert.equal(resumed.pendingResume, null);
    assert.equal(resumed.answers.goal, "YKS");
    assert.deepEqual(resumed.client.yks_alan, ["TYT"]);
    // The stored step was "dersler" but no subjects are answered yet, so the
    // stale value is corrected rather than trusted.
    assert.equal(resumed.stepId, "dersler");
  });

  it("sanitizes a stored step that is out of reach", () => {
    const withPrompt = wizardReducer(initialWizardState, {
      type: "hydrate",
      draft: draft({ stepId: "butce", client: {} }),
      urlStepId: null,
    });
    const resumed = wizardReducer(withPrompt, { type: "resume" });
    assert.equal(resumed.stepId, "yks_alan");
  });

  it("restart returns to a clean first step", () => {
    const dirty = ready({
      answers: { goal: "YKS", stage: "grade_12" },
      client: { yks_alan: ["TYT"] },
      stepId: "dersler",
    });
    const restarted = wizardReducer(dirty, { type: "restart" });
    assert.equal(restarted.stepId, "hedef");
    assert.deepEqual(restarted.answers, {});
    assert.deepEqual(restarted.client, {});
    assert.equal(restarted.phase, "ready");
  });
});

describe("navigation", () => {
  it("moves hedef to asama and only then branches for YKS", () => {
    let state = ready({ answers: { goal: "YKS" } });
    state = wizardReducer(state, { type: "next" });
    assert.equal(state.stepId, "asama");
    state = wizardReducer(state, { type: "next" });
    assert.equal(state.stepId, "yks_alan");
    state = wizardReducer(state, { type: "next" });
    assert.equal(state.stepId, "dersler");
  });

  it("skips the area screen for the other goals", () => {
    let state = ready({ answers: { goal: "DGS" }, stepId: "asama" });
    state = wizardReducer(state, { type: "next" });
    assert.equal(state.stepId, "dersler");
  });

  it("records the direction so the panel animates the right way", () => {
    const forward = wizardReducer(ready({ answers: { goal: "DGS" } }), { type: "next" });
    assert.equal(forward.direction, 1);
    const backward = wizardReducer(forward, { type: "back" });
    assert.equal(backward.direction, -1);
    assert.equal(backward.stepId, "hedef");
  });

  it("treats the first step as the exit point", () => {
    assert.equal(isFirstStep(ready()), true);
    assert.equal(isFirstStep(ready({ stepId: "asama" })), false);
    // Back on the first step is a no-op for the reducer; the container routes away.
    const state = wizardReducer(ready(), { type: "back" });
    assert.equal(state.stepId, "hedef");
  });

  it("does not move for a step outside the current branch", () => {
    const state = wizardReducer(ready({ answers: { goal: "DGS" } }), {
      type: "goToStep",
      stepId: "yks_alan",
    });
    assert.equal(state.stepId, "hedef");
  });
});

describe("progress totals", () => {
  it("counts nine steps for YKS and eight for the others", () => {
    assert.equal(currentVisibleStep(ready({ answers: { goal: "YKS" } })).total, 9);
    for (const goal of ["DGS", "KPSS", "UNDECIDED"] as const) {
      assert.equal(currentVisibleStep(ready({ answers: { goal } })).total, 8);
    }
  });

  it("numbers the area screen third for YKS", () => {
    const state = ready({ answers: { goal: "YKS" }, stepId: "yks_alan" });
    assert.equal(currentVisibleStep(state).humanIndex, 3);
  });
});

describe("URL synchronisation", () => {
  it("accepts a step the answers already reach", () => {
    const state = wizardReducer(
      ready({ answers: { goal: "DGS" }, stepId: "asama" }),
      { type: "syncUrlStep", stepId: "hedef" }
    );
    assert.equal(state.stepId, "hedef");
    assert.equal(state.direction, -1);
  });

  it("sanitizes an unknown or out-of-branch value instead of trusting it", () => {
    const base = ready({ answers: { goal: "DGS" }, stepId: "asama" });
    assert.equal(wizardReducer(base, { type: "syncUrlStep", stepId: "🙂" }).stepId, "asama");
    assert.equal(
      wizardReducer(base, { type: "syncUrlStep", stepId: "yks_alan" }).stepId,
      "asama"
    );
    assert.equal(wizardReducer(base, { type: "syncUrlStep", stepId: null }).stepId, "asama");
  });

  it("is a no-op when the URL already matches", () => {
    const base = ready({ answers: { goal: "DGS" }, stepId: "asama" });
    assert.equal(wizardReducer(base, { type: "syncUrlStep", stepId: "asama" }), base);
  });
});

describe("answers", () => {
  it("moves off a step the new goal removed", () => {
    const state = wizardReducer(
      ready({ answers: { goal: "YKS", stage: "grade_12" }, client: { yks_alan: ["TYT"] }, stepId: "yks_alan" }),
      { type: "answer", change: { field: "goal", value: "DGS" } }
    );
    assert.notEqual(state.stepId, "yks_alan");
    assert.equal(state.answers.stage, undefined);
    assert.equal(state.client.yks_alan, undefined);
  });

  it("keeps the student in place when the step survives the change", () => {
    const state = wizardReducer(
      ready({ answers: { goal: "DGS" }, stepId: "hedef" }),
      { type: "answer", change: { field: "goal", value: "KPSS" } }
    );
    assert.equal(state.stepId, "hedef");
    assert.equal(state.answers.goal, "KPSS");
  });

  it("records the answer that caused invalidation and clears metadata on a no-removal answer", () => {
    const base = ready({
      answers: {
        goal: "YKS",
        stage: "grade_12",
        subject_keys: ["matematik"],
        budget_segment: "balanced",
      },
      client: { yks_alan: ["TYT"] },
    });
    const changed = wizardReducer(base, {
      type: "answer",
      change: { field: "goal", value: "DGS" },
    });
    assert.equal(changed.invalidationSource, "goal");
    assert.ok(changed.cleared.includes("subject_keys"));

    const quiet = wizardReducer(changed, {
      type: "answer",
      change: { field: "challenges", value: ["foundations"] },
    });
    assert.deepEqual(quiet.cleared, []);
    assert.equal(quiet.invalidationSource, null);
  });

  it("records fresh-option pruning and clears feedback on navigation", () => {
    const pruned = wizardReducer(ready(), {
      type: "prune",
      answers: { goal: "DGS", subject_keys: ["matematik"] },
      client: {},
      dropped: ["subject_keys", "budget_segment"],
    });
    assert.deepEqual(pruned.cleared, ["subject_keys", "budget_segment"]);
    assert.equal(pruned.invalidationSource, "options");

    const navigated = wizardReducer(pruned, { type: "goToStep", stepId: "hedef" });
    assert.deepEqual(navigated.cleared, []);
    assert.equal(navigated.invalidationSource, null);
  });

  it("distinguishes YKS-area and subject invalidation sources", () => {
    const areaChanged = wizardReducer(
      ready({
        answers: {
          goal: "YKS",
          subject_keys: ["matematik", "ingilizce"],
          budget_segment: "balanced",
        },
        client: { yks_alan: ["TYT", "YDT"] },
      }),
      {
        type: "answer",
        change: { field: "yks_alan", value: ["TYT"] },
        subjects: [
          { key: "matematik", label: "Matematik", subject_ids: ["1"], exam_types: ["TYT"], tutor_count: 2 },
          { key: "ingilizce", label: "İngilizce", subject_ids: ["2"], exam_types: ["YDT"], tutor_count: 2 },
        ],
      }
    );
    assert.equal(areaChanged.invalidationSource, "yks_alan");
    assert.deepEqual(areaChanged.cleared.sort(), ["budget_segment", "subject_keys"]);

    const subjectsChanged = wizardReducer(
      ready({ answers: { subject_keys: ["matematik"], budget_segment: "balanced" } }),
      {
        type: "answer",
        change: { field: "subject_keys", value: ["matematik", "fizik"] },
      }
    );
    assert.equal(subjectsChanged.invalidationSource, "subject_keys");
    assert.deepEqual(subjectsChanged.cleared, ["budget_segment"]);
  });
});
