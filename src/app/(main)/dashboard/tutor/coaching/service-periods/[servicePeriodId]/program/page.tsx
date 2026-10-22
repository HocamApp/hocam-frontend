"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { CoachingRecordGuard as CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingEndCoachingSection } from "@/components/coaching/CoachingEndCoachingSection";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingProgramEditor } from "@/components/coaching/CoachingProgramEditor";
import { fetchCoachingStudents } from "@/lib/coachingApi";
import { programPageTitle } from "@/lib/coachingTutorProgram";

export default function TutorCoachingProgramPage() {
  const { servicePeriodId } = useParams<{ servicePeriodId: string }>();
  // The same list the end-coaching section below reads, so it is one request.
  const { data: students } = useQuery({
    queryKey: ["coaching-tutor-students"],
    queryFn: fetchCoachingStudents,
  });
  return (
    <CoachingGuard>
      <CoachingPageShell
        title={programPageTitle(students, servicePeriodId)}
        width="default"
        currentHref="/dashboard/tutor/coaching/students"
        audience="tutor"
      >
        <CoachingProgramEditor servicePeriodId={servicePeriodId} />
        <CoachingEndCoachingSection servicePeriodId={servicePeriodId} />
      </CoachingPageShell>
    </CoachingGuard>
  );
}
