import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as React from "react";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { NotificationMark } from "./NotificationMark";
import { getNotificationAppearance } from "./notificationAppearance";
import { formatRelativeTime } from "@/lib/utils";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const CountAwareNotificationMark = NotificationMark as ComponentType<{
  unreadCount: number;
}>;
const renderMark = (unreadCount: number) =>
  renderToStaticMarkup(
    createElement(CountAwareNotificationMark, { unreadCount }),
  );

const iconOf = (type: string, related = "") =>
  getNotificationAppearance(type, related).icon;
const colorOf = (type: string, related = "") =>
  getNotificationAppearance(type, related).color;

describe("NotificationMark", () => {
  it("renders nothing when there are no unread notifications", () => {
    assert.equal(renderMark(0), "");
  });

  it("shows the unread notification count", () => {
    assert.match(renderMark(2), />2<\/span>/);
  });

  it("caps a three-digit count at 99+", () => {
    assert.match(renderMark(128), />99\+<\/span>/);
  });
});

describe("notification appearance", () => {
  it("uses the reference's own icon and colour for each family", () => {
    assert.deepEqual(getNotificationAppearance("message"), {
      icon: "💬",
      color: "#FF3D71",
    });
    assert.deepEqual(getNotificationAppearance("coaching_purchase"), {
      icon: "💸",
      color: "#00C9A7",
    });
    assert.deepEqual(getNotificationAppearance("lesson_request"), {
      icon: "👤",
      color: "#FFB800",
    });
    assert.deepEqual(getNotificationAppearance("booking_reminder"), {
      icon: "🗞️",
      color: "#1E86FF",
    });
  });

  it("puts the problem icon on things that did not happen", () => {
    // Listed before the coaching and booking rules on purpose: a dispute is
    // also a coaching type and a cancellation is also a booking one.
    for (const type of [
      "booking_cancelled",
      "lesson_request_declined",
      "coaching_dispute_opened",
      "coaching_sla_breach",
      "coaching_report_overdue",
      "student_absence_reported",
      "technical_failure",
      "trust_safety_flag",
    ]) {
      assert.equal(iconOf(type), "🚨", type);
    }
  });

  it("marks confirmations, and lets a resolved dispute stay a dispute", () => {
    assert.equal(iconOf("booking_confirmed"), "👍");
    assert.equal(iconOf("lesson_request_accepted"), "👍");
    assert.equal(iconOf("booking_completed"), "👍");
    // The dispute rule runs first, so "resolved" does not steal it.
    assert.equal(iconOf("coaching_dispute_resolved"), "🚨");
  });

  it("does not read 'learning' as 'earning'", () => {
    // This was money, with a banknote on it, until every type was rendered in
    // a grid and the collision became visible.
    assert.equal(iconOf("learning_plan_proposed"), "🗞️");
    assert.equal(iconOf("coaching_tutor_earning"), "💸");
  });

  it("matches on the relation when the type alone does not say", () => {
    assert.equal(iconOf("something_new", "conversation"), "💬");
    assert.equal(iconOf("something_new", "lesson_request"), "👤");
  });

  it("falls back to the event pair rather than rendering nothing", () => {
    // The backend adds types every release; an unmapped one must still draw.
    const { icon, color } = getNotificationAppearance("some_future_event");
    assert.equal(icon, "🗞️");
    assert.equal(color, "#1E86FF");
  });

  it("never returns an empty icon or colour for any known type", () => {
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
      assert.ok(iconOf(type).length > 0, `${type} has no icon`);
      assert.match(colorOf(type), /^#[0-9A-F]{6}$/i, `${type} has no colour`);
    }
  });
});

describe("formatRelativeTime", () => {
  const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

  it("answers in minutes, which is the whole point", () => {
    // formatRelativeDate calls all of these "Bugün", which is the right grain
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
