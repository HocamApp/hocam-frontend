"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CoachingAttachmentPanel } from "@/components/coaching/CoachingAttachmentPanel";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { ReportFieldsStep } from "@/components/coaching/ReportField";
import { ReportPublishedState } from "@/components/coaching/ReportPublishedState";
import { ReportReviewStep } from "@/components/coaching/ReportReviewStep";
import { ReportSaveLine } from "@/components/coaching/ReportSaveLine";
import { ReportExamStep, ReportResourcesStep } from "@/components/coaching/ReportStepForms";
import { ReportStepProgress, ReportStepRail } from "@/components/coaching/ReportStepRail";
import { useReportDraft } from "@/components/coaching/useReportDraft";
import { SensitiveDataGuidance } from "@/components/privacy/SensitiveDataGuidance";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  SectionBandCount,
  SectionBandHeading,
  sectionBandClass,
} from "@/components/shared/SectionBand";
import { Button } from "@/components/ui/button";
import {
  COACHING_FAZ6_QUERY_KEYS,
  COACHING_SESSION_QUERY_KEYS,
  extractCoachingErrorMessage,
  fetchCoachingProgram,
  fetchCoachingReports,
  fetchCoachingSessionAttachments,
  fetchCoachingSessionDetail,
  fetchTutorCoachingReportHistory,
  getPrimaryReportTiming,
  getReportPublishInvalidationKeys,
  publishCoachingReportRevision,
  publishInitialCoachingReport,
  type CoachingSessionReportRevision,
} from "@/lib/coachingApi";
import {
  REPORT_FIELD_RULES,
  REPORT_STEPS,
  reportChecklist,
  reportDeadlineNotice,
  reportStepStates,
  type ReportDeadlineNotice,
  type ReportStepKey,
} from "@/lib/coachingReportDraft";
import { coachingDateTimeLabel } from "@/lib/coachingTime";

const STEP_TITLES: Record<ReportStepKey, string> = {
  summary: "Özet",
  progress: "İlerleme",
  priorities: "Öncelikler",
  exam: "Sınav analizi",
  resources: "Kaynaklar",
  review: "Gözden geçir ve yayınla",
};

class DraftNotSavedError extends Error {}

function isIncident(status: string) {
  return ["student_no_show", "tutor_no_show", "technical_failure"].includes(status);
}

function DeadlineNotice({ notice }: { notice: ReportDeadlineNotice }) {
  if (notice.kind === "no_report") {
    return (
      <div role="status" className="rounded-card border border-line bg-surface p-4">
        <p className="text-body font-medium text-ink">{notice.title}</p>
        <p className="mt-1 text-small text-ink-mid">{notice.text}</p>
      </div>
    );
  }
  return (
    <section
      aria-label="Rapor süresi"
      className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-card border border-line bg-surface px-4 py-3"
    >
      <div>
        <p className="text-label text-ink-mid">{notice.caption}</p>
        <p className={`text-small font-medium tabular-nums ${notice.urgent ? "text-pink-deep" : "text-ink"}`}>
          {notice.value}
        </p>
      </div>
      {notice.text ? <p className="min-w-0 flex-1 basis-64 text-small text-ink">{notice.text}</p> : null}
    </section>
  );
}

/**
 * The tutor's report for one meeting: a list of steps beside the one that is
 * open, fields that keep their label and count their words, a draft that saves
 * itself, and a last step that shows what is missing and how the student will
 * see it. Once the report is out the page says so and offers a new version as a
 * separate step.
 */
