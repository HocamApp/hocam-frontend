import { redirect } from "next/navigation";

/**
 * Time-change requests are answered in the Talepler inbox now. Notification
 * links and bookmarks to this address still land in the right place.
 */
export default function CoachingRescheduleRequestsRedirect() {
  redirect("/dashboard/tutor/coaching/requests");
}
