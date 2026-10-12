import assert from "node:assert/strict";
import { test } from "node:test";
import { bookingInstant, bookingDateLabel, bookingTimeLabel, getStudentRoster, filterStudentRoster, studentConversation, studentCoaching } from "./tutorClassroom";
import type { Booking, Conversation, PackagePurchase } from "@/types";
const now = Date.parse("2026-09-05T12:00:00+03:00");
function booking(student: string, status: Booking["status"], time = "2026-09-06T12:00:00Z", tutor = "tutor-1"): Booking {
  return { id: `${student}-${status}-${time}`, student: { id: student, email: `${student}@example.com`, display_name: student }, tutor: { id: tutor, name: "Hoca", surname: "Bir" }, subject: { id: "math", name: "Matematik", exam_type: "TYT" }, start_time: time, duration_minutes: 40, status, price: 0, lesson_request: null, created_at: time };
}
test("only confirmed relationships enter roster, scoped to tutor profile and deduplicated", () => {
  const statuses: Booking["status"][] = ["pending", "cancelled", "expired", "confirmed", "in_progress", "awaiting_confirmation", "completed", "disputed"];
  const rows = getStudentRoster([...statuses.map(s => booking(s, s)), booking("confirmed", "completed"), booking("own-teacher", "confirmed", undefined, "another-tutor")], [], "tutor-1", now);
  assert.equal(rows.length, 5);
  assert.equal(rows.find(r => r.student.id === "confirmed")?.totalLessons, 1);
  assert.equal(rows.find(r => r.student.id === "in_progress")?.currentLesson?.status, "in_progress");
  assert.ok(!rows.some(r => ["pending", "cancelled", "expired", "own-teacher"].includes(r.student.id)));
});
function paid(overrides: Partial<Omit<PackagePurchase, "student">> & { student?: { id: string; name?: string; surname?: string } } = {}): PackagePurchase {
  const { student, ...rest } = overrides;
  return {
    id: "pkg-1",
    student: { id: "early", name: "Erken", surname: "Kuş", ...student },
    tutor: { id: "tutor-1", name: "Hoca", surname: "Bir" },
    plan: { id: "plan", name: "Haftada 2", code: null, lesson_count: 8, lesson_duration_minutes: 40, lessons_per_week: 2, duration_days: 30, discount_percent: 0 },
    status: "paid", total_credits: 8, remaining_credits: 3,
    paid_at: "2026-09-01T09:00:00Z", expires_at: "2026-10-31T00:00:00Z",
    ...rest,
  } as PackagePurchase;
}
test("orders next lesson then last completed and counts future confirmed only", () => {
  const lessons = [booking("late", "confirmed", "2026-09-08T12:00:00Z"), booking("early", "confirmed"), booking("early", "pending"), booking("early", "completed", "2026-08-01T12:00:00Z"), booking("recent", "completed", "2026-09-04T12:00:00Z"), booking("old", "completed", "2026-08-02T12:00:00Z")];
  const rows = getStudentRoster(lessons, [], "tutor-1", now);
  assert.deepEqual(rows.map(r => r.student.id), ["early", "late", "recent", "old"]);
  assert.equal(rows[0].upcomingLessons, 1);
  assert.ok(rows.every(r => r.hasLessons));
});
test("what is left of a package is its booked lessons plus its credits not placed yet", () => {
  // Every lesson of a freshly paid package is on the calendar and no credit is
  // left unscheduled: the raw credits say 0, the package has 8 lessons ahead.
  const ahead = (n: number, purchase = "pkg-1") => Array.from({ length: n }, (_, i) => ({ ...booking("early", "confirmed", `2026-09-${10 + i}T12:00:00Z`), package_purchase: purchase }));
  const [fresh] = getStudentRoster(ahead(8), [paid({ remaining_credits: 0 })], "tutor-1", now);
  assert.equal(fresh.packageRemaining, 8);
  assert.equal(fresh.packageUnscheduled, 0);

  const [partly] = getStudentRoster(ahead(6), [paid({ remaining_credits: 2 })], "tutor-1", now);
  assert.equal(partly.packageRemaining, 8);
  assert.equal(partly.packageUnscheduled, 2);
});
test("a student who has only paid for a package is in the roster, with no lessons", () => {
  const rows = getStudentRoster([booking("early", "confirmed")], [paid({ student: { id: "package-only", name: "Ayşe", surname: "Kaya" }, remaining_credits: 8 })], "tutor-1", now);
  const only = rows.find(r => r.student.id === "package-only");
  assert.ok(only);
  assert.equal(only.hasLessons, false);
  assert.equal(only.student.display_name, "Ayşe Kaya");
  assert.equal(only.student.email, "");
  assert.equal(only.nextLesson, null);
  assert.equal(only.upcomingLessons, 0);
  assert.equal(only.packageRemaining, 8);
  assert.equal(only.packageUnscheduled, 8);
  assert.equal(only.packagePaidAt, "2026-09-01T09:00:00Z");
  // Listed after the students who have a lesson to come.
  assert.equal(rows.at(-1)?.student.id, "package-only");
});
test("a package that is not running, or is another tutor's, adds nobody and nothing", () => {
  const lessons = [booking("early", "completed", "2026-08-01T12:00:00Z")];
  const rows = getStudentRoster(lessons, [
    paid({ student: { id: "pending-only" }, status: "pending" }),
    paid({ student: { id: "cancelled-only" }, status: "cancelled" }),
    paid({ student: { id: "refunded-only" }, status: "refunded" }),
    paid({ student: { id: "other-tutors" }, tutor: { id: "other", name: "Başka", surname: "Hoca" } }),
    paid({ student: { id: "used-up" }, remaining_credits: 0 }),
    paid({ student: { id: "ended" }, expires_at: "2026-09-01T00:00:00Z" }),
    // The student with a lesson already: a pending package adds no lessons left.
    paid({ id: "pkg-pending", status: "pending", remaining_credits: 5 }),
  ], "tutor-1", now);
  assert.deepEqual(rows.map(r => r.student.id), ["early"]);
  assert.equal(rows[0].packageRemaining, 0);
});
test("lessons left are added up across a student's running packages", () => {
  const rows = getStudentRoster([booking("early", "completed", "2026-08-01T12:00:00Z")], [
    paid({ id: "a", remaining_credits: 3 }),
    paid({ id: "b", remaining_credits: 2 }),
  ], "tutor-1", now);
  assert.equal(rows[0].packageRemaining, 5);
  assert.equal(rows[0].packageUnscheduled, 5);
});
test("Turkish name search excludes private email addresses and keeps scheduling filters", () => {
  const rows = getStudentRoster([booking("İpek Işık", "confirmed"), booking("Ayşe", "completed")], [], "tutor-1", now);
  assert.equal(filterStudentRoster(rows, "ipek isik", "all").length, 1);
  assert.equal(filterStudentRoster(rows, "@example.com", "all").length, 0);
  assert.equal(filterStudentRoster(rows, "", "unscheduled")[0].student.id, "Ayşe");
  assert.equal(filterStudentRoster(rows, "yok", "all").length, 0);
});
test("booking wall time stays in Istanbul across midnight and browser time zones", () => {
  const old = process.env.TZ;
  try {
    for (const zone of ["Europe/Istanbul", "UTC", "America/Los_Angeles"]) {
      process.env.TZ = zone;
      assert.equal(bookingInstant("2026-09-06T00:15:00Z"), Date.parse("2026-09-05T21:15:00Z"));
      assert.equal(bookingDateLabel("2026-09-06T00:15:00Z"), "6 Eylül 2026");
      assert.equal(bookingTimeLabel("2026-09-06T00:15:00Z", 40), "00:15 – 00:55");
      assert.equal(getStudentRoster([booking("night", "confirmed", "2026-09-06T00:15:00Z")], [], "tutor-1", Date.parse("2026-09-05T21:16:00Z"))[0].upcomingLessons, 0);
    }
  } finally { if (old === undefined) delete process.env.TZ; else process.env.TZ = old; }
});
test("conversation and coaching associations use identities rather than names", () => {
  const conversation = { id: "old", student: "s1", tutor: "u1", created_at: "2026-08-01T00:00:00Z" } as Conversation;
  assert.equal(studentConversation([conversation, { ...conversation, id: "recent", latest_message: { created_at: "2026-09-01T00:00:00Z" } as NonNullable<Conversation["latest_message"]> }, { ...conversation, id: "wrong", tutor: "u2", created_at: "2026-10-01T00:00:00Z" }], "s1", "u1")?.id, "recent");
  assert.equal(studentConversation([conversation], "s2", "u1"), undefined);
  assert.deepEqual(studentCoaching([{ purchase_id: "p1", student_id: "s1" }, { purchase_id: "p2", student_name: "s1" }] as Parameters<typeof studentCoaching>[0], "s1").map(r => r.purchase_id), ["p1"]);
});
test("a student who paid and has no name on file is not named after an email address", () => {
  const rows = getStudentRoster([], [paid({ student: { id: "nameless", name: "", surname: "" } })], "tutor-1", now);

  assert.equal(rows[0].student.display_name, "İsimsiz öğrenci");
  assert.equal(rows[0].student.email, "");
});
test("the day a student paid is the most recent of their running packages", () => {
  const rows = getStudentRoster([], [
    paid({ id: "a", paid_at: "2026-09-01T09:00:00Z" }),
    paid({ id: "b", paid_at: "2026-09-03T09:00:00Z" }),
  ], "tutor-1", now);

  assert.equal(rows[0].packagePaidAt, "2026-09-03T09:00:00Z");
});
