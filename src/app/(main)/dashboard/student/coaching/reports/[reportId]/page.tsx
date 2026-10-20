"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DownloadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";

import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { CoachingLoadingState } from "@/components/coaching/CoachingLoadingState";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { PublishedReportView } from "@/components/coaching/PublishedReportView";
import { ReportFeedbackCard } from "@/components/coaching/ReportFeedbackCard";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { Button } from "@/components/ui/button";
import { useCoachingMessagesHref } from "@/hooks/useCoachingMessagesHref";
import {
  COACHING_FAZ6_QUERY_KEYS,
  COACHING_SESSION_QUERY_KEYS,
  extractCoachingErrorMessage,
  fetchCoachingAttachmentDownloadUrl,
  fetchCoachingReport,
  fetchCoachingReportPdf,
  fetchCoachingSessions,
} from "@/lib/coachingApi";
import { studentReportHeading } from "@/lib/coachingStudentReports";

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function StudentReportDetail({ reportId }: { reportId: string }) {
  const reportQuery = useQuery({
    queryKey: COACHING_FAZ6_QUERY_KEYS.publishedReport(reportId),
    queryFn: () => fetchCoachingReport(reportId),
  });
  // Only to number the meeting; without it the head names the day.
  const sessionsQuery = useQuery({
    queryKey: COACHING_SESSION_QUERY_KEYS.studentList(),
    queryFn: fetchCoachingSessions,
  });
  const messagesHref = useCoachingMessagesHref();
  const pdfMutation = useMutation({
    mutationFn: () => fetchCoachingReportPdf(reportId),
    onSuccess: (pdf) => downloadBlob(pdf, "hocam-calisma-koclugu-raporu.pdf"),
    onError: (error) => toast.error(extractCoachingErrorMessage(error)),
  });
  const attachmentMutation = useMutation({
    mutationFn: fetchCoachingAttachmentDownloadUrl,
    onSuccess: ({ url }) => window.open(url, "_blank", "noopener,noreferrer"),
    onError: (error) => toast.error(extractCoachingErrorMessage(error)),
  });

  const revision = reportQuery.data;
  const sessions = sessionsQuery.data;
  const heading = useMemo(
    () =>
      revision
        ? studentReportHeading({
            sessionId: revision.session_id,
            scheduledStart: revision.scheduled_start,
            publishedAt: revision.published_at,
            revisionNumber: revision.revision_number,
            changeNote: revision.change_note,
            sessions: sessions ?? [],
          })
        : null,
    [revision, sessions],
  );

  if (reportQuery.isLoading) return <CoachingLoadingState rows={3} />;
  if (reportQuery.isError || !revision || !heading) {
    return (
      <CoachingLoadError
        message="Rapor yüklenemedi."
        onRetry={() => reportQuery.refetch()}
        isRetrying={reportQuery.isFetching}
      />
    );
  }
  return (
    <div className="space-y-4">
      <PublishedReportView
        revision={revision}
        heading={heading}
        action={
          <Button
            type="button"
            variant="gold"
            className="min-h-11"
            disabled={pdfMutation.isPending}
            onClick={() => pdfMutation.mutate()}
          >
            <DownloadSimple className="mr-2 h-4 w-4" /> PDF indir
          </Button>
        }
        onDownloadAttachment={(attachmentId) => attachmentMutation.mutate(attachmentId)}
      />
      <ReportFeedbackCard
        reportId={reportId}
        currentChoice={revision.student_feedback}
        messagesHref={messagesHref}
      />
    </div>
  );
}

export default function StudentCoachingReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  return (
    <RouteGuard requireAuth requireRole="student">
      <CoachingPageShell
        title="Görüşme raporu"
        width="narrow"
        currentHref="/dashboard/student/coaching/reports"
        audience="student"
      >
        <StudentReportDetail reportId={reportId} />
      </CoachingPageShell>
    </RouteGuard>
  );
}
