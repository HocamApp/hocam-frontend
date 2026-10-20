"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRinging } from "@phosphor-icons/react";

import { CoachingRecordGuard } from "@/components/coaching/CoachingGuard";
import { CoachingEmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingInboxBoard } from "@/components/coaching/CoachingInboxBoard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import {
  extractCoachingErrorMessage,
  fetchAcceptanceRequests,
  fetchTutorCoachingRescheduleRequests,
  fetchTutorCoachingTimeRequests,
  proposeCoachingTime,
  respondToAcceptanceRequest,
  respondToCoachingRescheduleRequest,
} from "@/lib/coachingApi";
import { buildCoachingInbox } from "@/lib/coachingInbox";

function InboxContent() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // The same keys the overview, the tab badge and the other tutor pages use, so
  // one answer updates every place that shows it.
  const acceptanceQuery = useQuery({
    queryKey: ["tutor-acceptance-requests"],
    queryFn: fetchAcceptanceRequests,
  });
  const timeQuery = useQuery({
    queryKey: ["coaching-tutor-time-requests"],
    queryFn: fetchTutorCoachingTimeRequests,
  });
  const rescheduleQuery = useQuery({
    queryKey: ["coaching-tutor-reschedule-requests"],
    queryFn: fetchTutorCoachingRescheduleRequests,
  });

  const refreshAll = () => {
    setError(null);
    for (const queryKey of [
      ["tutor-acceptance-requests"],
      ["coaching-capacity"],
      ["coaching-tutor-time-requests"],
      ["coaching-tutor-reschedule-requests"],
      ["coaching-tutor-sessions"],
    ]) {
      queryClient.invalidateQueries({ queryKey });
    }
  };
  const onError = (mutationError: unknown) => setError(extractCoachingErrorMessage(mutationError));

  const respond = useMutation({ mutationFn: respondToAcceptanceRequest, onSuccess: refreshAll, onError });
  const propose = useMutation({
    mutationFn: (params: { id: string; dayOfWeek: number; startTime: string }) =>
      proposeCoachingTime(params.id, { dayOfWeek: params.dayOfWeek, startTime: params.startTime }),
    onSuccess: refreshAll,
    onError,
  });
  const reschedule = useMutation({
    mutationFn: (params: { id: string; decision: "approve" | "reject"; grantFree?: boolean }) =>
      respondToCoachingRescheduleRequest(params.id, {
        decision: params.decision,
        grantFree: params.grantFree,
      }),
    onSuccess: refreshAll,
    onError,
  });

  const queries = [acceptanceQuery, timeQuery, rescheduleQuery];
  // A source that failed is not an empty one: if any of the three did, the page
  // says so instead of leaving that kind out and looking caught up.
  const state = queries.some((query) => query.isLoading)
    ? "loading"
    : queries.some((query) => query.isError)
      ? "error"
      : "ready";

  const inbox = buildCoachingInbox({
    acceptanceRequests: acceptanceQuery.data ?? [],
    timeRequests: timeQuery.data ?? [],
    rescheduleRequests: rescheduleQuery.data ?? [],
    now: new Date(),
  });

  if (state === "ready" && inbox.pending.length === 0 && inbox.answered.length === 0) {
    return (
      <CoachingEmptyState
        icon={BellRinging}
        title="Henüz talebin yok"
        description="Bir öğrenci seni koçluk için seçtiğinde, uygun saat bulamadığında ya da bir görüşmenin saatini değiştirmek istediğinde talep burada görünür."
      />
    );
  }

  return (
    <CoachingInboxBoard
      pending={inbox.pending}
      answered={inbox.answered}
      state={state}
      onRetry={() => {
        for (const query of queries) if (query.isError) void query.refetch();
      }}
      isRetrying={queries.some((query) => query.isFetching) && state === "error"}
      actions={{
        busy: respond.isPending || propose.isPending || reschedule.isPending,
        error,
        onAccept: (id) => respond.mutate({ id, decision: "accept" }),
        onRejectAcceptance: (id, note) => respond.mutate({ id, decision: "reject", note }),
        onPropose: (id, dayOfWeek, startTime) => propose.mutate({ id, dayOfWeek, startTime }),
        onApprove: (id, grantFree) => reschedule.mutate({ id, decision: "approve", grantFree }),
        onRejectReschedule: (id) => reschedule.mutate({ id, decision: "reject" }),
      }}
    />
  );
}

export default function TutorCoachingRequestsPage() {
  return (
    <CoachingRecordGuard>
      <CoachingPageShell
        title="Talepler"
        width="wide"
        currentHref="/dashboard/tutor/coaching/requests"
        audience="tutor"
      >
        <InboxContent />
      </CoachingPageShell>
    </CoachingRecordGuard>
  );
}