export function CoachingReportWizard({
  sessionId,
  autosaveDelayMs,
}: {
  sessionId: string;
  /** Pause after the last keystroke before the draft is saved; tests shorten it. */
  autosaveDelayMs?: number;
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<ReportStepKey>("summary");
  const [mode, setMode] = useState<"edit" | "published" | null>(null);
  const [lastPublished, setLastPublished] = useState<CoachingSessionReportRevision | null>(null);
  const [justPublished, setJustPublished] = useState(false);
  const [changeNote, setChangeNote] = useState("");
  const [publishError, setPublishError] = useState<string | null>(null);

  const draft = useReportDraft(sessionId, autosaveDelayMs);
  const sessionQuery = useQuery({
    queryKey: COACHING_SESSION_QUERY_KEYS.detail(sessionId),
    queryFn: () => fetchCoachingSessionDetail(sessionId),
  });
  const reportListQuery = useQuery({
    queryKey: COACHING_FAZ6_QUERY_KEYS.tutorReportList(),
    queryFn: fetchCoachingReports,
  });
  const servicePeriodId = sessionQuery.data?.service_period_id;
  // §21.6: without a study program for the period the server wants a short
  // reason before the first report can be published.
  const programQuery = useQuery({
    queryKey: COACHING_FAZ6_QUERY_KEYS.program(servicePeriodId ?? "none"),
    queryFn: () => fetchCoachingProgram(servicePeriodId!),
    enabled: Boolean(servicePeriodId),
  });
  const attachmentsQuery = useQuery({
    queryKey: ["coaching-session-attachments", sessionId],
    queryFn: () => fetchCoachingSessionAttachments(sessionId),
  });
  const report = reportListQuery.data?.find((item) => item.session_id === sessionId) ?? null;
  const historyQuery = useQuery({
    queryKey: COACHING_FAZ6_QUERY_KEYS.reportHistory(report?.id ?? "none"),
    queryFn: () => fetchTutorCoachingReportHistory(report!.id),
    enabled: Boolean(report),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      // The last words first: publishing sends what the server holds.
      if (!(await draft.autosave.flush())) throw new DraftNotSavedError();
      return report?.latest_revision || lastPublished
        ? { revision: await publishCoachingReportRevision(report!.id, changeNote), initial: false }
        : { revision: await publishInitialCoachingReport(sessionId), initial: true };
    },
    onSuccess: ({ revision, initial }) => {
      const reportId = revision.report_id ?? report?.id ?? draft.reportId();
      const keys = reportId ? getReportPublishInvalidationKeys({ sessionId, reportId, initial }) : null;
      for (const key of keys ? Object.values(keys) : [COACHING_FAZ6_QUERY_KEYS.tutorReportList()]) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      setLastPublished(revision);
      setJustPublished(true);
      setChangeNote("");
      setPublishError(null);
      setMode("published");
    },
    onError: (error) =>
      setPublishError(
        error instanceof DraftNotSavedError
          ? "Taslak kaydedilemedi, bu yüzden yayınlanmadı. Kayıt durumunu kontrol et."
          : extractCoachingErrorMessage(error),
      ),
  });

  if (sessionQuery.isError || !sessionQuery.data) {
    if (sessionQuery.isLoading) return <Loading />;
    return (
      <CoachingLoadError
        message="Görüşme yüklenemedi."
        onRetry={() => sessionQuery.refetch()}
        isRetrying={sessionQuery.isFetching}
      />
    );
  }
  if (reportListQuery.isError) {
    return (
      <CoachingLoadError
        message="Raporlar yüklenemedi."
        onRetry={() => reportListQuery.refetch()}
        isRetrying={reportListQuery.isFetching}
      />
    );
  }
  if (draft.error) {
    return <CoachingLoadError message="Rapor taslağı yüklenemedi." onRetry={draft.retry} isRetrying={draft.isRetrying} />;
  }
  if (reportListQuery.isLoading || !draft.hydrated) return <Loading />;

  const session = sessionQuery.data;
  const notice = reportDeadlineNotice(getPrimaryReportTiming(session));
  if (isIncident(session.status)) {
    return (
      <div className="space-y-4">
        <DeadlineNotice notice={notice} />
        <CoachingAttachmentPanel sessionId={sessionId} />
      </div>
    );
  }

  const published = lastPublished ?? report?.latest_revision ?? null;
  // Master Spec §22.2: the draft opens as soon as the meeting is running, and
  // publishing stays gated to the end of it (the review step says so).
  const draftable = ["in_progress", "awaiting_report"].includes(session.status);
  if (!draftable && !published) {
    return (
      <div role="status" className="rounded-card border border-line bg-surface p-4">
        <p className="text-body font-medium text-ink">Rapor henüz açılamaz</p>
        <p className="mt-1 text-small text-ink-mid">Rapor taslağı görüşme başladığında açılır.</p>
      </div>
    );
  }

  const effectiveMode = mode ?? (published ? "published" : "edit");
  if (effectiveMode === "published" && published) {
    const revisions = historyQuery.data?.revisions ?? [published];
    return (
      <ReportPublishedState
        revision={published}
        justPublished={justPublished}
        history={revisions}
        onNewRevision={() => {
          setStep("summary");
          setJustPublished(false);
          setMode("edit");
        }}
      />
    );
  }

  const programMissing = programQuery.data === null;
  const checklist = reportChecklist({
    draft: draft.payload,
    examStatus: draft.exam.status,
    programMissing,
  });
  const states = reportStepStates({
    checklist,
    hasResources: draft.resources.some((resource) => resource.title.trim()),
    current: step,
  });
  const index = REPORT_STEPS.findIndex((item) => item.key === step);
  const previous = REPORT_STEPS[index - 1];
  const next = REPORT_STEPS[index + 1];
  const goTo = (target: ReportStepKey) => {
    void draft.autosave.flush();
    setStep(target);
  };
  const revising = Boolean(published);
  const meeting = `${session.student_name} · ${coachingDateTimeLabel(session.scheduled_start)} görüşmesi`;

  return (
    <div className="space-y-4">
      {!published ? <DeadlineNotice notice={notice} /> : null}
      <div className="grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <ReportStepRail states={states} onSelect={goTo} />
        </div>
        <section className="overflow-hidden rounded-card border border-line bg-surface">
          <div className={sectionBandClass("ink", "flex-wrap")}>
            <SectionBandHeading id="report-step-title" title={STEP_TITLES[step]} />
            <SectionBandCount tone="ink">{`Adım ${index + 1} / ${REPORT_STEPS.length}`}</SectionBandCount>
          </div>
          <div className="space-y-5 px-5 py-5 sm:px-6">
            <ReportStepProgress states={states} current={step} />
            {revising ? (
              <p className="text-small text-ink-mid">
                Yeni bir sürüm yazıyorsun. Son yayınlanan: sürüm {published?.revision_number}. Yayınlayana kadar öğrenci
                eski sürümü görür.
              </p>
            ) : null}
            {step === "summary" || step === "progress" || step === "priorities" ? (
              <>
                <SensitiveDataGuidance />
                <ReportFieldsStep
                  rules={REPORT_FIELD_RULES.filter((rule) => rule.step === step)}
                  values={draft.draft}
                  onChange={(field, value) => draft.setText(field, value)}
                />
              </>
            ) : null}
            {step === "exam" ? <ReportExamStep exam={draft.exam} onChange={draft.setExamField} /> : null}
            {step === "resources" ? (
              <ReportResourcesStep
                sessionId={sessionId}
                summary={draft.draft.program_changes_summary ?? ""}
                onSummary={(value) => draft.setText("program_changes_summary", value)}
                resources={draft.resources}
                attachments={attachmentsQuery.data ?? []}
                onChange={draft.setResources}
              />
            ) : null}
            {step === "review" ? (
              <ReportReviewStep
                checklist={checklist}
                onGoto={goTo}
                payload={draft.payload}
                meeting={meeting}
                revisionNumber={(published?.revision_number ?? 0) + 1}
                programMissing={programMissing}
                programHref={`/dashboard/tutor/coaching/service-periods/${servicePeriodId}/program`}
                noProgramReason={draft.draft.no_program_reason ?? ""}
                onNoProgramReason={(value) => draft.setText("no_program_reason", value)}
                revising={revising}
                changeNote={changeNote}
                onChangeNote={setChangeNote}
                sessionRunning={session.status !== "awaiting_report"}
                pending={publishMutation.isPending}
                error={publishError}
                onPublish={() => {
                  setPublishError(null);
                  publishMutation.mutate();
                }}
              />
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-line px-5 py-3 sm:px-6">
            <ReportSaveLine status={draft.autosave.status} onRetry={draft.autosave.retry} />
            <div className="flex items-center gap-4">
              <button
                type="button"
                disabled={!previous}
                onClick={() => previous && goTo(previous.key)}
                className="min-h-11 text-small font-medium text-ink underline underline-offset-4 disabled:cursor-not-allowed disabled:text-ink-mid disabled:no-underline"
              >
                Geri
              </button>
              {next ? (
                <Button type="button" variant="gold" className="min-h-11" onClick={() => goTo(next.key)}>
                  {`İleri: ${next.label}`}
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex min-h-48 items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
