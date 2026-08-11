import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { CapacityPreviewCard } from "./CapacityPreviewCard";
import { CoachingAvailabilityEditor } from "./CoachingAvailabilityEditor";

after(() => window.close());
afterEach(cleanup);

describe("Coaching availability and capacity presentation", () => {
  it("makes separate Coaching availability explicit when no window exists", () => {
    render(
      <CoachingAvailabilityEditor
        windows={[]}
        onCreate={() => undefined}
        onDelete={() => undefined}
        isMutating={false}
        error={null}
      />
    );

    assert.ok(screen.getByText(/Koçluk saatlerin normal ders saatlerinden ayrıdır/));
    assert.ok(screen.getByRole("heading", { name: "Koçluk saatlerini ekle" }));
  });

  it("explains server-reported weekly slots, theoretical, selected, and active capacity", () => {
    render(
      <CapacityPreviewCard
        capacity={{
          weekly_slot_count: 6,
          theoretical_capacity: 6,
          max_active_students: 4,
          active_students: 2,
          is_accepting_new_students: true,
          can_accept_new_student: true,
          slots: [],
        }}
      />
    );

    assert.ok(screen.getByText("6 haftalık slot"));
    assert.ok(screen.getByText("6 öğrenci teorik sınırı"));
    assert.ok(screen.getByText("4 öğrenci seçili kapasite"));
    assert.ok(screen.getByText("2 aktif öğrenci"));
  });
});
