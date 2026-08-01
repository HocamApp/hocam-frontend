import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MATCHING_ANSWER_KEYS,
  applyAnswerChange,
  getFirstUnansweredStepId,
  getValidatedMatchingAnswers,
  getNextStepId,
  getPreviousStepId,
  getStepTotal,
  getVisibleSteps,
  isFlowComplete,
  pruneAnswersAgainstOptions,
  pruneSubjectsForAreas,
  sanitizeStepParam,
  toMatchingAnswers,
  toggleAvailability,
  toggleExamArea,
  toggleWithLimit,
  validateStep,
} from "./hocaBulFlow";
import type { MatchSubjectOption, MatchingOptions } from "@/types";
import type { HocaBulApiAnswersDraft } from "@/types/hocaBul";

const subjects: MatchSubjectOption[] = [
  { key: "matematik", label: "Matematik", subject_ids: ["1"], exam_types: ["TYT", "AYT"], tutor_count: 12 },
  { key: "edebiyat", label: "Edebiyat", subject_ids: ["2"], exam_types: ["AYT"], tutor_count: 4 },
  { key: "ingilizce", label: "İngilizce", subject_ids: ["3"], exam_types: ["YDT"], tutor_count: 3 },
];

const completeAnswers: HocaBulApiAnswersDraft = {
  goal: "DGS",
  stage: "ongoing",
  subject_keys: ["matematik"],
  challenges: ["foundations"],
  teaching_styles: ["question_speed"],
  availability_windows: ["weekday_evening"],
  budget_segment: "balanced",
};

const completionOptions: MatchingOptions = {
  goals: [
    { value: "YKS", label: "YKS" },
    { value: "DGS", label: "DGS" },
  ],
  stages: {
    YKS: [{ value: "grade_12", label: "12. sınıf" }],
    DGS: [{ value: "ongoing", label: "Bir süredir hazırlanıyorum" }],
    KPSS: [],
    UNDECIDED: [],
  },
  subjects,
  budget_ranges: [
    { id: "balanced", label: "Dengeli", min: 400, max: 700 },
  ],
};

describe("step order", () => {
  it("gives DGS, KPSS and UNDECIDED eight steps without the YKS area screen", () => {
    for (const goal of ["DGS", "KPSS", "UNDECIDED"] as const) {
      const ids = getVisibleSteps(goal).map((step) => step.id);
      assert.deepEqual(ids, [
        "hedef",
        "asama",
        "dersler",
        "zorluk",
        "hoca_yaklasimi",
        "uygun_zamanlar",
        "butce",
        "kontrol",
      ]);
      assert.equal(getStepTotal(goal), 8);
    }
  });

  it("gives YKS nine steps with the area screen third", () => {
    const ids = getVisibleSteps("YKS").map((step) => step.id);
    assert.deepEqual(ids, [
      "hedef",
      "asama",
      "yks_alan",
      "dersler",
      "zorluk",
      "hoca_yaklasimi",
      "uygun_zamanlar",
      "butce",
      "kontrol",
    ]);
    assert.equal(getStepTotal("YKS"), 9);
    assert.equal(getVisibleSteps("YKS")[2].humanIndex, 3);
  });

  it("reports the same total on every step of a branch", () => {
    for (const step of getVisibleSteps("YKS")) assert.equal(step.total, 9);
    for (const step of getVisibleSteps("KPSS")) assert.equal(step.total, 8);
  });
});

describe("transitions", () => {
  it("always goes from hedef to asama, whatever the goal", () => {
    for (const goal of ["YKS", "DGS", "KPSS", "UNDECIDED"] as const) {
      assert.equal(getNextStepId(goal, "hedef"), "asama");
    }
  });

  it("branches when leaving asama, not when leaving hedef", () => {
    assert.equal(getNextStepId("YKS", "asama"), "yks_alan");
    assert.equal(getNextStepId("DGS", "asama"), "dersler");
    assert.equal(getNextStepId("KPSS", "asama"), "dersler");
    assert.equal(getNextStepId("UNDECIDED", "asama"), "dersler");
  });

  it("goes from the YKS area screen to the subjects screen", () => {
    assert.equal(getNextStepId("YKS", "yks_alan"), "dersler");
  });

  it("submits from the review step and exits before the first step", () => {
    assert.equal(getNextStepId("DGS", "kontrol"), "submit");
    assert.equal(getPreviousStepId("DGS", "hedef"), null);
    assert.equal(getPreviousStepId("YKS", "dersler"), "yks_alan");
    assert.equal(getPreviousStepId("DGS", "dersler"), "asama");
  });
});

