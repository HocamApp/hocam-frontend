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
  return (
    <CoachingPageShell
      title="Çalışma koçluğu"
      width="wide"
      currentHref="/dashboard/tutor/coaching"
      audience="tutor"
    >
      <CoachingStatusCard status={status} />
      <CoachingMetricGrid metrics={metrics} />
    </CoachingPageShell>
  );
}
