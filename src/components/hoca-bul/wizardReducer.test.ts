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

const completeAnswers = {
  goal: "YKS" as const,
  stage: "grade_12",
  subject_keys: ["matematik"],
  challenges: ["foundations" as const],
  teaching_styles: ["question_speed" as const],
  availability_windows: ["weekday_evening" as const],
  budget_segment: "balanced" as const,
};

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

  it("restores an explicit result-edit draft without interrupting for resume", () => {
    const state = wizardReducer(initialWizardState, {
      type: "hydrate",
      draft: draft({
        answers: completeAnswers,
        client: { yks_alan: ["TYT"] },
        stepId: "kontrol",
      }),
      urlStepId: "butce",
      skipResume: true,
    });

    assert.equal(state.pendingResume, null);
    assert.equal(state.stepId, "butce");
    assert.deepEqual(state.answers, completeAnswers);
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

describe("goal prefill", () => {
  it("answers the goal and moves past the question that was already asked", () => {
    const state = wizardReducer(initialWizardState, {
      type: "hydrate",
      draft: null,
      urlStepId: null,
      prefillGoal: "DGS",
    });

    assert.equal(state.phase, "ready");
    assert.equal(state.answers.goal, "DGS");
    assert.notEqual(state.stepId, "hedef");
    assert.equal(state.stepId, "asama");
  });

  it("derives the next step from the flow rather than assuming one", () => {
    // A non-resumable draft that already holds a stage: with the same goal
    // re-applied nothing is invalidated, so the first gap is further along.
    const state = wizardReducer(initialWizardState, {
      type: "hydrate",
      draft: draft({ answers: { goal: "DGS", stage: "ongoing" }, stepId: "hedef" }),
      urlStepId: null,
      prefillGoal: "DGS",
    });

    assert.equal(state.stepId, "dersler");
  });

  it("applies the change through the invalidation rules", () => {
    const state = wizardReducer(initialWizardState, {
      type: "hydrate",
      draft: draft({
        answers: { goal: "DGS", stage: "ongoing", subject_keys: ["matematik"], budget_segment: "balanced" },
        client: {},
        stepId: "hedef",
      }),
      urlStepId: null,
      prefillGoal: "KPSS",
    });

    assert.equal(state.answers.goal, "KPSS");
    // Changing the goal drops what the goal decides, exactly as a tap would.
    assert.equal(state.answers.stage, undefined);
    assert.equal(state.answers.subject_keys, undefined);
    assert.equal(state.answers.budget_segment, undefined);
    assert.equal(state.stepId, "asama");
  });

  it("adds the YKS-only step to the derived resume point", () => {
    const state = wizardReducer(initialWizardState, {
      type: "hydrate",
      draft: null,
      urlStepId: null,
      prefillGoal: "YKS",
    });

    assert.equal(currentVisibleStep(state).total, 9);
    assert.equal(state.stepId, "asama");
  });

  it("never overwrites a resumable draft, prompt or not", () => {
    const resumable = draft({
      answers: { goal: "DGS", stage: "ongoing" },
      client: {},
      stepId: "dersler",
    });

    const prompted = wizardReducer(initialWizardState, {
      type: "hydrate",
      draft: resumable,
      urlStepId: null,
      prefillGoal: "KPSS",
    });
    assert.ok(prompted.pendingResume);
    assert.deepEqual(prompted.answers, {});

    const skipped = wizardReducer(initialWizardState, {
      type: "hydrate",
      draft: resumable,
      urlStepId: null,
      skipResume: true,
      prefillGoal: "KPSS",
    });
    assert.equal(skipped.pendingResume, null);
    assert.equal(skipped.answers.goal, "DGS");
    assert.equal(skipped.answers.stage, "ongoing");
    assert.equal(skipped.stepId, "dersler");
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

describe("review editing", () => {
  const review = () =>
    ready({
      answers: completeAnswers,
      client: { yks_alan: ["TYT"] },
      stepId: "kontrol",
    });

  it("opens every visible answer step without changing answers", () => {
    for (const stepId of [
      "hedef",
      "asama",
      "yks_alan",
      "dersler",
      "zorluk",
      "hoca_yaklasimi",
      "uygun_zamanlar",
      "butce",
    ] as const) {
      const state = wizardReducer(review(), { type: "editFromReview", stepId });
      assert.equal(state.stepId, stepId);
      assert.equal(state.reviewEditActive, true);
      assert.deepEqual(state.answers, completeAnswers);
    }
  });

  it("rejects edit entry outside review and for a hidden branch step", () => {
    const ordinary = ready({ answers: completeAnswers, stepId: "butce" });
    assert.equal(
      wizardReducer(ordinary, { type: "editFromReview", stepId: "hedef" }),
      ordinary
    );
    const dgsReview = review();
    dgsReview.answers = { ...completeAnswers, goal: "DGS" };
    assert.equal(
      wizardReducer(dgsReview, { type: "editFromReview", stepId: "yks_alan" }),
      dgsReview
    );
  });

  it("returns a valid leaf edit directly to review", () => {
    const editing = wizardReducer(review(), {
      type: "editFromReview",
      stepId: "zorluk",
    });
    const returned = wizardReducer(editing, { type: "next" });
    assert.equal(returned.stepId, "kontrol");
    assert.equal(returned.reviewEditActive, false);
  });

  it("jumps from a subject edit to the invalidated budget only", () => {
    let state = wizardReducer(review(), { type: "editFromReview", stepId: "dersler" });
    state = wizardReducer(state, {
      type: "answer",
      change: { field: "subject_keys", value: ["matematik", "edebiyat"] },
    });
    state = wizardReducer(state, { type: "next" });
    assert.equal(state.stepId, "butce");
    assert.equal(state.reviewEditActive, true);
  });

  it("uses the first gap after a goal edit while preserving independent answers", () => {
    let state = wizardReducer(review(), { type: "editFromReview", stepId: "hedef" });
    state = wizardReducer(state, {
      type: "answer",
      change: { field: "goal", value: "DGS" },
    });
    state = wizardReducer(state, { type: "next" });
    assert.equal(state.stepId, "asama");
    assert.deepEqual(state.answers.challenges, ["foundations"]);
    assert.deepEqual(state.answers.teaching_styles, ["question_speed"]);
    assert.equal(state.reviewEditActive, true);
  });

  it("cancels edit intent on back, URL return, restart, and hydration", () => {
    const editing = wizardReducer(review(), { type: "editFromReview", stepId: "butce" });
    assert.equal(wizardReducer(editing, { type: "back" }).reviewEditActive, false);
    assert.equal(
      wizardReducer(editing, { type: "syncUrlStep", stepId: "kontrol" }).reviewEditActive,
      false
    );
    assert.equal(wizardReducer(editing, { type: "restart" }).reviewEditActive, false);
    assert.equal(
      wizardReducer(editing, { type: "hydrate", draft: null, urlStepId: null })
        .reviewEditActive,
      false
    );
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
