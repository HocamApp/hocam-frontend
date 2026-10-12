import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculation, refundRequest } from "@/test/refundFixtures";

import {
  isOpenRefund,
  newestFirst,
  openRefundFor,
  refundFigures,
  refundTimeline,
} from "./refundPresentation";

const NOW = Date.parse("2026-10-12T09:00:00+00:00");

function states(steps: ReturnType<typeof refundTimeline>) {
  return steps.map((step) => `${step.key}:${step.state}`);
}

describe("which requests are open", () => {
  it("counts a request that is waiting or approved, and nothing else", () => {
    assert.equal(isOpenRefund({ status: "requested" }), true);
    assert.equal(isOpenRefund({ status: "approved" }), true);
    assert.equal(isOpenRefund({ status: "rejected" }), false);
    assert.equal(isOpenRefund({ status: "processed" }), false);
  });

  it("finds the open request of one package", () => {
    const mine = refundRequest({ id: "a", purchase: "p1", status: "approved" });
    const closed = refundRequest({ id: "b", purchase: "p1", status: "rejected" });
    const other = refundRequest({ id: "c", purchase: "p2", status: "requested" });
    assert.equal(openRefundFor("p1", [closed, other, mine])?.id, "a");
    assert.equal(openRefundFor("p1", [closed, other]), null);
    assert.equal(openRefundFor("p1", undefined), null);
  });

  it("orders newest first without touching the input", () => {
    const old = refundRequest({ id: "old", created_at: "2026-09-01T09:00:00+00:00" });
    const recent = refundRequest({ id: "new", created_at: "2026-10-01T09:00:00+00:00" });
    const input = [old, recent];
    assert.deepEqual(newestFirst(input).map((r) => r.id), ["new", "old"]);
    assert.deepEqual(input.map((r) => r.id), ["old", "new"]);
  });
});

describe("the timeline of a request", () => {
  it("shows a waiting request as received, under review, and the rest to come", () => {
    const steps = refundTimeline(refundRequest(), NOW);
    assert.deepEqual(states(steps), [
      "received:done",
      "review:current",
      "approved:upcoming",
      "refunded:upcoming",
    ]);
    assert.equal(steps[0].detail, "11 Ekim 2026 tarihinde iade talebini aldık.");
    assert.equal(
      steps[1].detail,
      "Destek ekibimiz talebini inceliyor. En geç 25 Ekim 2026 tarihine kadar yanıt alırsın."
    );
  });

  it("says so when the answer is late, and points to support", () => {
    const steps = refundTimeline(refundRequest({ due_at: "2026-10-10T09:00:00+00:00" }), NOW);
    assert.match(steps[1].detail, /belirtilen tarih geçti/);
    assert.match(steps[1].detail, /Destek ekibine yazabilirsin/);
  });

  it("does not promise a date when the request carries none", () => {
    const steps = refundTimeline(refundRequest({ due_at: null }), NOW);
    assert.equal(steps[1].detail, "Destek ekibimiz talebini inceliyor.");
  });

  it("shows an approved request as waiting for the money", () => {
    const steps = refundTimeline(
      refundRequest({ status: "approved", decided_at: "2026-10-12T07:00:00+00:00" }),
      NOW
    );
    assert.deepEqual(states(steps), [
      "received:done",
      "review:done",
      "approved:done",
      "refunded:current",
    ]);
    assert.equal(steps[1].detail, "Talebin 12 Ekim 2026 tarihinde karara bağlandı.");
    assert.equal(steps[2].detail, "Talebin onaylandı ve planlı derslerin iptal edildi.");
    assert.match(steps[3].detail, /bankana göre değişir/);
  });

  it("keeps the approval sentence honest when no lesson was cancelled", () => {
    const steps = refundTimeline(
      refundRequest({
        status: "approved",
        calculation: calculation({ cancelled_lessons: [] }),
      }),
      NOW
    );
    assert.equal(steps[2].detail, "Talebin onaylandı.");
  });

  it("shows a closed request with the date the money was sent", () => {
    const steps = refundTimeline(
      refundRequest({
        status: "processed",
        decided_at: "2026-10-12T07:00:00+00:00",
        provider_refunded_at: "2026-10-13T10:00:00+00:00",
      }),
      NOW
    );
    assert.deepEqual(states(steps), [
      "received:done",
      "review:done",
      "approved:done",
      "refunded:done",
    ]);
    assert.match(steps[3].detail, /^13 Ekim 2026 tarihinde iade ödeme yöntemine gönderildi\./);
  });

  it("promises no number of days for the money to show up", () => {
    for (const status of ["requested", "approved", "processed"] as const) {
      const steps = refundTimeline(refundRequest({ status }), NOW);
      for (const step of steps) assert.doesNotMatch(step.detail, /\b\d+\s*(iş\s*)?gün/i, step.detail);
    }
  });

  it("ends a refused request at the refusal", () => {
    const steps = refundTimeline(
      refundRequest({
        status: "rejected",
        rejection_reason: "Dersler sürüyor.",
        decided_at: "2026-10-12T07:00:00+00:00",
      }),
      NOW
    );
    assert.deepEqual(states(steps), ["received:done", "review:done", "rejected:stopped"]);
    assert.equal(steps[2].title, "Reddedildi");
  });

  it("says the platform opened it when the platform did", () => {
    const steps = refundTimeline(refundRequest({ initiated_by: "platform" }), NOW);
    assert.equal(steps[0].detail, "11 Ekim 2026 tarihinde iade talebini senin adına açtık.");
  });
});

describe("the figures of a request", () => {
  it("reads the paid amount from the stored working", () => {
    const figures = refundFigures(refundRequest());
    assert.deepEqual(figures, {
      paid: 8500,
      deduction: 1700,
      refund: 6800,
      usedCredits: 2,
      unitPrice: 850,
    });
  });

  it("still has the row's own numbers for a request without a working", () => {
    const figures = refundFigures(refundRequest({ calculation: null }));
    assert.equal(figures.paid, null);
    assert.equal(figures.refund, 6800);
  });
});
