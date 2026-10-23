import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CoachingSessionAttendanceSummary, CoachingSessionItem } from "./coachingApi";
import {
  TUTOR_NO_SHOW_WAIT_MINUTES,
  TUTOR_PRESENT_SECONDS,
  counterpartPresence,
  noShowOption,
  postSessionBand,
  postSessionCanReport,
  postSessionMeta,
  postSessionNext,
  postSessionNumber,
  postSessionRating,
  tutorNoShowOption,
  tutorPresence,
} from "./coachingPostSession";

/** Wednesday 21 Ekim 2026, 19:00 in Istanbul; the report is due 24 hours after the meeting's end. */
function session(overrides: Partial<CoachingSessionItem> = {}): CoachingSessionItem {
  return {
    id: "s-3",
    service_period_id: "sp-1",
    sequence_number: 3,
    week_index: 2,
    status: "awaiting_report",
    scheduled_start: "2026-10-21T16:00:00Z",
    scheduled_local_date: "2026-10-21",
    scheduled_local_time: "19:00:00",
    duration_minutes: 30,
    reschedule_count: 0,
    report_due_at: "2026-10-22T16:30:00Z",
    report_overdue: false,
    complaint_eligible_at: "2026-10-23T16:30:00Z",
    complaint_eligible: false,
    ...overrides,
  };
}

function attendance(tutorSeconds: number, studentSeconds = 1800): CoachingSessionAttendanceSummary {
  const entry = (seconds: number) => ({
    first_joined_at: seconds > 0 ? "2026-10-21T16:00:00Z" : null,
    last_left_at: seconds > 0 ? "2026-10-21T16:30:00Z" : null,
    join_count: seconds > 0 ? 1 : 0,
    total_connected_seconds: seconds,
  });
  return { student: entry(studentSeconds), tutor: entry(tutorSeconds) };
}

const ALL_STATUSES = [
  "scheduled",
  "reschedule_requested",
  "in_progress",
  "awaiting_report",
  "completed",
  "student_no_show",
  "tutor_no_show",
  "technical_failure",
  "cancelled",
] as const;

describe("postSessionMeta", () => {
  it("names the meeting, its length and when it was, so a visit from the list has its context", () => {
    assert.equal(postSessionMeta(session(), 3), "3. görüşme · 30 dk · 21 Ekim Çarşamba 19:00");
  });

  it("leaves the number out of a meeting that is not part of the count", () => {
    assert.equal(postSessionMeta(session(), null), "30 dk · 21 Ekim Çarşamba 19:00");
  });
});

