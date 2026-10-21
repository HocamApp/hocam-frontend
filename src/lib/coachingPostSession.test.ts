import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CoachingSessionAttendanceSummary, CoachingSessionItem } from "./coachingApi";
import {
  TUTOR_NO_SHOW_WAIT_MINUTES,
  TUTOR_PRESENT_SECONDS,
  postSessionBand,
  postSessionCanReport,
  postSessionMeta,
  postSessionNext,
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

function attendance(tutorSeconds: number): CoachingSessionAttendanceSummary {
  const entry = (seconds: number) => ({
    first_joined_at: seconds > 0 ? "2026-10-21T16:00:00Z" : null,
    last_left_at: seconds > 0 ? "2026-10-21T16:30:00Z" : null,
    join_count: seconds > 0 ? 1 : 0,
    total_connected_seconds: seconds,
  });
  return { student: entry(1800), tutor: entry(tutorSeconds) };
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
