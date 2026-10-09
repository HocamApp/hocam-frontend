import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingRecordGuard } from "@/components/coaching/CoachingGuard";
import { TutorCoachingPendingWork } from "@/components/coaching/TutorCoachingPendingWork";
import { TutorAcceptanceRequestList } from "@/components/requests/TutorAcceptanceRequestList";

export default function TutorCoachingRequestsPage() {
  return (
    <CoachingRecordGuard>
      <CoachingPageShell
        title="Talepler"
        width="wide"
        currentHref="/dashboard/tutor/coaching/requests"
        audience="tutor"
      >
        <div className="space-y-6">
          <TutorCoachingPendingWork />
          <TutorAcceptanceRequestList surface="coaching" />
        </div>
      </CoachingPageShell>
    </CoachingRecordGuard>
  );
}
