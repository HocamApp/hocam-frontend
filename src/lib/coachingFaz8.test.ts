import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COACHING_FAZ8_QUERY_KEYS,
  RATING_CRITERIA,
  RATING_CRITERIA_LABELS,
  REPORT_FEEDBACK_CHOICES,
  REPORT_FEEDBACK_LABELS,
  type CoachingDispute,
  type CoachingDisputeEvidence,
  type CoachingFinancialSummary,
  type CoachingCancellationResult,
  type CoachingTutorEarningSummary,
  COACHING_DISPUTE_CATEGORY_LABEL,
  COACHING_DISPUTE_MERIT_LABEL,
  COACHING_DISPUTE_REMEDY_LABEL,
  COACHING_DISPUTE_STATUS_LABEL,
  COACHING_EVIDENCE_SCAN_STATE_LABEL,
  COACHING_SERVICE_STATUS_LABEL,
  coachingDisputeCategoryLabel,
  coachingDisputeMeritLabel,
  coachingDisputeRemedyLabel,
  coachingDisputeStatusLabel,
  coachingEvidenceScanStateLabel,
  coachingServiceStatusLabel,
  coachingEarningStatusCopy,
  coachingRefundStateCopy,
} from "./coachingApi";

describe("Faz 8 coaching financial copy", () => {
  it("keeps obligation, processing, settlement, and no-charge truth distinct", () => {
    assert.match(coachingRefundStateCopy("obligation_pending"), /İade gerekli/i);
    assert.match(coachingRefundStateCopy("processing"), /işleniyor/i);
    assert.match(coachingRefundStateCopy("settled"), /tamamlandı/i);
    assert.match(coachingRefundStateCopy("nothing_to_settle"), /Ödeme gerekmiyor/i);
  });

  it("never calls an unfunded, held, or READY earning paid", () => {
    assert.doesNotMatch(coachingEarningStatusCopy("eligible_unfunded"), /ödendi/i);
    assert.doesNotMatch(coachingEarningStatusCopy("on_hold"), /ödendi/i);
    assert.doesNotMatch(coachingEarningStatusCopy("ready"), /ödendi/i);
  });
});

describe("Faz 8 query keys", () => {
  it("separates student cases, tutor cases, eligibility, and finance caches", () => {
    assert.notDeepEqual(
      COACHING_FAZ8_QUERY_KEYS.studentDisputes(),
      COACHING_FAZ8_QUERY_KEYS.tutorDisputes(),
    );
    assert.deepEqual(COACHING_FAZ8_QUERY_KEYS.eligibility("purchase-1"), [
      "coaching-dispute-eligibility",
      "purchase-1",
    ]);
  });
});

describe("Faz 8 participant contract state", () => {
  it("keeps complaint list/detail, eligibility, and evidence lifecycle server-shaped", () => {
    const evidence: CoachingDisputeEvidence = {
      id: "evidence-1", original_name: "not.webm", mime_type: "audio/webm", size_bytes: 20,
      scan_state: "scan_unavailable", validated_at: null, deleted_requested: false,
    };
    const dispute: CoachingDispute = {
      id: "dispute-1", category: "technical", status: "needs_more_info", description: "Bağlantı sorunu.",
      submitted_at: "2026-08-10T10:00:00Z", service_period_id: "period-1", session_id: "session-1",
      determination: null, selected_remedy: null, application: null,
      refund: { liability_minor: 0, settled_minor: 0, state: "none" },
      evidence: [evidence], tutor_responses: [], timeline: [],
    };
    assert.equal(dispute.status, "needs_more_info");
    assert.equal(dispute.evidence[0].scan_state, "scan_unavailable");
    assert.equal(dispute.evidence[0].deleted_requested, false);
    assert.equal("storage_path" in dispute.evidence[0], false);
  });

  it("keeps cancellation, no-charge, liability, processing, and settlement separate", () => {
    const cancellation: CoachingCancellationResult = {
      service_status: "cancellation_pending", cancellation_pending: true,
      active_service_period_id: "period-1", terminated_upcoming_period_ids: ["period-2"],
      refund_liability_minor: 500, refund_state: "obligation_pending",
    };
    const noCharge: CoachingFinancialSummary = {
      service_status: "cancelled", financial_status: "pending", collected_amount_minor: 0,
      refund_liability_minor: 0, refund_processing_count: 0, refund_settled_minor: 0,
      cancellation_pending: false, refund_state: "nothing_to_settle",
    };
    assert.equal(cancellation.cancellation_pending, true);
    assert.equal(noCharge.refund_state, "nothing_to_settle");
    assert.notEqual(coachingRefundStateCopy("processing"), coachingRefundStateCopy("settled"));
  });

  it("keeps tutor hold, reversal, and READY payout facts distinct", () => {
    const earnings: CoachingTutorEarningSummary = {
      eligible_unfunded_minor: 1, pending_minor: 2, on_hold_minor: 3, reversed_minor: 4,
      payout_batches: [{ local_month: "2026-08", status: "ready", total_amount_minor: 2, paid_at: null }],
    };
    assert.equal(earnings.on_hold_minor, 3);
    assert.equal(earnings.reversed_minor, 4);
    assert.match(coachingEarningStatusCopy(earnings.payout_batches[0].status), /hazır/i);
  });
});

