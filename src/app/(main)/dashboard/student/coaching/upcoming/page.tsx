"use client";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { CoachingSessionList } from "@/components/coaching/CoachingSessionList";

export default function StudentCoachingUpcomingPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Yaklaşan Görüşmeler</h1>
        <CoachingSessionList />
      </div>
    </RouteGuard>
  );
}
