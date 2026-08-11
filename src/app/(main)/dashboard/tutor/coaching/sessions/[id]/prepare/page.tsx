"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CoachingAttachmentPanel } from "@/components/coaching/CoachingAttachmentPanel";
import { TutorStudentPrivateWorkspace } from "@/components/tutors/TutorStudentPrivateWorkspace";
import { formatDate } from "@/lib/utils";
import {
  fetchCoachingSessionDetail,
  extractCoachingErrorMessage,
  REPORT_FEEDBACK_LABELS,
} from "@/lib/coachingApi";

const JOINABLE_STATUSES = new Set(["scheduled", "in_progress"]);

function PrepareContent({ sessionId }: { sessionId: string }) {
  const { data: detail, isLoading, isError, error } = useQuery({
    queryKey: ["coaching-session-detail", sessionId],
    queryFn: () => fetchCoachingSessionDetail(sessionId),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !detail) {
    return <ErrorMessage message={extractCoachingErrorMessage(error)} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="text-lg font-semibold">{detail.student_name}</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(detail.scheduled_start)} · {detail.scheduled_local_time.slice(0, 5)}
            </p>
          </div>
          {JOINABLE_STATUSES.has(detail.status) && (
            <Button asChild>
              <Link href={`/session/coaching/${sessionId}`}>Görüşmeye katıl</Link>
            </Button>
          )}
          {detail.status === "awaiting_report" ? (
            <Button asChild>
              <Link href={`/dashboard/tutor/coaching/sessions/${sessionId}/report`}>
                Raporu hazırla
              </Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {detail.previous_report_feedback && (
        <Card>
          <CardContent className="py-4 text-sm">
            <p className="font-medium">Öğrencinin son rapor geri bildirimi</p>
            <p className="mt-1 text-muted-foreground">
              {REPORT_FEEDBACK_LABELS[detail.previous_report_feedback]}
            </p>
          </CardContent>
        </Card>
      )}

      <CoachingAttachmentPanel sessionId={sessionId} />

      {detail.student_id ? (
        <TutorStudentPrivateWorkspace studentId={detail.student_id} />
      ) : null}
    </div>
  );
}

export default function TutorCoachingPreparePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <CoachingGuard>
      <CoachingPageShell title="Görüşmeye hazırlan" description="Öğrencinin önceki geri bildirimini, paylaşılan dosyaları ve özel çalışma alanını görüşme öncesinde gözden geçir." parentHref="/dashboard/tutor/coaching/upcoming" parentLabel="Yaklaşan görüşmeler" eyebrow="Görüşme" width="narrow"><PrepareContent sessionId={id} /></CoachingPageShell>
    </CoachingGuard>
  );
}
