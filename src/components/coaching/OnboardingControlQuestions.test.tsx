import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { OnboardingControlQuestions } from "./OnboardingControlQuestions";

after(() => window.close());
afterEach(cleanup);

const questions = [
  { id: "scope", question: "Koçluk neyi kapsar?", options: [{ value: "a", label: "Program takibi" }] },
  { id: "duration", question: "Görüşme kaç dakika?", options: [{ value: "b", label: "30 dakika" }] },
];

describe("OnboardingControlQuestions", () => {
  it("shows one quick-check question at a time without changing server verdict semantics", () => {
    render(
      <OnboardingControlQuestions
        questions={questions}
        answers={{}}
        onAnswer={async () => ({ explanation: "Sunucudan açıklama" })}
        pendingQuestionId={null}
      />
    );
    assert.ok(screen.getByText("Hızlı kontrol"));
    assert.ok(screen.getByText("Koçluk neyi kapsar?"));
    assert.equal(screen.queryByText("Görüşme kaç dakika?"), null);
    assert.ok(screen.getByText("1 / 2"));
  });

  it("moves to the first answer that is not server-confirmed as correct", () => {
    render(
      <OnboardingControlQuestions
        questions={questions}
        answers={{ scope: { answer: "a", is_correct: true } }}
        onAnswer={async () => ({ explanation: "" })}
        pendingQuestionId={null}
      />
    );
    assert.equal(screen.queryByText("Koçluk neyi kapsar?"), null);
    assert.ok(screen.getByText("Görüşme kaç dakika?"));
    assert.ok(screen.getByText("2 / 2"));
  });
});
