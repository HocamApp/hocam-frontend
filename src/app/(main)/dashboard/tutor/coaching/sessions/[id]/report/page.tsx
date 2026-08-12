"use client";

import { useParams } from "next/navigation";

import { CoachingRecordGuard as CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingReportWizard } from "@/components/coaching/CoachingReportWizard";

export default function TutorCoachingReportPage() {
  const { id } = useParams<{ id: string }>();
  return <CoachingGuard><CoachingPageShell title="Görüşme raporu" description="Görüşme notlarını düzenle, öğrenciye açık raporu gözden geçir ve mevcut yayınlama semantiğiyle paylaş." parentHref="/dashboard/tutor/coaching/reports" parentLabel="Görüşme raporları" eyebrow="Rapor" width="narrow" currentHref="/dashboard/tutor/coaching/reports" audience="tutor"><CoachingReportWizard sessionId={id} /></CoachingPageShell></CoachingGuard>;
}