describe("resume point and URL sanitization", () => {
  it("returns the first step for empty answers and the review step when complete", () => {
    assert.equal(getFirstUnansweredStepId(undefined, {}, {}), "hedef");
    assert.equal(
      getFirstUnansweredStepId("DGS", completeAnswers, {}),
      "kontrol"
    );
  });

  it("stops at the first gap", () => {
    assert.equal(
      getFirstUnansweredStepId("DGS", { goal: "DGS", stage: "ongoing" }, {}),
      "dersler"
    );
  });

  it("never lets a URL skip past the first unanswered step", () => {
    const partial: HocaBulApiAnswersDraft = { goal: "DGS", stage: "ongoing" };
    assert.equal(sanitizeStepParam("butce", "DGS", partial, {}), "dersler");
    assert.equal(sanitizeStepParam("asama", "DGS", partial, {}), "asama");
  });

  it("falls back for unknown, empty and out-of-branch values", () => {
    assert.equal(sanitizeStepParam(null, "DGS", {}, {}), "hedef");
    assert.equal(sanitizeStepParam("", "DGS", {}, {}), "hedef");
    assert.equal(sanitizeStepParam("../../etc", "DGS", {}, {}), "hedef");
    // yks_alan does not exist for a DGS student.
    assert.equal(
      sanitizeStepParam("yks_alan", "DGS", completeAnswers, {}),
      "kontrol"
    );
  });
});

describe("validation", () => {
  it("requires an answer on every step", () => {
    assert.deepEqual(validateStep("hedef", {}, {}), { ok: false, code: "required" });
    assert.deepEqual(validateStep("dersler", {}, {}), { ok: false, code: "required" });
    assert.deepEqual(validateStep("yks_alan", {}, {}), { ok: false, code: "required" });
  });

  it("enforces the selection limits", () => {
    assert.deepEqual(
      validateStep("dersler", { subject_keys: ["a", "b", "c", "d"] }, {}),
      { ok: false, code: "max_exceeded" }
    );
    assert.deepEqual(
      validateStep("zorluk", { challenges: ["foundations", "consistency", "speed_accuracy"] }, {}),
      { ok: false, code: "max_exceeded" }
    );
  });

  it("rejects a flexible schedule combined with a concrete window", () => {
    assert.deepEqual(
      validateStep(
        "uygun_zamanlar",
        { availability_windows: ["flexible", "weekday_day"] },
        {}
      ),
      { ok: false, code: "flexible_conflict" }
    );
    assert.ok(
      validateStep("uygun_zamanlar", { availability_windows: ["flexible"] }, {}).ok
    );
  });

  it("rejects unsure combined with a concrete YKS area", () => {
    assert.deepEqual(
      validateStep("yks_alan", {}, { yks_alan: ["unsure", "TYT"] }),
      { ok: false, code: "exclusive_conflict" }
    );
  });

  it("treats the flow as complete only when every visible step is answered", () => {
    assert.ok(isFlowComplete("DGS", completeAnswers, {}));
    // The same answers are incomplete for YKS: the area screen is still empty.
    assert.equal(isFlowComplete("YKS", { ...completeAnswers, goal: "YKS" }, {}), false);
    assert.ok(
      isFlowComplete("YKS", { ...completeAnswers, goal: "YKS" }, { yks_alan: ["TYT"] })
    );
  });
});

describe("selection helpers", () => {
  it("toggles within a limit and reports when the limit blocked the change", () => {
    assert.deepEqual(toggleWithLimit(["a"], "b", 2), { values: ["a", "b"], limitHit: false });
    assert.deepEqual(toggleWithLimit(["a", "b"], "c", 2), { values: ["a", "b"], limitHit: true });
    assert.deepEqual(toggleWithLimit(["a", "b"], "a", 2), { values: ["b"], limitHit: false });
  });

  it("keeps a flexible schedule exclusive in both directions", () => {
    assert.deepEqual(toggleAvailability(["weekday_day"], "flexible").values, ["flexible"]);
    assert.deepEqual(toggleAvailability(["flexible"], "weekday_day").values, ["weekday_day"]);
    assert.deepEqual(toggleAvailability(["flexible"], "flexible").values, []);
  });

  it("keeps the unsure exam area exclusive", () => {
    assert.deepEqual(toggleExamArea(["TYT"], "unsure").values, ["unsure"]);
    assert.deepEqual(toggleExamArea(["unsure"], "AYT").values, ["AYT"]);
  });
});

