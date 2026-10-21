"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { CoachingRecordGuard as CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingAttachmentPanel } from "@/components/coaching/CoachingAttachmentPanel";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import {
  PrepareAttention,
  PrepareDisclosure,
  PrepareHeader,
  PreviousReportCard,
  PrepareProgramCard,
} from "@/components/coaching/PrepareParts";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { TutorLearningPlans } from "@/components/learning/TutorLearningPlans";
import { TutorStudentMaterials } from "@/components/tutors/TutorStudentMaterials";
import { TutorStudentNotes } from "@/components/tutors/TutorStudentNotes";
import { useServerNow } from "@/hooks/useServerNow";
import {
  COACHING_FAZ6_QUERY_KEYS,
  COACHING_SESSION_QUERY_KEYS,
  fetchCoachingProgram,
  fetchCoachingReports,
  fetchCoachingSessionAttachments,
  fetchCoachingSessionDetail,
  fetchCoachingStudents,
  fetchTutorCoachingSessions,
} from "@/lib/coachingApi";
import { istanbulDateKey } from "@/lib/coachingOverview";
import {
  findPreviousReport,
  prepareAttention,
  prepareHeadline,
  programSummary,
} from "@/lib/coachingPrepare";
import { coachingTutorJoin } from "@/lib/coachingSessions";
import { fetchTutorStudentMaterials, fetchTutorStudentNotes } from "@/lib/notificationsApi";
import { fetchCoachingPurchaseConversation } from "@/lib/messagingApi";

const FILES_ROW = "paylasilan-dosyalar";

function CardPlaceholder() {
  return <div aria-busy="true" className="h-40 animate-pulse rounded-card bg-skeleton" />;
}

