import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  NOTIFICATION_TONE_CLASS,
  getNotificationAppearance,
} from "./notificationAppearance";
import { formatRelativeTime } from "@/lib/utils";

const toneOf = (type: string, related = "") =>
  getNotificationAppearance(type, related).tone;

describe("notification appearance", () => {
  it("sends anything that went wrong to the error tone", () => {
    // Listed before the coaching and booking rules on purpose: a dispute is a
    // coaching type and a cancellation is a booking type, so a naive
    // family-first ordering would paint both as ordinary.
    for (const type of [
      "coaching_dispute_opened",
      "booking_cancelled",
      "coaching_sla_breach",
      "lesson_request_declined",
      "coaching_report_overdue",
      "student_absence_reported",
      "technical_failure",
      "trust_safety_flag",
    ]) {
      assert.equal(toneOf(type), "error", type);
    }
  });

  it("keeps money on gold and confirmations on success", () => {
    assert.equal(toneOf("coaching_purchase"), "gold");
    assert.equal(toneOf("period_refund"), "gold");
    assert.equal(toneOf("coaching_tutor_earning"), "gold");

    assert.equal(toneOf("booking_confirmed"), "success");
    assert.equal(toneOf("lesson_request_accepted"), "success");
    assert.equal(toneOf("coaching_dispute_resolved"), "error"); // dispute wins
  });

  it("gives conversation the one hue reserved for it", () => {
    assert.equal(toneOf("message"), "pink");
    assert.equal(toneOf("message_request"), "pink");
    assert.equal(toneOf("conversation"), "pink");
    // Some rows carry the relation but not the type.
    assert.equal(toneOf("something_new", "conversation"), "pink");
  });

  it("never invents a colour outside the system", () => {
    // The reference design used four hues this palette does not own. Every
    // tone here has to resolve to a class built from existing tokens.
    const allowed = new Set(Object.keys(NOTIFICATION_TONE_CLASS));
    const everyBackendType = [
      "booking", "booking_awaiting_confirmation", "booking_cancelled",
      "booking_completed", "booking_confirmed", "booking_disputed",
      "booking_reminder", "coaching_capacity_available", "coaching_dispute",
      "coaching_plan", "coaching_purchase", "coaching_reminder",
      "coaching_session", "conversation", "dispute_resolved",
      "learning_plan_proposed", "lesson_request", "lesson_request_accepted",
      "message", "message_request_blocked", "pdf", "period_refund",
      "physically_deleted", "png", "reschedule", "student_goal", "student_id",
      "technical_failure", "test", "trust_safety_flag", "tutor_auto_hidden",
      "tutor_leaving", "tutor_profile",
    ];
    for (const type of everyBackendType) {
      assert.ok(allowed.has(toneOf(type)), `${type} produced an unknown tone`);
    }
  });

  it("falls back rather than rendering nothing for an unknown type", () => {
    // The backend adds types every release; an unmapped one must still draw.
    const { icon, tone } = getNotificationAppearance("some_future_event");
    assert.ok(icon);
    assert.equal(tone, "ink");
  });
});

describe("formatRelativeTime", () => {
  const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

  it("answers in minutes, which is the whole point", () => {
    // formatRelativeDate calls both of these "Bugün", which is the right grain
    // for a review and the wrong one for a feed.
    assert.equal(formatRelativeTime(ago(30_000)), "az önce");
    assert.equal(formatRelativeTime(ago(4 * 60_000)), "4 dk önce");
    assert.equal(formatRelativeTime(ago(59 * 60_000)), "59 dk önce");
    assert.equal(formatRelativeTime(ago(3 * 3_600_000)), "3 sa önce");
  });

  it("hands back to the day-grained formatter past a day", () => {
    assert.equal(formatRelativeTime(ago(26 * 3_600_000)), "Dün");
    assert.equal(formatRelativeTime(ago(3 * 86_400_000)), "3 gün önce");
  });

  it("returns empty rather than NaN for an unparseable date", () => {
    assert.equal(formatRelativeTime("not-a-date"), "");
  });
});
