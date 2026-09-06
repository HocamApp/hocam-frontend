"use client";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { TutorClassroomList } from "@/components/tutors/TutorClassroomList";

export default function Page() {
  return <RouteGuard requireAuth requireRole="tutor"><TutorClassroomList /></RouteGuard>;
}
