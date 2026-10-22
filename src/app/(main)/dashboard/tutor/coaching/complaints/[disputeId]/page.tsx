"use client";

import { useParams } from "next/navigation";

import { CoachingRecordGuard } from "@/components/coaching/CoachingGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { TutorComplaintDetail } from "@/components/coaching/TutorComplaintDetail";

export default function TutorCoachingComplaintDetailPage() {
  const { disputeId } = useParams<{ disputeId: string }>();
  return (
    <CoachingRecordGuard>
      <CoachingPageShell
        title="Sorun bildirimi"
        width="default"
        currentHref="/dashboard/tutor/coaching/complaints"
        audience="tutor"
      >
        <TutorComplaintDetail disputeId={disputeId} />
      </CoachingPageShell>
    </CoachingRecordGuard>
  );
}
