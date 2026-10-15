"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

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

/* Brand v3 tile watermarks. One map, looked up by "EXAM name" first and then
   by name, so AYT can draw a different sign for the same subject. A subject
   that is not here gets no watermark rather than a made-up one. */
const SUBJECT_GLYPHS: Readonly<Record<string, string>> = {
  "AYT Matematik": "∫",
  "AYT Fizik": "F=ma",
  "AYT Kimya": "pH",
  Matematik: "∑",
  Türkçe: "Aa",
  Edebiyat: "“”",
  Fizik: "λ",
  Kimya: "H₂O",
  Biyoloji: "DNA",
  Tarih: "1453",
  "Tarih-1": "1453",
  "Tarih-2": "1453",
  Geometri: "△",
  İngilizce: "EN",
  Almanca: "DE",
  Fransızca: "FR",
  Mantık: "∴",
  Psikoloji: "Ψ",
  Coğrafya: "40°N",
  "Coğrafya-1": "40°N",
  "Coğrafya-2": "40°N",
  Felsefe: "∃",
  Sosyoloji: "%",
};

export function subjectGlyph(exam: ExamType, name: string): string | null {
  return SUBJECT_GLYPHS[`${exam} ${name}`] ?? SUBJECT_GLYPHS[name] ?? null;
}

/* Below md only the first few tiles show, then a button opens the rest. The
   whole list at two per row is about fifteen screens of tiles on a phone. */
const PHONE_TILE_LIMIT = 8;

/* TYT tiles are pale pink with a pink watermark, AYT pale yellow with an ink
   one (BRAND.md §4). One treatment per exam, so a row never cycles colours. */
const EXAM_TILE: Partial<Record<ExamType, { tile: string; glyph: string }>> = {
  TYT: { tile: "bg-pink-soft", glyph: "text-pink opacity-[0.16]" },
  AYT: { tile: "bg-yellow-soft", glyph: "text-ink opacity-10" },
};

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
export function YsSubjectGrid({ brandV3 = false }: { brandV3?: boolean } = {}) {
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
    staleTime: Infinity,
  });
  const { enabled: coachingEnabled } = useCoachingFlag();

  const groups = homeSubjectGroups(subjects ?? []);
  if (groups.length === 0) return null;

  if (brandV3) return <SubjectTiles groups={groups} coachingEnabled={coachingEnabled} />;

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

/**
 * Brand v3 (NEXT_PUBLIC_BRAND_V3): the same links as tiles. TYT first, then
 * AYT, in one grid that fills to two per row on a phone. The exam is said in
 * words on every tile and in the legend, so the colour is never the only cue.
 */
function SubjectTiles({
  groups,
  coachingEnabled,
}: {
  groups: ReturnType<typeof homeSubjectGroups>;
  coachingEnabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const gridId = useId();
  const gridRef = useRef<HTMLUListElement>(null);
  /* The button goes away when pressed, so focus moves to the first tile it
     revealed instead of dropping to the page. */
  const justExpanded = useRef(false);
  useEffect(() => {
    if (!expanded || !justExpanded.current) return;
    justExpanded.current = false;
    gridRef.current?.querySelectorAll("a")[PHONE_TILE_LIMIT]?.focus();
  }, [expanded]);
  const tiles = groups.flatMap(({ exam, items }) => items.map((subject) => ({ exam, subject })));
  const collapsible = tiles.length > PHONE_TILE_LIMIT;

  return (
    <section className="mt-[72px]" aria-labelledby="ys-subjects-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 id="ys-subjects-title" className="text-[1.5rem] font-bold leading-8 tracking-[-0.6px] md:text-[2rem] md:leading-10">
            {copy.title}
          </h2>
          <p className="mt-2 text-ink-mid">{copy.sub}</p>
        </div>
        <ul className="flex gap-4 text-small font-semibold" aria-label={copy.legendLabel}>
          {groups.map(({ exam }) => (
            <li key={exam} className="inline-flex items-center gap-2">
              <span
                aria-hidden
                className={`size-3.5 rounded-[4px] shadow-[inset_0_0_0_1px_rgb(12_14_9_/_20%)] ${EXAM_TILE[exam]?.tile ?? "bg-surface"}`}
              />
              {exam}
            </li>
          ))}
        </ul>
      </div>

      <ul ref={gridRef} id={gridId} className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3.5">
        {tiles.map(({ exam, subject }, index) => {
            const glyph = subjectGlyph(exam, subject.name);
            const look = EXAM_TILE[exam];
            const phoneHidden = collapsible && !expanded && index >= PHONE_TILE_LIMIT;
            return (
              <li key={subject.id} className={phoneHidden ? "max-md:hidden" : undefined}>
                <Link
                  href={tutorListHref({ exam_type: exam, subject: subject.name })}
                  className={`relative flex h-32 flex-col justify-between overflow-hidden rounded-[20px] p-4 text-ink transition-shadow duration-[--duration-state] hover:shadow-[inset_0_0_0_2px_var(--ink)] ${look?.tile ?? "bg-surface"}`}
                >
                  <span className="text-xs font-bold tracking-[1px] opacity-85">{exam}</span>
                  <span className="relative z-10 text-xl font-bold leading-tight">{subject.name}</span>
                  {glyph && (
                    <span
                      aria-hidden
                      className={`pointer-events-none absolute -right-1.5 -top-3.5 whitespace-nowrap text-[76px] font-extrabold leading-none tracking-[-3px] ${look?.glyph ?? ""}`}
                    >
                      {glyph}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
      </ul>

      {collapsible && !expanded && (
        <div className="mt-4 flex justify-center md:hidden">
          <Button
            type="button"
            variant="outline"
            aria-controls={gridId}
            aria-expanded={false}
            onClick={() => {
              justExpanded.current = true;
              setExpanded(true);
            }}
          >
            {copy.showAll}
          </Button>
        </div>
      )}

      {coachingEnabled && (
        <div className="mt-4">
          <Button asChild variant="outline" size="sm" className="bg-ink text-paper hover:bg-ink hover:text-paper">
            <Link href={tutorListHref({ has_coaching: "true" })}>{copy.coaching}</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
