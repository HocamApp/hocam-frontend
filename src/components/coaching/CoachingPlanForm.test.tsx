import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { CoachingSetupConfig } from "@/lib/coachingApi";
import { CoachingPlanForm } from "./CoachingPlanForm";

after(() => window.close());
afterEach(cleanup);

const setupConfig: CoachingSetupConfig = {
  exam_groups: ["YKS", "DGS", "KPSS"],
  session_duration_minutes: 30,
  lesson_price_minor: 107000,
  // Deliberately not the minor value. The component must compute
  // from *_minor; if it ever echoes the server string instead, the
  // negative assertion below is what catches it.
  lesson_price_display: "9.999,99 ₺",
  max_price_ratio_percent: 72,
  price_cap_minor: 77040,
  price_cap_display: "8.888,88 ₺",
  commission_bps: 1234,
  frequency_options: [
    {
      value: "weekly",
      label: "Haftada bir",
      packages: [
        { duration_days: 14, weeks: 2, total_sessions: 2 },
        { duration_days: 30, weeks: 4, total_sessions: 4 },
        { duration_days: 90, weeks: 12, total_sessions: 12 },
        { duration_days: 180, weeks: 24, total_sessions: 24 },
      ],
    },
  ],
};

function form(step: "frequency" | "price" | "exams") {
  return (
    <CoachingPlanForm
      plan={null}
      setupConfig={setupConfig}
      currentStep={step}
      capacity={null}
      onSubmit={() => undefined}
      onContinue={() => undefined}
      isSaving={false}
      error={null}
    />
  );
}

describe("CoachingPlanForm", () => {
  it("renders frequency package counts only from server setup config", () => {
    render(form("frequency"));
    const selected = screen.getByRole("button", { name: /Haftada bir/ });
    assert.equal(selected.getAttribute("aria-pressed"), "true");
    assert.ok(selected.textContent?.includes("Seçili düzen"));
    assert.ok(screen.getByText("4 haftada"));
    assert.ok(screen.getByText("4 görüşme"));
    assert.ok(screen.getByText("24 haftada"));
    assert.ok(screen.getByText("24 görüşme"));
  });

  it("explains the dynamic lesson-price cap without hardcoding 75 percent", () => {
    render(form("price"));
    assert.ok(screen.getByText(/1\.070,00\s₺/));
    assert.ok(screen.getByText(/%72/));
    assert.ok(screen.getByText(/770,40\s₺/));
    assert.equal(screen.queryByText(/%75/), null);
  });

  it("formats setup money from canonical minor values", () => {
    render(form("price"));
    assert.ok(screen.getByText("1.070,00 ₺"));
    assert.ok(screen.getByText("770,40 ₺"));
    assert.equal(screen.queryByText("9.999,99 ₺"), null);
  });

  it("offers only the server-provided canonical Coaching exams", () => {
    render(form("exams"));
    const yks = screen.getByRole("button", { name: /YKS/ });
    assert.ok(yks.textContent?.includes("TYT, AYT ve YDT hedeflerini birlikte kapsar"));
    fireEvent.click(yks);
    assert.equal(yks.getAttribute("aria-pressed"), "true");
    assert.ok(yks.textContent?.includes("Seçildi"));
    assert.ok(screen.getByRole("button", { name: "DGS" }));
    assert.ok(screen.getByRole("button", { name: "KPSS" }));
    assert.equal(screen.queryByRole("button", { name: "TYT" }), null);
    assert.equal(screen.queryByRole("button", { name: "AYT" }), null);
    assert.equal(screen.queryByRole("button", { name: "YDT" }), null);
  });
});