describe("postSessionBand for the student", () => {
  const band = (overrides: Partial<CoachingSessionItem> = {}, otherName: string | null = "Elif Kaya") =>
    postSessionBand({ session: session(overrides), role: "student", otherName });

  it("gives the Master Spec §24 promise and the server's own deadline for a meeting waiting for its report", () => {
    assert.deepEqual(band(), {
      title: "Koçluk görüşmen tamamlandı",
      message: "Elif hocan çalışma programını ve ilerleme raporunu en geç 24 saat içinde paylaşacak.",
      deadline: "22 Ekim Perşembe 19:30",
    });
  });

  it("says Hocan when the tutor's name is not known, and gives no deadline the server did not send", () => {
    const result = band({ report_due_at: null }, null);
    assert.equal(result.message, "Hocan çalışma programını ve ilerleme raporunu en geç 24 saat içinde paylaşacak.");
    assert.equal(result.deadline, null);
  });

  it("says plainly that the time given for the report has passed", () => {
    const result = band({ report_overdue: true });
    assert.equal(result.message, "Elif hocanın raporu için verilen süre geçti.");
    assert.equal(result.deadline, "22 Ekim Perşembe 19:30");
  });

  it("says the report is out once the meeting is completed", () => {
    assert.deepEqual(band({ status: "completed" }), {
      title: "Koçluk görüşmen tamamlandı",
      message: "Elif hocan raporunu paylaştı.",
      deadline: null,
    });
  });

  it("does not claim a meeting that is still running or has not started is completed", () => {
    assert.equal(band({ status: "in_progress" }).title, "Görüşme sürüyor");
    assert.equal(band({ status: "scheduled" }).title, "Görüşme henüz başlamadı");
    assert.equal(band({ status: "reschedule_requested" }).title, "Görüşme henüz başlamadı");
  });

  it("tells a closed meeting what happened to it, in terms of the right to a meeting and never of money", () => {
    assert.deepEqual(band({ status: "student_no_show" }), {
      title: "Bu görüşme kapandı",
      message: "Görüşmeye katılmadığın için bu görüşme hakkın kullanılmış sayıldı.",
      deadline: null,
    });
    assert.deepEqual(band({ status: "tutor_no_show" }), {
      title: "Bildirimin alındı",
      message: "Öğretmen katılmadı bildirimini kaydettik. Bu görüşme hakkın korunur.",
      deadline: null,
    });
    assert.deepEqual(band({ status: "technical_failure" }), {
      title: "Teknik sorun bildirildi",
      message: "Destek ekibi bildirimi inceliyor.",
      deadline: null,
    });
    assert.equal(band({ status: "cancelled" }).title, "Bu görüşme iptal edildi");
  });

  it("never mentions a refund or a payment, whatever the status", () => {
    for (const status of ALL_STATUSES) {
      for (const role of ["student", "tutor"] as const) {
        const { title, message } = postSessionBand({ session: session({ status }), role, otherName: "Elif Kaya" });
        assert.doesNotMatch(`${title} ${message}`, /iade|ödeme|para\b|ücret/i, `${role}/${status}`);
      }
    }
  });
});

describe("postSessionBand for a meeting the system ended", () => {
  const band = (role: "student" | "tutor", status: CoachingSessionItem["status"], reason: CoachingSessionItem["system_cancel_reason"]) =>
    postSessionBand({ session: session({ status, system_cancel_reason: reason }), role, otherName: "Elif Kaya" });

  it("tells a student nobody is blamed and the right is kept, in the words of what happened", () => {
    assert.deepEqual(band("student", "cancelled", "both_absent"), {
      title: "Bu görüşme yapılamadı",
      message: "İki taraf da odaya girmediği için görüşme iptal edildi. Kimse suçlanmadı; bu görüşme hakkın korunur.",
      deadline: null,
    });
    assert.deepEqual(band("student", "cancelled", "partial_below_threshold"), {
      title: "Bu görüşme yarım kaldı",
      message: "Birlikte yeterince kalamadığınız için görüşme iptal edildi. Kimse suçlanmadı; bu görüşme hakkın korunur.",
      deadline: null,
    });
    assert.deepEqual(band("student", "tutor_no_show", "tutor_absent_15_min"), {
      title: "Bu görüşme yapılamadı",
      message: "Elif hocan 15 dakika içinde odaya girmediği için görüşme iptal edildi. Bu görüşme hakkın korunur.",
      deadline: null,
    });
  });

  it("tells a tutor what the system did and that the meeting is not counted as held", () => {
    assert.deepEqual(band("tutor", "cancelled", "both_absent"), {
      title: "Görüşme iptal edildi",
      message: "İki taraf da odaya girmediği için sistem görüşmeyi iptal etti. Kimse suçlanmadı.",
      deadline: null,
    });
    assert.deepEqual(band("tutor", "cancelled", "partial_below_threshold"), {
      title: "Görüşme yarım kaldı",
      message: "Birlikte yeterince kalınmadığı için sistem görüşmeyi iptal etti. Kimse suçlanmadı; bu görüşme tamamlanmış sayılmaz.",
      deadline: null,
    });
    assert.deepEqual(band("tutor", "tutor_no_show", "tutor_absent_15_min"), {
      title: "Görüşme kapandı",
      message: "15 dakika içinde odaya girmediğin için görüşme sistem tarafından kapatıldı. Bu görüşme tamamlanmış sayılmaz.",
      deadline: null,
    });
  });

  it("leaves a participant's own report as it was, and never speaks of money", () => {
    assert.equal(band("student", "tutor_no_show", null).title, "Bildirimin alındı");
    assert.equal(band("tutor", "tutor_no_show", null).message, "Öğrenci senin katılmadığını bildirdi.");
    for (const role of ["student", "tutor"] as const) {
      for (const reason of ["both_absent", "partial_below_threshold", "tutor_absent_15_min"] as const) {
        const { title, message } = band(role, "cancelled", reason);
        assert.doesNotMatch(`${title} ${message}`, /iade|ödeme|para\b|ücret|hakediş|kazanç/i, `${role}/${reason}`);
      }
    }
  });
});

