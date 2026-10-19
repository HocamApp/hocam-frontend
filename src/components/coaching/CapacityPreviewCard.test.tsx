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

/** The big number that stands above a caption. */
function numberOf(caption: string): string | null | undefined {
  return screen.getByText(caption).previousElementSibling?.textContent;
}

describe("CapacityPreviewCard", () => {
  it("is a tutor's own numbers, so it wears the ink band and not the pink one", () => {
    render(<CapacityPreviewCard capacity={capacity} />);

    const band = screen.getByRole("heading", { name: "Koçluk kapasiten" }).closest("div[class*='bg-ink']");
    assert.ok(band, "the heading sits on an ink band");
    assert.match(band!.className, /\btext-paper\b/);
    assert.ok(band!.textContent?.includes("Yeni öğrenci alımı kapalı"), "the intake status is on the band");
  });

  it("says each of the four numbers in plain Turkish, number first and a sentence under it", () => {
    render(<CapacityPreviewCard capacity={capacity} />);

    assert.equal(numberOf("haftalık görüşme yeri açtın"), "4");
    assert.equal(numberOf("öğrenciye kadar alabilirsin (üst sınır)"), "8");
    assert.equal(numberOf("öğrenciyle sınırladın"), "1");
    assert.equal(numberOf("öğrenciyle şu an çalışıyorsun"), "0");
    assert.ok(screen.getByRole("region", { name: "Koçluk kapasitesi" }));
  });

  it("drops the jargon: no slot, no theoretical limit, no percentage bars", () => {
    const { container } = render(<CapacityPreviewCard capacity={capacity} />);

    assert.equal(/slot|teorik|seçili kapasite/i.test(container.textContent ?? ""), false);
    assert.equal(screen.queryByText("Aktif öğrenci yükü"), null);
    assert.equal(container.querySelectorAll("[style*='width']").length, 0);
  });

  it("opens the intake line when the tutor can take a new student", () => {
    render(<CapacityPreviewCard capacity={{ ...capacity, can_accept_new_student: true }} />);
    assert.ok(screen.getByText("Yeni öğrenci alınabilir"));
  });

  it("explains an empty week instead of showing a bare zero", () => {
    render(
      <CapacityPreviewCard
        capacity={{ ...capacity, weekly_slot_count: 0, theoretical_capacity: 0 }}
      />
    );
    assert.ok(screen.getByText(/Henüz koçluk saati eklemedin/));
    assert.ok(screen.getByText(/Koçluk saatlerin normal ders saatlerinden ayrıdır/));
  });
});
