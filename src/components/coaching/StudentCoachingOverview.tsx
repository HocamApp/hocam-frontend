"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ListChecks } from "@phosphor-icons/react";

import { InlineError } from "@/components/shared/InlineError";
import {
  SectionBandCount,
  SectionBandHeading,
  sectionBandClass,
} from "@/components/shared/SectionBand";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  coachingInitials,
  type StudentCoachingProgress,
  type StudentProgressSegment,
  type StudentTimelineItem,
} from "@/lib/coachingStudentOverview";

export interface StudentCoachingHeaderModel {
  /** The coach's name; null while it is unknown (the thread could not be read). */
  name: string | null;
  avatarUrl: string | null;
  statusLabel: string;
  subtitle: string;
  messagesHref: string;
  unread: number | null;
  /** One sentence the plan needs said, for example that a cancellation is being processed. */
  notice: string | null;
}

export interface StudentNextStepModel {
  text: string;
  /** Present while the student still has to choose the weekly times. */
  pickSchedule: { href: string; deadline: string | null } | null;
}

export interface StudentOverviewProblem {
  id: string;
  section: "ahead" | "past";
  message: string;
}

const SEGMENT_CLASS: Record<StudentProgressSegment, string> = {
  done: "bg-gold",
  next: "bg-pink",
  // A meeting that did not happen is outlined: not held, and not alarming either.
  missed: "border border-paper",
  later: "bg-ink-mid",
};

const DOT_CLASS: Record<StudentTimelineItem["tone"], string> = {
  pink: "bg-pink",
  gold: "border-2 border-gold-ink bg-gold",
  ink: "bg-ink",
};

function GoldLink({ href, children, label }: { href: string; children: ReactNode; label?: string }) {
  return (
    <Button asChild size="sm" variant="gold" className="min-h-11">
      <Link href={href} aria-label={label}>
        {children}
      </Link>
    </Button>
  );
}

/**
 * The coach and the plan on an ink card: who, how far along, and the way to
 * write. Segments are flat shapes (gold held, pink next); the summary beside
 * them says the same in words, since colour alone is not a signal.
 */
