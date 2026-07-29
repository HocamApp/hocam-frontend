import TutorsPageClient from "@/components/tutors/TutorsPageClient";

// The page uses URL-backed filters. Dynamic rendering lets useSearchParams
// resolve on the server so the verified tutor list and its heading are
// present in the initial HTML instead of a client-only loading shell.
export const dynamic = "force-dynamic";

export default function TutorsPage() {
  return <TutorsPageClient />;
}
