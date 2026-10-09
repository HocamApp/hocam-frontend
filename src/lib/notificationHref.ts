import type { Notification } from "@/types/api";

type Role = string | undefined;

const TUTOR_REPORT_EVENTS = new Set([
  "coaching_report_draft_ready",
  "coaching_report_reminder",
  "coaching_report_overdue",
]);

function coachingSessionHref(n: Notification, role: Role): string {
  if (role === "tutor") {
    if (n.type === "coaching_reschedule_requested") {
      return "/dashboard/tutor/coaching/reschedule-requests";
    }
    if (TUTOR_REPORT_EVENTS.has(n.type) && n.related_object_id) {
      return `/dashboard/tutor/coaching/sessions/${n.related_object_id}/report`;
    }
    return "/dashboard/tutor/coaching/upcoming";
  }
  if (n.type === "coaching_complaint_eligible") return "/dashboard/student/coaching/complaints";
  return "/dashboard/student/coaching/upcoming";
}

/**
 * Where a notification row leads. A notification that tells someone
 * something happened and then leaves them to hunt for it is half a
 * notification; coaching rows had no destination at all.
 */
export function getNotificationHref(n: Notification, role?: string): string | null {
  const isTutor = role === "tutor";

  switch (n.related_object_type) {
    case "conversation":
      return n.related_object_id ? `/messages/${n.related_object_id}` : "/messages";
    case "booking":
      if (n.related_object_id) {
        return isTutor
          ? `/dashboard/tutor?tab=bookings&highlightBooking=${n.related_object_id}`
          : `/dashboard/student?highlightBooking=${n.related_object_id}`;
      }
      return isTutor ? "/dashboard/tutor" : "/dashboard/student";
    case "lesson_request":
      return isTutor ? "/dashboard/tutor" : "/dashboard/student";
    // The unanswered-request nudge exists to send the student back to the
    // directory, so that is where it goes.
    case "message_request":
      return "/";
    case "package_purchase":
      if (!isTutor) return n.type === "package_request_accepted" ? "/dashboard/student" : "/";
      // A bundle with coaching is answered from the coaching Talepler tab;
      // a lesson-only request from the package workspace.
      return n.type === "coaching_package_request"
        ? "/dashboard/tutor/coaching/requests"
        : "/dashboard/tutor/packages";
    case "coaching_session":
      return coachingSessionHref(n, role);
    case "coaching_time_request":
      return isTutor ? "/dashboard/tutor/coaching/time-requests" : "/dashboard/student/coaching/schedule";
    case "coaching_dispute":
      if (!n.related_object_id) {
        return isTutor ? "/dashboard/tutor/coaching/complaints" : "/dashboard/student/coaching/complaints";
      }
      return isTutor
        ? `/dashboard/tutor/coaching/complaints/${n.related_object_id}`
        : `/dashboard/student/coaching/complaints/${n.related_object_id}`;
    case "coaching_purchase":
      if (isTutor) return "/dashboard/tutor/coaching/students";
      return n.type === "coaching_schedule_needed"
        ? "/dashboard/student/coaching/schedule"
        : "/dashboard/student/coaching";
    case "coaching_refund_obligation":
    case "coaching_refund_operation":
      return isTutor ? "/dashboard/tutor/coaching" : "/dashboard/student/coaching/complaints";
    case "coaching_tutor_earning":
      return "/dashboard/tutor/statistics?tab=income&period=30";
    case "coaching_sla_cycle":
      return "/messages";
    case "coaching_report":
      return isTutor
        ? "/dashboard/tutor/coaching/reports"
        : n.related_object_id
          ? `/dashboard/student/coaching/reports/${n.related_object_id}`
          : "/dashboard/student/coaching/reports";
    case "coaching_plan":
      // "A place opened" for a student who asked to be told: back to coaching.
      return "/dashboard/student/coaching";
    default:
      return null;
  }
}
