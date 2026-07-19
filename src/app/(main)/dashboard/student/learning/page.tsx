import { redirect } from "next/navigation";

/** Legacy learning/packages URL: the package hub UI has been removed. */
export default function StudentLearningRedirectPage() {
  redirect("/dashboard/student");
}