describe("postSessionBand for the tutor", () => {
  const band = (overrides: Partial<CoachingSessionItem> = {}) =>
    postSessionBand({ session: session(overrides), role: "tutor", otherName: "Deniz Yıldız" });

  it("tells the tutor the report is owed and by when", () => {
    assert.deepEqual(band(), {
      title: "Görüşme bitti",
      message: "Deniz için çalışma programını ve ilerleme raporunu en geç 24 saat içinde paylaşmalısın.",
      deadline: "22 Ekim Perşembe 19:30",
    });
  });

  it("says the report is out once it is", () => {
    assert.deepEqual(band({ status: "completed" }), {
      title: "Görüşme bitti",
      message: "Raporu paylaştın.",
      deadline: null,
    });
  });

  it("says plainly that the time given for the report has passed", () => {
    const result = band({ report_overdue: true });
    assert.equal(result.message, "Rapor için verilen süre geçti; en kısa sürede paylaş.");
    assert.equal(result.deadline, "22 Ekim Perşembe 19:30");
  });

  it("describes a closed meeting from the tutor's side", () => {
    assert.equal(band({ status: "in_progress" }).title, "Görüşme sürüyor");
    assert.equal(band({ status: "student_no_show" }).title, "Görüşme kapandı");
    assert.match(band({ status: "student_no_show" }).message, /Öğrenci katılmadı/);
    assert.equal(band({ status: "tutor_no_show" }).title, "Görüşme kapandı");
    assert.match(band({ status: "tutor_no_show" }).message, /katılmadığını bildirdi/);
    assert.equal(band({ status: "technical_failure" }).title, "Teknik sorun bildirildi");
  });
});

describe("tutorPresence", () => {
  it("does not know before the attendance has been read", () => {
    assert.equal(tutorPresence(null), "unknown");
    assert.equal(tutorPresence(undefined), "unknown");
  });

  it("counts the tutor as there once they were connected for five minutes inside the meeting", () => {
    assert.equal(TUTOR_PRESENT_SECONDS, 300);
    assert.equal(tutorPresence(attendance(0)), "absent");
    assert.equal(tutorPresence(attendance(299)), "absent");
    assert.equal(tutorPresence(attendance(300)), "present");
    assert.equal(tutorPresence(attendance(1800)), "present");
  });
});

describe("tutorNoShowOption: Öğretmen katılmadı bildir", () => {
  const start = Date.parse("2026-10-21T16:00:00Z");
  const at = (minutesAfterStart: number) => new Date(start + minutesAfterStart * 60_000);

  it("is never offered when the tutor was in the meeting, or while that is not known yet", () => {
    assert.deepEqual(tutorNoShowOption({ session: session(), presence: "present", now: at(40) }), { kind: "hidden" });
    assert.deepEqual(tutorNoShowOption({ session: session(), presence: "unknown", now: at(40) }), { kind: "hidden" });
  });

  it("waits for the tenth minute the server asks for, and says when", () => {
    assert.equal(TUTOR_NO_SHOW_WAIT_MINUTES, 10);
    assert.deepEqual(tutorNoShowOption({ session: session(), presence: "absent", now: at(6) }), {
      kind: "later",
      opensAt: "19:10",
    });
  });

  it("is offered from the tenth minute on when the tutor was not there", () => {
    assert.deepEqual(tutorNoShowOption({ session: session(), presence: "absent", now: at(10) }), { kind: "available" });
    assert.deepEqual(tutorNoShowOption({ session: session(), presence: "absent", now: at(45) }), { kind: "available" });
  });

  it("is not offered once the meeting can no longer be reported (the server refuses it)", () => {
    assert.deepEqual(
      tutorNoShowOption({ session: session({ status: "completed" }), presence: "absent", now: at(45) }),
      { kind: "hidden" },
    );
    assert.deepEqual(
      tutorNoShowOption({ session: session({ status: "tutor_no_show" }), presence: "absent", now: at(45) }),
      { kind: "hidden" },
    );
  });
});

