"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { InlineError } from "@/components/shared/InlineError";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  OPEN_REQUEST_LINK,
  REFUND_PAGES,
  REFUND_PREVIEW_STEP,
  REFUND_REASON_OPTIONS,
  REFUND_REASON_STEP,
  SLOT_CONFLICT_OPTION,
  blockedReasonText,
  deductionExplanation,
  previewValiditySentence,
  refundErrorText,
  unscheduledSentence,
  usedLessonNote,
  whatHappensNext,
  type RefundReasonOption,
} from "@/lib/refundCopy";
import { openRefundFor } from "@/lib/refundPresentation";
import { PAYMENTS_HREF, refundStatusHref } from "@/lib/refundRoutes";
import { describeRefundError, fetchRefundRequests, previewRefund, requestRefund } from "@/lib/refundsApi";
import { cn, formatPrice } from "@/lib/utils";
import type { PackagePurchase, RefundPreview, RefundReason } from "@/types";

import { RefundFigures } from "./RefundFigures";
import { RefundLessonList } from "./RefundLessonList";

const NOTE_MAX_LENGTH = 2000;

type Step = "reason" | "preview";

/** The reason a link asks for, if this screen offers it. `slot_conflict` is
 * only on offer when the link brings it: the server refuses it for a package
 * whose hours were all scheduled. */
function startingReason(requested: string | null | undefined): RefundReason {
  if (requested === "slot_conflict") return "slot_conflict";
  const everyday = REFUND_REASON_OPTIONS.find((option) => option.value === requested);
  return everyday ? everyday.value : "voluntary";
}

function reasonOptions(startReason: RefundReason): readonly RefundReasonOption[] {
  return startReason === "slot_conflict"
    ? [SLOT_CONFLICT_OPTION, ...REFUND_REASON_OPTIONS]
    : REFUND_REASON_OPTIONS;
}

export function RefundFlowSkeleton() {
  return (
    <div className="max-w-2xl space-y-6" aria-busy="true" aria-label="Yükleniyor">
      <Skeleton className="h-28 w-full rounded-[var(--radius-card)]" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-[72px] w-full" />
        <Skeleton className="h-[72px] w-full" />
        <Skeleton className="h-[72px] w-full" />
      </div>
      <Skeleton className="h-10 w-40 rounded-pill" />
    </div>
  );
}

function PackageSummary({ purchase }: { purchase: PackagePurchase }) {
  return (
    <section
      aria-label={REFUND_REASON_STEP.yourPackage}
      className="rounded-[var(--radius-card)] border border-line bg-surface p-5 sm:p-6"
    >
      <p className="text-base font-bold text-ink">
        {purchase.tutor.name} {purchase.tutor.surname}
      </p>
      <p className="mt-0.5 text-sm text-ink-mid">{purchase.plan.name}</p>
      <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
        <div>
          <dt className="text-ink-mid">{REFUND_REASON_STEP.paid}</dt>
          <dd className="mt-1 font-semibold tabular-nums text-ink">{formatPrice(purchase.total_price)}</dd>
        </div>
        <div>
          <dt className="text-ink-mid">{REFUND_REASON_STEP.lessons}</dt>
          <dd className="mt-1 font-semibold tabular-nums text-ink">{purchase.total_credits}</dd>
        </div>
      </dl>
    </section>
  );
}

function OpenRequestNotice({ refundId }: { refundId: string }) {
  return (
    <section className="max-w-2xl rounded-[var(--radius-card)] border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-bold text-ink">{REFUND_PAGES.openRequestTitle}</h2>
      <p className="mt-1 text-sm leading-6 text-ink-mid">{REFUND_PAGES.openRequestBody}</p>
      <Button asChild className="mt-4">
        <Link href={refundStatusHref(refundId)}>{OPEN_REQUEST_LINK}</Link>
      </Button>
    </section>
  );
}

