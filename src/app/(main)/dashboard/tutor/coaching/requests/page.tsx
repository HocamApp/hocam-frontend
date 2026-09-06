import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingRecordGuard } from "@/components/coaching/CoachingGuard";
import { TutorAcceptanceRequestList } from "@/components/requests/TutorAcceptanceRequestList";

export default function TutorCoachingRequestsPage() {
  return (
    <CoachingRecordGuard>
      <CoachingPageShell
        title="Yeni öğrenci talepleri"
        width="wide"
        currentHref="/dashboard/tutor/coaching/requests"
        audience="tutor"
      >
        <TutorAcceptanceRequestList surface="coaching" />
      </CoachingPageShell>
    </CoachingRecordGuard>
  );
}
