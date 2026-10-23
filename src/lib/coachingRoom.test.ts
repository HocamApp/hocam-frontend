import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CoachingSessionDetail } from "./coachingApi";
import { ROOM_URGENT_MINUTES, roomClock, roomFailure, roomMeta, roomOpensAt, roomRefetchDelay } from "./coachingRoom";

/** Wednesday 21 Ekim 2026, 19:00-19:30 in Istanbul (16:00Z-16:30Z). */
function detail(overrides: Partial<CoachingSessionDetail> = {}): CoachingSessionDetail {
  return {
    id: "s-3",
    service_period_id: "sp-1",
    sequence_number: 3,
    week_index: 2,
    status: "scheduled",
    scheduled_start: "2026-10-21T16:00:00Z",
    scheduled_local_date: "2026-10-21",
    scheduled_local_time: "19:00:00",
    duration_minutes: 30,
    reschedule_count: 0,
    report_due_at: null,
    report_overdue: false,
    complaint_eligible_at: null,
    complaint_eligible: false,
    tutor_name: "Elif Kaya",
    student_name: "Deniz Yıldız",
    student_id: "u-1",
    viewer_role: "student",
    ...overrides,
  };
}

const start = Date.parse("2026-10-21T16:00:00Z");
const at = (minutesFromStart: number, seconds = 0) => new Date(start + minutesFromStart * 60_000 + seconds * 1000);

describe("roomClock", () => {
  it("counts down to the start while the room is open early", () => {
    assert.deepEqual(roomClock(detail(), at(-4)), { phase: "before", label: "Başlamasına 4 dk", urgent: false });
  });

  it("shows the minutes left once the meeting has started", () => {
    assert.deepEqual(roomClock(detail(), at(12)), { phase: "live", label: "Kalan 18 dk", urgent: false });
  });

  it("rounds a part of a minute up, so it never says 0 while there is time", () => {
    assert.equal(roomClock(detail(), at(29, 30)).label, "Kalan 1 dk");
    assert.equal(roomClock(detail(), at(29, 59)).label, "Kalan 1 dk");
  });

  it("is urgent for the last five minutes and not a second before", () => {
    assert.equal(ROOM_URGENT_MINUTES, 5);
    assert.deepEqual(roomClock(detail(), at(25)), { phase: "live", label: "Kalan 5 dk", urgent: true });
    assert.deepEqual(roomClock(detail(), at(24, 59)), { phase: "live", label: "Kalan 6 dk", urgent: false });
  });

  it("says the time is up once it is, and keeps saying so", () => {
    assert.deepEqual(roomClock(detail(), at(30)), { phase: "over", label: "Süre doldu", urgent: true });
    assert.deepEqual(roomClock(detail(), at(45)), { phase: "over", label: "Süre doldu", urgent: true });
  });

  it("follows the meeting's own length", () => {
    assert.equal(roomClock(detail({ duration_minutes: 45 }), at(30)).label, "Kalan 15 dk");
  });
});

describe("a meeting a late tutor ran longer", () => {
  const extended = detail({ ends_at: "2026-10-21T16:42:00Z" });

  it("keeps the clock counting after the booked end, to the server's end", () => {
    assert.deepEqual(roomClock(extended, at(32)), { phase: "live", label: "Kalan 10 dk", urgent: false });
    assert.deepEqual(roomClock(extended, at(38)), { phase: "live", label: "Kalan 4 dk", urgent: true });
    assert.equal(roomClock(extended, at(42)).phase, "over");
  });

  it("writes the real end on the bar", () => {
    assert.equal(roomMeta(extended, 3), "3. görüşme · 19:00–19:42");
  });
});

describe("roomMeta", () => {
  it("says which meeting it is and from when to when, for the bar of a meeting that is happening today", () => {
    assert.equal(roomMeta(detail(), 3), "3. görüşme · 19:00–19:30");
  });

  it("leaves the number out until it is known, and follows the meeting's own length", () => {
    assert.equal(roomMeta(detail({ duration_minutes: 45 }), null), "19:00–19:45");
  });
});

describe("roomOpensAt", () => {
  it("opens the room ten minutes before the start for a student and fifteen for a tutor, as the server does", () => {
    assert.equal(roomOpensAt(detail(), "student"), start - 10 * 60_000);
    assert.equal(roomOpensAt(detail(), "tutor"), start - 15 * 60_000);
  });
});

describe("roomRefetchDelay", () => {
  it("waits for the moment the room opens, plus a breath so the server agrees", () => {
    const opens = start - 10 * 60_000;
    assert.equal(roomRefetchDelay(opens, new Date(opens - 90_000)), 91_500);
  });

  it("does not wait for something already past, and gives up on a day-long wait", () => {
    const opens = start - 10 * 60_000;
    assert.equal(roomRefetchDelay(opens, new Date(opens + 1_000)), null);
    assert.equal(roomRefetchDelay(opens, new Date(opens - 3 * 24 * 60 * 60_000)), null);
  });
});

