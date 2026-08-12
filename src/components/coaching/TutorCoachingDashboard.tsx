import { CoachingMetricGrid, type CoachingMetricValues } from "./CoachingMetricGrid";
import { CoachingPageShell } from "./CoachingPageShell";
import { CoachingSectionNav } from "./CoachingSectionNav";
import { CoachingStatusCard } from "./CoachingStatusCard";
import type { CoachingDerivedStatus } from "@/lib/coachingPresentation";

export function TutorCoachingDashboard({
  status,
  metrics,
}: {
  status: CoachingDerivedStatus;
  metrics: CoachingMetricValues;
}) {
  return (
    <CoachingPageShell
      title="Çalışma koçluğu"
      description="Teklifini, öğrencilerini ve haftalık koçluk akışını tek yerden yönet."
      parentHref="/dashboard/tutor"
      parentLabel="Öğretmen paneli"
      eyebrow="Koçluk merkezi"
      width="wide"
      currentHref="/dashboard/tutor/coaching"
      audience="tutor"
    >
      <CoachingStatusCard status={status} />
      <CoachingMetricGrid metrics={metrics} />
      <CoachingSectionNav />
    </CoachingPageShell>
  );
}
