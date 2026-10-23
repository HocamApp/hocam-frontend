import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CoachingEarlyEndRequest, CoachingLiveState } from "./coachingApi";
import {
  EARLY_END_POLL_MS,
  earlyEndConfirmText,
  earlyEndIncomingText,
  earlyEndMinute,
  earlyEndView,
  liveStatePollMs,
  shouldLeaveForSummary,
} from "./coachingEarlyEnd";

// The meeting is 19:00-19:30 Istanbul on Wednesday 21 Ekim 2026 (16:00Z-16:30Z).
const START = Date.parse("2026-10-21T16:00:00Z");
const MINUTE = 60_000;
const iso = (minutesFromStart: number, seconds = 0) => new Date(START + minutesFromStart * MINUTE + seconds * 1000).toISOString();
const at = (minutesFromStart: number, seconds = 0) => new Date(START + minutesFromStart * MINUTE + seconds * 1000);

function request(overrides: Partial<CoachingEarlyEndRequest> = {}): CoachingEarlyEndRequest {
  return {
    id: "r-1",
    status: "pending",
    version: 1,
    requested_by_role: "tutor",
    requested_by_me: false,
    created_at: iso(6, 20),
    expires_at: iso(9, 20),
    responded_at: null,
    retry_available_at: null,
    ...overrides,
  };
}

function live(overrides: Partial<CoachingLiveState> = {}): CoachingLiveState {
  return {
    server_time: iso(7),
    status: "in_progress",
    scheduled_start: iso(0),
    session_end: iso(30),
    viewer_role: "student",
    early_end_enabled: true,
    early_end_retry_available_at: null,
    early_end: null,
    ...overrides,
  };
}

