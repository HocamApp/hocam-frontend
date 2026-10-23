import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CoachingControlQuestion } from "./coachingApi";
import {
  ONBOARDING_NEXT_LABELS,
  controlGateNote,
  controlProgress,
  onboardingStage,
  onboardingStepper,
} from "./coachingOnboarding";

const questions = (count: number): CoachingControlQuestion[] =>
  Array.from({ length: count }, (_, index) => ({ id: `q${index + 1}`, question: `Soru ${index + 1}`, options: [] }));

describe("onboardingStage", () => {
  it("follows the server's step", () => {
    assert.equal(onboardingStage({ is_completed: false, current_step_key: "carousel" }), "intro");
    assert.equal(onboardingStage({ is_completed: false, current_step_key: "control_questions" }), "questions");
    assert.equal(onboardingStage({ is_completed: false, current_step_key: "contract" }), "contract");
  });

  it("puts a tutor the server left on the old last step back on the contract, where it now ends", () => {
    assert.equal(onboardingStage({ is_completed: false, current_step_key: "plan" }), "contract");
  });

  it("is done once the server says so, whatever step it still names", () => {
    assert.equal(onboardingStage({ is_completed: true, current_step_key: "plan" }), "done");
    assert.equal(onboardingStage({ is_completed: true, current_step_key: null }), "done");
  });

  it("starts from the beginning when it knows nothing", () => {
    assert.equal(onboardingStage({ is_completed: false, current_step_key: null }), "intro");
  });
});

describe("onboardingStepper", () => {
  const read = (stage: Parameters<typeof onboardingStepper>[0]) =>
    onboardingStepper(stage)
      .map((step) => `${step.number}.${step.label}:${step.state}`)
      .join(" ");

  it("has three steps, the old empty last one gone", () => {
    assert.equal(read("intro"), "1.Tanıtım:current 2.Hızlı kontrol:todo 3.Sözleşme:todo");
  });

  it("marks what is behind as done and what is ahead as waiting", () => {
    assert.equal(read("questions"), "1.Tanıtım:done 2.Hızlı kontrol:current 3.Sözleşme:todo");
    assert.equal(read("contract"), "1.Tanıtım:done 2.Hızlı kontrol:done 3.Sözleşme:current");
  });

  it("has everything done at the end", () => {
    assert.equal(read("done"), "1.Tanıtım:done 2.Hızlı kontrol:done 3.Sözleşme:done");
  });
});

describe("controlProgress", () => {
  it("counts what the server confirmed as correct, and what is left", () => {
    const progress = controlProgress(questions(4), {
      q1: { answer: "a", is_correct: true },
      q2: { answer: "b", is_correct: false },
      q3: { answer: "c", is_correct: true },
    });
    assert.deepEqual(progress, { correct: 2, total: 4, remaining: 2 });
  });

  it("is zero and full for the two ends", () => {
    assert.deepEqual(controlProgress(questions(4), {}), { correct: 0, total: 4, remaining: 4 });
    const all = Object.fromEntries(questions(4).map((q) => [q.id, { answer: "x", is_correct: true }]));
    assert.deepEqual(controlProgress(questions(4), all), { correct: 4, total: 4, remaining: 0 });
  });
});

describe("controlGateNote", () => {
  it("says how many questions stand between the tutor and the contract", () => {
    assert.equal(controlGateNote({ correct: 2, total: 4, remaining: 2 }), "Sözleşmeye geçmek için 2 soru daha var.");
    assert.equal(controlGateNote({ correct: 3, total: 4, remaining: 1 }), "Sözleşmeye geçmek için 1 soru daha var.");
  });

  it("says nothing when nothing is left", () => {
    assert.equal(controlGateNote({ correct: 4, total: 4, remaining: 0 }), null);
  });
});

describe("ONBOARDING_NEXT_LABELS", () => {
  it("names what the tutor sets up next, in the order of the setup", () => {
    assert.equal(
      ONBOARDING_NEXT_LABELS.join(" · "),
      "Görüşme düzeni · Fiyat · Sınavlar · Açıklama · Saatler · Kapasite · Yayın"
    );
  });
});
