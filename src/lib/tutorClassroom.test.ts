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
test("orders next lesson then last completed, counts future confirmed only and enriches paid own packages", () => {
  const lessons = [booking("late", "confirmed", "2026-09-08T12:00:00Z"), booking("early", "confirmed"), booking("early", "pending"), booking("early", "completed", "2026-08-01T12:00:00Z"), booking("recent", "completed", "2026-09-04T12:00:00Z"), booking("old", "completed", "2026-08-02T12:00:00Z")];
  const paid = { student: { id: "early" }, tutor: { id: "tutor-1" }, status: "paid", remaining_credits: 3, total_credits: 8 } as PackagePurchase;
  const rows = getStudentRoster(lessons, [paid, { ...paid, status: "pending" }, { ...paid, tutor: { ...paid.tutor, id: "other" } }, { ...paid, student: { ...paid.student, id: "package-only" } }], "tutor-1", now);
  assert.deepEqual(rows.map(r => r.student.id), ["early", "late", "recent", "old"]);
  assert.equal(rows[0].upcomingLessons, 1);
  assert.equal(rows[0].remainingCredits, 3);
  assert.equal(rows[0].totalCredits, 8);
});
test("Turkish search, email search and scheduling filters", () => {
  const rows = getStudentRoster([booking("İpek Işık", "confirmed"), booking("Ayşe", "completed")], [], "tutor-1", now);
  assert.equal(filterStudentRoster(rows, "ipek isik", "all").length, 1);
  assert.equal(filterStudentRoster(rows, "@example.com", "upcoming")[0].student.id, "İpek Işık");
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
