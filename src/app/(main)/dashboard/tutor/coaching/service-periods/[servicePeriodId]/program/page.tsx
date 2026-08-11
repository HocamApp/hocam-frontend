"use client";

import { useParams } from "next/navigation";

import { CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingProgramEditor } from "@/components/coaching/CoachingProgramEditor";

export default function TutorCoachingProgramPage() {
  const { servicePeriodId } = useParams<{ servicePeriodId: string }>();
  return <CoachingGuard><CoachingPageShell title="Öğrenci programı" description="Bu hizmet dönemi için çalışma hedeflerini ve program maddelerini düzenle." parentHref="/dashboard/tutor/coaching/students" parentLabel="Koçluk öğrencilerim" eyebrow="Çalışma programı" width="narrow"><CoachingProgramEditor servicePeriodId={servicePeriodId} /></CoachingPageShell></CoachingGuard>;
}
