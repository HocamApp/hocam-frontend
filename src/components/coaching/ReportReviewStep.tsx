"use client";

import Link from "next/link";
import { useId } from "react";
import { Check } from "@phosphor-icons/react";

import { PublishedReportView } from "@/components/coaching/PublishedReportView";
import { InlineError } from "@/components/shared/InlineError";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CoachingReportDraftInput } from "@/lib/coachingApi";
import {
  reportPreviewRevision,
  type ReportChecklistItem,
  type ReportStepKey,
} from "@/lib/coachingReportDraft";

/**
 * The last step: what is still missing (each with a way to the step that holds
 * it), the report as the student will see it, and the one button that sends it.
 * A shut button always says why.
 */
export function ReportReviewStep({
  checklist,
  onGoto,
  payload,
  meeting,
  revisionNumber,
  programMissing,
  programHref,
  noProgramReason,
  onNoProgramReason,
  revising,
  changeNote,
  onChangeNote,
  sessionRunning,
  pending,
  error,
  onPublish,
}: {
  checklist: readonly ReportChecklistItem[];
  onGoto: (step: ReportStepKey) => void;
  payload: CoachingReportDraftInput;
  meeting: string;
  revisionNumber: number;
  programMissing: boolean;
  programHref: string;
  noProgramReason: string;
  onNoProgramReason: (value: string) => void;
  /** Writing a new version of a report that is already out. */
  revising: boolean;
  changeNote: string;
  onChangeNote: (value: string) => void;
  sessionRunning: boolean;
  pending: boolean;
  error: string | null;
  onPublish: () => void;
}) {
  const reasonId = useId();
  const noteId = useId();
  const missing = checklist.filter((item) => !item.done).length;
  const blocked = pending || missing > 0 || (!revising && sessionRunning);
  const why = !revising && sessionRunning ? "Görüşme bitince yayınlayabilirsin." : missing > 0 ? `${missing} madde eksik` : null;

  return (
    <div className="space-y-6">
      <ul aria-label="Yayın listesi" className="divide-y divide-line rounded-card border border-line bg-surface">
        {checklist.map((item) => (
          <li key={item.key} className="flex flex-wrap items-center gap-3 px-4 py-2">
            {item.done ? (
              <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-pill bg-gold text-gold-ink">
                <Check className="h-3 w-3" weight="bold" />
              </span>
            ) : (
              <span aria-hidden="true" className="h-5 w-5 shrink-0 rounded-pill border-2 border-line" />
            )}
            <span className="min-w-0 flex-1 text-small">
              <span className="sr-only">{item.done ? "Tamamlandı." : "Eksik."}</span>{" "}
              <span className={item.done ? "text-ink" : "text-error"}>{item.message}</span>
            </span>
            {!item.done && item.step !== "review" ? (
              <Button type="button" variant="gold" size="sm" className="min-h-11" onClick={() => onGoto(item.step)}>
                Düzelt
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      {programMissing ? (
        <div className="space-y-2 rounded-card border border-line bg-surface p-4">
          <p className="text-small text-ink">
            Bu dönem için çalışma programı yok.{" "}
            <Link href={programHref} className="font-medium underline underline-offset-4">
              Programı hazırla
            </Link>{" "}
            ya da neden olmadığını kısaca yaz.
          </p>
          <label htmlFor={reasonId} className="block text-small font-medium text-ink">
            Program olmadan yayınlama gerekçesi
          </label>
          <Textarea
            id={reasonId}
            value={noProgramReason}
            onChange={(event) => onNoProgramReason(event.target.value)}
            placeholder="Örn. Bu hafta deneme sonuçlarını bekliyoruz, program önümüzdeki görüşmede çıkacak."
            className="min-h-[5.5rem] bg-surface text-body text-ink focus-visible:border-ink focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-small font-medium text-ink">Öğrencinin göreceği rapor</h3>
        <PublishedReportView
          revision={reportPreviewRevision(payload, revisionNumber)}
          heading={{ title: "Görüşme raporu", meeting, published: "Önizleme", changeNote: null }}
        />
      </section>

      <div className="space-y-3">
        {revising ? (
          <div>
            <label htmlFor={noteId} className="block text-small font-medium text-ink">
              Bu sürümde neyi değiştirdin?
            </label>
            <p className="mt-0.5 text-small text-ink-mid">İsteğe bağlı; öğrenci bu notu görür.</p>
            <Textarea
              id={noteId}
              value={changeNote}
              onChange={(event) => onChangeNote(event.target.value)}
              className="mt-1.5 min-h-[5.5rem] bg-surface text-body text-ink focus-visible:border-ink focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        ) : null}
        <InlineError message={error} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button type="button" size="lg" disabled={blocked} onClick={onPublish}>
            {revising ? "Yeni sürümü yayınla" : "İlk raporu yayınla"}
          </Button>
          {why ? <p className="text-small text-ink-mid">{why}</p> : null}
        </div>
        {!revising ? (
          <p className="text-small text-ink-mid">
            İlk raporu yayınlayınca görüşme tamamlanmış sayılır. Sonraki yayınlar yeni sürüm olarak eklenir.
          </p>
        ) : null}
      </div>
    </div>
  );
}
