import { redirect } from "next/navigation";

/**
 * Complaints are listed on the Kayıtlar page now. Notification links and
 * bookmarks to this address still land in the right place; the page for a single
 * complaint is unchanged.
 */
export default function TutorCoachingComplaintsRedirect() {
  redirect("/dashboard/tutor/coaching/reports");
}
