import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

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
    fireEvent.click(screen.getByRole("button", { name: "Saat aralığı ekle" }));

    assert.deepEqual(submitted, {
      day_of_week: 0,
      start_time: "18:00",
      end_time: "20:00",
    });
  });

  it("explains server-reported capacity in plain sentences", () => {
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

    const tile = (caption: string) => screen.getByText(caption).closest("li")?.textContent;
    assert.match(tile("haftalık görüşme yeri açtın") ?? "", /^6/);
    assert.match(tile("öğrenciye kadar alabilirsin (üst sınır)") ?? "", /^6/);
    assert.match(tile("öğrenciyle sınırladın") ?? "", /^4/);
    assert.match(tile("öğrenciyle şu an çalışıyorsun") ?? "", /^2/);
  });
});

const window18 = {
  id: "w1",
  day_of_week: 0,
  start_time: "18:00:00",
  end_time: "20:00:00",
  created_at: "2026-10-19T09:00:00Z",
};

function editor(windows = [window18], onDelete: (id: string) => void = () => undefined) {
  return (
    <CoachingAvailabilityEditor
      windows={windows}
      onCreate={() => undefined}
      onDelete={onDelete}
      isMutating={false}
      error={null}
    />
  );
}

describe("Coaching hours editor, step by step", () => {
  it("asks for the hours in three numbered steps", () => {
    render(editor([]));

    assert.ok(screen.getByText("Günü seç"));
    assert.ok(screen.getByText("Saatleri seç"));
    assert.ok(screen.getByText("Ekle"));
    assert.deepEqual(
      Array.from(document.querySelectorAll("[data-step]")).map((node) => node.textContent),
      ["1", "2", "3"],
    );
  });

  it("tells the tutor, before adding, how many meetings the chosen hours open", () => {
    render(editor([]));

    // The default 18:00–20:00 is two hours of 30-minute meetings.
    assert.ok(screen.getByText(/18:00–20:00 aralığı haftada 4 görüşmelik yer açar/));

    fireEvent.change(screen.getByLabelText("Bitiş"), { target: { value: "19:00" } });
    assert.ok(screen.getByText(/18:00–19:00 aralığı haftada 2 görüşmelik yer açar/));

    fireEvent.change(screen.getByLabelText("Bitiş"), { target: { value: "18:00" } });
    assert.ok(screen.getByText(/Bitiş saati başlangıçtan sonra olmalı/));
  });

  it("shows the week with a day tile each, and the meetings a day gives", () => {
    render(editor());

    assert.equal(screen.getAllByRole("article").length, 7);
    const monday = screen.getByRole("heading", { name: "Pazartesi" }).closest("article") as HTMLElement;
    assert.ok(within(monday).getByText("18:00–20:00"));
    assert.ok(within(monday).getByText("4 görüşme"));
    assert.ok(screen.getByText("Haftada 4 görüşme"));
    assert.equal(screen.getAllByText("Boş").length, 6);
  });

  it("deletes a window from its own tile", () => {
    let removed: string | null = null;
    render(editor([window18], (id) => { removed = id; }));

    fireEvent.click(screen.getByRole("button", { name: "Pazartesi 18:00 aralığını sil" }));
    assert.equal(removed, "w1");
  });

  it("counts a half-hour window as one meeting and ignores a leftover shorter than one", () => {
    render(editor([
      { ...window18, id: "a", start_time: "18:00:00", end_time: "18:30:00" },
      { ...window18, id: "b", day_of_week: 1, start_time: "16:20:00", end_time: "20:00:00" },
    ]));

    // 16:20–20:00 is 220 minutes: seven whole meetings, the last 10 minutes make none.
    assert.ok(screen.getByText("Haftada 8 görüşme"));
    assert.ok(screen.getByText("1 görüşme"));
    assert.ok(screen.getByText("7 görüşme"));
  });
});
