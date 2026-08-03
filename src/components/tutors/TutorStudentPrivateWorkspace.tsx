"use client";

import { TutorStudentMaterials } from "@/components/tutors/TutorStudentMaterials";
import { TutorStudentNotes } from "@/components/tutors/TutorStudentNotes";
import { TutorLearningPlans } from "@/components/learning/TutorLearningPlans";

export function TutorStudentPrivateWorkspace({
  studentId,
  compact = false,
}: {
  studentId: string;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      {process.env.NEXT_PUBLIC_LEARNING_PLANS_ENABLED === "true" && (
        <TutorLearningPlans studentId={studentId} />
      )}
      <TutorStudentNotes studentId={studentId} compact={compact} />
      <TutorStudentMaterials studentId={studentId} compact={compact} />
    </div>
  );
}
