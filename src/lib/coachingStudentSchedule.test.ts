import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CoachingTimeRequest } from "./coachingApi";
import {
  buildScheduleSummary,
  buildTimeRequestRows,
  groupSlotsByDay,
  scheduleDeadline,
  toggleScheduleSlot,
  type PickedScheduleSlot,
} from "./coachingStudentSchedule";

describe("groupSlotsByDay", () => {
  it("puts the days in week order and the hours in clock order, once each", () => {
    const days = groupSlotsByDay([
      { day_of_week: 2, start_time: "19:00:00" },
      { day_of_week: 0, start_time: "18:30:00" },
      { day_of_week: 0, start_time: "17:00:00" },
      { day_of_week: 0, start_time: "17:00:00" },
    ]);

    assert.deepEqual(days, [
      {
        day: 0,
        label: "Pazartesi",
        times: [
          { value: "17:00:00", label: "17:00" },
          { value: "18:30:00", label: "18:30" },
        ],
      },
      { day: 2, label: "Çarşamba", times: [{ value: "19:00:00", label: "19:00" }] },
    ]);
  });

  it("reads hours with or without seconds", () => {
    const [monday] = groupSlotsByDay([
      { day_of_week: 0, start_time: "18:30" },
      { day_of_week: 0, start_time: "09:00" },
    ]);

    assert.deepEqual(monday.times.map((time) => time.label), ["09:00", "18:30"]);
  });

  it("is empty when there are no slots", () => {
    assert.deepEqual(groupSlotsByDay([]), []);
  });
});

describe("toggleScheduleSlot", () => {
  const tuesday = { day: 1, time: "18:30:00" };
  const saturday = { day: 5, time: "11:00:00" };
  const thursday = { day: 3, time: "17:30:00" };
  const pick = (selected: PickedScheduleSlot[], slot: { day: number; time: string }, locked = {}) =>
    toggleScheduleSlot({ requiredCount: 2, locked, selected, day: slot.day, time: slot.time });

  it("fills the lowest open slot first", () => {
    const first = pick([], tuesday);
    assert.deepEqual(first, [{ slot_index: 0, day_of_week: 1, start_time: "18:30:00" }]);

    const second = pick(first, saturday);
    assert.deepEqual(second.map((slot) => slot.slot_index), [0, 1]);
  });

  it("takes a chosen hour back on a second click, and the next pick fills the gap", () => {
    const both = pick(pick([], tuesday), saturday);

    const afterRemoving = pick(both, tuesday);
    assert.deepEqual(afterRemoving, [{ slot_index: 1, day_of_week: 5, start_time: "11:00:00" }]);

    const refilled = pick(afterRemoving, thursday);
    assert.deepEqual(
      refilled.map((slot) => [slot.slot_index, slot.day_of_week]),
      [
        [1, 5],
        [0, 3],
      ],
    );
  });

  it("ignores a pick when every open slot is already filled", () => {
    const both = pick(pick([], tuesday), saturday);

    assert.deepEqual(pick(both, thursday), both);
  });

  it("leaves a slot the tutor's proposal already fixed alone", () => {
    const locked = { 0: { day_of_week: 3, start_time: "21:00:00" } };

    const first = pick([], tuesday, locked);
    assert.deepEqual(first, [{ slot_index: 1, day_of_week: 1, start_time: "18:30:00" }]);
    assert.deepEqual(pick(first, saturday, locked), first);
  });
});

describe("buildScheduleSummary", () => {
  const tuesday: PickedScheduleSlot = { slot_index: 0, day_of_week: 1, start_time: "18:30:00" };

  it("names each slot, what is chosen for it, and how many are still to pick", () => {
    const summary = buildScheduleSummary({ requiredCount: 2, selected: [tuesday], locked: {} });

    assert.deepEqual(summary.rows, [
      { slotIndex: 0, label: "1. saat", value: "Salı 18:30", locked: false },
      { slotIndex: 1, label: "2. saat", value: null, locked: false },
    ]);
    assert.equal(summary.chosen, 1);
    assert.equal(summary.complete, false);
    assert.equal(summary.hint, "1 saat daha seç");
  });

  it("asks for all of them before anything is chosen", () => {
    const summary = buildScheduleSummary({ requiredCount: 2, selected: [], locked: {} });

    assert.equal(summary.hint, "2 saat seç");
    assert.equal(summary.chosen, 0);
  });

  it("counts a slot fixed by the tutor's proposal as chosen, and marks it", () => {
    const summary = buildScheduleSummary({
      requiredCount: 2,
      selected: [tuesday],
      locked: { 1: { day_of_week: 3, start_time: "21:00:00" } },
    });

    assert.deepEqual(summary.rows[1], { slotIndex: 1, label: "2. saat", value: "Perşembe 21:00", locked: true });
    assert.equal(summary.complete, true);
    assert.equal(summary.hint, null);
  });
});