describe("roomFailure", () => {
  const failure = (overrides: Partial<Parameters<typeof roomFailure>[0]> = {}) =>
    roomFailure({
      code: null,
      status: null,
      session: detail(),
      role: "student",
      otherName: "Elif Kaya",
      now: at(-30),
      ...overrides,
    });

  it("makes the not-yet-open room a waiting screen that says when it opens and for how long", () => {
    assert.deepEqual(failure({ code: "too_early", status: 403 }), {
      kind: "waiting",
      title: "Oda 18:50'de açılır",
      message: "Görüşme 19:00'da başlıyor. Oda açılınca bu sayfa kendiliğinden girer.",
      countdown: "20 dk kaldı",
      opensAt: start - 10 * 60_000,
    });
  });

  it("opens earlier for a tutor", () => {
    const result = failure({ code: "too_early", status: 403, role: "tutor" });
    assert.equal(result.kind === "waiting" && result.title, "Oda 18:45'te açılır");
    assert.equal(result.kind === "waiting" && result.opensAt, start - 15 * 60_000);
  });

  it("says it opens any moment once the time has come but the server has not agreed yet", () => {
    const result = failure({ code: "too_early", status: 403, now: at(-9) });
    assert.equal(result.kind === "waiting" && result.countdown, "Birazdan açılır");
  });

  it("still waits without knowing the meeting yet", () => {
    const result = failure({ code: "too_early", status: 403, session: undefined });
    assert.deepEqual(result, {
      kind: "waiting",
      title: "Oda henüz açılmadı",
      message: "Başlama saatine yaklaştığında bu sayfa kendiliğinden girer.",
      countdown: null,
      opensAt: null,
    });
  });

  it("sends an ended meeting to the screen where it can be rated or reported", () => {
    const student = failure({ code: "session_ended", status: 403, now: at(40) });
    assert.deepEqual(student, {
      kind: "closed",
      title: "Bu görüşme sona erdi",
      message: "Görüşmeyi değerlendirmek ya da bir sorun bildirmek için görüşme özetine git.",
      summary: true,
    });
    const tutor = failure({ code: "session_ended", status: 403, now: at(40), role: "tutor" });
    assert.equal(tutor.kind === "closed" && tutor.message, "Raporunu görüşme özetinden hazırlayabilirsin.");
  });

  it("says what became of a meeting that is not active, in the words of the screen after the meeting", () => {
    const result = failure({
      code: "session_not_active",
      status: 409,
      session: detail({ status: "technical_failure" }),
      now: at(5),
    });
    assert.deepEqual(result, {
      kind: "closed",
      title: "Teknik sorun bildirildi",
      message: "Destek ekibi bildirimi inceliyor.",
      summary: true,
    });
    const noShow = failure({ code: "session_not_active", status: 409, session: detail({ status: "tutor_no_show" }), now: at(5) });
    assert.equal(noShow.kind === "closed" && noShow.title, "Bildirimin alındı");
  });

  it("is plain when it does not know why a meeting is not active", () => {
    const result = failure({ code: "session_not_active", status: 409, session: undefined });
    assert.deepEqual(result, { kind: "closed", title: "Bu görüşmeye şu an girilemiyor", message: "", summary: true });
  });

  it("calls a video service that is not set up unavailable, and a lost connection by its name", () => {
    assert.deepEqual(failure({ status: 503 }), {
      kind: "unavailable",
      title: "Görüntülü görüşme şu an açılamıyor",
      message: "Birkaç dakika sonra tekrar dene. Sorun sürerse destek ekibine yaz.",
    });
    assert.deepEqual(failure({ status: null }), {
      kind: "unavailable",
      title: "Bağlantı kurulamadı",
      message: "İnternet bağlantını kontrol edip tekrar dene.",
    });
  });

  it("says a meeting that is not there is not there, and everything else is a plain failure to open", () => {
    assert.deepEqual(failure({ status: 404 }), {
      kind: "closed",
      title: "Görüşme bulunamadı",
      message: "Bu görüşme hesabında görünmüyor.",
      summary: false,
    });
    assert.deepEqual(failure({ status: 500 }), {
      kind: "unavailable",
      title: "Görüşme odası açılamadı",
      message: "Birkaç dakika sonra tekrar dene.",
    });
  });

  it("never shows the server's English", () => {
    const codes = [null, "too_early", "session_ended", "session_not_active", "invalid_transition"];
    for (const code of codes) {
      for (const status of [null, 403, 404, 409, 500, 503]) {
        for (const role of ["student", "tutor"] as const) {
          const result = failure({ code, status, role });
          const text = JSON.stringify(result);
          assert.doesNotMatch(text, /Session is|Coaching room|Video session|not configured|has ended/i, `${role}/${code}/${status}`);
        }
      }
    }
  });
});
