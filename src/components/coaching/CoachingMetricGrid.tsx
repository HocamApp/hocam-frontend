import { CoachingWeeklyRhythm } from "./CoachingWeeklyRhythm";

export interface CoachingMetricValues {
  activeStudents: number | null;
  upcomingSessions: number | null;
  pendingReports: number | null;
  pendingRequests: number | null;
}

export function CoachingMetricGrid({ metrics }: { metrics: CoachingMetricValues }) {
  return <CoachingWeeklyRhythm metrics={metrics} />;
}
