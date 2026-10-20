"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { StudentReportCard } from "@/lib/coachingStudentReports";

/**
 * The student's reports, two to a row from tablet width. Each card puts what
 * the tutor asked of the student until the next meeting first, because that is
 * what the report is for; the way in is a solid gold button.
 *
 * Plain class strings: tailwind-merge would drop a named size next to a colour.
 */
export function StudentReportCards({ cards }: { cards: readonly StudentReportCard[] }) {
  return (
    <ul aria-label="Raporlar" className="grid gap-4 sm:grid-cols-2">
      {cards.map((card) => (
        <li key={card.id} className="flex flex-col overflow-hidden rounded-card border border-line bg-surface">
          <div className="flex items-baseline justify-between gap-3 bg-ink px-5 py-3 text-paper">
            <h3 className="text-body font-bold">{card.title}</h3>
            {card.dayLabel ? <span className="text-small tabular-nums">{card.dayLabel}</span> : null}
          </div>
          <div className="flex-1 px-5 py-4">
            {card.focus ? (
              <>
                <p className="text-label text-ink-mid">Odak</p>
                <p className="mt-0.5 line-clamp-3 text-body font-medium text-ink">{card.focus}</p>
              </>
            ) : null}
            <p className={`text-small text-ink-mid tabular-nums ${card.focus ? "mt-3" : ""}`}>{card.published}</p>
          </div>
          <div className="px-5 pb-4">
            <Button asChild size="sm" variant="gold" className="min-h-11">
              <Link href={card.href} aria-label={`${card.title}: Raporu aç`}>
                Raporu aç
              </Link>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
