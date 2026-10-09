import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Notification } from "@/types/api";
import { getNotificationHref } from "./notificationHref";

function n(type: string, related_object_type: string, related_object_id: string | null = "x1"): Notification {
  return { id: "n", type, title: "", body: "", is_read: false, related_object_type, related_object_id, created_at: "" };
}

describe("getNotificationHref", () => {
  it("keeps the existing lesson and message routes", () => {
    assert.equal(getNotificationHref(n("message", "conversation"), "student"), "/messages/x1");
    assert.equal(getNotificationHref(n("x", "message_request"), "student"), "/");
  });

  it("sends a tutor to the request that needs an answer", () => {
    assert.equal(
      getNotificationHref(n("coaching_reschedule_requested", "coaching_session"), "tutor"),
      "/dashboard/tutor/coaching/reschedule-requests",
    );
    assert.equal(
      getNotificationHref(n("coaching_report_overdue", "coaching_session", "s9"), "tutor"),
      "/dashboard/tutor/coaching/sessions/s9/report",
    );
    assert.equal(getNotificationHref(n("x", "coaching_time_request"), "tutor"), "/dashboard/tutor/coaching/time-requests");
  });

  it("routes every coaching record type for both roles", () => {
    for (const type of [
      "coaching_session", "coaching_dispute", "coaching_purchase", "coaching_refund_obligation",
      "coaching_refund_operation", "coaching_sla_cycle", "coaching_report", "coaching_time_request",
      "package_purchase",
    ]) {
      for (const role of ["student", "tutor"]) {
        assert.ok(getNotificationHref(n("any", type), role), `${type} / ${role}`);
      }
    }
    assert.equal(
      getNotificationHref(n("coaching_dispute_resolved", "coaching_dispute", "d1"), "student"),
      "/dashboard/student/coaching/complaints/d1",
    );
  });
});
