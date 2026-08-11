"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { PublishedReportView } from "@/components/coaching/PublishedReportView";
import { ReportFeedbackCard } from "@/components/coaching/ReportFeedbackCard";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  COACHING_FAZ6_QUERY_KEYS,
  extractCoachingErrorMessage,
  fetchCoachingAttachmentDownloadUrl,
  fetchCoachingReport,
  fetchCoachingReportPdf,
} from "@/lib/coachingApi";

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
  const reportQuery = useQuery({ queryKey: COACHING_FAZ6_QUERY_KEYS.publishedReport(reportId), queryFn: () => fetchCoachingReport(reportId) });
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
  if (reportQuery.isLoading) return <div className="flex min-h-48 items-center justify-center"><LoadingSpinner /></div>;
  if (reportQuery.isError || !reportQuery.data) return <ErrorMessage message={extractCoachingErrorMessage(reportQuery.error)} />;
  return <div className="space-y-4"><div className="flex justify-end"><Button variant="outline" disabled={pdfMutation.isPending} onClick={() => pdfMutation.mutate()}><Download className="mr-2 h-4 w-4" /> PDF indir</Button></div><PublishedReportView revision={reportQuery.data} onDownloadAttachment={(attachmentId) => attachmentMutation.mutate(attachmentId)} /><ReportFeedbackCard reportId={reportId} currentChoice={reportQuery.data.student_feedback} /></div>;
}

export default function StudentCoachingReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  return <RouteGuard requireAuth requireRole="student"><div className="mx-auto max-w-3xl px-4 py-8"><h1 className="mb-6 text-2xl font-semibold">Görüşme raporu</h1><StudentReportDetail reportId={reportId} /></div></RouteGuard>;
}
