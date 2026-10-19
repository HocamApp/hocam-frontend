import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  AcceptanceRequest,
  CoachingRescheduleRequestItem,
  CoachingTimeRequest,
} from "./coachingApi";
import { buildCoachingInbox } from "./coachingInbox";

// Monday 19 October 2026, 12:30 in Istanbul (UTC+3). Tests never read the clock.
const NOW = new Date("2026-10-19T09:30:00Z");

function acceptance(overrides: Partial<AcceptanceRequest> = {}): AcceptanceRequest {
  return {
    id: "a-1",
    student: { id: "u-1", name: "Can", surname: "T." },
    package: { id: "pk-1", plan_name: "Paket", lessons_per_week: 2, duration_days: 28, total_credits: 8, total_price: 3200 },
    coaching: { frequency: "weekly", total_sessions: 4, total_price_minor: 240000, service_status: "pending" },
    includes_coaching: true,
    status: "pending",
    purchase_status: "pending_acceptance",
    requested_at: "2026-10-19T08:00:00Z",
    expires_at: "2026-10-19T11:45:00Z",
    responded_at: null,
    rejection_reason: "",
    rejection_note: "",
    ...overrides,
  } as AcceptanceRequest;
}

function reschedule(overrides: Partial<CoachingRescheduleRequestItem> = {}): CoachingRescheduleRequestItem {
  return {
    id: "r-1",
    session_id: "s-9",
    requested_by: "student",
    original_start: "2026-10-21T15:30:00Z",
    proposed_start: "2026-10-22T15:30:00Z",
    is_free: true,
    consumes_student_free_entitlement: true,
    requires_tutor_approval: true,
    granted_free_by_tutor: false,
    status: "pending",
    requested_at: "2026-10-19T07:00:00Z",
    responded_at: null,
    rejection_reason: "",
    student_name: "Mert A.",
    ...overrides,
  } as CoachingRescheduleRequestItem;
}

function timeRequest(overrides: Partial<CoachingTimeRequest> = {}): CoachingTimeRequest {
  return {
    id: "t-1",
    slot_index: 0,
    status: "pending",
    note: "Hafta içi akşamları müsait değilim",
    requested_at: "2026-10-19T06:00:00Z",
    expires_at: "2026-10-21T09:00:00Z",
    resolved_at: null,
    proposals: [],
    student_name: "Deniz Ö.",
    ...overrides,
  } as CoachingTimeRequest;
}

const inbox = buildCoachingInbox({
  acceptanceRequests: [
    acceptance(),
    acceptance({ id: "a-lesson", includes_coaching: false, coaching: null }),
    acceptance({ id: "a-done", status: "accepted", responded_at: "2026-10-18T10:00:00Z", student: { id: "u-2", name: "Elif", surname: "Y." } }),
    acceptance({ id: "a-no", status: "rejected", responded_at: "2026-10-16T10:00:00Z", student: { id: "u-3", name: "Ece", surname: "B." } }),
  ],
  timeRequests: [timeRequest()],
  rescheduleRequests: [reschedule()],
  now: NOW,
});

