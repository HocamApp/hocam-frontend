import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  toIllustrationState,
  toStagePhase,
  type IllustrationState,
} from "./illustrationState";
import type {
  HocaBulApiAnswersDraft,
  HocaBulClientAnswers,
} from "@/types/hocaBul";

function state(
  step: Parameters<typeof toIllustrationState>[0],
  answers: HocaBulApiAnswersDraft = {},
  client: HocaBulClientAnswers = {}
): IllustrationState {
  return toIllustrationState(step, answers, client);
}

/** Every answer the flow accepts, used wherever completeness matters. */
const completeYks: HocaBulApiAnswersDraft = {
  goal: "YKS",
  stage: "grade_12",
  subject_keys: ["matematik", "fizik"],
  challenges: ["foundations"],
  teaching_styles: ["foundations_patient"],
  availability_windows: ["weekday_evening"],
  budget_segment: "balanced",
};

describe("hedef", () => {
  it("reports no goal before one is chosen", () => {
    assert.deepEqual(state("hedef"), { step: "hedef", goal: null });
  });

  it("carries each of the four real goals through unchanged", () => {
    for (const goal of ["YKS", "DGS", "KPSS", "UNDECIDED"] as const) {
      assert.deepEqual(state("hedef", { goal }), { step: "hedef", goal });
    }
  });
});

describe("asama", () => {
  // The backend's own STAGES table (apps/students/matching.py). If a value is
  // added there and not here it falls back rather than breaking the screen, but
  // this list is what proves the intended grouping.
  const BACKEND_STAGES: Array<[string, string]> = [
    ["grade_9", "early"],
    ["grade_10", "early"],
    ["grade_11", "active"],
    ["grade_12", "final"],
    ["graduate", "returning"],
    ["other", "exploring"],
    ["starting", "early"],
    ["ongoing", "active"],
    ["retaking", "returning"],
    ["intensive", "final"],
    ["exploring", "exploring"],
    ["lesson_support", "exploring"],
    ["exam_considering", "exploring"],
  ];

  it("maps all 13 backend stage values to a phase", () => {
    assert.equal(BACKEND_STAGES.length, 13);
    for (const [stage, phase] of BACKEND_STAGES) {
      assert.equal(toStagePhase(stage), phase, `stage ${stage}`);
    }
  });

  it("groups the 13 values into exactly the five planned phases", () => {
    const phases = Array.from(
      new Set(BACKEND_STAGES.map(([, phase]) => phase))
    ).sort();
    assert.deepEqual(phases, [
      "active",
      "early",
      "exploring",
      "final",
      "returning",
    ]);
  });

  it("has no phase before a stage is answered", () => {
    assert.deepEqual(state("asama"), { step: "asama", phase: null });
  });

  it("degrades an unknown server stage to the neutral scene", () => {
    // stages are served by the backend, so this is a real case, not a defensive one.
    assert.equal(toStagePhase("a_stage_this_build_has_never_seen"), "exploring");
    assert.deepEqual(state("asama", { stage: "brand_new_value" }), {
      step: "asama",
      phase: "exploring",
    });
  });

  it("treats an empty stage as unanswered rather than unknown", () => {
    assert.equal(toStagePhase(""), null);
  });
});

describe("yks_alan", () => {
  it("has every lane dark by default", () => {
    assert.deepEqual(state("yks_alan"), {
      step: "yks_alan",
      lanes: { tyt: false, ayt: false, ydt: false },
      unsure: false,
    });
  });

  it("lights each concrete area independently across all eight combinations", () => {
    const areas = ["TYT", "AYT", "YDT"] as const;
    for (let mask = 0; mask < 8; mask += 1) {
      const selected = areas.filter((_, index) => (mask >> index) & 1);
      const result = state("yks_alan", {}, { yks_alan: [...selected] });
      assert.deepEqual(
        result,
        {
          step: "yks_alan",
          lanes: {
            tyt: selected.includes("TYT"),
            ayt: selected.includes("AYT"),
            ydt: selected.includes("YDT"),
          },
          unsure: false,
        },
        `combination ${selected.join("+") || "none"}`
      );
    }
  });

  it("supports all three concrete areas at once", () => {
    const result = state("yks_alan", {}, { yks_alan: ["TYT", "AYT", "YDT"] });
    assert.deepEqual(result, {
      step: "yks_alan",
      lanes: { tyt: true, ayt: true, ydt: true },
      unsure: false,
    });
  });

  it("shows the unsure scene without lighting any lane", () => {
    const result = state("yks_alan", {}, { yks_alan: ["unsure"] });
    assert.deepEqual(result, {
      step: "yks_alan",
      lanes: { tyt: false, ayt: false, ydt: false },
      unsure: true,
    });
  });
});

