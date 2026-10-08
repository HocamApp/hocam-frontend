import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { RATING_CRITERIA, RATING_CRITERIA_LABELS } from "@/lib/coachingApi";
import { CoachingSessionRatingForm } from "./CoachingSessionRatingForm";

after(() => window.close());
afterEach(cleanup);

describe("CoachingSessionRatingForm", () => {
  it("starts with no score chosen and cannot be sent half-filled", () => {
    render(<CoachingSessionRatingForm onSubmit={() => {}} isPending={false} />);

    assert.equal(screen.queryAllByRole("button", { pressed: true }).length, 0);
    const send = screen.getByRole("button", { name: "Değerlendirmeyi gönder" }) as HTMLButtonElement;
    assert.equal(send.disabled, true);
    assert.ok(screen.getByText("Göndermek için 7 ölçüt daha puanla."));
  });

  it("sends exactly the scores the student picked", () => {
    const calls: unknown[] = [];
    render(<CoachingSessionRatingForm onSubmit={(scores) => calls.push(scores)} isPending={false} />);

    RATING_CRITERIA.forEach((criterion, index) => {
      const value = (index % 5) + 1;
      fireEvent.click(
        screen.getByRole("button", { name: `${RATING_CRITERIA_LABELS[criterion]}: ${value} / 5` }),
      );
    });
    const pressed = screen.getByRole("button", { name: `${RATING_CRITERIA_LABELS.program_benefit}: 1 / 5` });
    assert.equal(pressed.getAttribute("aria-pressed"), "true");

    fireEvent.click(screen.getByRole("button", { name: "Değerlendirmeyi gönder" }));
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], {
      program_benefit: 1,
      attentiveness: 2,
      message_responsiveness: 3,
      motivation: 4,
      session_efficiency: 5,
      tutor_preparation: 1,
      technical_quality: 2,
    });
  });

  it("gives every score button a 44px target", () => {
    render(<CoachingSessionRatingForm onSubmit={() => {}} isPending={false} />);
    const button = screen.getByRole("button", { name: `${RATING_CRITERIA_LABELS.motivation}: 3 / 5` });
    assert.match(button.className, /h-11 w-11/);
  });
});
