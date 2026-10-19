import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";

import type { CoachingPlanPreview, CoachingRevenuePreview } from "@/lib/coachingApi";
import type { CoachingSettingRow } from "@/lib/coachingPlanSummary";
import { CoachingReviewStep } from "./CoachingReviewStep";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });
after(() => window.close());
afterEach(cleanup);

const preview: CoachingPlanPreview = {
  tutor_name: "Deniz K.",
  frequency: "weekly",
  frequency_display: "Haftada bir",
  session_duration_minutes: 30,
  price_per_session_minor: 60000,
  price_per_session_display: "600,00 ₺",
  is_free: false,
  target_exam_types: ["YKS", "DGS"],
  description: "İlk görüşmede seviyeni çıkarıp haftalık programı birlikte yazarız.",
  capacity_available: true,
};

const revenue: CoachingRevenuePreview = {
  commission_bps: 1750,
  unit_price_minor: 60000,
  unit_price_display: "600,00 ₺",
  rows: [
    {
      duration_days: 30,
      weeks: 4,
      total_sessions: 4,
      discount_percent: 0,
      subtotal_price_minor: 240000,
      subtotal_price_display: "2.400,00 ₺",
      discount_amount_minor: 0,
      discount_amount_display: "0,00 ₺",
      total_price_minor: 240000,
      total_price_display: "2.400,00 ₺",
      platform_fee_minor: 42000,
      platform_fee_display: "420,00 ₺",
      tutor_net_minor: 198000,
      tutor_net_display: "1.980,00 ₺",
    },
  ],
};

const draft = { is_published: false, is_accepting_new_students: true };

const rows: CoachingSettingRow[] = [
  { step: "frequency", label: "Görüşme düzeni", value: "Haftada bir", hint: null, chip: null },
  { step: "availability", label: "Koçluk saatlerin", value: "Haftada 12 görüşme yeri", hint: null, chip: null },
];

describe("CoachingReviewStep", () => {
  it("shows what the student will see, the saved settings and the earnings side by side", () => {
    render(
      <CoachingReviewStep
        plan={draft}
        preview={preview}
        revenue={revenue}
        rows={rows}
        missingSteps={[]}
        error={null}
        actions={<button>Teklifi yayınla</button>}
      />
    );

    assert.ok(screen.getByText("Öğrenci seni böyle görür"));
    assert.ok(screen.getByText(preview.description));
    assert.ok(screen.getByRole("heading", { name: "Hazır olanlar" }));
    assert.ok(screen.getByRole("region", { name: "Tahmini kazanç" }));
  });

  it("marks each setting with a gold tick and a Düzenle link back to its step", () => {
    render(
      <CoachingReviewStep
        plan={draft}
        preview={preview}
        revenue={revenue}
        rows={rows}
        missingSteps={[]}
        error={null}
        actions={null}
      />
    );

    const list = screen.getByRole("list", { name: "Hazır olanlar" });
    assert.equal(within(list).getAllByRole("listitem").length, 2);
    assert.equal(list.querySelectorAll("[class*='bg-gold']").length, 2);
    assert.equal(
      screen.getByRole("link", { name: "Düzenle Görüşme düzeni" }).getAttribute("href"),
      "/dashboard/tutor/coaching/plan?step=frequency"
    );
  });

  it("offers the publish actions once nothing is missing", () => {
    render(
      <CoachingReviewStep
        plan={draft}
        preview={preview}
        revenue={revenue}
        rows={rows}
        missingSteps={[]}
        error={null}
        actions={<button>Teklifi yayınla</button>}
      />
    );

    const panel = screen.getByRole("region", { name: "Yayın durumu" });
    assert.ok(within(panel).getByRole("button", { name: "Teklifi yayınla" }));
    assert.ok(within(panel).getByText(/Yayınlayınca başvuru alabilirsin/));
    assert.equal(screen.queryByRole("alert"), null);
  });

  it("holds the publish action back and points at the unfinished step instead", () => {
    render(
      <CoachingReviewStep
        plan={draft}
        preview={preview}
        revenue={revenue}
        rows={rows}
        missingSteps={["availability"]}
        error={null}
        actions={<button>Teklifi yayınla</button>}
      />
    );

    assert.equal(screen.queryByRole("button", { name: "Teklifi yayınla" }), null);
    assert.equal(screen.queryByRole("region", { name: "Yayın durumu" }), null);
    const alert = screen.getByRole("alert");
    assert.match(alert.textContent ?? "", /Yayınlamadan önce şu adımı tamamla: Koçluk saatlerin\./);
    const link = within(alert.parentElement as HTMLElement).getByRole("link", { name: "Eksik adıma git" });
    assert.equal(link.getAttribute("href"), "/dashboard/tutor/coaching/plan?step=availability");
  });

  it("shows skeletons, not empty cards, while the previews load", () => {
    render(
      <CoachingReviewStep
        plan={draft}
        preview={null}
        revenue={null}
        rows={rows}
        missingSteps={[]}
        error={null}
        actions={null}
      />
    );

    assert.equal(screen.queryByRole("region", { name: "Tahmini kazanç" }), null);
    assert.ok(screen.getByRole("heading", { name: "Hazır olanlar" }));
  });

  it("shows a server error such as a refused publish", () => {
    render(
      <CoachingReviewStep
        plan={draft}
        preview={preview}
        revenue={revenue}
        rows={rows}
        missingSteps={[]}
        error="Teklif yayınlanamadı."
        actions={null}
      />
    );

    assert.ok(screen.getByText("Teklif yayınlanamadı."));
  });
});