describe("§41 session rating and §22.9 report feedback contract", () => {
  it("has exactly the seven named rating criteria, each with a Turkish label", () => {
    assert.equal(RATING_CRITERIA.length, 7);
    for (const criterion of RATING_CRITERIA) {
      assert.ok(RATING_CRITERIA_LABELS[criterion]?.length, `missing label for ${criterion}`);
    }
  });

  it("has exactly the three fixed report-feedback choices, not a comment thread", () => {
    assert.deepEqual(REPORT_FEEDBACK_CHOICES, [
      "goals_understood",
      "want_to_change_goal",
      "want_to_leave_note",
    ]);
    for (const choice of REPORT_FEEDBACK_CHOICES) {
      assert.ok(REPORT_FEEDBACK_LABELS[choice]?.length, `missing label for ${choice}`);
    }
  });
});

/**
 * The dispute vocabulary reaches the UI as bare codes. These screens used to
 * print them verbatim, so a student picked a complaint reason from a list that
 * read "scope_deficient" and "message_sla".
 */
describe("§31–§32 dispute vocabulary is Turkish, never a machine code", () => {
  const UNKNOWN = "totally_unknown_code";

  it("covers every category the backend can send", () => {
    assert.deepEqual(Object.keys(COACHING_DISPUTE_CATEGORY_LABEL).sort(), [
      "inappropriate_behavior",
      "message_sla",
      "other",
      "program_absent",
      "report_absent",
      "scope_deficient",
      "technical",
      "tutor_no_show",
    ]);
    assert.equal(
      coachingDisputeCategoryLabel("scope_deficient"),
      "Hizmet açıklanan kapsamda sunulmadı"
    );
  });

  it("covers every dispute status", () => {
    assert.deepEqual(Object.keys(COACHING_DISPUTE_STATUS_LABEL).sort(), [
      "awaiting_student_choice",
      "closed",
      "needs_more_info",
      "resolved",
      "under_review",
      "waiting_review",
    ]);
  });

  it("covers merits, remedies and evidence scan states", () => {
    assert.deepEqual(Object.keys(COACHING_DISPUTE_MERIT_LABEL).sort(), [
      "partial",
      "student_upheld",
      "tutor_upheld",
    ]);
    assert.deepEqual(Object.keys(COACHING_DISPUTE_REMEDY_LABEL).sort(), [
      "period_refund",
      "reschedule",
      "terminate_remaining",
    ]);
    assert.deepEqual(Object.keys(COACHING_EVIDENCE_SCAN_STATE_LABEL).sort(), [
      "active",
      "pending",
      "rejected",
      "scan_unavailable",
    ]);
  });

  it("covers the service statuses, including the ones the page-local copies missed", () => {
    ["pending_tutor_acceptance", "paused_by_platform", "rejected", "completed", "refunded"].forEach(
      (status) => assert.ok(COACHING_SERVICE_STATUS_LABEL[status], `missing ${status}`)
    );
    assert.equal(
      coachingServiceStatusLabel("accepted_awaiting_payment"),
      "Ödeme doğrulaması bekleniyor"
    );
  });

  // An unknown code means deploy skew. Echoing it at the student is the bug,
  // not a diagnostic — every accessor has to answer in Turkish regardless.
  it("never echoes an unknown code back at the user", () => {
    [
      coachingDisputeCategoryLabel,
      coachingDisputeStatusLabel,
      coachingDisputeMeritLabel,
      coachingDisputeRemedyLabel,
      coachingEvidenceScanStateLabel,
      coachingServiceStatusLabel,
    ].forEach((label) => {
      const result = label(UNKNOWN);
      assert.notEqual(result, UNKNOWN);
      assert.doesNotMatch(result, /_/, `"${result}" still looks like a code`);
    });
  });

  it("every label in every map is Turkish prose, not a snake_case echo", () => {
    [
      COACHING_DISPUTE_CATEGORY_LABEL,
      COACHING_DISPUTE_STATUS_LABEL,
      COACHING_DISPUTE_MERIT_LABEL,
      COACHING_DISPUTE_REMEDY_LABEL,
      COACHING_EVIDENCE_SCAN_STATE_LABEL,
      COACHING_SERVICE_STATUS_LABEL,
    ].forEach((map) =>
      Object.entries(map).forEach(([code, label]) => {
        assert.doesNotMatch(label, /_/, `${code} was left as a code`);
        assert.notEqual(label, code);
      })
    );
  });
});
