import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CoachingDispute, CoachingSessionItem } from "./coachingApi";
import { buildTutorComplaint } from "./coachingTutorComplaints";

function dispute(overrides: Partial<CoachingDispute> = {}): CoachingDispute {
  return {
    id: "d-1",
    category: "report_absent",
    status: "under_review",
    description: "",
    submitted_at: "2026-10-15T11:20:00Z",
    service_period_id: "sp-1",
    session_id: "s-3",
    determination: null,
    selected_remedy: null,
    application: null,
    refund: { liability_minor: 0, settled_minor: 0, state: "none" },
    evidence: [],
    tutor_responses: [],
    timeline: [],
    ...overrides,
  };
}

function session(overrides: Partial<CoachingSessionItem> = {}): CoachingSessionItem {
  return {
    id: "s-3",
    sequence_number: 3,
    week_index: 2,
    status: "completed",
    scheduled_start: "2026-10-14T16:00:00Z",
    scheduled_local_date: "2026-10-14",
    scheduled_local_time: "19:00:00",
    duration_minutes: 30,
    reschedule_count: 0,
    report_due_at: null,
    report_overdue: false,
    complaint_eligible_at: null,
    complaint_eligible: false,
    ...overrides,
  } as CoachingSessionItem;
}

const states = (model: ReturnType<typeof buildTutorComplaint>) => model.path.steps.map((step) => `${step.label}:${step.state}`).join(" ");

describe("buildTutorComplaint: the head", () => {
  it("names the topic, when it was filed and where it stands, in the words the tutor reads", () => {
    const model = buildTutorComplaint(dispute({ status: "awaiting_student_choice" }), []);
    assert.equal(model.title, "Rapor hazırlanmadı");
    assert.equal(model.whenLabel, "15 Ekim Perşembe 14:20");
    assert.equal(model.statusLabel, "Öğrenci seçimi bekleniyor");
  });

  it("points at the meeting, numbered as the tutor numbers it, and still points when the list does not have it", () => {
    const found = buildTutorComplaint(dispute(), [session()]);
    assert.deepEqual(found.session, { label: "3. görüşme · 14 Ekim Çarşamba 19:00", href: "/session/coaching/s-3/summary" });
    const missing = buildTutorComplaint(dispute(), [session({ id: "other" })]);
    assert.deepEqual(missing.session, { label: null, href: "/session/coaching/s-3/summary" });
    const none = buildTutorComplaint(dispute({ session_id: null }), [session()]);
    assert.equal(none.session, null);
  });
});

describe("buildTutorComplaint: the way", () => {
  it("is at the start while it waits for review", () => {
    const model = buildTutorComplaint(dispute({ status: "waiting_review" }), []);
    assert.equal(states(model), "Alındı:current İnceleniyor:todo Karar:todo Kapandı:todo");
    assert.equal(model.path.note, null);
  });

  it("is in review while support looks at it, and says when it waits for the student's answer", () => {
    assert.equal(states(buildTutorComplaint(dispute({ status: "under_review" }), [])), "Alındı:done İnceleniyor:current Karar:todo Kapandı:todo");
    const more = buildTutorComplaint(dispute({ status: "needs_more_info" }), []);
    assert.equal(states(more), "Alındı:done İnceleniyor:current Karar:todo Kapandı:todo");
    assert.equal(more.path.note, "Öğrenciden ek bilgi bekleniyor.");
  });

  it("has a decision once the review has decided, and says the student has yet to choose", () => {
    const model = buildTutorComplaint(dispute({ status: "awaiting_student_choice" }), []);
    assert.equal(states(model), "Alındı:done İnceleniyor:done Karar:current Kapandı:todo");
    assert.equal(model.path.note, "Öğrencinin çözümü seçmesi bekleniyor.");
  });

  it("ends on the word for how it ended", () => {
    assert.equal(states(buildTutorComplaint(dispute({ status: "resolved" }), [])), "Alındı:done İnceleniyor:done Karar:done Çözüldü:current");
    assert.equal(states(buildTutorComplaint(dispute({ status: "closed" }), [])), "Alındı:done İnceleniyor:done Karar:done Kapandı:current");
    assert.equal(buildTutorComplaint(dispute({ status: "closed" }), []).path.note, null);
  });

  it("does not guess for a status it does not know: only the first step is done", () => {
    const model = buildTutorComplaint(dispute({ status: "something_new" }), []);
    assert.equal(states(model), "Alındı:done İnceleniyor:todo Karar:todo Kapandı:todo");
    assert.equal(model.statusLabel, "Durum güncelleniyor");
  });
});

describe("buildTutorComplaint: the rest", () => {
  it("dates the process steps, and says plainly when it has none", () => {
    const model = buildTutorComplaint(
      dispute({
        timeline: [
          { event_type: "created", participant_message: "Bildirim alındı.", created_at: "2026-10-15T11:20:00Z" },
          { event_type: "x", participant_message: "", created_at: "2026-10-16T08:00:00Z" },
        ],
      }),
      []
    );
    assert.deepEqual(model.steps, [
      { when: "15 Ekim Perşembe 14:20", text: "Bildirim alındı." },
      { when: "16 Ekim Cuma 11:00", text: "Süreç güncellemesi" },
    ]);
    assert.equal(buildTutorComplaint(dispute(), []).steps.length, 0);
  });

  it("gives the result only once the review has decided", () => {
    assert.equal(buildTutorComplaint(dispute(), []).result, null);
    const model = buildTutorComplaint(
      dispute({
        status: "awaiting_student_choice",
        determination: { id: "det", merit: "partial", allowed_remedies: ["reschedule"], determined_at: "2026-10-17T07:40:00Z" },
      }),
      []
    );
    assert.deepEqual(model.result, { meritLabel: "Kısmi", whenLabel: "17 Ekim Cumartesi 10:40" });
  });

  it("lists the evidence staff opened, by name", () => {
    const model = buildTutorComplaint(
      dispute({
        evidence: [
          { id: "e1", original_name: "rapor.pdf", mime_type: "application/pdf", size_bytes: 1, scan_state: "active", validated_at: null, deleted_requested: false },
        ],
      }),
      []
    );
    assert.deepEqual(model.evidence, [{ id: "e1", name: "rapor.pdf" }]);
  });

  it("lists the tutor's own earlier answers with their dates", () => {
    const model = buildTutorComplaint(
      dispute({ tutor_responses: [{ body: "Raporu yükledim.", created_at: "2026-10-16T06:12:00Z" }] }),
      []
    );
    assert.deepEqual(model.replies, [{ when: "16 Ekim Cuma 09:12", body: "Raporu yükledim." }]);
  });

  it("takes an answer while it is open, and says why not once it is over", () => {
    for (const status of ["waiting_review", "under_review", "needs_more_info", "awaiting_student_choice"]) {
      const model = buildTutorComplaint(dispute({ status }), []);
      assert.equal(model.reply.open, true, status);
      assert.equal(model.reply.closedNote, null, status);
    }
    const resolved = buildTutorComplaint(dispute({ status: "resolved" }), []);
    assert.equal(resolved.reply.open, false);
    assert.equal(resolved.reply.closedNote, "Bu bildirim çözüldüğü için yeni yanıt eklenemiyor.");
    const closed = buildTutorComplaint(dispute({ status: "closed" }), []);
    assert.equal(closed.reply.closedNote, "Bu bildirim kapandığı için yeni yanıt eklenemiyor.");
  });
});