describe("scheduleDeadline", () => {
  const deadlineAt = "2026-10-24T15:00:00Z"; // Saturday 24 October, 18:00 in Istanbul

  it("says the deadline as a day and a time, in Istanbul", () => {
    const deadline = scheduleDeadline({ deadlineAt, now: new Date("2026-10-20T12:20:00Z") });

    assert.equal(deadline?.value, "24 Ekim Cumartesi 18:00");
  });

  it("says how long is left in the two units that matter", () => {
    const at = (iso: string) => scheduleDeadline({ deadlineAt, now: new Date(iso) })?.remaining;

    assert.equal(at("2026-10-20T12:20:00Z"), "4 gün 2 saat kaldı");
    assert.equal(at("2026-10-20T15:00:00Z"), "4 gün kaldı");
    assert.equal(at("2026-10-24T11:30:00Z"), "3 saat 30 dakika kaldı");
    assert.equal(at("2026-10-24T12:00:00Z"), "3 saat kaldı");
    assert.equal(at("2026-10-24T14:35:00Z"), "25 dakika kaldı");
    assert.equal(at("2026-10-24T14:59:30Z"), "1 dakikadan az kaldı");
  });

  it("is expired at the deadline and after it", () => {
    const at = (iso: string) => scheduleDeadline({ deadlineAt, now: new Date(iso) });

    assert.deepEqual(
      [at("2026-10-24T15:00:00Z")?.expired, at("2026-10-25T09:00:00Z")?.expired, at("2026-10-24T14:59:59Z")?.expired],
      [true, true, false],
    );
    assert.equal(at("2026-10-24T15:00:00Z")?.remaining, "Süre doldu");
  });

  it("is nothing when the server gave no deadline", () => {
    assert.equal(scheduleDeadline({ deadlineAt: null, now: new Date() }), null);
  });
});

describe("buildTimeRequestRows", () => {
  function request(slotIndex: number, extra: Partial<CoachingTimeRequest> = {}): CoachingTimeRequest {
    return {
      id: `tr-${slotIndex}`,
      slot_index: slotIndex,
      status: "pending",
      note: "",
      requested_at: "2026-10-20T10:00:00Z",
      expires_at: "2026-10-22T10:00:00Z",
      resolved_at: null,
      proposals: [],
      ...extra,
    };
  }
  const rows = (requests: CoachingTimeRequest[], extra: { lockedIndexes?: number[]; selectedIndexes?: number[] } = {}) =>
    buildTimeRequestRows({
      requiredCount: 2,
      lockedIndexes: extra.lockedIndexes ?? [],
      selectedIndexes: extra.selectedIndexes ?? [],
      requests,
    });

  it("offers a request for every slot that is not chosen yet", () => {
    assert.deepEqual(rows([]), [
      { kind: "ask", slotIndex: 0, label: "1. saat" },
      { kind: "ask", slotIndex: 1, label: "2. saat" },
    ]);
  });

  it("has no row for a slot that is chosen or fixed", () => {
    assert.deepEqual(
      rows([], { selectedIndexes: [0], lockedIndexes: [1] }).map((row) => row.slotIndex),
      [],
    );
  });

  it("keeps the row of a chosen slot while its request is still open", () => {
    const open = request(0, {
      proposals: [
        { id: "p-1", day_of_week: 3, start_time: "21:00:00", status: "pending", proposed_at: "2026-10-20T11:00:00Z", responded_at: null },
      ],
    });

    // Slot 0 is chosen but its request is open, so it keeps its row; slot 1 is not chosen and has one too.
    assert.deepEqual(
      rows([open], { selectedIndexes: [0] }).map((row) => row.kind),
      ["proposal", "ask"],
    );
    // Without the open request a chosen slot has no row.
    assert.deepEqual(
      rows([], { selectedIndexes: [0] }).map((row) => row.slotIndex),
      [1],
    );
  });

  it("says the request is waiting, until when, and which request to withdraw", () => {
    const [first] = rows([request(0)]);

    assert.deepEqual(first, {
      kind: "waiting",
      slotIndex: 0,
      label: "1. saat",
      requestId: "tr-0",
      answerBy: "22 Ekim Perşembe 13:00",
    });
  });

  it("shows the tutor's proposal as a day and a time to accept or decline", () => {
    const withProposal = request(1, {
      proposals: [
        { id: "p-1", day_of_week: 3, start_time: "21:00:00", status: "pending", proposed_at: "2026-10-20T11:00:00Z", responded_at: null },
        { id: "p-0", day_of_week: 2, start_time: "20:00:00", status: "declined", proposed_at: "2026-10-20T10:30:00Z", responded_at: "2026-10-20T10:40:00Z" },
      ],
    });

    const row = rows([withProposal])[1];

    assert.deepEqual(row, {
      kind: "proposal",
      slotIndex: 1,
      label: "2. saat",
      requestId: "tr-1",
      answerBy: "22 Ekim Perşembe 13:00",
      proposals: [{ id: "p-1", when: "Perşembe 21:00" }],
    });
  });

  it("asks again after a request was withdrawn or found no common hour", () => {
    assert.deepEqual(
      rows([request(0, { status: "withdrawn" }), request(1, { status: "unresolved" })]).map((row) => row.kind),
      ["ask", "ask"],
    );
  });

  it("says a common hour was found", () => {
    assert.deepEqual(rows([request(1, { status: "matched" })])[1], { kind: "matched", slotIndex: 1, label: "2. saat" });
  });

  it("uses the newest request when a slot has several", () => {
    const newest = request(0, { id: "tr-new", status: "pending" });
    const old = request(0, { id: "tr-old", status: "withdrawn" });

    const [row] = rows([newest, old]);

    assert.equal(row.kind === "waiting" ? row.requestId : null, "tr-new");
  });
});
