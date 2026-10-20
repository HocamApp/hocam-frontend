"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { AttentionNotice } from "@/components/shared/AttentionNotice";
import {
  SectionBandCount,
  SectionBandHeading,
  sectionBandClass,
} from "@/components/shared/SectionBand";
import { RescheduleDialog } from "@/components/coaching/RescheduleDialog";
import { Button } from "@/components/ui/button";
import type { StudentSessionRow, StudentSessionsModel } from "@/lib/coachingStudentSessions";
import { coachingDateTimeLabel } from "@/lib/coachingTime";

/** The form opens on the missing-report topic, the one this link is about. */
const SUPPORT_HREF = "/dashboard/student/coaching/complaints?konu=report_absent";

const TEXT_LINK_CLASS =
  "inline-flex min-h-11 items-center text-small font-medium text-ink underline underline-offset-4 hover:text-pink-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2";

function GoldLink({ href, label, children }: { href: string; label?: string; children: ReactNode }) {
  return (
    <Button asChild size="sm" variant="gold" className="min-h-11">
      <Link href={href} aria-label={label}>
        {children}
      </Link>
    </Button>
  );
}

/** The one thing to do about a meeting that is still ahead: nothing but a quiet note while the tutor has not answered. */
function PendingNote({ row, onPink = false }: { row: StudentSessionRow; onPink?: boolean }) {
  const secondary = onPink ? "" : "text-ink-mid";
  return (
    <div className={onPink ? "" : "text-left sm:text-right"}>
      {row.pending ? (
        <>
          <p className={`text-label ${secondary}`}>Önerdiğin saat</p>
          <p className="text-small font-medium tabular-nums">{row.pending.value}</p>
        </>
      ) : null}
      <p className={`text-small ${secondary}`}>Hocanın yanıtı bekleniyor</p>
    </div>
  );
}

/**
 * The next meeting, alone on pink. Katıl is gold, as on the tutor's page, and
 * only while the room can open; before that the card says when it does, so the
 * button never answers "not open yet". Yeniden planla is solid black here:
 * gold beside pink at this size vibrates.
 */
function NextCard({ row }: { row: StudentSessionRow }) {
  return (
    <section aria-label="Sıradaki görüşme" className="rounded-card bg-pink p-6 text-primary-foreground sm:p-8">
      <p className="text-label font-medium">
        {"Sıradaki görüşme · "}
        <span>{`${row.number}. görüşme`}</span>
      </p>
      <p className="mt-3 text-body-l">{row.dayHeading}</p>
      <p className="text-[3.25rem] font-bold leading-[1.05] tracking-[-0.03em] tabular-nums">{row.time}</p>
      <p className="mt-1 text-small">
        {row.live
          ? `${row.durationMinutes} dk · Devam ediyor`
          : row.remaining
            ? `${row.durationMinutes} dk · ${row.remaining} sonra`
            : `${row.durationMinutes} dk`}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        {row.join?.kind === "open" ? <GoldLink href={row.join.href}>Katıl</GoldLink> : null}
        {row.join?.kind === "closed" ? <p className="text-small">{`Katıl ${row.join.opensLabel}`}</p> : null}
        {row.canReschedule ? <RescheduleDialog session={row.session} tone="onPink" /> : null}
        {row.waitingForTutor ? <PendingNote row={row} onPink /> : null}
      </div>
    </section>
  );
}

function DateColumn({ row, record = false }: { row: StudentSessionRow; record?: boolean }) {
  return (
    <div className="w-11 shrink-0 text-center leading-tight">
      <p className="text-label text-ink-mid">{row.date.weekday}</p>
      <p className={`text-[1.5rem] font-bold tabular-nums ${record ? "text-ink-mid" : "text-ink"}`}>{row.date.day}</p>
      <p className="text-label text-ink-mid">{row.date.month}</p>
    </div>
  );
}

function UpcomingRow({ row }: { row: StudentSessionRow }) {
  return (
    <li className="flex gap-x-3 border-t border-line py-4 first:border-t-0">
      <DateColumn row={row} />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-44">
          <p className="text-body font-medium text-ink">{row.title}</p>
          {row.detail ? <p className="text-small text-ink-mid">{row.detail}</p> : null}
        </div>
        {row.waitingForTutor ? <PendingNote row={row} /> : null}
        {row.canReschedule ? <RescheduleDialog session={row.session} /> : null}
      </div>
    </li>
  );
}

