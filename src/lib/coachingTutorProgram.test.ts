import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CoachingProgram, CoachingProgramTask, CoachingStudentRow } from "./coachingApi";
import {
  EMPTY_TASK_FORM,
  PRIORITY_CHOICES,
  buildTutorProgram,
  programFormError,
  programPageTitle,
  priorityChoices,
  taskFormError,
  taskFormFrom,
  toProgramPayload,
  toTaskPayload,
} from "./coachingTutorProgram";

// Wednesday 21 Ekim 2026, 14:00 in Istanbul.
const NOW = new Date("2026-10-21T11:00:00Z");

function task(overrides: Partial<CoachingProgramTask>): CoachingProgramTask {
  return {
    id: "t-1",
    title: "Görev",
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
    id: "p-1",
    service_period_id: "sp-1",
    title: "Ekim–Aralık YKS programı",
    objective: "TYT matematikte 25 nete çıkmak",
    start_date: "2026-10-12",
    end_date: "2026-12-20",
    tasks,
    ...overrides,
  };
}

describe("buildTutorProgram", () => {
  const tasks = [
    task({ id: "a", title: "Undated one", sort_order: 1 }),
    task({ id: "b", title: "Paragraf denemesi", due_date: "2026-10-22", subject: "Türkçe", priority: "Orta", sort_order: 2 }),
    task({ id: "c", title: "Limit", due_date: "2026-10-20", subject: "AYT Matematik", priority: "Yüksek", sort_order: 3 }),
    task({
      id: "d",
      title: "Fonksiyonlar",
      due_date: "2026-10-18",
      is_completed: true,
      completed_at: "2026-10-19T09:30:00Z",
      sort_order: 4,
    }),
    task({ id: "e", title: "Same day, made later", due_date: "2026-10-22", sort_order: 5 }),
  ];
  const model = buildTutorProgram({ program: program(tasks), now: NOW });

  it("lists what is open by date, the overdue one first, undated last and ties in the order they were made, then what is done", () => {
    assert.equal(model.rows.map((row) => row.id).join(","), "c,b,e,a,d");
  });

  it("counts what the student has done, and what is late", () => {
    assert.equal(model.doneCount, 1);
    assert.equal(model.total, 5);
    assert.equal(model.overdueCount, 1);
    assert.equal(model.percent, 20);
  });

  it("says each row's date in the words of the student's screen, the late one as late", () => {
    const byId = Object.fromEntries(model.rows.map((row) => [row.id, row]));
    assert.equal(byId.c.dateLabel, "Sal 20 Eki");
    assert.equal(byId.c.overdue, true);
    assert.equal(byId.b.dateLabel, "Per 22 Eki");
    assert.equal(byId.b.overdue, false);
    assert.equal(byId.a.dateLabel, null);
  });

  it("says who finished a task and when, and nothing for an open one", () => {
    const byId = Object.fromEntries(model.rows.map((row) => [row.id, row]));
    assert.equal(byId.d.completedLabel, "Öğrenci tamamladı · Pzt 19 Eki");
    assert.equal(byId.d.overdue, false);
    assert.equal(byId.b.completedLabel, null);
  });

  it("keeps the task itself on the row, so an edit starts from what is stored", () => {
    assert.equal(model.rows[0].task.id, "c");
    assert.equal(model.rows[0].task.due_date, "2026-10-20");
  });

  it("writes the span of the program and has no percent for an empty list", () => {
    assert.equal(model.rangeLabel, "12 Eki – 20 Ara");
    const empty = buildTutorProgram({ program: program([]), now: NOW });
    assert.equal(empty.percent, null);
    assert.equal(empty.total, 0);
    assert.equal(empty.rows.length, 0);
  });

  it("falls back to what it has when a program has no dates", () => {
    const one = buildTutorProgram({ program: program([], { start_date: null, end_date: "2026-12-20" }), now: NOW });
    assert.equal(one.rangeLabel, "20 Ara");
    const none = buildTutorProgram({ program: program([], { start_date: null, end_date: null }), now: NOW });
    assert.equal(none.rangeLabel, null);
  });

  it("calls a task done without a time just done", () => {
    const result = buildTutorProgram({
      program: program([task({ id: "x", is_completed: true, completed_at: null })]),
      now: NOW,
    });
    assert.equal(result.rows[0].completedLabel, "Öğrenci tamamladı");
  });
});

describe("priorityChoices", () => {
  it("offers the three, and the old free text when a task already has it, so editing does not wipe it", () => {
    assert.deepEqual([...PRIORITY_CHOICES], ["Yüksek", "Orta", "Düşük"]);
    assert.deepEqual(priorityChoices(""), ["Yüksek", "Orta", "Düşük"]);
    assert.deepEqual(priorityChoices("Orta"), ["Yüksek", "Orta", "Düşük"]);
    assert.deepEqual(priorityChoices("acil"), ["Yüksek", "Orta", "Düşük", "acil"]);
  });
});

