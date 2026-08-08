"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { CoachingGuard } from "@/components/coaching/CoachingGuard";
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
        </CardContent>
      </Card>

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
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Görüşmeye Hazırlan</h1>
        <PrepareContent sessionId={id} />
      </div>
    </CoachingGuard>
  );
}
