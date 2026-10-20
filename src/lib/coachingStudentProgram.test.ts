import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CoachingProgram, CoachingProgramTask } from "./coachingApi";
import { buildStudentProgram } from "./coachingStudentProgram";

// Tuesday 20 October 2026, 15:20 in Istanbul (UTC+3). Tests never read the clock.
const NOW = new Date("2026-10-20T12:20:00Z");

function task(overrides: Partial<CoachingProgramTask> & { id: string }): CoachingProgramTask {
  return {
    title: `Görev ${overrides.id}`,
    description: "",
    subject: "",
    due_date: null,
    priority: null,
    sort_order: 1,
    is_completed: false,
    completed_at: null,
    ...overrides,
  };
}

function program(tasks: CoachingProgramTask[], overrides: Partial<CoachingProgram> = {}): CoachingProgram {
  return {
    id: "pr-1",
    service_period_id: "p-1",
    title: "Ekim programı",
    objective: "Ekim sonuna kadar TYT matematik netini 22'den 28'e çıkarmak.",
    start_date: "2026-10-12",
    end_date: "2026-11-09",
    tasks,
    ...overrides,
  };
}

const tasks = [
  task({ id: "t1", due_date: "2026-10-21", sort_order: 2 }),
  task({ id: "t1b", due_date: "2026-10-21", sort_order: 1 }),
  task({ id: "t2", due_date: "2026-10-22", sort_order: 3 }),
  task({ id: "late", due_date: "2026-10-18", sort_order: 5, subject: "Fizik", priority: "Yüksek" }),
  task({ id: "today", due_date: "2026-10-20", sort_order: 4 }),
  task({ id: "nodate1", sort_order: 7 }),
  task({ id: "nodate2", sort_order: 6 }),
  task({ id: "done1", is_completed: true, completed_at: "2026-10-16T09:00:00Z", due_date: "2026-10-17" }),
  task({ id: "done2", is_completed: true, completed_at: "2026-10-14T09:00:00Z", due_date: "2026-10-15" }),
  task({ id: "doneNoStamp", is_completed: true, completed_at: null }),
];

describe("buildStudentProgram: the order of what is left", () => {
  const { pending } = buildStudentProgram({ program: program(tasks), now: NOW });

  it("goes by date, the overdue one first by being the earliest, undated ones last, the tutor's order breaking ties", () => {
    assert.deepEqual(
      pending.map((row) => row.id),
      ["late", "today", "t1b", "t1", "t2", "nodate2", "nodate1"],
    );
  });

  it("marks only what is past its day as overdue", () => {
    assert.deepEqual(
      pending.filter((row) => row.overdue).map((row) => row.id),
      ["late"],
    );
  });

  it("writes the date for people and keeps what the tutor typed", () => {
    const late = pending.find((row) => row.id === "late")!;
    assert.equal(late.dateLabel, "Paz 18 Eki");
    assert.deepEqual(late.date, { weekday: "Paz", day: 18, month: "Eki" });
    assert.equal(late.subject, "Fizik");
    assert.equal(late.priority, "Yüksek");
    const bare = pending.find((row) => row.id === "t2")!;
    assert.equal(bare.subject, null);
    assert.equal(bare.priority, null);
    assert.equal(bare.description, null);
    assert.equal(pending.find((row) => row.id === "nodate1")!.dateLabel, null);
  });

  it("decides overdue by the Istanbul day: just after midnight there, today's task is late", () => {
    // 21:30Z on the 20th is 00:30 on the 21st in Istanbul.
    const after = buildStudentProgram({ program: program(tasks), now: new Date("2026-10-20T21:30:00Z") }).pending;
    assert.deepEqual(
      after.filter((row) => row.overdue).map((row) => row.id),
      ["late", "today"],
    );
  });
});

describe("buildStudentProgram: what is done", () => {
  const { completed, goal } = buildStudentProgram({ program: program(tasks), now: NOW });

  it("lists the latest finished first, with the day it was finished", () => {
    assert.deepEqual(completed.map((row) => row.id), ["done1", "done2", "doneNoStamp"]);
    assert.equal(completed[0].completedLabel, "Tamamlandı Cum 16 Eki");
    assert.equal(completed[2].completedLabel, "Tamamlandı");
    assert.equal(completed[0].overdue, false);
  });

  it("counts finished against all", () => {
    assert.equal(goal.doneCount, 3);
    assert.equal(goal.total, 10);
  });
});

describe("buildStudentProgram: the goal and its timeline", () => {
  it("places today on the line between the program's two dates", () => {
    const { goal } = buildStudentProgram({ program: program([]), now: NOW });
    assert.equal(goal.title, "Ekim programı");
    assert.equal(goal.objective, "Ekim sonuna kadar TYT matematik netini 22'den 28'e çıkarmak.");
    assert.deepEqual(goal.timeline, { startLabel: "12 Eki", endLabel: "9 Kas", elapsedPercent: 29 });
  });

  it("keeps today on the line when the program has not started or is over", () => {
    const before = buildStudentProgram({ program: program([]), now: new Date("2026-10-01T09:00:00Z") });
    assert.equal(before.goal.timeline?.elapsedPercent, 0);
    const after = buildStudentProgram({ program: program([]), now: new Date("2026-12-01T09:00:00Z") });
    assert.equal(after.goal.timeline?.elapsedPercent, 100);
  });

  it("names the one end it knows and draws no line, and none at all without dates", () => {
    const onlyEnd = buildStudentProgram({ program: program([], { start_date: null }), now: NOW });
    assert.deepEqual(onlyEnd.goal.timeline, { startLabel: null, endLabel: "9 Kas", elapsedPercent: null });
    const none = buildStudentProgram({ program: program([], { start_date: null, end_date: null }), now: NOW });
    assert.equal(none.goal.timeline, null);
  });

  it("leaves the objective empty so the page can fall back to the title", () => {
    const { goal } = buildStudentProgram({ program: program([], { objective: "  " }), now: NOW });
    assert.equal(goal.objective, "");
  });
});
