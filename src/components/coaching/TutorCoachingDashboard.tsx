"use client";

import { useRef } from "react";

import { PageIntroHint } from "@/components/shared/PageIntroHint";
import { CoachingMetricGrid, type CoachingMetricValues } from "./CoachingMetricGrid";
import { CoachingPageShell } from "./CoachingPageShell";
import { CoachingStatusCard } from "./CoachingStatusCard";
import type { CoachingDerivedStatus } from "@/lib/coachingPresentation";

export function TutorCoachingDashboard({
  status,
  metrics,
}: {
  status: CoachingDerivedStatus;
  metrics: CoachingMetricValues;
}) {
  const titleRef = useRef<HTMLSpanElement>(null);
  return (
    <CoachingPageShell
      title="Çalışma koçluğu"
      titleRef={titleRef}
      width="wide"
      currentHref="/dashboard/tutor/coaching"
      audience="tutor"
    >
      <PageIntroHint hintKey="tutor_intro_coaching" anchorRef={titleRef} title="Koçluk teklifin burada">
        Öğrencilere ders paketine ek olarak çalışma koçluğu sunabilirsin. Kurulumu, gelen talepleri ve görüşmeleri bu sayfadan yönetirsin.
      </PageIntroHint>
      <CoachingStatusCard status={status} />
      <CoachingMetricGrid metrics={metrics} />
    </CoachingPageShell>
  );
}