function CoachCard({
  header,
  progress,
}: {
  header: StudentCoachingHeaderModel;
  progress: StudentCoachingProgress | null;
}) {
  const title = header.name ?? "Çalışma koçluğun";
  return (
    <section aria-label="Koçluk özeti" className="rounded-card bg-ink p-5 text-paper sm:p-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Avatar className="h-14 w-14">
          {header.avatarUrl ? <AvatarImage src={header.avatarUrl} alt="" /> : null}
          <AvatarFallback className="bg-gold text-[1.125rem] font-bold text-gold-ink">
            {coachingInitials(header.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 basis-44">
          <h2 className="text-h3-m font-bold md:text-h3 md:font-bold">{title}</h2>
          <p className="text-small tabular-nums">{header.subtitle}</p>
        </div>
        <span className="inline-flex shrink-0 rounded-pill bg-gold px-3 py-0.5 text-label font-medium text-gold-ink">
          {header.statusLabel}
        </span>
      </div>

      {progress ? (
        <div
          role="img"
          aria-label={progress.summary}
          className="mt-5 flex gap-1.5"
        >
          {progress.segments.map((segment, index) => (
            <span
              key={index}
              data-segment={segment}
              className={`h-2 flex-1 rounded-pill ${SEGMENT_CLASS[segment]}`}
            />
          ))}
        </div>
      ) : null}

      {header.notice ? <p className="mt-4 text-small">{header.notice}</p> : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        {progress ? <p className="text-small">{progress.summary}</p> : <span />}
        <GoldLink href={header.messagesHref}>
          {header.unread ? `Hocana yaz · ${header.unread} yeni` : "Hocana yaz"}
        </GoldLink>
      </div>
    </section>
  );
}

function ProblemRow({
  problem,
  onRetry,
  isRetrying,
}: {
  problem: StudentOverviewProblem;
  onRetry: (id: string) => void;
  isRetrying: boolean;
}) {
  return (
    <div className="space-y-3 border-b border-line px-4 py-4 sm:px-6">
      <InlineError message={problem.message} />
      <Button type="button" variant="gold" size="sm" onClick={() => onRetry(problem.id)} disabled={isRetrying}>
        Tekrar dene
      </Button>
    </div>
  );
}

function RowAction({
  item,
  completingTaskId,
  onComplete,
}: {
  item: StudentTimelineItem;
  completingTaskId: string | null;
  onComplete: (taskId: string) => void;
}) {
  if (item.kind === "session") {
    if (item.join?.kind === "open") return <GoldLink href={item.join.href}>Katıl</GoldLink>;
    if (item.live) return <span className="text-small font-medium text-ink">Devam ediyor</span>;
    if (item.remaining) {
      return (
        <div className="text-left sm:text-right">
          <p className="text-label text-ink-mid">Kalan</p>
          <p className="text-small font-medium tabular-nums text-ink">{item.remaining}</p>
        </div>
      );
    }
    return null;
  }
  if (!item.action) return null;
  if (item.action.kind === "complete") {
    const { taskId } = item.action;
    return (
      <Button
        type="button"
        size="sm"
        variant="gold"
        className="min-h-11"
        aria-label={`${item.title} görevini tamamla`}
        disabled={completingTaskId === taskId}
        onClick={() => onComplete(taskId)}
      >
        Tamamla
      </Button>
    );
  }
  return <GoldLink href={item.action.href} label={`${item.title}: ${item.action.label}`}>{item.action.label}</GoldLink>;
}

/**
 * One row of the line: the date in a narrow column (weekday, day, month), a
 * marker, then what it is and the one thing to do. On a record the day number
 * steps back to --ink-mid (DESIGN.md, Section band). Below ~400px the action
 * drops under the text.
 */
function TimelineRow({
  item,
  completingTaskId,
  onComplete,
}: {
  item: StudentTimelineItem;
  completingTaskId: string | null;
  onComplete: (taskId: string) => void;
}) {
  const record = item.tone === "ink";
  return (
    <li className="grid grid-cols-[3rem_0.75rem_minmax(0,1fr)] gap-x-3 border-t border-line py-4 first:border-t-0">
      <div className="text-center leading-tight">
        {item.date ? (
          <>
            <p className="text-label text-ink-mid">{item.date.weekday}</p>
            <p className={`text-[1.5rem] font-bold tabular-nums ${record ? "text-ink-mid" : "text-ink"}`}>{item.date.day}</p>
            <p className="text-label text-ink-mid">{item.date.month}</p>
          </>
        ) : (
          <ListChecks aria-hidden="true" className="mx-auto mt-2 h-6 w-6 text-ink-mid" />
        )}
      </div>
      <span aria-hidden="true" className={`mt-2 h-3 w-3 rounded-full ${DOT_CLASS[item.tone]}`} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-44">
          <p className={`text-body text-ink ${item.kind === "session" ? "font-bold" : "font-medium"}`}>{item.title}</p>
          {item.detail || item.overdue ? (
            <p className="text-small text-ink-mid">
              {item.detail}
              {item.detail && item.overdue ? " · " : null}
              {item.overdue ? <span className="font-medium text-error">Gecikti</span> : null}
            </p>
          ) : null}
          {item.join?.kind === "closed" ? (
            <p className="text-small text-ink-mid">{`Katıl ${item.join.opensLabel}`}</p>
          ) : null}
        </div>
        <RowAction item={item} completingTaskId={completingTaskId} onComplete={onComplete} />
      </div>
    </li>
  );
}

function ListSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3 py-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="text-h3-m font-bold md:text-h3 md:font-bold">
      {children}
    </h2>
  );
}

/**
 * Genel bakış for a student with a coaching: the coach card, then Sırada (the
 * next meetings, tasks and anything support is waiting on) and Geçmiş (the
 * latest report, open complaints), as one line of dated rows. Each part loads
 * and fails on its own, with its own retry, so one broken read never hides the
 * rest or reads as an empty list.
 *
 * A coaching that is not running yet (waiting for the time to be picked, paused,
 * being cancelled) shows the next step instead of the two lists.
 *
 * Plain class strings: tailwind-merge would drop a named size next to a colour.
 */
export function StudentCoachingOverview({
  header,
  progress,
  nextStep,
  history,
  ahead,
  hidden,
  aheadLoading,
  past,
  pastLoading,
  programHint,
  problems,
  onRetry,
  isRetrying,
  onComplete,
  completingTaskId,
}: {
  header: StudentCoachingHeaderModel;
  progress: StudentCoachingProgress | null;
  nextStep: StudentNextStepModel | null;
  /** Set once the coaching has ended: the reports left to look back on, in place of the two lists. */
  history: { rows: readonly StudentTimelineItem[]; seeAllHref: string } | null;
  ahead: readonly StudentTimelineItem[];
  hidden: number;
  aheadLoading: boolean;
  past: readonly StudentTimelineItem[];
  pastLoading: boolean;
  programHint: boolean;
  problems: readonly StudentOverviewProblem[];
  onRetry: (id: string) => void;
  isRetrying: boolean;
  onComplete: (taskId: string) => void;
  completingTaskId: string | null;
}) {
  const aheadProblems = problems.filter((problem) => problem.section === "ahead");
  const pastProblems = problems.filter((problem) => problem.section === "past");
  const showPast = pastLoading || past.length > 0 || pastProblems.length > 0;

  return (
    <div className="space-y-6">
      <CoachCard header={header} progress={progress} />

      {nextStep ? (
        <section
          aria-labelledby="student-next-step-title"
          className="overflow-hidden rounded-card border border-line bg-surface"
        >
          <div className={sectionBandClass("pink")}>
            <SectionBandHeading id="student-next-step-title" title="Sıradaki adım" />
          </div>
          <div className="space-y-4 px-4 py-5 sm:px-6">
            <p className="max-w-2xl text-body leading-[1.6] text-ink">{nextStep.text}</p>
            {nextStep.pickSchedule ? (
              <>
                {nextStep.pickSchedule.deadline ? (
                  <div>
                    <p className="text-label text-ink-mid">Son seçim zamanı</p>
                    <p className="text-body font-medium tabular-nums text-ink">{nextStep.pickSchedule.deadline}</p>
                  </div>
                ) : null}
                <Button asChild>
                  <Link href={nextStep.pickSchedule.href}>Koçluk saatini seç</Link>
                </Button>
              </>
            ) : null}
          </div>
        </section>
      ) : history ? (
        <>
          {pastProblems.length > 0 ? (
            <div className="overflow-hidden rounded-card border border-line bg-surface">
              {pastProblems.map((problem) => (
                <ProblemRow key={problem.id} problem={problem} onRetry={onRetry} isRetrying={isRetrying} />
              ))}
            </div>
          ) : null}
          {pastLoading && history.rows.length === 0 ? (
            <div className="rounded-card border border-line bg-surface px-4 sm:px-6">
              <ListSkeleton label="Geçmiş yükleniyor" />
            </div>
          ) : null}
          {history.rows.length > 0 ? (
            <StudentCoachingHistory rows={history.rows} seeAllHref={history.seeAllHref} />
          ) : null}
        </>
      ) : (
        <>
          <section aria-labelledby="student-ahead-title" className="space-y-3">
            <SectionHeading id="student-ahead-title">Sırada</SectionHeading>
            <div className="overflow-hidden rounded-card border border-line bg-surface">
              {aheadProblems.map((problem) => (
                <ProblemRow key={problem.id} problem={problem} onRetry={onRetry} isRetrying={isRetrying} />
              ))}
              <div className="px-4 sm:px-6">
                {aheadLoading ? <ListSkeleton label="Sırada yükleniyor" /> : null}
                {!aheadLoading && ahead.length > 0 ? (
                  <ul>
                    {ahead.map((item) => (
                      <TimelineRow key={item.id} item={item} completingTaskId={completingTaskId} onComplete={onComplete} />
                    ))}
                  </ul>
                ) : null}
                {!aheadLoading && ahead.length === 0 && aheadProblems.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-body font-medium text-ink">Şu an yapılacak bir şey yok.</p>
                    <p className="mt-1 text-small text-ink-mid">Yaklaşan görüşmelerin ve görevlerin burada görünür.</p>
                  </div>
                ) : null}
                {!aheadLoading && programHint ? (
                  <p className="border-t border-line py-4 text-small text-ink-mid first:border-t-0">
                    Hocan programını hazırladığında görevlerin burada görünür.
                  </p>
                ) : null}
              </div>
              {hidden > 0 ? (
                <p className="border-t border-line bg-paper px-4 py-3 text-small text-ink sm:px-6">
                  {`${hidden} kayıt daha var. Hepsi Görüşmeler ve Koçluk Programım sekmelerinde.`}
                </p>
              ) : null}
            </div>
          </section>

          {showPast ? (
            <section aria-labelledby="student-past-title" className="space-y-3">
              <SectionHeading id="student-past-title">Geçmiş</SectionHeading>
              <div className="overflow-hidden rounded-card border border-line bg-surface">
                {pastProblems.map((problem) => (
                  <ProblemRow key={problem.id} problem={problem} onRetry={onRetry} isRetrying={isRetrying} />
                ))}
                <div className="px-4 sm:px-6">
                  {pastLoading ? <ListSkeleton label="Geçmiş yükleniyor" /> : null}
                  {!pastLoading && past.length > 0 ? (
                    <ul>
                      {past.map((item) => (
                        <TimelineRow key={item.id} item={item} completingTaskId={completingTaskId} onComplete={onComplete} />
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}
        </>
      )}

      <p className="text-center text-small text-ink-mid">
        Başka bir konuda yardım için{" "}
        <Link
          href="/support"
          className="inline-flex min-h-11 items-center font-medium text-ink underline underline-offset-4 hover:text-pink-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
        >
          Hocam destek
        </Link>
      </p>
    </div>
  );
}

/**
 * A student whose coaching has ended and who still has reports: the reports,
 * on an ink band (what is on record), instead of "no coaching".
 */
export function StudentCoachingHistory({
  rows,
  seeAllHref,
}: {
  rows: readonly StudentTimelineItem[];
  seeAllHref: string;
}) {
  return (
    <section
      aria-labelledby="student-history-title"
      className="overflow-hidden rounded-card border border-line bg-surface"
    >
      <div className={sectionBandClass("ink", "flex-wrap")}>
        <SectionBandHeading id="student-history-title" title="Geçmiş koçluğun" />
        <SectionBandCount tone="ink">{`${rows.length} rapor`}</SectionBandCount>
      </div>
      <div className="px-4 sm:px-6">
        <ul>
          {rows.map((item) => (
            <TimelineRow key={item.id} item={item} completingTaskId={null} onComplete={() => {}} />
          ))}
        </ul>
      </div>
      <p className="border-t border-line bg-paper px-4 py-3 text-small sm:px-6">
        <Link
          href={seeAllHref}
          className="inline-flex min-h-11 items-center font-medium text-ink underline underline-offset-4 hover:text-pink-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
        >
          Tüm raporlar
        </Link>
      </p>
    </section>
  );
}
