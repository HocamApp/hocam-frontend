"use client";

import { useParams } from "next/navigation";

import { CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingReportWizard } from "@/components/coaching/CoachingReportWizard";

export default function TutorCoachingReportPage() {
  const { id } = useParams<{ id: string }>();
  return <CoachingGuard><div className="mx-auto max-w-3xl px-4 py-8"><h1 className="mb-6 text-2xl font-semibold">Görüşme raporu</h1><CoachingReportWizard sessionId={id} /></div></CoachingGuard>;
}
