"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ClockCountdown } from "@phosphor-icons/react";

import { InlineError } from "@/components/shared/InlineError";
import {
  SectionBandCount,
  SectionBandHeading,
  sectionBandClass,
} from "@/components/shared/SectionBand";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ActiveStudentRow,
  PendingStudentRow,
  StudentWaitingItem,
} from "@/lib/coachingStudents";
import { CoachingEndCoaching } from "./CoachingEndCoaching";

/** A student's initials, or an icon where nobody is named, in the same hairline circle. */
function Avatar({ initials }: { initials: string | null }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill border border-line bg-paper text-small font-medium text-ink"
    >
      {initials ?? <ClockCountdown className="h-5 w-5" />}
    </span>
  );
}

/**
 * One list row: avatar, a sentence and a quieter line, an optional block set to
 * the right (a deadline, the next meeting), and the way in. Wraps instead of
 * squeezing, so a phone gets the text first and the button under it.
 */
function Row({
  avatar,
  title,
  detail,
  aside,
  action,
}: {
  avatar: ReactNode;
  title: string;
  detail: string | null;
  aside?: ReactNode;
  action?: ReactNode;
}) {
  return (
    // On a phone the avatar and text sit on one line and the deadline and the
    // button share the line under them, aligned with the text. From `sm` the
    // wrapper dissolves (`contents`) and all four become columns of one row.
    <li className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-t border-line px-4 py-3 first:border-t-0 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:px-6">
      {avatar}
      <div className="min-w-0">
        <p className="text-body font-medium text-ink">{title}</p>
        {detail ? <p className="mt-0.5 text-small text-ink-mid">{detail}</p> : null}
      </div>
      {aside || action ? (
        <div className="col-start-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:contents">
          {aside}
          {action}
        </div>
      ) : null}
    </li>
  );
}

function GoldLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button asChild size="sm" variant="gold" className="min-h-11">
      <Link href={href}>{children}</Link>
    </Button>
  );
}

/** A small caption over a value, set to the right of a row. */
function Aside({ caption, value, urgent = false }: { caption: string; value: string; urgent?: boolean }) {
  return (
    <div className="shrink-0 text-left sm:text-right">
      <p className="text-label text-ink-mid">{caption}</p>
      <p className={`text-small font-medium ${urgent ? "text-pink-deep" : "text-ink"}`}>{value}</p>
    </div>
  );
}

/**
 * The Öğrenciler page. What waits on the tutor comes first, on a pink band
 * because it asks for action; the students being coached follow on an ink band,
 * since that is the tutor's own record; anyone who needs nothing from the tutor
 * right now (not yet chosen hours, being ended) is set apart under them.
 *
 * Ending a coaching never sits on an active student's row. It lives on that
 * student's program page; the one place it appears in this list is a student who
 * has not chosen hours, who has no program page to end it from.
 *
 * Plain class strings throughout: tailwind-merge would drop a named size such
 * as `text-label` next to a text colour.
 */
export function CoachingStudentsBoard({
  waiting,
  waitingState,
  onRetryWaiting,
  active,
  pending,
  nextKnown,
  occupiedPlaces,
  maxStudents,
}: {
  waiting: readonly StudentWaitingItem[];
  waitingState: "loading" | "error" | "ready";
  onRetryWaiting?: () => void;
  active: readonly ActiveStudentRow[];
  pending: readonly PendingStudentRow[];
  /** False when the meetings could not be read, so no "next meeting" is claimed. */
  nextKnown: boolean;
  occupiedPlaces: number | null;
  maxStudents: number | null;
}) {
  const showWaiting = waitingState !== "ready" || waiting.length > 0;

  return (
    <div className="space-y-5">
      {showWaiting ? (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <div className={sectionBandClass("pink", "flex-wrap")}>
            <SectionBandHeading id="coaching-students-waiting-title" title="Senden bekleyenler" />
            {waitingState === "ready" ? <SectionBandCount tone="pink">{waiting.length}</SectionBandCount> : null}
          </div>

          {waitingState === "loading" ? (
            <div role="status" aria-label="Bekleyenler yükleniyor" className="space-y-3 px-4 py-4 sm:px-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : null}

          {waitingState === "error" ? (
            <div className="space-y-3 px-4 py-5 sm:px-6">
              <InlineError message="Bekleyenler yüklenemedi." />
              {onRetryWaiting ? (
                <Button type="button" variant="gold" size="sm" onClick={onRetryWaiting}>
                  Tekrar dene
                </Button>
              ) : null}
            </div>
          ) : null}

          {waitingState === "ready" ? (
            <ul>
              {waiting.map((item) => (
                <Row
                  key={item.id}
                  avatar={<Avatar initials={item.initials} />}
                  title={item.title}
                  detail={item.detail}
                  aside={<Aside caption={item.due.caption} value={item.due.value} urgent={item.due.urgent} />}
                  action={<GoldLink href={item.action.href}>{item.action.label}</GoldLink>}
                />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className={sectionBandClass("ink", "flex-wrap")}>
          <SectionBandHeading id="coaching-students-active-title" title="Aktif öğrenciler" />
          {occupiedPlaces !== null && maxStudents !== null ? (
            <SectionBandCount tone="ink">{`${occupiedPlaces} / ${maxStudents} kontenjan`}</SectionBandCount>
          ) : null}
        </div>
        {active.length === 0 ? (
          <p className="px-4 py-6 text-center text-body text-ink-mid sm:px-6">Şu an aktif koçluk öğrencin yok.</p>
        ) : (
          <ul>
            {active.map((student) => (
              <Row
                key={student.purchaseId}
                avatar={<Avatar initials={student.initials} />}
                title={student.name}
                detail={student.summary}
                aside={
                  nextKnown ? (
                    <Aside caption="Sıradaki" value={student.next ?? "Görüşme planlanmadı"} />
                  ) : null
                }
                action={
                  student.programHref ? <GoldLink href={student.programHref}>Programı yönet</GoldLink> : null
                }
              />
            ))}
          </ul>
        )}
      </div>

      {pending.length > 0 ? (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <div className={sectionBandClass("ink", "flex-wrap")}>
            <SectionBandHeading id="coaching-students-pending-title" title="Beklemede" />
            <SectionBandCount tone="ink">{pending.length}</SectionBandCount>
          </div>
          <ul>
            {pending.map((student) => (
              <Row
                key={student.purchaseId}
                avatar={<Avatar initials={student.initials} />}
                title={student.name}
                detail={student.note}
                action={
                  student.canEnd ? (
                    <CoachingEndCoaching
                      purchaseId={student.purchaseId}
                      studentName={student.name}
                      variant="link"
                    />
                  ) : null
                }
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
