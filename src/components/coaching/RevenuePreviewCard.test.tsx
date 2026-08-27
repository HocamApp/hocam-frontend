import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import type { CoachingRevenuePreview } from "@/lib/coachingApi";
import { RevenuePreviewCard } from "./RevenuePreviewCard";

after(() => window.close());
afterEach(cleanup);

Object.defineProperty(globalThis, "requestAnimationFrame", {
  configurable: true,
  value: (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  },
});
Object.defineProperty(globalThis, "cancelAnimationFrame", {
  configurable: true,
  value: () => undefined,
});

const row = (weeks: number, net: string) => ({
  duration_days: weeks === 4 ? 30 : 14,
  weeks,
  total_sessions: weeks,
  discount_percent: weeks === 4 ? 6 : 1,
  subtotal_price_minor: 100000,
  subtotal_price_display: "1.000,00 ₺",
  discount_amount_minor: 6000,
  discount_amount_display: "60,00 ₺",
  total_price_minor: 94000,
  total_price_display: "940,00 ₺",
  platform_fee_minor: 14100,
  platform_fee_display: "141,00 ₺",
  tutor_net_minor: 79900,
  tutor_net_display: net,
});

describe("RevenuePreviewCard", () => {
  it("uses the server-returned four-week row as the primary summary", () => {
    const preview: CoachingRevenuePreview = {
      commission_bps: 1500,
      unit_price_minor: 25000,
      unit_price_display: "250,00 ₺",
      rows: [row(2, "iki-hafta-net"), row(4, "dört-hafta-net")],
    };
    render(<RevenuePreviewCard preview={preview} />);

    assert.ok(screen.getByText("799,00 ₺"));
    assert.equal(screen.queryByText("dört-hafta-net"), null);
    assert.ok(screen.getByText("940,00 ₺"));
    assert.ok(screen.getByText("4 görüşme"));
    assert.ok(screen.getByRole("region", { name: "Sunucu hesaplamalı kazanç tahmini" }));
    assert.ok(screen.getByText("Öğrencinin koçluk toplamı"));
    assert.ok(screen.getByText("Platform komisyonu"));
    assert.ok(screen.getByRole("button", { name: "Diğer paketlerde kazancını gör" }));
  });
});
