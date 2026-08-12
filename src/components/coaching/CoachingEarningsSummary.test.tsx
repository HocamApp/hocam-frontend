import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { CoachingEarningsSummary } from "./CoachingEarningsSummary";

after(() => window.close());
afterEach(cleanup);

describe("CoachingEarningsSummary", () => {
  it("formats minor units as Turkish lira and avoids settlement claims", () => {
    render(<CoachingEarningsSummary summary={{ eligible_unfunded_minor: 123456, pending_minor: 0, on_hold_minor: 100, reversed_minor: 0, payout_batches: [{ local_month: "2026-08", status: "paid", total_amount_minor: 50000, paid_at: "2026-08-10T10:00:00Z" }] }} />);
    assert.ok(screen.getAllByText(/1\.234,56/).length >= 1);
    assert.ok(screen.getByText(/Sistem kaydında işlendi/));
    assert.equal(screen.queryByText(/bankaya yatırıldı/i), null);
    assert.equal(screen.queryByText(/ödeme tamamlandı/i), null);
    assert.ok(screen.getByText("Aylık kazanç kayıtları"));
    assert.ok(screen.getByRole("heading", { name: "Finansal görünüm" }));
    assert.ok(screen.getByLabelText("Kazanç durumlarının dağılımı"));
    const distribution = screen.getByLabelText("Kazanç durumlarının dağılımı");
    const caveat = screen.getByRole("note", { name: "Finansal kayıt açıklaması" });
    assert.equal(distribution.compareDocumentPosition(caveat) & Node.DOCUMENT_POSITION_FOLLOWING, Node.DOCUMENT_POSITION_FOLLOWING);
    assert.ok(screen.getAllByText("₺500,00").length >= 1);
    assert.ok(screen.getByText("Ağustos 2026"));
  });

  it("presents a wallet hero and a real monthly chart from server batches", () => {
    render(<CoachingEarningsSummary summary={{
      eligible_unfunded_minor: 123456,
      pending_minor: 50000,
      on_hold_minor: 10000,
      reversed_minor: 0,
      payout_batches: [
        { local_month: "2026-08", status: "ready", total_amount_minor: 123456, paid_at: null },
        { local_month: "2026-06", status: "ready", total_amount_minor: 70000, paid_at: null },
        { local_month: "2026-07", status: "ready", total_amount_minor: 95000, paid_at: null },
      ],
    }} />);

    assert.ok(screen.getByRole("heading", { name: "Koçluk kazanç cüzdanı" }));
    assert.ok(screen.getAllByText("₺1.234,56").length >= 1);
    assert.ok(screen.getByRole("img", { name: "Aylık koçluk kazanç grafiği" }));
    assert.ok(screen.getByRole("region", { name: "Aylık kazanç grafiği kaydırma alanı" }));
    const chart = screen.getByTestId("coaching-earnings-chart");
    const labels = Array.from(chart.querySelectorAll("[data-chart-month]")).map((node) => node.textContent);
    assert.deepEqual(labels, ["Haz", "Tem", "Ağu"]);
    assert.ok(screen.getByText("₺700,00"));
    assert.ok(screen.getByText("₺950,00"));
    assert.equal(screen.queryByRole("button", { name: /parayı çek/i }), null);
  });

  it("keeps a finished zero chart without inventing monthly points or withdrawal", () => {
    render(<CoachingEarningsSummary summary={{
      eligible_unfunded_minor: 0,
      pending_minor: 0,
      on_hold_minor: 0,
      reversed_minor: 0,
      payout_batches: [],
    }} />);

    const chart = screen.getByTestId("coaching-earnings-chart");
    assert.ok(screen.getByRole("img", { name: "Aylık koçluk kazanç grafiği" }));
    assert.equal(chart.querySelectorAll("[data-chart-month]").length, 0);
    const axisAmounts = Array.from(chart.querySelectorAll("text"))
      .map((node) => node.textContent)
      .filter((value): value is string => Boolean(value?.startsWith("₺")));
    assert.ok(axisAmounts.length > 0);
    assert.deepEqual(new Set(axisAmounts), new Set(["₺0,00"]));
    const distributionSegments = Array.from(screen.getByLabelText("Kazanç durumlarının dağılımı").children) as HTMLElement[];
    assert.ok(distributionSegments.every((segment) => segment.style.width === "0%"));
    assert.ok(screen.getByText("Henüz grafik oluşturacak aylık kazanç kaydı yok."));
    assert.equal(screen.queryByRole("button", { name: /parayı çek/i }), null);
  });
});
