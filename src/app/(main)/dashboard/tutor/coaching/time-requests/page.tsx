import { redirect } from "next/navigation";

/**
 * Time requests are answered in the Talepler inbox now. Notification links and
 * bookmarks to this address still land in the right place.
 */
export default function CoachingTimeRequestsRedirect() {
  redirect("/dashboard/tutor/coaching/requests");
}
