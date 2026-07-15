"use client";

import { StudentLessonsWorkspace } from "@/components/lessons/StudentLessonsWorkspace";
import { RouteGuard } from "@/components/shared/RouteGuard";

export default function StudentLessonsPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <StudentLessonsWorkspace />
    </RouteGuard>
  );
}