describe("invalidation", () => {
  it("clears stage, area, subjects and budget when the goal changes", () => {
    const result = applyAnswerChange(
      { answers: { ...completeAnswers, goal: "YKS" }, client: { yks_alan: ["TYT"] } },
      { field: "goal", value: "KPSS" }
    );
    assert.equal(result.answers.goal, "KPSS");
    assert.equal(result.answers.stage, undefined);
    assert.equal(result.answers.subject_keys, undefined);
    assert.equal(result.answers.budget_segment, undefined);
    assert.equal(result.client.yks_alan, undefined);
    assert.deepEqual(result.cleared.sort(), [
      "budget_segment",
      "stage",
      "subject_keys",
      "yks_alan",
    ]);
    // Untouched by a goal change.
    assert.deepEqual(result.answers.challenges, completeAnswers.challenges);
    assert.deepEqual(
      result.answers.availability_windows,
      completeAnswers.availability_windows
    );
  });

  it("clears nothing when the goal is re-selected unchanged", () => {
    const result = applyAnswerChange(
      { answers: { ...completeAnswers }, client: {} },
      { field: "goal", value: "DGS" }
    );
    assert.deepEqual(result.cleared, []);
    assert.equal(result.answers.stage, "ongoing");
  });

  it("drops only the subjects that the new YKS area no longer offers", () => {
    const result = applyAnswerChange(
      {
        answers: { subject_keys: ["matematik", "ingilizce"], budget_segment: "balanced" },
        client: { yks_alan: ["TYT", "YDT"] },
      },
      { field: "yks_alan", value: ["TYT"] },
      { subjects }
    );
    assert.deepEqual(result.answers.subject_keys, ["matematik"]);
    assert.equal(result.answers.budget_segment, undefined);
    assert.deepEqual(result.cleared.sort(), ["budget_segment", "subject_keys"]);
  });

  it("keeps every subject when the area selection is unsure", () => {
    assert.deepEqual(
      pruneSubjectsForAreas(["matematik", "ingilizce"], subjects, ["unsure"]),
      ["matematik", "ingilizce"]
    );
  });

  it("clears the budget when the subjects change", () => {
    const result = applyAnswerChange(
      { answers: { subject_keys: ["matematik"], budget_segment: "premium" }, client: {} },
      { field: "subject_keys", value: ["matematik", "edebiyat"] }
    );
    assert.equal(result.answers.budget_segment, undefined);
    assert.deepEqual(result.cleared, ["budget_segment"]);
  });

  it("clears nothing for challenges, styles or availability", () => {
    const result = applyAnswerChange(
      { answers: { ...completeAnswers }, client: {} },
      { field: "challenges", value: ["consistency"] }
    );
    assert.deepEqual(result.cleared, []);
    assert.equal(result.answers.budget_segment, "balanced");
  });
});

describe("pruning against fresh server options", () => {
  const options: MatchingOptions = {
    goals: [
      { value: "YKS", label: "YKS" },
      { value: "DGS", label: "DGS" },
      { value: "UNDECIDED", label: "Henüz karar vermedim" },
    ],
    stages: {
      YKS: [{ value: "grade_12", label: "12. sınıf" }],
      DGS: [{ value: "ongoing", label: "Bir süredir hazırlanıyorum" }],
      KPSS: [],
      UNDECIDED: [],
    },
    subjects,
    budget_ranges: [
      { id: "balanced", label: "Dengeli", min: 400, max: 700 },
      { id: "flexible", label: "Fiyat konusunda esneğim", min: null, max: null },
    ],
  };

  it("drops a stage, subject and budget band the server no longer returns", () => {
    const result = pruneAnswersAgainstOptions(
      {
        goal: "DGS",
        stage: "retaking",
        subject_keys: ["matematik", "kimya"],
        budget_segment: "premium",
      },
      {},
      options
    );
    assert.equal(result.answers.stage, undefined);
    assert.deepEqual(result.answers.subject_keys, ["matematik"]);
    assert.equal(result.answers.budget_segment, undefined);
    assert.deepEqual(result.dropped.sort(), ["budget_segment", "stage", "subject_keys"]);
  });

  it("drops a leftover area selection once the goal is no longer YKS", () => {
    const result = pruneAnswersAgainstOptions(
      { goal: "DGS", stage: "ongoing", subject_keys: ["edebiyat"] },
      { yks_alan: ["TYT"] },
      options
    );
    assert.equal(result.client.yks_alan, undefined);
    assert.deepEqual(result.answers.subject_keys, ["edebiyat"]);
    assert.deepEqual(result.dropped, ["yks_alan"]);
  });

  it("drops zero-supply and area-incompatible subjects and clears an existing budget", () => {
    const constrainedOptions: MatchingOptions = {
      ...options,
      subjects: [
        ...subjects,
        { key: "kimya", label: "Kimya", subject_ids: ["4"], exam_types: ["AYT"], tutor_count: 0 },
      ],
    };
    const result = pruneAnswersAgainstOptions(
      {
        goal: "YKS",
        stage: "grade_12",
        subject_keys: ["matematik", "ingilizce", "kimya"],
        challenges: ["foundations"],
        teaching_styles: ["question_speed"],
        availability_windows: ["weekday_evening"],
        budget_segment: "balanced",
      },
      { yks_alan: ["TYT"] },
      constrainedOptions
    );

    assert.deepEqual(result.answers.subject_keys, ["matematik"]);
    assert.equal(result.answers.budget_segment, undefined);
    assert.deepEqual(result.answers.challenges, ["foundations"]);
    assert.deepEqual(result.answers.teaching_styles, ["question_speed"]);
    assert.deepEqual(result.answers.availability_windows, ["weekday_evening"]);
    assert.deepEqual(result.dropped.sort(), ["budget_segment", "subject_keys"]);
  });

  it("preserves a budget when fresh options do not remove any subject", () => {
    const result = pruneAnswersAgainstOptions(
      { goal: "YKS", stage: "grade_12", subject_keys: ["matematik"], budget_segment: "balanced" },
      { yks_alan: ["TYT"] },
      options
    );
    assert.equal(result.answers.budget_segment, "balanced");
    assert.deepEqual(result.dropped, []);
  });
});

