import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { CoachingWeeklyRhythm } from "./CoachingWeeklyRhythm";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

after(() => window.close());
afterEach(cleanup);

describe("CoachingWeeklyRhythm", () => {
  it("turns successful current counts into an accessible operational distribution", () => {
    render(
      <CoachingWeeklyRhythm
        metrics={{
          activeStudents: 2,
          upcomingSessions: 1,
          pendingReports: 1,
          pendingRequests: 0,
        }}
      />
    );

    assert.ok(screen.getByRole("heading", { name: "Haftanın ritmi" }));
    assert.ok(screen.getByLabelText("Aktif öğrenci: %50 pay"));
    assert.ok(screen.getByLabelText("Yaklaşan görüşme: %25 pay"));
    assert.ok(screen.getByText("Şu an ilgilenmen gereken 2 iş var."));
  });

  it("uses a purposeful start state when every successful count is zero", () => {
    render(
      <CoachingWeeklyRhythm
        metrics={{
          activeStudents: 0,
          upcomingSessions: 0,
          pendingReports: 0,
          pendingRequests: 0,
        }}
      />
    );

    assert.ok(screen.getByText("Koçluk akışın burada şekillenecek"));
    assert.equal(screen.queryByText("Şu anda görüntülenemiyor"), null);
  });

  it("keeps failed metrics unavailable instead of converting them to zero", () => {
    render(
      <CoachingWeeklyRhythm
        metrics={{
          activeStudents: null,
          upcomingSessions: 1,
          pendingReports: null,
          pendingRequests: 0,
        }}
      />
    );

    assert.equal(screen.getAllByText("Şu anda görüntülenemiyor").length, 2);
    assert.equal(screen.queryAllByText("0").length, 1);
  });
});