describe("postSessionCanReport", () => {
  it("is true only while the server still takes a technical or no-show report", () => {
    const allowed = ALL_STATUSES.filter((status) => postSessionCanReport(session({ status })));
    assert.deepEqual(allowed, ["in_progress", "awaiting_report"]);
  });
});

describe("postSessionRating", () => {
  it("is open for a student who has not rated a meeting that took place", () => {
    assert.equal(postSessionRating(session({ rating_submitted: false }), "student"), "open");
    assert.equal(postSessionRating(session({ status: "completed" }), "student"), "open");
  });

  it("keeps a form that would silently keep the first answer out of the way", () => {
    assert.equal(postSessionRating(session({ rating_submitted: true }), "student"), "done");
  });

  it("is not offered for a meeting that did not take place, nor to the tutor", () => {
    for (const status of ["scheduled", "in_progress", "student_no_show", "tutor_no_show", "technical_failure", "cancelled"] as const) {
      assert.equal(postSessionRating(session({ status }), "student"), "hidden", status);
    }
    assert.equal(postSessionRating(session(), "tutor"), "hidden");
  });
});

describe("postSessionNext: a meeting still running", () => {
  it("does not look past a meeting a late tutor ran longer, until the server's end", () => {
    const running = session({ id: "s-5", status: "in_progress", ends_at: "2026-10-21T16:42:00Z" });
    const during = postSessionNext({ sessions: [running], currentId: "s-3", role: "student", now: new Date("2026-10-21T16:35:00Z") });
    assert.equal(during.empty, false);
    const after = postSessionNext({ sessions: [running], currentId: "s-3", role: "student", now: new Date("2026-10-21T16:45:00Z") });
    assert.equal(after.empty, true);
  });
});

describe("postSessionNext", () => {
  const now = new Date("2026-10-21T16:35:00Z");
  const later = (overrides: Partial<CoachingSessionItem>) =>
    session({
      id: "s-4",
      sequence_number: 4,
      status: "scheduled",
      scheduled_start: "2026-10-28T16:00:00Z",
      scheduled_local_date: "2026-10-28",
      report_due_at: null,
      ...overrides,
    });

  it("says when the student's next meeting is and how far off", () => {
    const result = postSessionNext({ sessions: [session(), later({})], currentId: "s-3", role: "student", now });
    assert.deepEqual(result, { caption: "28 Ekim Çarşamba 19:00 · 6 gün 23 sa sonra", empty: false });
  });

  it("never offers the meeting just left as the next one, even while it still runs", () => {
    // Left the room at 19:20 Istanbul time: the 19:00 meeting runs until 19:30.
    const midMeeting = new Date("2026-10-21T16:20:00Z");
    const running = session({ status: "in_progress" });
    const result = postSessionNext({ sessions: [running, later({})], currentId: "s-3", role: "student", now: midMeeting });
    assert.match(result.caption, /^28 Ekim/);
  });

  it("skips cancelled meetings and ones whose time has passed without the server moving them on", () => {
    const result = postSessionNext({
      sessions: [
        session(),
        later({ id: "s-x", status: "cancelled", scheduled_start: "2026-10-23T16:00:00Z" }),
        later({ id: "s-y", status: "scheduled", scheduled_start: "2026-10-21T15:00:00Z" }),
        later({}),
      ],
      currentId: "s-3",
      role: "student",
      now,
    });
    assert.match(result.caption, /^28 Ekim/);
  });

  it("says so when nothing is planned", () => {
    assert.deepEqual(postSessionNext({ sessions: [session()], currentId: "s-3", role: "student", now }), {
      caption: "Henüz planlanmış görüşme yok.",
      empty: true,
    });
  });

  it("names the student of the tutor's next meeting", () => {
    const result = postSessionNext({
      sessions: [session(), later({ student_name: "Ali Demir" })],
      currentId: "s-3",
      role: "tutor",
      now,
    });
    assert.equal(result.caption, "Ali Demir · 28 Ekim Çarşamba 19:00 · 6 gün 23 sa sonra");
  });
});