describe("earlyEndView", () => {
  it("is hidden until the meeting is running, and once the time is up", () => {
    for (const status of ["scheduled", "awaiting_report", "completed", "cancelled", "technical_failure"] as const) {
      assert.deepEqual(earlyEndView({ live: live({ status }), now: at(7), otherName: "Elif Kaya" }), { kind: "hidden" }, status);
    }
    // The sweep has not run yet but the server would refuse: do not offer it.
    assert.deepEqual(
      earlyEndView({ live: live({ server_time: iso(30, 5) }), now: at(30, 5), otherName: "Elif Kaya" }),
      { kind: "hidden" },
    );
  });

  it("is hidden when the server says the feature is off", () => {
    assert.deepEqual(
      earlyEndView({ live: live({ early_end_enabled: false }), now: at(7), otherName: "Elif Kaya" }),
      { kind: "hidden" },
    );
  });

  it("is idle when nobody has asked", () => {
    assert.deepEqual(earlyEndView({ live: live(), now: at(7), otherName: "Elif Kaya" }), { kind: "idle", notice: null });
  });

  it("waits for the answer to my own pending request, and keeps its version", () => {
    const view = earlyEndView({
      live: live({ early_end: request({ requested_by_me: true, version: 4 }) }),
      now: at(7),
      otherName: "Elif Kaya",
    });
    assert.deepEqual(view, { kind: "waiting", version: 4 });
  });

  it("is an incoming request when the other side asked, with the minute it was asked in", () => {
    const view = earlyEndView({
      live: live({ early_end: request({ requested_by_me: false, version: 2, created_at: iso(6, 20) }) }),
      now: at(7),
      otherName: "Elif Kaya",
    });
    assert.deepEqual(view, { kind: "incoming", version: 2, minute: 7 });
  });

  it("does not treat a timed-out or answered request as incoming", () => {
    for (const status of ["expired", "declined", "cancelled", "accepted"] as const) {
      const view = earlyEndView({ live: live({ early_end: request({ status }) }), now: at(7), otherName: "Elif Kaya" });
      assert.notEqual(view.kind, "incoming", status);
      assert.notEqual(view.kind, "waiting", status);
    }
  });

  it("says how long until the asker may ask again, rounded up, never below one minute", () => {
    const retry = iso(11, 30);
    const view = earlyEndView({
      live: live({
        early_end_retry_available_at: retry,
        early_end: request({ requested_by_me: true, status: "cancelled", retry_available_at: retry }),
      }),
      now: at(7),
      otherName: "Elif Kaya",
    });
    assert.equal(view.kind, "cooldown");
    assert.equal((view as { label: string }).label, "Yeni bir istek için 5 dk beklemelisin.");

    const last = earlyEndView({
      live: live({ early_end_retry_available_at: retry, early_end: request({ requested_by_me: true, status: "cancelled" }) }),
      now: at(11, 29),
      otherName: "Elif Kaya",
    });
    assert.equal((last as { label: string }).label, "Yeni bir istek için 1 dk beklemelisin.");
  });

  it("counts from the poll's own clock when the page's is behind, so a five minute wait reads five", () => {
    const view = earlyEndView({
      live: live({
        server_time: iso(7, 0),
        early_end_retry_available_at: iso(12, 0),
        early_end: request({ requested_by_me: true, status: "cancelled" }),
      }),
      now: at(6, 45),
      otherName: "Elif Kaya",
    });
    assert.equal((view as { label: string }).label, "Yeni bir istek için 5 dk beklemelisin.");
  });

  it("is idle again the moment the cooldown has passed, even if the poll has not caught up", () => {
    const view = earlyEndView({
      live: live({
        early_end_retry_available_at: iso(11, 30),
        early_end: request({ requested_by_me: true, status: "cancelled" }),
      }),
      now: at(11, 31),
      otherName: "Elif Kaya",
    });
    assert.equal(view.kind, "idle");
  });

  it("tells the asker, for a short while, that the other side wants to go on", () => {
    const declined = request({
      requested_by_me: true,
      status: "declined",
      responded_at: iso(7, 0),
      retry_available_at: iso(12, 0),
    });
    const fresh = earlyEndView({
      live: live({ server_time: iso(7, 5), early_end_retry_available_at: iso(12, 0), early_end: declined }),
      now: at(7, 5),
      otherName: "Elif Kaya",
    });
    assert.equal(fresh.kind, "cooldown");
    assert.equal((fresh as { notice: string | null }).notice, "Elif Kaya görüşmeye devam etmek istiyor.");

    const stale = earlyEndView({
      live: live({ server_time: iso(8, 0), early_end_retry_available_at: iso(12, 0), early_end: declined }),
      now: at(8, 0),
      otherName: "Elif Kaya",
    });
    assert.equal((stale as { notice: string | null }).notice, null, "the notice does not stay forever");
  });

  it("tells the asker, for a short while, that nobody answered", () => {
    const view = earlyEndView({
      live: live({
        server_time: iso(9, 30),
        early_end: request({ requested_by_me: true, status: "expired", expires_at: iso(9, 20) }),
      }),
      now: at(9, 30),
      otherName: "Elif Kaya",
    });
    assert.deepEqual(view, { kind: "idle", notice: "İsteğin yanıtlanmadı. Görüşme sürüyor." });
  });

  it("never gives the answering side a notice for what they answered themselves", () => {
    const view = earlyEndView({
      live: live({ early_end: request({ requested_by_me: false, status: "declined", responded_at: iso(7, 0) }) }),
      now: at(7, 5),
      otherName: "Elif Kaya",
    });
    assert.deepEqual(view, { kind: "idle", notice: null });
  });

  it("falls back to a role word when the other person has no name", () => {
    const declined = request({ requested_by_me: true, status: "declined", responded_at: iso(7, 0) });
    const student = earlyEndView({
      live: live({ viewer_role: "student", server_time: iso(7, 1), early_end: declined }),
      now: at(7, 1),
      otherName: "  ",
    });
    assert.equal((student as { notice: string }).notice, "Öğretmenin görüşmeye devam etmek istiyor.");
    const tutor = earlyEndView({
      live: live({ viewer_role: "tutor", server_time: iso(7, 1), early_end: declined }),
      now: at(7, 1),
      otherName: undefined,
    });
    assert.equal((tutor as { notice: string }).notice, "Öğrencin görüşmeye devam etmek istiyor.");
  });
});

