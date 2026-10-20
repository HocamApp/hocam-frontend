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

  it("opens the complaint form on the missing-report topic when a report is overdue", () => {
    assert.equal(
      getNotificationHref(n("coaching_complaint_eligible", "coaching_session"), "student"),
      "/dashboard/student/coaching/complaints?konu=report_absent",
    );
  });

  it("splits package requests by whether they carry coaching", () => {
    assert.equal(getNotificationHref(n("package_request", "package_purchase"), "tutor"), "/dashboard/tutor/packages");
    assert.equal(
      getNotificationHref(n("coaching_package_request", "package_purchase"), "tutor"),
      "/dashboard/tutor/coaching/requests",
    );
    assert.equal(getNotificationHref(n("package_request_accepted", "package_purchase"), "student"), "/dashboard/student");
    assert.equal(getNotificationHref(n("package_request_rejected", "package_purchase"), "student"), "/");
  });

  it("sends a paid package to the calendar of whoever it concerns", () => {
    assert.equal(
      getNotificationHref(n("package_activated", "package_purchase"), "student"),
      "/dashboard/student",
    );
    assert.equal(
      getNotificationHref(n("package_purchased", "package_purchase"), "tutor"),
      "/dashboard/tutor?tab=bookings",
    );
  });

  it("sends a package whose term was extended to the calendar of whoever it concerns", () => {
    assert.equal(
      getNotificationHref(n("package_extended", "package_purchase"), "student"),
      "/dashboard/student",
    );
    assert.equal(
      getNotificationHref(n("package_extended", "package_purchase"), "tutor"),
      "/dashboard/tutor?tab=bookings",
    );
  });

  it("opens the refund the student follows, and the tutor's calendar when their lessons were cancelled", () => {
    for (const type of ["refund_requested", "refund_approved", "refund_rejected", "refund_processed"]) {
      assert.equal(
        getNotificationHref(n(type, "refund_request", "r7"), "student"),
        "/profile/payments/refunds/r7",
        type,
      );
    }
    assert.equal(
      getNotificationHref(n("refund_lessons_cancelled", "refund_request", "r7"), "tutor"),
      "/dashboard/tutor?tab=bookings",
    );
    assert.equal(
      getNotificationHref(n("refund_requested", "refund_request", null), "student"),
      "/profile/payments",
    );
  });

  it("highlights the lesson a tutor was told was added with a package credit", () => {
    assert.equal(
      getNotificationHref(n("package_lesson_booked", "booking", "b4"), "tutor"),
      "/dashboard/tutor?tab=bookings&highlightBooking=b4",
    );
  });

  it("sends a student who must pick a time straight to the schedule", () => {
    assert.equal(
      getNotificationHref(n("coaching_schedule_needed", "coaching_purchase"), "student"),
      "/dashboard/student/coaching/schedule",
    );
  });
});
