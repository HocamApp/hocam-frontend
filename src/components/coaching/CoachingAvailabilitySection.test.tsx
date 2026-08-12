import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

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
    assert.equal(screen.getAllByRole("article").length, 7);
    assert.equal(screen.queryByText(/AM|PM/), null);
  });

  it("submits application-controlled 24-hour values without locale conversion", () => {
    let submitted: unknown = null;
    render(
      <CoachingAvailabilityEditor
        windows={[]}
        onCreate={(payload) => {
          submitted = payload;
        }}
        onDelete={() => undefined}
        isMutating={false}
        error={null}
      />
    );

    fireEvent.change(screen.getByLabelText("Başlangıç"), { target: { value: "18:00" } });
    fireEvent.change(screen.getByLabelText("Bitiş"), { target: { value: "20:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Aralık ekle" }));

    assert.deepEqual(submitted, {
      day_of_week: 0,
      start_time: "18:00",
      end_time: "20:00",
    });
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