describe("earlyEndMinute", () => {
  it("is the minute of the meeting the request was made in, counting from one", () => {
    assert.equal(earlyEndMinute(iso(0), iso(0, 0)), 1);
    assert.equal(earlyEndMinute(iso(0), iso(6, 20)), 7);
    assert.equal(earlyEndMinute(iso(0), iso(29, 59)), 30);
  });

  it("never goes below one (an early clock, a request just before the start)", () => {
    assert.equal(earlyEndMinute(iso(0), iso(-1)), 1);
  });
});

describe("the words", () => {
  it("says before asking what an accept means", () => {
    assert.equal(
      earlyEndConfirmText("Elif Kaya"),
      "Elif Kaya kabul ederse görüşme şimdi tamamlanmış sayılır. Kabul etmezse görüşme devam eder.",
    );
  });

  it("tells a student what a yes costs the meeting, in the language of the right to a meeting", () => {
    assert.equal(
      earlyEndIncomingText({ role: "student", otherName: "Elif Kaya", minute: 7 }),
      "Elif Kaya görüşmeyi bitirmek istiyor. Görüşme 7. dakikada. Kabul edersen görüşme tamamlanmış sayılır; kalan süre için ek görüşme hakkı doğmaz.",
    );
  });

  it("tells a tutor that the report is still theirs", () => {
    assert.equal(
      earlyEndIncomingText({ role: "tutor", otherName: "Deniz Yıldız", minute: 12 }),
      "Deniz Yıldız görüşmeyi bitirmek istiyor. Görüşme 12. dakikada. Kabul edersen görüşme biter; raporu yine sen hazırlarsın.",
    );
  });

  it("promises no refund, payment or earning, and has no dash or exclamation", () => {
    const texts = [
      earlyEndConfirmText("Elif Kaya"),
      earlyEndConfirmText(""),
      earlyEndIncomingText({ role: "student", otherName: "Elif Kaya", minute: 7 }),
      earlyEndIncomingText({ role: "tutor", otherName: "", minute: 7 }),
    ];
    for (const text of texts) {
      assert.doesNotMatch(text, /iade|ödeme|ödendi|kazanç|hakediş|\bpara\b|ücret/i, text);
      assert.doesNotMatch(text, /[—–!]/, text);
    }
  });
});

describe("polling", () => {
  it("polls every three seconds while the meeting runs", () => {
    assert.equal(EARLY_END_POLL_MS, 3_000);
    assert.equal(liveStatePollMs({ status: "in_progress", errorStatus: null }), 3_000);
    assert.equal(liveStatePollMs({ status: "scheduled", errorStatus: null }), 3_000);
    assert.equal(liveStatePollMs({ status: undefined, errorStatus: null }), 3_000);
  });

  it("stops once the meeting is no longer running", () => {
    for (const status of ["awaiting_report", "completed", "cancelled", "technical_failure", "student_no_show", "tutor_no_show"] as const) {
      assert.equal(liveStatePollMs({ status, errorStatus: null }), false, status);
    }
  });

  it("stops for good when the feature is off or not there", () => {
    assert.equal(liveStatePollMs({ status: undefined, errorStatus: 403 }), false);
    assert.equal(liveStatePollMs({ status: undefined, errorStatus: 404 }), false);
  });

  it("keeps trying through a flaky connection", () => {
    assert.equal(liveStatePollMs({ status: "in_progress", errorStatus: null }), 3_000);
    assert.equal(liveStatePollMs({ status: "in_progress", errorStatus: 500 }), 3_000);
    assert.equal(liveStatePollMs({ status: undefined, errorStatus: 0 }), 3_000);
  });
});

describe("shouldLeaveForSummary", () => {
  it("sends both sides to the screen after the meeting once an accept has ended it", () => {
    assert.equal(
      shouldLeaveForSummary(live({ status: "awaiting_report", early_end: request({ status: "accepted" }) })),
      true,
    );
  });

  it("does not send anyone while the meeting runs, or when it ended some other way", () => {
    assert.equal(shouldLeaveForSummary(live({ early_end: request({ status: "accepted" }) })), false);
    assert.equal(shouldLeaveForSummary(live({ status: "awaiting_report", early_end: request({ status: "declined" }) })), false);
    assert.equal(shouldLeaveForSummary(live({ status: "awaiting_report" })), false);
    assert.equal(shouldLeaveForSummary(undefined), false);
  });
});
