import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CoachingDispute } from "./coachingApi";
import {
  buildComplaintCards,
  buildDisputeDetail,
  categoryDeadlineLines,
  complaintsSummary,
  refundLine,
  studentDisputeStatusLabel,
} from "./coachingStudentComplaints";
import { formatTryMinor } from "./money";

function dispute(id: string, status: string, submittedAt: string, extra: Partial<CoachingDispute> = {}): CoachingDispute {
  return {
    id,
    category: "report_absent",
    status,
    description: "3. görüşmenin raporu teslim edilmedi.",
    submitted_at: submittedAt,
    service_period_id: "sp-1",
    session_id: "s-3",
    determination: null,
    selected_remedy: null,
    application: null,
    refund: { liability_minor: 0, settled_minor: 0, state: "none" },
    evidence: [],
    tutor_responses: [],
    timeline: [],
    ...extra,
  };
}

const list = [
  dispute("d-old", "closed", "2026-10-02T18:40:00Z", { category: "message_sla" }),
  dispute("d-info", "needs_more_info", "2026-10-15T11:20:00Z"),
  dispute("d-new", "under_review", "2026-10-19T08:00:00Z", { category: "technical" }),
  dispute("d-done", "resolved", "2026-10-08T16:05:00Z", { category: "technical" }),
  dispute("d-choice", "awaiting_student_choice", "2026-10-10T09:00:00Z", { category: "tutor_no_show" }),
];

describe("studentDisputeStatusLabel", () => {
  it("says what is waiting for the student in the student's own words", () => {
    assert.equal(studentDisputeStatusLabel("awaiting_student_choice"), "Senin seçimin bekleniyor");
    assert.equal(studentDisputeStatusLabel("needs_more_info"), "Ek bilgi gerekli");
    assert.equal(studentDisputeStatusLabel("waiting_review"), "İnceleme bekliyor");
    assert.equal(studentDisputeStatusLabel("under_review"), "İnceleniyor");
    assert.equal(studentDisputeStatusLabel("resolved"), "Çözüldü");
    assert.equal(studentDisputeStatusLabel("closed"), "Kapandı");
    assert.equal(studentDisputeStatusLabel("something_new"), "Durum güncelleniyor");
  });
});

describe("buildComplaintCards", () => {
  it("puts what waits for the student first, then the newest", () => {
    assert.deepEqual(
      buildComplaintCards(list).map((card) => card.id),
      ["d-info", "d-choice", "d-new", "d-done", "d-old"],
    );
  });

  it("names the topic, says when it was filed in Istanbul time, and where it opens", () => {
    const [first] = buildComplaintCards(list);

    assert.equal(first.title, "Rapor hazırlanmadı");
    assert.equal(first.whenLabel, "15 Ekim Perşembe 14:20");
    assert.equal(first.statusLabel, "Ek bilgi gerekli");
    assert.equal(first.href, "/dashboard/student/coaching/complaints/d-info");
  });

  it("marks only the ones that need a step from the student", () => {
    const byId = Object.fromEntries(buildComplaintCards(list).map((card) => [card.id, card]));

    assert.deepEqual(
      Object.entries(byId).map(([id, card]) => [id, card.needsStudent, card.tone]),
      [
        ["d-info", true, "attention"],
        ["d-choice", true, "attention"],
        ["d-new", false, "working"],
        ["d-done", false, "done"],
        ["d-old", false, "done"],
      ],
    );
    assert.equal(buildComplaintCards([dispute("w", "waiting_review", "2026-10-19T08:00:00Z")])[0].tone, "waiting");
  });

  it("does not rely on the server's order", () => {
    const shuffled = [list[3], list[0], list[2], list[4], list[1]];

    assert.deepEqual(
      buildComplaintCards(shuffled).map((card) => card.id),
      buildComplaintCards(list).map((card) => card.id),
    );
  });
});

describe("complaintsSummary", () => {
  it("counts the complaints and the ones waiting for the student", () => {
    assert.equal(complaintsSummary(buildComplaintCards(list)), "5 bildirim · 2 tanesi senden bir adım bekliyor");
    assert.equal(
      complaintsSummary(buildComplaintCards(list.slice(0, 1).concat(list[1]))),
      "2 bildirim · 1 tanesi senden bir adım bekliyor",
    );
  });

  it("says nothing about a step when none is waiting, and nothing at all without complaints", () => {
    assert.equal(complaintsSummary(buildComplaintCards([list[0], list[3]])), "2 bildirim");
    assert.equal(complaintsSummary([]), "");
  });
});

