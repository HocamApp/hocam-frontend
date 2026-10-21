"use client";

import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { ReportFieldsStep } from "@/components/coaching/ReportField";
import { ReportSaveLine } from "@/components/coaching/ReportSaveLine";
import { useReportDraft } from "@/components/coaching/useReportDraft";
import { SensitiveDataGuidance } from "@/components/privacy/SensitiveDataGuidance";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { REPORT_FIELD_RULES } from "@/lib/coachingReportDraft";

/**
 * The part of the report that fits beside a video call: the summary and the
 * topics, saved on their own into the same draft. The rest is written on the
 * report page, which opens in a new tab so the call is not left.
 */
export function CoachingReportQuickDraft({
  sessionId,
  autosaveDelayMs,
}: {
  sessionId: string;
  autosaveDelayMs?: number;
}) {
  const draft = useReportDraft(sessionId, autosaveDelayMs);

  if (draft.error) {
    return <CoachingLoadError message="Rapor taslağı yüklenemedi." onRetry={draft.retry} isRetrying={draft.isRetrying} />;
  }
  if (!draft.hydrated) {
    return (
      <div className="flex min-h-24 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SensitiveDataGuidance />
      <ReportFieldsStep
        rules={REPORT_FIELD_RULES.filter((rule) => rule.step === "summary")}
        values={draft.draft}
        onChange={(field, value) => draft.setText(field, value)}
      />
      <ReportSaveLine status={draft.autosave.status} onRetry={draft.autosave.retry} />
      <Button asChild variant="gold" size="sm" className="min-h-11">
        <a href={`/dashboard/tutor/coaching/sessions/${sessionId}/report`} target="_blank" rel="noopener noreferrer">
          Tam raporu aç
        </a>
      </Button>
    </div>
  );
}
