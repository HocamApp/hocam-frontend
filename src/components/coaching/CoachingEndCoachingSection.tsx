"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { fetchCoachingStudents } from "@/lib/coachingApi";
import { CoachingEndCoaching } from "./CoachingEndCoaching";

/**
 * The one place a coaching with a running program is ended from. It sits at the
 * foot of that student's own program page, away from the list a tutor scrolls
 * past, as a solid destructive button that still asks for a written reason and
 * a confirmation. The student is found from the program's period in the same
 * students list the Öğrenciler page reads, so there is no second request shape.
 * Nothing is drawn unless this period belongs to an active student of this tutor.
 */
export function CoachingEndCoachingSection({ servicePeriodId }: { servicePeriodId: string }) {
  const router = useRouter();
  const { data: students } = useQuery({
    queryKey: ["coaching-tutor-students"],
    queryFn: fetchCoachingStudents,
  });
  const student = students?.find(
    (row) => row.service_period_id === servicePeriodId && row.service_status === "active"
  );
  if (!student) return null;

  return (
    <section
      aria-labelledby="coaching-end-title"
      className="mt-8 flex flex-col gap-4 rounded-card border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div>
        <h2 id="coaching-end-title" className="text-body font-bold text-ink">
          Koçluğu sonlandır
        </h2>
        <p className="mt-1 max-w-xl text-small text-ink-mid">
          {student.student_name} ile koçluğu bitirmek istersen buradan sonlandırabilirsin. Bu işlem geri
          alınamaz; önce gerekçeni yazar, sonra onaylarsın.
        </p>
      </div>
      <CoachingEndCoaching
        purchaseId={student.purchase_id}
        studentName={student.student_name}
        variant="button"
        onEnded={() => router.push("/dashboard/tutor/coaching/students")}
      />
    </section>
  );
}
