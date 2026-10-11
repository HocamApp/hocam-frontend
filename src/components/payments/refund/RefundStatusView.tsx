import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { instantDateLabel } from "@/lib/instantTime";
import {
  REFUND_PAGES,
  REFUND_PREVIEW_STEP,
  REFUND_STATUS_VIEW,
  deductionExplanation,
  refundReasonLabel,
  usedLessonNote,
} from "@/lib/refundCopy";
import { refundFigures, refundTimeline } from "@/lib/refundPresentation";
import { PAYMENTS_HREF } from "@/lib/refundRoutes";
import { formatPrice } from "@/lib/utils";
import type { RefundRequest } from "@/types";

import { RefundFigures } from "./RefundFigures";
import { RefundLessonList } from "./RefundLessonList";
import { RefundStatusBadge } from "./RefundStatusBadge";
import { RefundTimeline } from "./RefundTimeline";

export function RefundStatusSkeleton() {
  return (
    <div className="max-w-2xl space-y-8" aria-busy="true" aria-label="Yükleniyor">
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-28 rounded-pill" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="space-y-5">
        <Skeleton className="h-6 w-24" />
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="flex gap-4">
            <Skeleton className="h-6 w-6 shrink-0 rounded-pill" />
            <div className="w-full space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

function SectionTitle({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="text-lg font-bold text-ink">
      {children}
    </h2>
  );
}

/**
 * One refund request, from the student's side: where it is, what it is worth,
 * and what happens to the lessons. Staff's notes are not in the data this reads,
 * and a refused request shows the reason staff wrote for the student, nothing
 * else.
 */
export function RefundStatusView({ refund }: { refund: RefundRequest }) {
  const steps = refundTimeline(refund);
  const figures = refundFigures(refund);
  const calculation = refund.calculation;
  const refused = refund.status === "rejected";
  const open = refund.status === "requested";
  const tutor = refund.purchase_summary.tutor;

  return (
    <div className="max-w-2xl space-y-10">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <RefundStatusBadge status={refund.status} />
        <p className="text-sm text-ink-mid">
          {REFUND_STATUS_VIEW.requestedAt}:{" "}
          <span className="tabular-nums">{instantDateLabel(refund.created_at)}</span>
        </p>
      </header>

      {refund.initiated_by === "platform" && (
        <p className="text-sm text-ink-mid">{REFUND_STATUS_VIEW.platformOpened}</p>
      )}

      {refused && (
        <section
          aria-labelledby="refund-rejected"
          className="rounded-[var(--radius-card)] border border-ink p-5 sm:p-6"
        >
          <h2 id="refund-rejected" className="text-lg font-bold text-ink">
            {REFUND_STATUS_VIEW.rejectedTitle}
          </h2>
          {refund.rejection_reason && (
            <p className="mt-3 text-base leading-7 text-ink">
              <span className="font-medium">{REFUND_STATUS_VIEW.rejectedReason}:</span>{" "}
              {refund.rejection_reason}
            </p>
          )}
          <p className="mt-3 text-sm leading-6 text-ink-mid">{REFUND_STATUS_VIEW.rejectedNext}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/support">{REFUND_STATUS_VIEW.support}</Link>
          </Button>
        </section>
      )}

      <section aria-labelledby="refund-timeline" className="space-y-5">
        <SectionTitle id="refund-timeline">{REFUND_STATUS_VIEW.timelineTitle}</SectionTitle>
        <RefundTimeline steps={steps} />
      </section>

      {!refused && (
        <section aria-labelledby="refund-figures" className="space-y-4">
          <SectionTitle id="refund-figures">Tutar</SectionTitle>
          <RefundFigures
            paid={figures.paid}
            paidLabel={REFUND_STATUS_VIEW.paid}
            deduction={figures.deduction}
            deductionLabel={REFUND_STATUS_VIEW.deduction}
            deductionNote={deductionExplanation(figures.usedCredits, formatPrice(figures.unitPrice))}
            refund={figures.refund}
            refundLabel={open ? REFUND_STATUS_VIEW.refundAsked : REFUND_STATUS_VIEW.refund}
          >
            {open && (
              <p className="mt-4 text-sm leading-6 text-ink-mid">{REFUND_STATUS_VIEW.mayChange}</p>
            )}
            {!calculation && (
              <p className="mt-4 text-sm leading-6 text-ink-mid">{REFUND_STATUS_VIEW.oldRequestNote}</p>
            )}
          </RefundFigures>
        </section>
      )}

      {!refused && calculation && (
        <div className="space-y-6">
          <RefundLessonList
            title={REFUND_STATUS_VIEW.usedTitle}
            lessons={calculation.used_lessons}
            noteFor={(lesson) => usedLessonNote(String(lesson.why), calculation.near_window_hours)}
          />
          <RefundLessonList
            title={
              open ? REFUND_STATUS_VIEW.cancelledTitleOpen : REFUND_STATUS_VIEW.cancelledTitleDone
            }
            intro={open ? REFUND_PREVIEW_STEP.cancelledNote : undefined}
            lessons={calculation.cancelled_lessons}
          />
        </div>
      )}

      <section aria-labelledby="refund-summary" className="space-y-4">
        <SectionTitle id="refund-summary">{REFUND_STATUS_VIEW.summaryTitle}</SectionTitle>
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-ink-mid">{REFUND_STATUS_VIEW.tutor}</dt>
            <dd className="mt-1 font-medium text-ink">
              {tutor.name} {tutor.surname}
            </dd>
          </div>
          <div>
            <dt className="text-ink-mid">{REFUND_STATUS_VIEW.reason}</dt>
            <dd className="mt-1 font-medium text-ink">{refundReasonLabel(refund.reason)}</dd>
          </div>
          {refund.student_note && (
            <div>
              <dt className="text-ink-mid">{REFUND_STATUS_VIEW.note}</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words text-ink">{refund.student_note}</dd>
            </div>
          )}
        </dl>
      </section>

      <Button asChild variant="outline">
        <Link href={PAYMENTS_HREF}>{REFUND_PAGES.backToPackages}</Link>
      </Button>
    </div>
  );
}
