"use client";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { CoachingSessionList } from "@/components/coaching/CoachingSessionList";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";

export default function StudentCoachingUpcomingPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <CoachingPageShell title="Yaklaşan görüşmeler" description="Planlanan koçluk görüşmelerini, katılım durumunu ve saat değişikliklerini takip et." parentHref="/dashboard/student/coaching" parentLabel="Çalışma koçluğum" eyebrow="Takvim" width="narrow" currentHref="/dashboard/student/coaching/upcoming" audience="student"><CoachingSessionList /></CoachingPageShell>
    </RouteGuard>
  );
}
