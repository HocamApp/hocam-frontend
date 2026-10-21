"use client";

import { Button } from "@/components/ui/button";
import { coachingTimeLabel } from "@/lib/coachingTime";
import type { ReportSaveStatus } from "./useReportAutosave";

/**
 * Says whether the draft is safe. A failure stays in the form, with its reason
 * and a way to try again; it never turns into a stream of toasts.
 */
export function ReportSaveLine({
  status,
  onRetry,
}: {
  status: ReportSaveStatus;
  onRetry: () => void;
}) {
  const text =
    status.kind === "saved"
      ? `Kaydedildi · ${coachingTimeLabel(status.at)}`
      : status.kind === "saving"
        ? "Kaydediliyor…"
        : status.kind === "dirty"
          ? "Değişiklikler kaydedilecek…"
          : status.kind === "error"
            ? `Kaydedilemedi · ${status.message}`
            : "Otomatik kaydedilir";
  const dot =
    status.kind === "saved" ? "bg-success" : status.kind === "error" ? "bg-error" : "bg-line";

  return (
    <p
      role="status"
      aria-label="Kayıt durumu"
      className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-small text-ink-mid"
    >
      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-pill ${dot}`} />
      <span className="min-w-0">{text}</span>
      {status.kind === "error" ? (
        <Button type="button" variant="gold" size="sm" className="min-h-11" onClick={onRetry}>
          Tekrar dene
        </Button>
      ) : null}
    </p>
  );
}