function PrepareContent({ sessionId }: { sessionId: string }) {
  const now = useServerNow();
  const today = istanbulDateKey(now);
  const [filesOpen, setFilesOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(false);

  const detailQuery = useQuery({
    queryKey: COACHING_SESSION_QUERY_KEYS.detail(sessionId),
    queryFn: () => fetchCoachingSessionDetail(sessionId),
  });
  const detail = detailQuery.data;
  const periodId = detail?.service_period_id;
  const studentId = detail?.student_id;

  const sessionsQuery = useQuery({
    queryKey: COACHING_SESSION_QUERY_KEYS.tutorList(),
    queryFn: fetchTutorCoachingSessions,
    staleTime: 60_000,
  });
  const reportsQuery = useQuery({
    queryKey: COACHING_FAZ6_QUERY_KEYS.tutorReportList(),
    queryFn: fetchCoachingReports,
    staleTime: 60_000,
  });
  const programQuery = useQuery({
    queryKey: COACHING_FAZ6_QUERY_KEYS.program(periodId ?? "none"),
    queryFn: () => fetchCoachingProgram(periodId!),
    enabled: Boolean(periodId),
  });
  const attachmentsQuery = useQuery({
    queryKey: ["coaching-session-attachments", sessionId],
    queryFn: () => fetchCoachingSessionAttachments(sessionId),
  });
  const studentsQuery = useQuery({
    queryKey: ["coaching-tutor-students"],
    queryFn: fetchCoachingStudents,
    staleTime: 60_000,
  });
  const purchaseId = studentsQuery.data?.find((row) => row.service_period_id === periodId)?.purchase_id;
  const conversationQuery = useQuery({
    queryKey: ["coaching-purchase-conversation", purchaseId],
    queryFn: () => fetchCoachingPurchaseConversation(purchaseId!),
    enabled: Boolean(purchaseId),
    staleTime: 10 * 60_000,
  });
  const notesQuery = useQuery({
    queryKey: ["tutor-student-notes", studentId],
    queryFn: () => fetchTutorStudentNotes(studentId!),
    enabled: Boolean(studentId),
  });
  const materialsQuery = useQuery({
    queryKey: ["tutor-student-materials", studentId],
    queryFn: () => fetchTutorStudentMaterials(studentId!),
    enabled: Boolean(studentId),
  });

  // "Dosyalara bak" opens the row and brings it into view.
  useEffect(() => {
    if (filesOpen) document.getElementById(FILES_ROW)?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [filesOpen]);

  if (detailQuery.isLoading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  if (detailQuery.isError || !detail) {
    return (
      <CoachingLoadError
        message="Görüşme yüklenemedi."
        onRetry={() => detailQuery.refetch()}
        isRetrying={detailQuery.isFetching}
      />
    );
  }

  const programHref = `/dashboard/tutor/coaching/service-periods/${periodId}/program`;
  const previous =
    sessionsQuery.data && reportsQuery.data
      ? findPreviousReport({ session: detail, sessions: sessionsQuery.data, reports: reportsQuery.data })
      : null;
  const previousStart = previous && previous.kind !== "none" ? previous.scheduledStart : null;
  const program = programQuery.isSuccess ? programQuery.data : undefined;
  const messagesHref = conversationQuery.data?.id ? `/messages/${conversationQuery.data.id}` : null;
  const attention = prepareAttention({
    studentName: detail.student_name,
    feedback: detail.previous_report_feedback,
    program,
    attachments: attachmentsQuery.data ?? [],
    previousStart,
    today,
    messagesHref,
    programHref,
  });
  const firstName = detail.student_name?.trim().split(/\s+/)[0] || "Öğrenci";
  const count = (query: { isLoading: boolean; isError: boolean; data?: unknown[] }, unit: string) =>
    query.isError ? "yüklenemedi" : query.isLoading || !query.data ? "…" : `${query.data.length} ${unit}`;

  return (
    <div className="space-y-4">
      <PrepareHeader
        studentName={detail.student_name || "Öğrenci"}
        headline={prepareHeadline(detail)}
        join={coachingTutorJoin(detail, now)}
        status={detail.status}
        reportHref={`/dashboard/tutor/coaching/sessions/${sessionId}/report`}
      />

      <PrepareAttention items={attention} onShowFiles={() => setFilesOpen(true)} />

      <div className="grid gap-4 lg:grid-cols-2">
        {sessionsQuery.isError || reportsQuery.isError ? (
          <CoachingLoadError
            message="Geçen görüşme yüklenemedi."
            onRetry={() => {
              void sessionsQuery.refetch();
              void reportsQuery.refetch();
            }}
            isRetrying={sessionsQuery.isFetching || reportsQuery.isFetching}
          />
        ) : previous ? (
          <PreviousReportCard previous={previous} feedback={detail.previous_report_feedback} />
        ) : (
          <CardPlaceholder />
        )}
        {programQuery.isError ? (
          <CoachingLoadError
            message="Program yüklenemedi."
            onRetry={() => programQuery.refetch()}
            isRetrying={programQuery.isFetching}
          />
        ) : programQuery.isSuccess ? (
          <PrepareProgramCard summary={programSummary(programQuery.data)} today={today} programHref={programHref} />
        ) : (
          <CardPlaceholder />
        )}
      </div>

      <section aria-label="Dosyalar ve notlar" className="overflow-hidden rounded-card border border-line bg-surface">
        <PrepareDisclosure
          id={FILES_ROW}
          title={`${firstName} ile paylaşılan dosyalar`}
          count={count(attachmentsQuery, "dosya")}
          open={filesOpen}
          onToggle={() => setFilesOpen((value) => !value)}
        >
          <CoachingAttachmentPanel
            sessionId={sessionId}
            viewerRole="tutor"
            otherName={detail.student_name}
            heading={null}
          />
        </PrepareDisclosure>
        {studentId ? (
          <>
            <PrepareDisclosure
              id="ozel-notlarim"
              title="Özel notlarım"
              caption="yalnız sana görünür"
              count={count(notesQuery, "not")}
              open={notesOpen}
              onToggle={() => setNotesOpen((value) => !value)}
            >
              <div className="space-y-3">
                {process.env.NEXT_PUBLIC_LEARNING_PLANS_ENABLED === "true" ? (
                  <TutorLearningPlans studentId={studentId} />
                ) : null}
                <TutorStudentNotes studentId={studentId} bare />
              </div>
            </PrepareDisclosure>
            <PrepareDisclosure
              id="materyallerim"
              title="Materyallerim"
              caption="yalnız sana görünür"
              count={count(materialsQuery, "dosya")}
              open={materialsOpen}
              onToggle={() => setMaterialsOpen((value) => !value)}
            >
              <TutorStudentMaterials studentId={studentId} bare />
            </PrepareDisclosure>
          </>
        ) : null}
      </section>
    </div>
  );
}

export default function TutorCoachingPreparePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <CoachingGuard>
      <CoachingPageShell title="Görüşmeye hazırlan" width="wide" currentHref="/dashboard/tutor/coaching/sessions/prepare" audience="tutor"><PrepareContent sessionId={id} /></CoachingPageShell>
    </CoachingGuard>
  );
}
