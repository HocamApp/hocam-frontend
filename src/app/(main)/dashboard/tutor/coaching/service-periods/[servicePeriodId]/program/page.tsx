"use client";

import { useParams } from "next/navigation";

import { CoachingRecordGuard as CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingProgramEditor } from "@/components/coaching/CoachingProgramEditor";

export default function TutorCoachingProgramPage() {
  const { servicePeriodId } = useParams<{ servicePeriodId: string }>();
  return <CoachingGuard><CoachingPageShell title="Öğrenci programı" width="wide" currentHref="/dashboard/tutor/coaching/students" audience="tutor"><CoachingProgramEditor servicePeriodId={servicePeriodId} /></CoachingPageShell></CoachingGuard>;
}
