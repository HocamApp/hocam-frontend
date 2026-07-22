"use client";

import { TutorStudentMaterials } from "@/components/tutors/TutorStudentMaterials";
import { TutorStudentNotes } from "@/components/tutors/TutorStudentNotes";

export function TutorStudentPrivateWorkspace({
  studentId,
  compact = false,
}: {
  studentId: string;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      <TutorStudentNotes studentId={studentId} compact={compact} />
      <TutorStudentMaterials studentId={studentId} compact={compact} />
    </div>
  );
}