describe("task form", () => {
  it("starts empty and is read back from a stored task", () => {
    assert.deepEqual(EMPTY_TASK_FORM, { title: "", subject: "", description: "", due_date: "", priority: "" });
    assert.deepEqual(
      taskFormFrom(task({ title: "T", subject: "Fizik", description: "d", due_date: "2026-10-22", priority: "Orta" })),
      { title: "T", subject: "Fizik", description: "d", due_date: "2026-10-22", priority: "Orta" }
    );
    assert.deepEqual(taskFormFrom(task({})), { title: "Görev", subject: "", description: "", due_date: "", priority: "" });
  });

  it("is sent trimmed, with no date or priority as null", () => {
    assert.deepEqual(
      toTaskPayload({ title: "  Limit  ", subject: " AYT ", description: " ", due_date: "", priority: "" }),
      { title: "Limit", subject: "AYT", description: "", due_date: null, priority: null }
    );
    assert.deepEqual(
      toTaskPayload({ title: "x", subject: "", description: "", due_date: "2026-10-22", priority: "Yüksek" }),
      { title: "x", subject: "", description: "", due_date: "2026-10-22", priority: "Yüksek" }
    );
  });

  it("needs a title, and does not let a field outgrow what the server keeps", () => {
    assert.equal(taskFormError(EMPTY_TASK_FORM), "Görev başlığını yaz.");
    assert.equal(taskFormError({ ...EMPTY_TASK_FORM, title: "   " }), "Görev başlığını yaz.");
    assert.equal(taskFormError({ ...EMPTY_TASK_FORM, title: "a".repeat(241) }), "Görev başlığı en çok 240 karakter olabilir.");
    assert.equal(taskFormError({ ...EMPTY_TASK_FORM, title: "a".repeat(240) }), null);
    assert.equal(
      taskFormError({ ...EMPTY_TASK_FORM, title: "x", subject: "a".repeat(121) }),
      "Ders adı en çok 120 karakter olabilir."
    );
    assert.equal(
      taskFormError({ ...EMPTY_TASK_FORM, title: "x", priority: "bu çok uzun bir öncelik yazısı" }),
      "Öncelik en çok 20 karakter olabilir."
    );
  });
});

describe("program form", () => {
  const ok = { title: "Ekim programı", objective: "Hedef", start_date: "2026-10-12", end_date: "2026-12-20" };

  it("is sent trimmed", () => {
    assert.deepEqual(toProgramPayload({ ...ok, title: "  Ekim programı  ", objective: " Hedef " }), ok);
  });

  it("names the first thing that is missing, in the order of the form", () => {
    assert.equal(programFormError(ok), null);
    assert.equal(programFormError({ ...ok, title: " " }), "Program başlığını yaz.");
    assert.equal(programFormError({ ...ok, start_date: "" }), "Başlangıç tarihini seç.");
    assert.equal(programFormError({ ...ok, end_date: "" }), "Bitiş tarihini seç.");
    assert.equal(programFormError({ ...ok, objective: "" }), "Bu dönemin amacını yaz.");
  });

  it("does not let the end come before the start, and allows the same day", () => {
    assert.equal(programFormError({ ...ok, end_date: "2026-10-01" }), "Bitiş tarihi başlangıçtan önce olamaz.");
    assert.equal(programFormError({ ...ok, end_date: "2026-10-12" }), null);
  });

  it("does not let a title outgrow what the server keeps", () => {
    assert.equal(programFormError({ ...ok, title: "a".repeat(201) }), "Program başlığı en çok 200 karakter olabilir.");
  });
});

describe("programPageTitle", () => {
  const row = (overrides: Partial<CoachingStudentRow>) =>
    ({ service_period_id: "sp-1", student_name: "Elif Yılmaz", service_status: "active", ...overrides }) as CoachingStudentRow;

  it("names the student the program belongs to", () => {
    assert.equal(programPageTitle([row({}), row({ service_period_id: "sp-2", student_name: "Mert A." })], "sp-2"), "Mert A. · Program");
  });

  it("names a student whose coaching has ended too, since the program is still theirs", () => {
    assert.equal(programPageTitle([row({ service_status: "completed" })], "sp-1"), "Elif Yılmaz · Program");
  });

  it("falls back to the plain name while the list is not there or does not know the period", () => {
    assert.equal(programPageTitle(undefined, "sp-1"), "Öğrenci programı");
    assert.equal(programPageTitle([row({})], "sp-9"), "Öğrenci programı");
  });
});
