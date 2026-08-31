import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";

// One module mock per process, so the auth shape is fixed here as "a signed-in
// student" and the cases that need a tutor or a signed-out visitor are asserted
// through the streak payload instead.
let StreakIndicator: React.ComponentType | null = null;
let streakResponse: unknown = null;
let shouldFail = false;

before(async () => {
  mock.module("@/hooks/useAuth", {
    namedExports: {
      useAuth: () => ({
        user: { id: "student-1", role: "student" },
        isAuthenticated: true,
        isStudent: true,
        isTutor: false,
        isLoading: false,
      }),
    },
  });
  mock.module("@/lib/streakApi", {
    namedExports: {
      fetchStudentStreak: async () => {
        if (shouldFail) throw new Error("offline");
        return streakResponse;
      },
    },
  });

  ({ StreakIndicator } = await import("./StreakIndicator"));
});

afterEach(() => {
  cleanup();
  shouldFail = false;
});
after(() => window.close());

async function renderIndicator() {
  const Component = StreakIndicator!;
  await act(async () => {
    render(<Component />);
  });
}

describe("StreakIndicator", () => {
  it("shows the streak once the student has one", async () => {
    streakResponse = {
      length: 7,
      longest: 12,
      active_today: true,
      freezes_left: 2,
      frozen_dates: [],
      last_active_date: "2026-08-20",
    };
    await renderIndicator();

    const badge = screen.getByRole("status");
    assert.equal(badge.getAttribute("aria-label"), "7 günlük çalışma serisi");
    // The freeze balance belongs in the tooltip, not in the badge: it is the
    // answer to a question the student only asks after missing a day.
    assert.match(badge.getAttribute("title") ?? "", /2 dondurma hakkın var/);
  });

  it("renders nothing at zero, rather than handing out a failure on day one", async () => {
    streakResponse = {
      length: 0,
      longest: 0,
      active_today: false,
      freezes_left: 2,
      frozen_dates: [],
      last_active_date: null,
    };
    await renderIndicator();

    assert.equal(screen.queryByRole("status"), null);
  });

  it("renders nothing when the request fails, instead of a broken navbar slot", async () => {
    shouldFail = true;
    await renderIndicator();

    assert.equal(screen.queryByRole("status"), null);
  });
});
