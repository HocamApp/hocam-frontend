"use client";

import Link from "next/link";

import { InlineError } from "@/components/shared/InlineError";
import {
  SectionBandCount,
  SectionBandHeading,
  sectionBandClass,
} from "@/components/shared/SectionBand";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CoachingWeekDay } from "@/lib/coachingOverview";

export interface CoachingOfferGlance {
  published: boolean;
  acceptingNewStudents: boolean;
  activeStudents: number;
  maxStudents: number;
}

function offerSummary(offer: CoachingOfferGlance): string {
  // The server counts every place held (students, requests waiting for an answer or for
  // payment), so this says places, not students.
  const places = `${offer.activeStudents} / ${offer.maxStudents} kontenjan dolu`;
  if (!offer.acceptingNewStudents) return `${places} · yeni öğrenci almıyorsun`;
  return `${places} · ${Math.max(0, offer.maxStudents - offer.activeStudents)} boş`;
}

/**
 * The week's meetings, Monday to Sunday, on an ink band: they are the tutor's
 * own record of what is booked, where the pink card beside it is what needs an
 * answer. Today carries a flat gold pill rather than a tinted row, since
 * --pink-pale is a section surface only (DESIGN.md). Under the days, one line
 * on where the offer stands, so the page needs no separate status panel.
 *
 * Plain class strings: tailwind-merge would drop a named size next to a colour.
 */
export function CoachingWeekCard({
  week,
  state,
  offer,
  onRetry,
  isRetrying = false,
}: {
  week: { days: CoachingWeekDay[]; total: number };
  state: "loading" | "error" | "ready";
  offer: CoachingOfferGlance | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className={sectionBandClass("ink", "flex-wrap")}>
        <SectionBandHeading id="coaching-week-title" title="Bu hafta" />
        {state === "ready" && week.total > 0 ? (
          <SectionBandCount tone="ink">{`${week.total} görüşme`}</SectionBandCount>
        ) : null}
      </div>

      {state === "loading" ? (
        <div role="status" aria-label="Bu hafta yükleniyor" className="space-y-3 px-4 py-4 sm:px-6">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : null}

      {state === "error" ? (
        <div className="space-y-3 px-4 py-5 sm:px-6">
          <InlineError message="Bu hafta yüklenemedi." />
          {onRetry ? (
            <Button type="button" variant="gold" size="sm" onClick={onRetry} disabled={isRetrying}>
              Tekrar dene
            </Button>
          ) : null}
        </div>
      ) : null}

      {state === "ready" && week.total === 0 ? (
        <p className="px-4 py-8 text-center text-body font-medium text-ink sm:px-6">Bu hafta görüşme yok</p>
      ) : null}

      {state === "ready" && week.total > 0 ? (
        <ul>
          {week.days.map((day) => (
            <li
              key={day.dateKey}
              className="flex items-start gap-3 border-t border-line px-4 py-3 first:border-t-0 sm:px-6"
            >
              {/* The label and today's pill share one narrow column, so a long
                  name beside them never has to wrap around the pill on a phone. */}
              <div className="flex w-16 shrink-0 flex-col items-start gap-1">
                <span
                  className={`text-small ${
                    day.sessions.length === 0 ? "text-ink-mid" : "font-medium text-ink"
                  }`}
                >
                  {day.label}
                </span>
                {day.isToday ? (
                  <span className="inline-flex rounded-pill bg-gold px-2.5 py-0.5 text-label font-medium text-gold-ink">
                    Bugün
                  </span>
                ) : null}
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                {day.sessions.length === 0 ? (
                  <p className="text-small text-ink-mid">Görüşme yok</p>
                ) : (
                  day.sessions.map((session) => (
                    <p key={session.id} className="text-small text-ink">
                      {`${session.time} · ${session.studentName}`}
                    </p>
                  ))
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {offer ? (
        <section
          aria-label="Teklifin durumu"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line bg-paper px-4 py-3 sm:px-6"
        >
          {offer.published ? (
            <span className="inline-flex shrink-0 rounded-pill bg-gold px-3 py-0.5 text-label font-medium text-gold-ink">
              Teklifin yayında
            </span>
          ) : (
            <span className="inline-flex shrink-0 rounded-pill border border-ink px-3 py-0.5 text-label font-medium text-ink">
              Yayında değil
            </span>
          )}
          <span className="text-small text-ink">{offerSummary(offer)}</span>
          <Link
            href="/dashboard/tutor/coaching/plan"
            className="ml-auto inline-flex min-h-11 items-center text-small font-medium text-ink underline underline-offset-4 hover:text-pink-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
          >
            Teklif ayarları
          </Link>
        </section>
      ) : null}
    </div>
  );
}
