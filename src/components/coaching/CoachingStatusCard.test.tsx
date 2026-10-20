import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import type { CoachingDerivedStatus } from "@/lib/coachingPresentation";

let CoachingStatusCard: React.ComponentType<{ status: CoachingDerivedStatus }>;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  ({ CoachingStatusCard } = await import("./CoachingStatusCard"));
});

afterEach(cleanup);

function status(overrides: Partial<CoachingDerivedStatus> = {}): CoachingDerivedStatus {
  return {
    publication: "draft",
    intake: "not_applicable",
    capacity: "unknown",
    platformCheckout: "enabled",
    readiness: "incomplete",
    platformMessage: null,
    nextAction: null,
    ...overrides,
  } as CoachingDerivedStatus;
}

describe("CoachingStatusCard", () => {
  it("follows the next action the status names", () => {
    render(
      <CoachingStatusCard
        status={status({ nextAction: { label: "Saatlerini ekle", href: "/dashboard/tutor/coaching/plan?step=availability" } })}
      />,
    );

    assert.equal(
      screen.getByRole("link", { name: /Saatlerini ekle/ }).getAttribute("href"),
      "/dashboard/tutor/coaching/plan?step=availability",
    );
  });

  it("falls back to the review step of the plan wizard, not to a page that no longer exists", () => {
    render(<CoachingStatusCard status={status()} />);

    const link = screen.getByRole("link", { name: /Öğrenci görünümünü aç/ });
    assert.equal(link.getAttribute("href"), "/dashboard/tutor/coaching/plan?step=publish");
    assert.doesNotMatch(link.getAttribute("href") ?? "", /\/preview$/);
  });
});
