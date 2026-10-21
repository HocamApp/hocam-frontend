"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CaretDown, Clock } from "@phosphor-icons/react";

import {
  SectionBandCount,
  SectionBandHeading,
  sectionBandClass,
} from "@/components/shared/SectionBand";
import { Button } from "@/components/ui/button";
import { REPORT_FEEDBACK_LABELS, type CoachingReportFeedbackChoice } from "@/lib/coachingApi";
import { coachingSessionStatusLabel } from "@/lib/coachingPresentation";
import { monthDayLabel, taskDue, type PrepareAttentionItem, type PreviousReport, type PrepareProgram } from "@/lib/coachingPrepare";
import type { CoachingJoin } from "@/lib/coachingSessions";

/**
 * The pieces of the tutor's Hazırlan page. Pink is the meeting, gold is what
 * needs a look, ink is the record (last time, the program). Buttons that sit on
 * a pink or gold band are solid ink, so they never share a colour with the
 * surface behind them; elsewhere a row's action is solid gold.
 *
 * Plain class strings throughout: tailwind-merge would drop a named size next to a colour.
 */

const INK_BUTTON = "min-h-11 bg-ink text-paper hover:bg-ink/90";

function GoldLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button asChild size="sm" variant="gold" className="min-h-11">
      <Link href={href}>{children}</Link>
    </Button>
  );
}

const WAITING_STATUSES = new Set(["scheduled", "reschedule_requested", "in_progress"]);

/** The meeting on a pink band: who, when, and the one thing to do about the room or the report. */
export function PrepareHeader({
  studentName,
  headline,
  join,
  status,
  reportHref,
}: {
  studentName: string;
  headline: string;
  join: CoachingJoin;
  status: string;
  reportHref: string;
}) {
  let right: ReactNode = null;
  if (status === "awaiting_report") {
    right = (
      <Button asChild size="sm" className={INK_BUTTON}>
        <Link href={reportHref}>Raporu hazırla</Link>
      </Button>
    );
  } else if (join && join.kind !== "closed") {
    right = (
      <Button asChild size="sm" className={INK_BUTTON}>
        <Link href={join.href}>Görüşmeye katıl</Link>
      </Button>
    );
  } else if (join) {
    right = (
      <p className="flex items-center gap-2 text-small">
        <Clock className="h-4 w-4" aria-hidden="true" />
        {`Oda ${join.opensLabel}`}
      </p>
    );
  } else if (!WAITING_STATUSES.has(status)) {
    right = <p className="text-small">{coachingSessionStatusLabel(status)}</p>;
  }

  return (
    <section
      aria-label="Görüşme"
      className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-card bg-pink px-6 py-5 text-primary-foreground"
    >
      <div className="min-w-0 flex-1 basis-56">
        <h2 className="text-h3-m font-bold md:text-h3 md:font-bold">{studentName}</h2>
        <p className="text-small tabular-nums">{headline}</p>
      </div>
      {right}
    </section>
  );
}

