"use client";

import { useParams } from "next/navigation";

import { CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingProgramEditor } from "@/components/coaching/CoachingProgramEditor";

export default function TutorCoachingProgramPage() {
  const { servicePeriodId } = useParams<{ servicePeriodId: string }>();
  return <CoachingGuard><div className="mx-auto max-w-3xl px-4 py-8"><h1 className="mb-6 text-2xl font-semibold">Öğrenci programı</h1><CoachingProgramEditor servicePeriodId={servicePeriodId} /></div></CoachingGuard>;
}