describe("buildCoachingInbox: waiting", () => {
  it("puts whatever is due soonest first, whatever kind it is", () => {
    assert.deepEqual(
      inbox.pending.map((item) => item.kind),
      ["acceptance", "time", "reschedule"]
    );
  });

  it("leaves out lesson-only requests, which belong to the lessons side", () => {
    assert.equal(inbox.pending.some((item) => item.id === "acceptance-a-lesson"), false);
  });

  it("describes a coaching request with both halves of the package and what answering it means", () => {
    const item = inbox.pending[0];
    assert.equal(item.kind, "acceptance");
    if (item.kind !== "acceptance") return;
    assert.equal(item.title, "Can T. koçluk istiyor");
    assert.equal(item.detail, "Ders ve koçluk paketi");
    assert.deepEqual(item.lines, [
      { label: "Ders paketi · haftada 2 ders · 4 hafta · 8 ders", amount: "3.200,00 ₺" },
      { label: "Çalışma koçluğu · Haftada 1 görüşme · 4 görüşme", amount: "2.400,00 ₺" },
    ]);
    assert.deepEqual(item.due, { value: "2 sa 15 dk kaldı", urgent: true });
    assert.equal(item.requestId, "a-1");
  });

  it("names the student on a time request, and quotes what they wrote", () => {
    const item = inbox.pending[1];
    assert.equal(item.kind, "time");
    if (item.kind !== "time") return;
    assert.equal(item.title, "Deniz Ö. saat istiyor");
    assert.equal(item.detail, "Uygun saat bulamadı");
    assert.equal(item.note, "Hafta içi akşamları müsait değilim");
    assert.deepEqual(item.due, { value: "Çar 12:00", urgent: false });
  });

  it("copes with a time request that names nobody", () => {
    const anon = buildCoachingInbox({
      acceptanceRequests: [],
      timeRequests: [timeRequest({ student_name: undefined, note: "" })],
      rescheduleRequests: [],
      now: NOW,
    });
    const item = anon.pending[0];
    assert.equal(item.title, "Bir öğrenci saat istiyor");
    if (item.kind === "time") assert.equal(item.note, null);
  });

  it("shows a reschedule request as now and wanted, and whether answering uses the student's free change", () => {
    const item = inbox.pending[2];
    assert.equal(item.kind, "reschedule");
    if (item.kind !== "reschedule") return;
    assert.equal(item.title, "Mert A. saat değiştirmek istiyor");
    assert.match(item.current, /21 Ekim Çarşamba 18:30/);
    assert.match(item.wanted, /22 Ekim Perşembe 18:30/);
    assert.equal(item.detail, `${item.current} yerine ${item.wanted}`);
    assert.equal(item.usesFreeChange, true);
    assert.deepEqual(item.due, { value: "Çar 18:30", urgent: false });
  });

  it("says a change that costs the student nothing does not", () => {
    const free = buildCoachingInbox({
      acceptanceRequests: [],
      timeRequests: [],
      rescheduleRequests: [reschedule({ consumes_student_free_entitlement: false })],
      now: NOW,
    });
    const item = free.pending[0];
    if (item.kind === "reschedule") assert.equal(item.usesFreeChange, false);
  });

  it("does not list a time request the tutor has already proposed for, as one to answer", () => {
    const proposed = buildCoachingInbox({
      acceptanceRequests: [],
      timeRequests: [
        timeRequest({
          proposals: [{ id: "p", day_of_week: 0, start_time: "18:00:00", status: "pending", proposed_at: "2026-10-19T08:00:00Z" }] as CoachingTimeRequest["proposals"],
        }),
      ],
      rescheduleRequests: [],
      now: NOW,
    });
    assert.deepEqual(proposed.pending, []);
    assert.equal(proposed.answered[0].detail, "Önerin: Pzt 18:00 · öğrenci yanıtı bekleniyor");
  });
});

describe("buildCoachingInbox: answered", () => {
  it("lists what has been answered, most recent first, saying what was decided and when", () => {
    assert.deepEqual(
      inbox.answered.map((row) => [row.title, row.detail, row.when]),
      [
        ["Elif Y. · koçluk talebi", "Kabul ettin", "Dün"],
        ["Ece B. · koçluk talebi", "Reddettin", "3 gün önce"],
      ]
    );
  });

  it("marks each as accepted, declined or neither, for its icon", () => {
    assert.deepEqual(inbox.answered.map((row) => row.outcome), ["accepted", "declined"]);
  });

  it("covers a request that ran out, was withdrawn, or was approved by itself", () => {
    const rows = buildCoachingInbox({
      acceptanceRequests: [
        acceptance({ id: "e", status: "expired", responded_at: null, expires_at: "2026-10-17T10:00:00Z" }),
        acceptance({ id: "w", status: "withdrawn", responded_at: "2026-10-18T09:00:00Z" }),
      ],
      timeRequests: [],
      rescheduleRequests: [reschedule({ id: "ra", status: "auto_approved", responded_at: "2026-10-19T08:00:00Z" })],
      now: NOW,
    }).answered;
    assert.deepEqual(rows.map((row) => row.detail), ["Otomatik onaylandı", "Öğrenci vazgeçti", "Süresi doldu"]);
  });

  it("keeps only the ten most recent", () => {
    const many = Array.from({ length: 14 }, (_, i) =>
      acceptance({ id: `m${i}`, status: "accepted", responded_at: `2026-10-${String(1 + i).padStart(2, "0")}T10:00:00Z` })
    );
    const rows = buildCoachingInbox({ acceptanceRequests: many, timeRequests: [], rescheduleRequests: [], now: NOW }).answered;
    assert.equal(rows.length, 10);
  });
});
