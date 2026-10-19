import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import type { CoachingCapacityDetail } from "@/lib/coachingApi";
import { CapacityPreviewCard } from "./CapacityPreviewCard";

after(() => window.close());
afterEach(cleanup);

const capacity = {
  weekly_slot_count: 4,
  theoretical_capacity: 8,
  max_active_students: 1,
  active_students: 0,
  can_accept_new_student: false,
} as CoachingCapacityDetail;

describe("CapacityPreviewCard", () => {
  it("is a tutor's own numbers, so it wears the ink band and not the pink one", () => {
    render(<CapacityPreviewCard capacity={capacity} />);

    const band = screen.getByRole("heading", { name: "Kapasite" }).closest("div[class*='bg-ink']");
    assert.ok(band, "the heading sits on an ink band");
    assert.match(band!.className, /\btext-paper\b/);
    assert.ok(screen.getByText("%13 seçili"));
  });

  it("keeps the four figures, the two bars and the intake status", () => {
    render(<CapacityPreviewCard capacity={capacity} />);

    assert.ok(screen.getByText("4 haftalık slot"));
    assert.ok(screen.getByText("8 öğrenci teorik sınırı"));
    assert.ok(screen.getByText("1 öğrenci seçili kapasite"));
    assert.ok(screen.getByText("0 aktif öğrenci"));
    assert.ok(screen.getByText("Seçili kapasite"));
    assert.ok(screen.getByText("Aktif öğrenci yükü"));
    assert.ok(screen.getByText("Yeni öğrenci alımı kapalı"));
    assert.ok(screen.getByRole("region", { name: "Koçluk kapasitesi" }));
  });
});