describe("request serialization", () => {
  it("returns null until every required answer exists", () => {
    assert.equal(toMatchingAnswers({}), null);
    assert.equal(toMatchingAnswers({ ...completeAnswers, budget_segment: undefined }), null);
    assert.equal(toMatchingAnswers({ ...completeAnswers, subject_keys: [] }), null);
  });

  it("sends exactly the eight keys the serializer accepts", () => {
    const body = toMatchingAnswers(completeAnswers);
    assert.ok(body);
    assert.deepEqual(Object.keys(body).sort(), [...MATCHING_ANSWER_KEYS]);
    assert.equal(body.schema_version, 1);
  });

  it("cannot leak a client-only answer or UI metadata into the body", () => {
    const polluted = {
      ...completeAnswers,
      yks_alan: ["TYT"],
      stepId: "butce",
      updatedAt: 123,
    } as unknown as HocaBulApiAnswersDraft;
    const body = toMatchingAnswers(polluted);
    assert.ok(body);
    assert.deepEqual(Object.keys(body).sort(), [...MATCHING_ANSWER_KEYS]);
    assert.equal("yks_alan" in body, false);
    assert.equal("stepId" in body, false);
  });

  it("rejects over-limit arrays and mixed flexible availability", () => {
    assert.equal(
      toMatchingAnswers({ ...completeAnswers, subject_keys: ["a", "b", "c", "d"] }),
      null
    );
    assert.equal(
      toMatchingAnswers({
        ...completeAnswers,
        availability_windows: ["flexible", "weekday_day"],
      }),
      null
    );
    assert.equal(
      toMatchingAnswers({
        ...completeAnswers,
        challenges: ["foundations", "consistency", "speed_accuracy"],
      }),
      null
    );
    assert.equal(
      toMatchingAnswers({
        ...completeAnswers,
        teaching_styles: ["question_speed", "high_target", "foundations_patient"],
      }),
      null
    );
  });
});

describe("fresh completion validation", () => {
  it("returns the serializer payload for complete YKS and non-YKS flows", () => {
    assert.deepEqual(
      getValidatedMatchingAnswers(completeAnswers, {}, completionOptions),
      toMatchingAnswers(completeAnswers)
    );
    const yksAnswers = { ...completeAnswers, goal: "YKS" as const, stage: "grade_12" };
    assert.deepEqual(
      getValidatedMatchingAnswers(yksAnswers, { yks_alan: ["TYT"] }, completionOptions),
      toMatchingAnswers(yksAnswers)
    );
  });

  it("rejects incomplete client state and every answer removed by fresh pruning", () => {
    const yksAnswers = { ...completeAnswers, goal: "YKS" as const, stage: "grade_12" };
    assert.equal(getValidatedMatchingAnswers(yksAnswers, {}, completionOptions), null);
    assert.equal(
      getValidatedMatchingAnswers(
        yksAnswers,
        { yks_alan: ["unsure", "TYT"] },
        completionOptions
      ),
      null
    );
    assert.equal(
      getValidatedMatchingAnswers(
        { ...completeAnswers, stage: "stale" },
        {},
        completionOptions
      ),
      null
    );
    assert.equal(
      getValidatedMatchingAnswers(
        { ...completeAnswers, subject_keys: ["missing"] },
        {},
        completionOptions
      ),
      null
    );
    assert.equal(
      getValidatedMatchingAnswers(
        { ...completeAnswers, budget_segment: "premium" },
        {},
        completionOptions
      ),
      null
    );
  });
});