function ReasonStep({
  options,
  reason,
  note,
  busy,
  error,
  onReason,
  onNote,
  onSubmit,
  headingRef,
}: {
  options: readonly RefundReasonOption[];
  reason: RefundReason;
  note: string;
  busy: boolean;
  error: string | null;
  onReason: (reason: RefundReason) => void;
  onNote: (note: string) => void;
  onSubmit: () => void;
  headingRef: RefObject<HTMLHeadingElement>;
}) {
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!busy) onSubmit();
  }

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      <fieldset className="space-y-3">
        <legend className="mb-1">
          <h2 ref={headingRef} tabIndex={-1} className="text-lg font-bold text-ink outline-none">
            {REFUND_REASON_STEP.reasonLegend}
          </h2>
        </legend>
        {options.map((option) => {
          const checked = option.value === reason;
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-11 cursor-pointer items-start gap-3 rounded-input border bg-surface p-4 transition-colors duration-[--duration-state]",
                checked ? "border-ink" : "border-line hover:border-ink"
              )}
            >
              <input
                type="radio"
                name="refund-reason"
                value={option.value}
                checked={checked}
                onChange={() => onReason(option.value)}
                className="mt-1 h-5 w-5 shrink-0 accent-[var(--ink)]"
              />
              <span className="min-w-0">
                <span className="block text-base font-medium text-ink">{option.label}</span>
                <span className="mt-0.5 block text-sm text-ink-mid">{option.hint}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="refund-note" className="text-[0.8125rem] font-medium">
          {REFUND_REASON_STEP.noteLabel}{" "}
          <span className="font-normal text-ink-mid">({REFUND_REASON_STEP.noteOptional})</span>
        </Label>
        <Textarea
          id="refund-note"
          value={note}
          maxLength={NOTE_MAX_LENGTH}
          rows={4}
          onChange={(event) => onNote(event.target.value)}
          aria-describedby="refund-note-help"
        />
        <p id="refund-note-help" className="flex justify-between gap-4 text-xs text-ink-mid">
          <span>{REFUND_REASON_STEP.noteHelp}</span>
          <span className="shrink-0 tabular-nums">
            {note.length}/{NOTE_MAX_LENGTH}
          </span>
        </p>
      </div>

      <InlineError message={error} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <Button asChild variant="ghost" className="min-h-11">
          <Link href={PAYMENTS_HREF}>{REFUND_REASON_STEP.cancel}</Link>
        </Button>
        <Button type="submit" size="lg" disabled={busy} aria-busy={busy}>
          {busy ? REFUND_REASON_STEP.loading : REFUND_REASON_STEP.next}
        </Button>
      </div>
    </form>
  );
}

