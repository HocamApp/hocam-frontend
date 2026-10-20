"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import {
  SectionBandCount,
  SectionBandHeading,
  sectionBandClass,
} from "@/components/shared/SectionBand";
import { Button } from "@/components/ui/button";
import type {
  CoachingJoin,
  TutorNextSession,
  TutorReportRow,
  TutorSessionDay,
} from "@/lib/coachingSessions";

function GoldLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button asChild size="sm" variant="gold" className="min-h-11">
      <Link href={href}>{children}</Link>
    </Button>
  );
}

/** Katıl where the room can be opened, the time it opens where it cannot yet, nothing otherwise. */
function JoinControl({ join, tone }: { join: CoachingJoin; tone: "light" | "onPink" }) {
  if (!join) return null;
  if (join.kind === "closed") {
    return (
      <span className={`text-small ${tone === "onPink" ? "text-primary-foreground" : "text-ink-mid"}`}>
        Katıl {join.opensLabel}
      </span>
    );
  }
  return <GoldLink href={join.href}>Katıl</GoldLink>;
}

/**
 * The Görüşmeler page. The next meeting stands alone at the top on pink, since
 * it is the one thing to act on; the rest of what is ahead follows day by day on
 * an ink band, which is the tutor's own record; reports still owed come last.
 * Katıl appears only while the room can actually be opened, so the button never
 * answers "not open yet".
 *
 * Plain class strings throughout: tailwind-merge would drop a named size such
 * as `text-label` next to a text colour.
 */
export function CoachingSessionsBoard({
  next,
  days,
  reports,
  total,
  hidden = 0,
  onShowMore,
}: {
  next: TutorNextSession | null;
  days: readonly TutorSessionDay[];
  reports: readonly TutorReportRow[];
  total: number;
  /** Meetings ahead that the list leaves out for now. */
  hidden?: number;
  onShowMore?: () => void;
}) {
  return (
    <div className="space-y-5">
      {next ? (
        <section
          aria-label="Sıradaki görüşme"
          className="overflow-hidden rounded-card border border-pink bg-pink text-primary-foreground"
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 px-6 py-5">
            <div className="min-w-0 flex-1 basis-56">
              <p className="text-small">
                {next.countdown ? `Sıradaki görüşme · ${next.countdown}` : "Sıradaki görüşme"}
              </p>
              <p className="mt-1 text-h2-m font-bold md:text-h2 md:font-bold">
                {`${next.when} · ${next.studentName}`}
              </p>
              <p className="mt-1 text-small">{next.detail}</p>
              {next.note ? <p className="mt-0.5 text-small">{next.note}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <JoinControl join={next.join} tone="onPink" />
              <GoldLink href={next.prepareHref}>Hazırlan</GoldLink>
            </div>
          </div>
        </section>
      ) : null}

      {days.length > 0 ? (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <div className={sectionBandClass("ink", "flex-wrap")}>
            <SectionBandHeading id="coaching-sessions-later-title" title="Sonraki görüşmeler" />
            <SectionBandCount tone="ink">{total}</SectionBandCount>
          </div>
          <div className="px-4 pb-3 pt-1 sm:px-6">
            {days.map((day, index) => (
              <div key={day.dateKey} className="flex gap-3">
                <div aria-hidden="true" className="flex w-2.5 shrink-0 flex-col items-center">
                  <span className="mt-5 h-2.5 w-2.5 rounded-pill bg-ink" />
                  {index < days.length - 1 ? <span className="w-0.5 flex-1 bg-line" /> : null}
                </div>
                <div className="min-w-0 flex-1 py-3">
                  <p className="text-label text-ink-mid">{day.heading}</p>
                  <ul className="mt-1">
                    {day.rows.map((row) => (
                      <li
                        key={row.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2"
                      >
                        <div className="min-w-0 flex-1 basis-44">
                          <p className="text-body font-medium text-ink">{`${row.time} · ${row.studentName}`}</p>
                          <p className="text-small text-ink-mid">{row.detail}</p>
                          {row.note ? <p className="text-small font-medium text-ink">{row.note}</p> : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <JoinControl join={row.join} tone="light" />
                          <GoldLink href={row.prepareHref}>Hazırlan</GoldLink>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
            {hidden > 0 && onShowMore ? (
              <div className="pb-2 pt-1">
                <Button type="button" variant="gold" size="sm" className="min-h-11" onClick={onShowMore}>
                  {`${hidden} görüşme daha göster`}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {reports.length > 0 ? (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <div className={sectionBandClass("ink", "flex-wrap")}>
            <SectionBandHeading id="coaching-sessions-reports-title" title="Rapor bekleyen" />
            <SectionBandCount tone="ink">{reports.length}</SectionBandCount>
          </div>
          <ul>
            {reports.map((report) => (
              <li
                key={report.id}
                className="grid grid-cols-[minmax(0,1fr)] items-center gap-x-4 gap-y-2 border-t border-line px-4 py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:px-6"
              >
                <div className="min-w-0">
                  <p className="text-body font-medium text-ink">{report.studentName}</p>
                  <p className="text-small text-ink-mid">{report.detail}</p>
                </div>
                {report.due ? (
                  <div className="shrink-0 sm:text-right">
                    <p className="text-label text-ink-mid">Son tarih</p>
                    <p className={`text-small font-medium ${report.due.urgent ? "text-pink-deep" : "text-ink"}`}>
                      {report.due.value}
                    </p>
                  </div>
                ) : null}
                <div>
                  <GoldLink href={report.href}>Raporu yaz</GoldLink>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
