import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { ScheduleEvent } from "@/types";

let ScheduleEventCard: typeof import("./ScheduleEventCard").ScheduleEventCard;

before(async () => {
  // next/link reaches for browser globals this JSDOM setup does not provide,
  // and the card only uses it as an anchor. Same stand-in the hoca-bul tests
  // use; it forwards a ref because Radix's Slot hands it one.
  mock.module("next/link", {
    defaultExport: React.forwardRef<
      HTMLAnchorElement,
      { href: string; children?: React.ReactNode }
    >(function MockLink({ href, children, ...rest }, ref) {
      return React.createElement("a", { href, ref, ...rest }, children);
    }),
  });

  ScheduleEventCard = (await import("./ScheduleEventCard")).ScheduleEventCard;
});

after(() => window.close());
afterEach(cleanup);

function studyBlock(overrides: Partial<ScheduleEvent> = {}): ScheduleEvent {
  return {
    source: "study_block",
    id: "block-1",
    local_date: "2026-08-17",
    local_time: "19:30",
    duration_minutes: 60,
    status: "planned",
    subject: { id: "subject-1", name: "Matematik", exam_type: "TYT" },
    title: "Matematik · Soru Çözümü",
    block_type: "soru_cozumu",
    completed: false,
    editable: true,
    room_url: "",
    occurrence_date: "2026-08-17",
    recurrence: "weekly",
    block_title: "",
    ...overrides,
  };
}

function lesson(overrides: Partial<ScheduleEvent> = {}): ScheduleEvent {
  return {
    source: "booking",
    id: "booking-1",
    local_date: "2026-08-17",
    local_time: "18:00",
    duration_minutes: 40,
    status: "confirmed",
    subject: { id: "subject-1", name: "Matematik", exam_type: "TYT" },
    title: "Matematik · Memin Sönmez",
    block_type: null,
    completed: false,
    editable: false,
    room_url: "https://8x8.vc/room",
    occurrence_date: null,
    recurrence: null,
    block_title: null,
    ...overrides,
  };
}

describe("personal study blocks", () => {
  it("ticking the checkbox reports the new state to the caller", () => {
    const calls: boolean[] = [];
    render(
      <ScheduleEventCard
        event={studyBlock()}
        onToggleCompleted={(_event, completed) => calls.push(completed)}
      />
    );

    fireEvent.click(screen.getByRole("checkbox"));

    assert.deepEqual(calls, [true]);
  });

  it("un-ticking a completed block asks for false, not another true", () => {
    const calls: boolean[] = [];
    render(
      <ScheduleEventCard
        event={studyBlock({ completed: true })}
        onToggleCompleted={(_event, completed) => calls.push(completed)}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    assert.equal(checkbox.getAttribute("aria-checked"), "true");
    fireEvent.click(checkbox);

    assert.deepEqual(calls, [false]);
  });

  it("does not fire while the occurrence is still saving", () => {
    const calls: boolean[] = [];
    render(
      <ScheduleEventCard
        event={studyBlock()}
        pending
        onToggleCompleted={(_event, completed) => calls.push(completed)}
      />
    );

    fireEvent.click(screen.getByRole("checkbox"));

    assert.deepEqual(calls, []);
  });

  it("offers edit and delete, and passes the whole event back", () => {
    const edited: string[] = [];
    const deleted: string[] = [];
    render(
      <ScheduleEventCard
        event={studyBlock()}
        onEdit={(event) => edited.push(event.id)}
        onDelete={(event) => deleted.push(event.id)}
      />
    );

    fireEvent.click(screen.getByLabelText("Çalışmayı düzenle"));
    fireEvent.click(screen.getByLabelText("Çalışmayı sil"));

    assert.deepEqual(edited, ["block-1"]);
    assert.deepEqual(deleted, ["block-1"]);
  });

  it("prefers the student's own note over the composed title when compact", () => {
    render(
      <ScheduleEventCard
        event={studyBlock({ block_title: "Türev tekrar" })}
        density="compact"
      />
    );

    assert.ok(screen.getByText("Türev tekrar"));
    assert.equal(screen.queryByText("Matematik · Soru Çözümü"), null);
  });

  it("falls back to the subject when there is no note", () => {
    render(<ScheduleEventCard event={studyBlock()} density="compact" />);

    assert.ok(screen.getByText("Matematik"));
  });

  it("keeps the composed title at full density", () => {
    render(<ScheduleEventCard event={studyBlock({ block_title: "Türev tekrar" })} />);

    assert.ok(screen.getByText("Matematik · Soru Çözümü"));
  });
});

describe("lessons and coaching are read-only", () => {
  it("shows no checkbox, no edit and no delete", () => {
    render(
      <ScheduleEventCard
        event={lesson()}
        onToggleCompleted={() => assert.fail("a lesson must not be tickable")}
        onEdit={() => assert.fail("a lesson must not be editable")}
        onDelete={() => assert.fail("a lesson must not be deletable")}
      />
    );

    assert.equal(screen.queryByRole("checkbox"), null);
    assert.equal(screen.queryByLabelText("Çalışmayı düzenle"), null);
    assert.equal(screen.queryByLabelText("Çalışmayı sil"), null);
  });

  it("says it is read-only for a screen reader, not only with a lock glyph", () => {
    render(<ScheduleEventCard event={lesson()} />);

    assert.ok(screen.getByText(", salt okunur"));
  });

  it("links a lesson to the in-app session, never the raw room url", () => {
    render(<ScheduleEventCard event={lesson()} />);

    const link = screen.getByText("Derse git").closest("a");
    assert.equal(link?.getAttribute("href"), "/session/booking-1");
  });

  it("links coaching to its own session route", () => {
    render(
      <ScheduleEventCard
        event={lesson({ source: "coaching", id: "session-9", subject: null })}
      />
    );

    const link = screen.getByText("Görüşmeye git").closest("a");
    assert.equal(link?.getAttribute("href"), "/session/coaching/session-9");
  });
});