describe("dersler", () => {
  it("counts zero through three selections", () => {
    const cases: Array<[string[], number]> = [
      [[], 0],
      [["a"], 1],
      [["a", "b"], 2],
      [["a", "b", "c"], 3],
    ];
    for (const [keys, count] of cases) {
      assert.deepEqual(state("dersler", { subject_keys: keys }), {
        step: "dersler",
        count,
      });
    }
  });

  it("clamps above the rack's three slots rather than overflowing", () => {
    // The limit itself is the flow module's job; this only proves the artwork
    // cannot be asked to draw a fourth tile.
    assert.deepEqual(state("dersler", { subject_keys: ["a", "b", "c", "d"] }), {
      step: "dersler",
      count: 3,
    });
  });

  it("does not react to which subjects were chosen, only how many", () => {
    const first = state("dersler", { subject_keys: ["matematik", "fizik"] });
    const second = state("dersler", { subject_keys: ["edebiyat", "ingilizce"] });
    assert.deepEqual(first, second);
  });

  it("never carries a subject key into the presentation state", () => {
    const result = state("dersler", { subject_keys: ["matematik"] });
    assert.equal(JSON.stringify(result).includes("matematik"), false);
  });
});

describe("zorluk", () => {
  it("opens no gate by default", () => {
    assert.deepEqual(state("zorluk"), { step: "zorluk", gates: [] });
  });

  it("carries up to two challenges", () => {
    const result = state("zorluk", {
      challenges: ["foundations", "consistency"],
    });
    assert.deepEqual(result, {
      step: "zorluk",
      gates: ["foundations", "consistency"],
    });
  });

  it("is independent of the order the student tapped in", () => {
    const forward = state("zorluk", {
      challenges: ["foundations", "consistency"],
    });
    const reverse = state("zorluk", {
      challenges: ["consistency", "foundations"],
    });
    assert.deepEqual(forward, reverse);
  });

  it("never opens more than two gates", () => {
    const result = state("zorluk", {
      challenges: ["foundations", "consistency", "speed_accuracy"],
    });
    assert.equal((result as { gates: string[] }).gates.length, 2);
  });
});

describe("hoca_yaklasimi", () => {
  it("raises no tool by default", () => {
    assert.deepEqual(state("hoca_yaklasimi"), {
      step: "hoca_yaklasimi",
      tools: [],
    });
  });

  it("carries up to two styles in the option list's order", () => {
    const result = state("hoca_yaklasimi", {
      teaching_styles: ["high_target", "foundations_patient"],
    });
    assert.deepEqual(result, {
      step: "hoca_yaklasimi",
      tools: ["foundations_patient", "high_target"],
    });
  });

  it("never raises more than two tools", () => {
    const result = state("hoca_yaklasimi", {
      teaching_styles: ["foundations_patient", "question_speed", "high_target"],
    });
    assert.equal((result as { tools: string[] }).tools.length, 2);
  });
});