function PreviewStep({
  preview,
  reason,
  notice,
  error,
  busy,
  onBack,
  onSubmit,
  headingRef,
  noticeRef,
}: {
  preview: RefundPreview;
  reason: RefundReason;
  notice: string | null;
  error: string | null;
  busy: boolean;
  onBack: () => void;
  onSubmit: () => void;
  headingRef: RefObject<HTMLHeadingElement>;
  noticeRef: RefObject<HTMLParagraphElement>;
}) {
  const calculation = preview.calculation;
  const figureNotes = calculation
    ? [
        calculation.full_refund ? REFUND_PREVIEW_STEP.fullRefund : "",
        calculation.unscheduled_credits > 0
          ? unscheduledSentence(calculation.unscheduled_credits)
          : "",
      ].filter(Boolean)
    : [];

  const heading = (
    <h2 ref={headingRef} tabIndex={-1} className="text-lg font-bold text-ink outline-none">
      {REFUND_PREVIEW_STEP.title}
    </h2>
  );

  if (!preview.eligible) {
    return (
      <section className="space-y-5">
        {heading}
        <p className="text-base leading-7 text-ink" role="status">
          {blockedReasonText(preview.blocked_reason)}
        </p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          {preview.blocked_reason === "reason_not_applicable" ? (
            <Button type="button" onClick={onBack}>
              {REFUND_PREVIEW_STEP.back}
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href={PAYMENTS_HREF}>{REFUND_PAGES.backToPackages}</Link>
            </Button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div className="space-y-4">
        {heading}
        {notice && (
          <p
            ref={noticeRef}
            role="status"
            tabIndex={-1}
            className="rounded-input border border-ink px-4 py-3 text-sm leading-6 text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
          >
            {notice}
          </p>
        )}
        {calculation && (
          <RefundFigures
            paid={calculation.total_paid}
            paidLabel={REFUND_PREVIEW_STEP.paid}
            deduction={calculation.deduction_amount}
            deductionLabel={REFUND_PREVIEW_STEP.deduction}
            deductionNote={deductionExplanation(
              calculation.used_credits,
              formatPrice(calculation.unit_price)
            )}
            refund={calculation.refund_amount}
            refundLabel={REFUND_PREVIEW_STEP.refund}
          >
            {figureNotes.length > 0 && (
              <p className="mt-4 text-sm leading-6 text-ink-mid">{figureNotes.join(" ")}</p>
            )}
          </RefundFigures>
        )}
      </div>

      {calculation && (
        <div className="space-y-6">
          <RefundLessonList
            title={REFUND_PREVIEW_STEP.usedTitle}
            lessons={calculation.used_lessons}
            noteFor={(lesson) => usedLessonNote(String(lesson.why), calculation.near_window_hours)}
          />
          {calculation.cancelled_lessons.length > 0 ? (
            <RefundLessonList
              title={REFUND_PREVIEW_STEP.cancelledTitle}
              intro={REFUND_PREVIEW_STEP.cancelledNote}
              lessons={calculation.cancelled_lessons}
            />
          ) : (
            <p className="text-sm text-ink-mid">{REFUND_PREVIEW_STEP.nothingCancelled}</p>
          )}
        </div>
      )}

      <div>
        <h3 className="text-base font-bold text-ink">{REFUND_PREVIEW_STEP.whatHappensTitle}</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink-mid marker:text-ink-mid">
          {whatHappensNext(preview.answer_within_days, reason).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-3 border-t border-line pt-6">
        <p className="text-sm leading-6 text-ink">{REFUND_PREVIEW_STEP.confirmLead}</p>
        {preview.token_valid_for_minutes ? (
          <p className="text-xs text-ink-mid">
            {previewValiditySentence(preview.token_valid_for_minutes)}
          </p>
        ) : null}
        <InlineError message={error} />
        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center">
          <Button type="button" variant="ghost" className="min-h-11" onClick={onBack} disabled={busy}>
            {REFUND_PREVIEW_STEP.back}
          </Button>
          <Button type="button" size="lg" onClick={onSubmit} disabled={busy} aria-busy={busy}>
            {busy ? REFUND_PREVIEW_STEP.submitting : REFUND_PREVIEW_STEP.submit}
          </Button>
        </div>
      </div>
    </section>
  );
}

/**
 * Asking for a refund: why, then the numbers, then the confirmation.
 *
 * Nothing the student types is an amount. The preview works the numbers out
 * on the server and signs them; confirming sends that signature back, so the
 * request is for exactly the figures that were on the screen. When anything
 * moved in between, the server answers with the new figures, they replace the
 * old ones, and the student has to confirm again: the request is never sent on
 * a click that was meant for a different number.
 */
export function RefundFlow({
  purchase,
  initialReason,
}: {
  purchase: PackagePurchase;
  initialReason?: string | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const start = startingReason(initialReason);
  const options = reasonOptions(start);

  const [step, setStep] = useState<Step>("reason");
  const [reason, setReason] = useState<RefundReason>(start);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<RefundPreview | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  /** Counts the notices, so the same sentence twice in a row still moves focus. */
  const [noticeCount, setNoticeCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const noticeRef = useRef<HTMLParagraphElement>(null);
  const hasMoved = useRef(false);
  /** Set before the request leaves, so a second click in the same instant
   * cannot send a second one; cleared only when the request failed. */
  const sending = useRef(false);

  const refunds = useQuery({ queryKey: ["refund-requests"], queryFn: fetchRefundRequests });
  const open = openRefundFor(purchase.id, refunds.data);

  useEffect(() => {
    if (!hasMoved.current) {
      hasMoved.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  // The student was looking at the button when the figures changed under them:
  // bring them to the sentence that says so, which also reads it out.
  useEffect(() => {
    if (noticeCount === 0) return;
    (noticeRef.current ?? headingRef.current)?.focus();
  }, [noticeCount]);

  function announce(text: string) {
    setNotice(text);
    setNoticeCount((count) => count + 1);
  }

  const previewMutation = useMutation({
    mutationFn: previewRefund,
    onSuccess: (data) => {
      setPreview(data);
      setStep("preview");
      setError(null);
      // The list this screen read may be older than the server's answer.
      if (data.blocked_reason === "refund_in_progress") {
        void queryClient.invalidateQueries({ queryKey: ["refund-requests"] });
      }
    },
    onError: (err) => {
      setError(refundErrorText(describeRefundError(err).kind, "preview"));
    },
  });

  const requestMutation = useMutation({
    mutationFn: requestRefund,
    onSuccess: (refund) => {
      toast.success(REFUND_PAGES.submitted);
      void queryClient.invalidateQueries({ queryKey: ["refund-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["package-purchases"] });
      router.replace(refundStatusHref(refund.id));
    },
    onError: (err) => {
      sending.current = false;
      const described = describeRefundError(err);
      if (described.kind === "changed" && described.preview) {
        setPreview(described.preview);
        announce(REFUND_PREVIEW_STEP.refreshed);
        setError(null);
        return;
      }
      if (described.kind === "token") {
        announce(refundErrorText("token", "submit"));
        setError(null);
        previewMutation.mutate({ purchase: purchase.id, reason });
        return;
      }
      if (described.kind === "in_progress") {
        void queryClient.invalidateQueries({ queryKey: ["refund-requests"] });
      }
      setError(refundErrorText(described.kind, "submit"));
    },
  });

  if (refunds.isLoading) return <RefundFlowSkeleton />;
  if (open) return <OpenRequestNotice refundId={open.id} />;

  function askForPreview() {
    setNotice(null);
    setError(null);
    previewMutation.mutate({ purchase: purchase.id, reason });
  }

  function confirm() {
    if (sending.current || !preview?.token) return;
    sending.current = true;
    setNotice(null);
    setError(null);
    requestMutation.mutate({
      purchase: purchase.id,
      reason,
      preview_token: preview.token,
      note: note.trim() || undefined,
    });
  }

  function goBack() {
    setStep("reason");
    setPreview(null);
    setNotice(null);
    setError(null);
  }

  return (
    <div className="max-w-2xl space-y-8">
      <PackageSummary purchase={purchase} />
      {step === "reason" || !preview ? (
        <ReasonStep
          options={options}
          reason={reason}
          note={note}
          busy={previewMutation.isPending}
          error={error}
          onReason={setReason}
          onNote={setNote}
          onSubmit={askForPreview}
          headingRef={headingRef}
        />
      ) : (
        <PreviewStep
          preview={preview}
          reason={reason}
          notice={notice}
          error={error}
          busy={requestMutation.isPending || previewMutation.isPending}
          onBack={goBack}
          onSubmit={confirm}
          headingRef={headingRef}
          noticeRef={noticeRef}
        />
      )}
    </div>
  );
}