/**
 * What is wrong with a report that has not come, in the one treatment the app
 * uses for it: a pink hairline, ink text, one pink pill to reach support. While
 * support is not open yet the notice says when it will be.
 */
function ReportNotice({ row }: { row: StudentSessionRow }) {
  if (row.overdueReport) {
    return (
      <AttentionNotice
        className="mt-3"
        title="Görüşme raporu gecikti"
        action={
          row.supportOpen ? (
            <Button asChild size="sm" className="h-auto max-w-full whitespace-normal py-2 text-center">
              <Link href={SUPPORT_HREF}>Eksik rapor için desteğe başvur</Link>
            </Button>
          ) : undefined
        }
      >
        <p>{`Son teslim zamanı: ${coachingDateTimeLabel(row.overdueReport.dueAt)}`}</p>
        {row.supportLater ? (
          <p>{`Eksik rapor desteği ${coachingDateTimeLabel(row.supportLater)} itibarıyla kullanılabilir.`}</p>
        ) : null}
      </AttentionNotice>
    );
  }
  if (row.supportOpen) {
    return (
      <Link href={SUPPORT_HREF} className={TEXT_LINK_CLASS}>
        Eksik rapor için desteğe başvur
      </Link>
    );
  }
  if (row.supportLater) {
    return (
      <p className="mt-1 text-small text-ink-mid">
        {`Eksik rapor desteği ${coachingDateTimeLabel(row.supportLater)} itibarıyla kullanılabilir.`}
      </p>
    );
  }
  return null;
}

function PastRow({ row }: { row: StudentSessionRow }) {
  return (
    <li className="flex gap-x-3 border-t border-line py-4 first:border-t-0">
      <DateColumn row={row} record />
      <div className="flex min-w-0 flex-1 flex-wrap items-start gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-52">
          <p className="text-body font-medium text-ink">{row.title}</p>
          {row.detail ? <p className="text-small text-ink-mid">{row.detail}</p> : null}
          <ReportNotice row={row} />
          {row.incident ? (
            <div className="mt-1">
              <Link href={row.incident.href} className={TEXT_LINK_CLASS}>
                Teknik sorun mu vardı, hoca gelmedi mi?
              </Link>
            </div>
          ) : null}
        </div>
        {row.rate ? (
          <GoldLink href={row.rate.href} label={`${row.title}: Değerlendir`}>
            Değerlendir
          </GoldLink>
        ) : null}
      </div>
    </li>
  );
}

/**
 * The student's Görüşmeler page: the next meeting on pink, the ones after it,
 * and what already happened on an ink band (what is on record). Row actions are
 * solid gold; the one pink button is the support way in, inside its notice.
 *
 * Plain class strings: tailwind-merge would drop a named size next to a colour.
 */
export function StudentSessionsBoard({ model }: { model: StudentSessionsModel }) {
  const { next, upcoming, moreDates, past } = model;
  return (
    <div className="space-y-6">
      {next ? <NextCard row={next} /> : null}

      {upcoming.length > 0 ? (
        <section aria-labelledby="student-sessions-upcoming-title" className="space-y-3">
          <h2 id="student-sessions-upcoming-title" className="text-h3-m font-bold md:text-h3 md:font-bold">
            Yaklaşanlar
          </h2>
          <div className="overflow-hidden rounded-card border border-line bg-surface">
            <ul className="px-4 sm:px-6">
              {upcoming.map((row) => (
                <UpcomingRow key={row.id} row={row} />
              ))}
            </ul>
            {moreDates.length > 0 ? (
              <p className="border-t border-line bg-paper px-4 py-3 text-small text-ink sm:px-6">
                {`${moreDates.length} görüşme daha: ${moreDates.join(", ")}`}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section
          aria-labelledby="student-sessions-past-title"
          className="overflow-hidden rounded-card border border-line bg-surface"
        >
          <div className={sectionBandClass("ink", "flex-wrap")}>
            <SectionBandHeading id="student-sessions-past-title" title="Geçmiş" />
            <SectionBandCount tone="ink">{past.length}</SectionBandCount>
          </div>
          <ul className="px-4 sm:px-6">
            {past.map((row) => (
              <PastRow key={row.id} row={row} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
