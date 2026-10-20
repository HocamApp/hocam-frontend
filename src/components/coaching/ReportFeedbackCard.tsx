"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  COACHING_FAZ6_QUERY_KEYS,
  REPORT_FEEDBACK_CHOICES,
  REPORT_FEEDBACK_LABELS,
  extractCoachingErrorMessage,
  submitCoachingReportFeedback,
  type CoachingReportFeedbackChoice,
} from "@/lib/coachingApi";

/** The two answers that need words: the server stores only the choice, so the words go in a message. */
const NEEDS_WORDS = new Set<CoachingReportFeedbackChoice>(["want_to_change_goal", "want_to_leave_note"]);

const CHIP_BASE =
  "inline-flex min-h-11 items-center rounded-pill border px-4 text-small font-medium transition-colors duration-[var(--duration-state)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:opacity-60";

/**
 * Master Spec §22.9 "Öğrenci geri bildirimi", decision #53: one fixed short
 * choice, not a comment thread; it feeds the tutor's next-session prepare
 * screen. Because the choice carries no text, the two that ask for something
 * point to the coaching thread, where the words can be written. `messagesHref`
 * is null when there is no such thread, and then nothing is offered.
 *
 * Plain class strings: tailwind-merge would drop a named size next to a colour.
 */
export function ReportFeedbackCard({
  reportId,
  currentChoice,
  messagesHref = null,
}: {
  reportId: string;
  currentChoice?: CoachingReportFeedbackChoice | null;
  messagesHref?: string | null;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<CoachingReportFeedbackChoice | null>(currentChoice ?? null);

  const mutation = useMutation({
    mutationFn: (choice: CoachingReportFeedbackChoice) => submitCoachingReportFeedback(reportId, choice),
    onSuccess: (result) => {
      setSelected(result.choice);
      toast.success("Geri bildirimin kaydedildi.");
      queryClient.invalidateQueries({ queryKey: COACHING_FAZ6_QUERY_KEYS.publishedReport(reportId) });
    },
    onError: (err) => toast.error(extractCoachingErrorMessage(err)),
  });

  const offerThread = messagesHref !== null && selected !== null && NEEDS_WORDS.has(selected);

  return (
    <section aria-labelledby="report-feedback-title" className="rounded-card border border-line bg-surface p-5 sm:p-6">
      <h2 id="report-feedback-title" className="text-h3-m font-bold md:text-h3 md:font-bold">
        Kısa geri bildirim
      </h2>
      <p className="mt-1 text-small text-ink-mid">Hocan bunu bir sonraki görüşmeye hazırlanırken görür.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {REPORT_FEEDBACK_CHOICES.map((choice) => (
          <button
            key={choice}
            type="button"
            aria-pressed={selected === choice}
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(choice)}
            className={`${CHIP_BASE} ${
              selected === choice ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink hover:border-ink"
            }`}
          >
            {REPORT_FEEDBACK_LABELS[choice]}
          </button>
        ))}
      </div>
      {offerThread ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
          <p className="min-w-0 flex-1 basis-56 text-small text-ink">
            Notunu ya da değişiklik isteğini hocana mesajla iletebilirsin.
          </p>
          <Button asChild size="sm" variant="gold" className="min-h-11">
            <Link href={messagesHref}>Hocana yaz</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