describe("counterpartPresence: whose attendance each side looks at", () => {
  it("is the tutor's for a student and the student's for a tutor", () => {
    const tutorGone = attendance(0, 1800);
    assert.equal(counterpartPresence(tutorGone, "student"), "absent");
    assert.equal(counterpartPresence(tutorGone, "tutor"), "present");
    const studentGone = attendance(1800, 0);
    assert.equal(counterpartPresence(studentGone, "student"), "present");
    assert.equal(counterpartPresence(studentGone, "tutor"), "absent");
  });

  it("does not know before the attendance has been read", () => {
    assert.equal(counterpartPresence(null, "tutor"), "unknown");
    assert.equal(counterpartPresence(undefined, "student"), "unknown");
  });

  it("keeps tutorPresence as the student's way of asking", () => {
    assert.equal(tutorPresence(attendance(0)), counterpartPresence(attendance(0), "student"));
  });
});

describe("noShowOption: the same rule for a tutor reporting the student as for a student reporting the tutor", () => {
  const start = Date.parse("2026-10-21T16:00:00Z");
  const at = (minutesAfterStart: number) => new Date(start + minutesAfterStart * 60_000);

  it("is never offered while the other side is there, nor before the tenth minute, and says when it opens", () => {
    assert.deepEqual(noShowOption({ session: session(), presence: "present", now: at(40) }), { kind: "hidden" });
    assert.deepEqual(noShowOption({ session: session(), presence: "unknown", now: at(40) }), { kind: "hidden" });
    assert.deepEqual(noShowOption({ session: session({ status: "in_progress" }), presence: "absent", now: at(6) }), {
      kind: "later",
      opensAt: "19:10",
    });
    assert.deepEqual(noShowOption({ session: session({ status: "in_progress" }), presence: "absent", now: at(10) }), {
      kind: "available",
    });
  });

  it("leaves a meeting the server no longer takes a report for alone", () => {
    assert.deepEqual(noShowOption({ session: session({ status: "completed" }), presence: "absent", now: at(45) }), { kind: "hidden" });
  });

  it("keeps tutorNoShowOption as the student's way of asking", () => {
    const input = { session: session(), presence: "absent" as const, now: at(45) };
    assert.deepEqual(tutorNoShowOption(input), noShowOption(input));
  });
});

describe("postSessionNumber", () => {
  it("numbers a tutor's meeting inside its period", () => {
    assert.equal(postSessionNumber({ session: session({ sequence_number: 3 }), role: "tutor", sessions: [] }), 3);
  });

  it("numbers a student's meeting across the whole plan, and says nothing until the list is read", () => {
    const earlier = (id: string, day: string) =>
      session({ id, status: "completed", scheduled_start: `${day}T16:00:00Z`, scheduled_local_date: day, sequence_number: 1 });
    const current = session({ sequence_number: 1 });
    const list = [earlier("a", "2026-10-07"), earlier("b", "2026-10-14"), current];
    assert.equal(postSessionNumber({ session: current, role: "student", sessions: list }), 3);
    assert.equal(postSessionNumber({ session: current, role: "student", sessions: [] }), null);
  });
});