describe("categoryDeadlineLines", () => {
  it("names the last day to file, not the day after: the deadline is the moment the window closes", () => {
    const lines = categoryDeadlineLines({
      category_filing_deadlines: {
        // 28 October 00:00 in Istanbul: the last day to file is the 27th.
        report_absent: "2026-10-27T21:00:00Z",
        other: "2026-10-29T10:00:00Z",
        inappropriate_behavior: null,
      },
    });

    assert.deepEqual(lines, {
      report_absent: "Son bildirim günü: 27 Ekim Salı",
      other: "Son bildirim günü: 29 Ekim Perşembe",
    });
  });

  it("is empty when the server gave no deadlines", () => {
    assert.deepEqual(categoryDeadlineLines({}), {});
    assert.deepEqual(categoryDeadlineLines({ category_filing_deadlines: undefined }), {});
  });
});

describe("refundLine", () => {
  it("is nothing when there is no refund to speak of", () => {
    assert.equal(refundLine({ state: "none", liability_minor: 0 }), null);
    assert.equal(refundLine({ state: "nothing_to_settle", liability_minor: 0 }), null);
  });

  it("says the server's state and the amount it recorded", () => {
    assert.deepEqual(refundLine({ state: "obligation_pending", liability_minor: 240000 }), {
      status: "İade edilecek tutar kaydedildi; işlem sırada.",
      amount: formatTryMinor(240000),
    });
    assert.deepEqual(refundLine({ state: "settled", liability_minor: 0 }), {
      status: "İade tamamlandı.",
      amount: null,
    });
  });
});

describe("buildDisputeDetail", () => {
  const base = dispute("d-1", "under_review", "2026-10-15T11:20:00Z", {
    timeline: [
      { event_type: "created", participant_message: "Bildirimin alındı.", created_at: "2026-10-15T11:20:00Z" },
      { event_type: "review", participant_message: "", created_at: "2026-10-16T06:00:00Z" },
    ],
    tutor_responses: [{ body: "Rapor sistem hatası yüzünden gecikti.", created_at: "2026-10-16T07:15:00Z" }],
  });

  it("dates the steps of the process and the tutor's replies", () => {
    const detail = buildDisputeDetail(base);

    assert.deepEqual(detail.steps, [
      { when: "15 Ekim Perşembe 14:20", text: "Bildirimin alındı." },
      { when: "16 Ekim Cuma 09:00", text: "Süreç güncellemesi" },
    ]);
    assert.deepEqual(detail.responses, [{ when: "16 Ekim Cuma 10:15", body: "Rapor sistem hatası yüzünden gecikti." }]);
    assert.equal(detail.title, "Rapor hazırlanmadı");
    assert.equal(detail.needsMoreInfo, false);
  });

  it("asks for more information when the server does", () => {
    assert.equal(buildDisputeDetail({ ...base, status: "needs_more_info" }).needsMoreInfo, true);
  });

  it("offers the remedies the server allows until one is applied, with the review's result", () => {
    const decided = {
      ...base,
      status: "awaiting_student_choice",
      determination: {
        id: "det-1",
        merit: "student_upheld",
        allowed_remedies: ["reschedule", "period_refund"],
        determined_at: "2026-10-17T13:30:00Z",
      },
    };

    const detail = buildDisputeDetail(decided);

    assert.deepEqual(detail.choice, {
      determinationId: "det-1",
      meritLabel: "Öğrenci lehine",
      options: [
        { value: "reschedule", label: "Yeniden görüşme" },
        { value: "period_refund", label: "İlgili dönem iadesi" },
      ],
    });
    assert.equal(detail.chosen, null);
  });

  it("says what was chosen once it is applied, and the refund it led to", () => {
    const applied = {
      ...base,
      status: "resolved",
      determination: {
        id: "det-1",
        merit: "student_upheld",
        allowed_remedies: ["period_refund"],
        determined_at: "2026-10-17T13:30:00Z",
      },
      selected_remedy: "period_refund",
      application: {
        id: "app-1",
        remedy_type: "period_refund",
        applied_at: "2026-10-18T10:00:00Z",
        session_id: null,
        service_period_id: "sp-1",
        refund_obligation_status: "pending",
      },
      refund: { liability_minor: 240000, settled_minor: 0, state: "processing" },
    };

    const detail = buildDisputeDetail(applied);

    assert.equal(detail.choice, null);
    assert.deepEqual(detail.chosen, {
      label: "İlgili dönem iadesi",
      refund: { status: "İade işlemi işleniyor.", amount: formatTryMinor(240000) },
    });
  });

  it("has no replies, no choice and nothing chosen for a fresh complaint", () => {
    const detail = buildDisputeDetail(dispute("d-2", "waiting_review", "2026-10-19T08:00:00Z"));

    assert.deepEqual([detail.responses, detail.steps, detail.choice, detail.chosen], [[], [], null, null]);
  });
});
