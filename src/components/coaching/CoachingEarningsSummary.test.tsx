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
    assert.ok(screen.getByText(/1\.234,56/));
    assert.ok(screen.getByText(/Sistem kaydında işlendi/));
    assert.equal(screen.queryByText(/bankaya yatırıldı/i), null);
    assert.equal(screen.queryByText(/ödeme tamamlandı/i), null);
    assert.ok(screen.getByText("Aylık kazanç kayıtları"));
  });
});
