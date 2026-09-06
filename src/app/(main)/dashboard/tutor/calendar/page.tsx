"use client";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { TutorCalendarPage } from "@/components/tutor-calendar/TutorCalendarPage";

export default function Page() {
  return <RouteGuard requireAuth requireRole="tutor"><TutorCalendarPage /></RouteGuard>;
}