describe("uygun_zamanlar", () => {
  it("lights nothing by default", () => {
    assert.deepEqual(state("uygun_zamanlar"), {
      step: "uygun_zamanlar",
      windows: {
        weekday_day: false,
        weekday_evening: false,
        weekend_day: false,
        weekend_evening: false,
      },
      flexible: false,
    });
  });

  it("lights all four concrete windows together", () => {
    const result = state("uygun_zamanlar", {
      availability_windows: [
        "weekday_day",
        "weekday_evening",
        "weekend_day",
        "weekend_evening",
      ],
    });
    assert.deepEqual(result, {
      step: "uygun_zamanlar",
      windows: {
        weekday_day: true,
        weekday_evening: true,
        weekend_day: true,
        weekend_evening: true,
      },
      flexible: false,
    });
  });

  it("shows the flexible scene instead of, never alongside, concrete blocks", () => {
    const result = state("uygun_zamanlar", {
      // A stale draft could still hold both; the artwork must not render both.
      availability_windows: ["flexible", "weekday_day"],
    });
    assert.deepEqual(result, {
      step: "uygun_zamanlar",
      windows: {
        weekday_day: false,
        weekday_evening: false,
        weekend_day: false,
        weekend_evening: false,
      },
      flexible: true,
    });
  });
});

describe("butce", () => {
  it("has no band before one is chosen", () => {
    assert.deepEqual(state("butce"), {
      step: "butce",
      band: null,
      flexible: false,
    });
  });

  it("maps the three concrete segments to a position on the scale", () => {
    const cases = [
      ["economical", 1],
      ["balanced", 2],
      ["premium", 3],
    ] as const;
    for (const [segment, band] of cases) {
      assert.deepEqual(state("butce", { budget_segment: segment }), {
        step: "butce",
        band,
        flexible: false,
      });
    }
  });

  it("treats flexible as its own scene rather than a fourth position", () => {
    assert.deepEqual(state("butce", { budget_segment: "flexible" }), {
      step: "butce",
      band: null,
      flexible: true,
    });
  });

  it("carries no price, currency or range into the presentation state", () => {
    const serialized = JSON.stringify(state("butce", { budget_segment: "premium" }));
    assert.equal(/\d{3,}|₺|TL/.test(serialized), false);
  });
});

describe("kontrol", () => {
  it("counts eight answerable steps on the YKS branch", () => {
    const result = state("kontrol", completeYks, { yks_alan: ["TYT"] });
    assert.deepEqual(result, { step: "kontrol", filled: 8, total: 8 });
  });

  it("counts seven answerable steps off the YKS branch", () => {
    const result = state("kontrol", {
      ...completeYks,
      goal: "DGS",
      stage: "ongoing",
    });
    assert.deepEqual(result, { step: "kontrol", filled: 7, total: 7 });
  });

  it("reports a partial profile without inventing a result", () => {
    const result = state("kontrol", {
      goal: "DGS",
      stage: "ongoing",
      subject_keys: ["matematik"],
    });
    assert.deepEqual(result, { step: "kontrol", filled: 3, total: 7 });
  });

  it("counts the YKS-only step as unanswered when its area is missing", () => {
    const result = state("kontrol", completeYks, {});
    assert.deepEqual(result, { step: "kontrol", filled: 7, total: 8 });
  });

  it("exposes no score, percentage or match of any kind", () => {
    const result = state("kontrol", completeYks, { yks_alan: ["TYT"] });
    assert.deepEqual(Object.keys(result).sort(), ["filled", "step", "total"]);
  });
});

describe("purity", () => {
  it("does not mutate the answers it is given", () => {
    const answers: HocaBulApiAnswersDraft = {
      ...completeYks,
      challenges: ["consistency", "foundations"],
    };
    const client: HocaBulClientAnswers = { yks_alan: ["AYT", "TYT"] };
    const snapshot = JSON.stringify({ answers, client });

    for (const step of [
      "hedef",
      "asama",
      "yks_alan",
      "dersler",
      "zorluk",
      "hoca_yaklasimi",
      "uygun_zamanlar",
      "butce",
      "kontrol",
    ] as const) {
      toIllustrationState(step, answers, client);
    }

    assert.equal(JSON.stringify({ answers, client }), snapshot);
  });

  it("returns a state whose step matches the one asked for", () => {
    for (const step of [
      "hedef",
      "asama",
      "yks_alan",
      "dersler",
      "zorluk",
      "hoca_yaklasimi",
      "uygun_zamanlar",
      "butce",
      "kontrol",
    ] as const) {
      assert.equal(state(step, completeYks, { yks_alan: ["TYT"] }).step, step);
    }
  });
});
