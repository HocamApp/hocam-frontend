import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import type { CoachingDerivedStatus } from "@/lib/coachingPresentation";
import { TutorCoachingDashboard } from "./TutorCoachingDashboard";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

after(() => window.close());
afterEach(cleanup);

const publishedPaused: CoachingDerivedStatus = {
  publication: "published",
  intake: "open",
  capacity: "available",
  platformCheckout: "platform_paused",
  readiness: "complete",
  platformMessage:
    "Teklifin yayında. Yeni koçluk satışları platform genelinde şu anda kapalı.",
  nextAction: null,
};

describe("TutorCoachingDashboard", () => {
  it("presents platform checkout as information, never as a tutor-fixable failure", () => {
    render(
      <TutorCoachingDashboard
        status={publishedPaused}
        metrics={{ activeStudents: 2, upcomingSessions: 1, pendingReports: 0, pendingRequests: 3 }}
      />
    );

    assert.ok(
      screen.getByText(
        "Teklifin yayında. Yeni koçluk satışları platform genelinde şu anda kapalı."
      )
    );
    assert.equal(screen.queryByText(/checkout aç/i), null);
    assert.equal(screen.queryByText(/satışları aç/i), null);
    assert.ok(screen.getByRole("region", { name: "Koçluk hizmet durumu" }));
    const platformRegion = screen.getByRole("region", { name: "Platform durumu" });
    assert.ok(platformRegion.textContent?.includes("platform genelinde şu anda kapalı"));
    assert.ok(screen.getByRole("link", { name: /Yeni öğrenci talepleri/i }));
    assert.ok(screen.getByRole("heading", { name: /Teklif ve ayarlar/i }));
    assert.ok(screen.getByRole("link", { name: /Teklifini düzenle/i }));
    assert.equal(screen.queryByText(/bundle/i), null);
  });

  it("shows unavailable metrics without inventing zero", () => {
    render(
      <TutorCoachingDashboard
        status={{ ...publishedPaused, publication: "draft", platformMessage: null }}
        metrics={{
          activeStudents: null,
          upcomingSessions: null,
          pendingReports: null,
          pendingRequests: null,
        }}
      />
    );

    assert.equal(screen.getAllByText("Şu anda görüntülenemiyor").length, 4);
    assert.equal(screen.queryByText("0"), null);
  });
});
