"use client";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { TutorClassroomStudent } from "@/components/tutors/TutorClassroomStudent";

export default function Page({ params }: { params: { studentId: string } }) {
  return <RouteGuard requireAuth requireRole="tutor"><TutorClassroomStudent key={params.studentId} studentId={params.studentId} /></RouteGuard>;
}