/** What changed since the last meeting, on a gold band; nothing at all when nothing did. */
export function PrepareAttention({
  items,
  onShowFiles,
}: {
  items: readonly PrepareAttentionItem[];
  onShowFiles: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-label="Bakılacaklar" className="overflow-hidden rounded-card border border-line bg-surface">
      <div className={sectionBandClass("gold", "flex-wrap")}>
        <SectionBandHeading id="prepare-attention-title" title="Bakılacaklar" />
        <SectionBandCount tone="gold">{items.length}</SectionBandCount>
      </div>
      <ul className="divide-y divide-line px-6">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
            <div className="min-w-0 flex-1 basis-56">
              <p className="text-body font-medium text-ink">{item.title}</p>
              {item.detail ? <p className="text-small text-ink-mid">{item.detail}</p> : null}
            </div>
            {item.action && "href" in item.action ? (
              <Button asChild size="sm" className={INK_BUTTON}>
                <Link href={item.action.href}>{item.action.label}</Link>
              </Button>
            ) : item.action ? (
              <Button type="button" size="sm" className={INK_BUTTON} onClick={onShowFiles}>
                {item.action.label}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The report of the meeting before, read where the tutor prepares: the summary, the focus set, the student's answer. */
export function PreviousReportCard({
  previous,
  feedback,
}: {
  previous: PreviousReport;
  feedback: CoachingReportFeedbackChoice | null | undefined;
}) {
  const content = previous.kind === "report" ? previous.revision.content : null;
  return (
    <section aria-label="Geçen görüşme" className="overflow-hidden rounded-card border border-line bg-surface">
      <div className={sectionBandClass("ink", "flex-wrap")}>
        <SectionBandHeading id="prepare-previous-title" title="Geçen görüşme" />
        {previous.kind !== "none" ? (
          <SectionBandCount tone="ink">{monthDayLabel(previous.scheduledStart)}</SectionBandCount>
        ) : null}
      </div>
      <div className="space-y-4 px-6 py-5">
        {content ? (
          <>
            <div>
              <p className="text-label text-ink-mid">Özet</p>
              <p className="whitespace-pre-wrap text-body text-ink">{content.short_summary}</p>
            </div>
            {content.focus_until_next_meeting?.trim() ? (
              <div>
                <p className="text-label text-ink-mid">Bir sonraki görüşmeye kadar odak</p>
                <p className="whitespace-pre-wrap text-body font-medium text-ink">{content.focus_until_next_meeting}</p>
              </div>
            ) : null}
            {feedback ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-4">
                <p className="text-label text-ink-mid">Öğrencinin geri bildirimi</p>
                <span className="rounded-pill bg-paper px-3 py-1 text-small text-ink">{REPORT_FEEDBACK_LABELS[feedback]}</span>
              </div>
            ) : null}
          </>
        ) : previous.kind === "awaiting" ? (
          <>
            <p className="text-body text-ink">Geçen görüşmenin raporu henüz yayınlanmadı.</p>
            <GoldLink href={`/dashboard/tutor/coaching/sessions/${previous.sessionId}/report`}>Raporu yaz</GoldLink>
          </>
        ) : (
          <p className="text-body text-ink-mid">
            {previous.kind === "none" && previous.firstSession
              ? "Bu ilk görüşmen; geçen rapor yok."
              : "Önceki görüşmeler için yayınlanmış rapor yok."}
          </p>
        )}
      </div>
    </section>
  );
}

const PROGRAM_ROWS_SHOWN = 4;

/** How far the student is through the program, and what is still open, soonest first. */
export function PrepareProgramCard({
  summary,
  today,
  programHref,
}: {
  summary: PrepareProgram | null;
  today: string;
  programHref: string;
}) {
  const shown = summary?.pending.slice(0, PROGRAM_ROWS_SHOWN) ?? [];
  const more = (summary?.pending.length ?? 0) - shown.length;
  return (
    <section aria-label="Program" className="overflow-hidden rounded-card border border-line bg-surface">
      <div className={sectionBandClass("ink", "flex-wrap")}>
        <SectionBandHeading id="prepare-program-title" title="Program" />
        {summary && summary.total > 0 ? <SectionBandCount tone="ink">{`${summary.done} / ${summary.total} tamam`}</SectionBandCount> : null}
      </div>
      <div className="space-y-4 px-6 py-5">
        {summary === null ? (
          <>
            <p className="text-body text-ink-mid">Bu dönem için program yok.</p>
            <GoldLink href={programHref}>Programı hazırla</GoldLink>
          </>
        ) : summary.total === 0 ? (
          <>
            <p className="text-body text-ink-mid">Programda henüz görev yok.</p>
            <GoldLink href={programHref}>Programı yönet</GoldLink>
          </>
        ) : (
          <>
            <div
              role="progressbar"
              aria-label="Program ilerlemesi"
              aria-valuemin={0}
              aria-valuemax={summary.total}
              aria-valuenow={summary.done}
              aria-valuetext={`${summary.done} / ${summary.total} görev tamam`}
              className="h-2 overflow-hidden rounded-pill bg-line"
            >
              <div className="h-full rounded-pill bg-gold" style={{ width: `${(summary.done / summary.total) * 100}%` }} />
            </div>
            {shown.length > 0 ? (
              <ul className="divide-y divide-line">
                {shown.map((task) => {
                  const due = taskDue(task.due_date, today);
                  return (
                    <li key={task.id} className="flex items-center justify-between gap-4 py-2.5">
                      <p className="min-w-0 text-body text-ink">{task.title}</p>
                      <div className="shrink-0 text-right">
                        <p className="text-label text-ink-mid">Son tarih</p>
                        <p className={`text-small font-medium tabular-nums ${due.urgent ? "text-pink-deep" : "text-ink"}`}>{due.value}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-body text-ink-mid">Tüm görevler tamam.</p>
            )}
            {more > 0 ? <p className="text-small text-ink-mid">{`+ ${more} görev daha`}</p> : null}
            <GoldLink href={programHref}>Programı yönet</GoldLink>
          </>
        )}
      </div>
    </section>
  );
}

/** A row that opens: what is inside, who sees it, and how many, before it is opened. */
export function PrepareDisclosure({
  id,
  title,
  caption,
  count,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  /** Who sees it, when that is not obvious: "yalnız sana görünür". */
  caption?: string;
  count: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div id={id} className="border-t border-line first:border-t-0">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="flex min-h-11 w-full items-center justify-between gap-3 px-6 py-3 text-left"
        >
          <span className="text-body font-medium text-ink">
            {title}
            {caption ? <span className="font-normal text-ink-mid">{` · ${caption}`}</span> : null}
          </span>
          <span className="flex shrink-0 items-center gap-2 text-small text-ink-mid">
            {count}
            <CaretDown aria-hidden="true" className={`h-4 w-4 transition-transform duration-[--duration-state] ${open ? "rotate-180" : ""}`} />
          </span>
        </button>
      </h2>
      {open ? (
        <div id={`${id}-panel`} className="px-6 pb-5 pt-1">
          {children}
        </div>
      ) : null}
    </div>
  );
}
