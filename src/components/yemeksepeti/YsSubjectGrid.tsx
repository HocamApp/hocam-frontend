"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useCoachingFlag } from "@/hooks/useCoachingFlag";
import { groupSubjectsByExam } from "@/lib/subjects";
import { tutorListHref } from "@/lib/tutorDirectoryLinks";
import { fetchSubjects } from "@/lib/tutorsApi";
import type { ExamType, Subject } from "@/types/api";

import { subjects as copy } from "./ysHomeCopy";

/* A TYT row and an AYT row, as the homepage plan specifies. The subjects
   endpoint also carries DGS and KPSS; those stay reachable through the
   directory's exam filter but get no row here. */
const HOME_EXAMS: readonly ExamType[] = ["TYT", "AYT"];

export function homeSubjectGroups(subjects: Subject[]) {
  return groupSubjectsByExam(subjects).filter((group) => HOME_EXAMS.includes(group.exam));
}

/**
 * "Hangi dersler var?": every subject the platform teaches, each one a link
 * into the directory above, filtered to it.
 *
 * Reads the `["subjects"]` query the page already prefetches on the server,
 * so the pills are in the first HTML rather than arriving after hydration.
 * Only what the API returns is shown; nothing is listed by hand. Grouping
 * and the unsupported-subject filter are the directory's own (lib/subjects).
 *
 * The coaching pill is the one ink-filled item and exists only while coaching
 * is switched on for this viewer.
 */
export function YsSubjectGrid() {
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
    staleTime: Infinity,
  });
  const { enabled: coachingEnabled } = useCoachingFlag();

  const groups = homeSubjectGroups(subjects ?? []);
  if (groups.length === 0) return null;

  return (
    <section
      className="mt-[72px] grid gap-x-10 gap-y-6 rounded-card border border-line bg-surface p-6 md:grid-cols-[260px_minmax(0,1fr)] md:p-8"
      aria-labelledby="ys-subjects-title"
    >
      <div className="min-w-0">
        <h2 id="ys-subjects-title" className="text-[1.5rem] font-bold leading-8 tracking-[-0.6px]">
          {copy.title}
        </h2>
        <p className="mt-2 text-ink-mid">{copy.sub}</p>
      </div>

      <div className="flex min-w-0 flex-col gap-[18px]">
        {groups.map(({ exam, items }) => (
          <div key={exam} className="grid grid-cols-[52px_minmax(0,1fr)] items-start gap-3">
            <span className="text-small font-bold leading-9">{exam}</span>
            <div className="flex flex-wrap gap-2">
              {items.map((subject) => (
                <Button key={subject.id} asChild variant="outline" size="sm">
                  <Link href={tutorListHref({ exam_type: exam, subject: subject.name })}>
                    {subject.name}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        ))}

        {coachingEnabled && (
          <div className="grid grid-cols-[52px_minmax(0,1fr)] items-start gap-3">
            <span aria-hidden />
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="bg-ink text-paper hover:bg-ink hover:text-paper"
              >
                <Link href={tutorListHref({ has_coaching: "true" })}>{copy.coaching}</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
