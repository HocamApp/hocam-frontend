"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  NO_SHOW_CONSUMED_COPY,
  NO_SHOW_PARTY_LABEL,
  NO_SHOW_RIGHT_PRESERVED_COPY,
} from "@/lib/coachingSessionCopy";
import {
  reportCoachingSessionNoShow,
  reportCoachingSessionTechnicalIssue,
  extractCoachingErrorMessage,
  COACHING_SESSION_QUERY_KEYS,
} from "@/lib/coachingApi";

export type CoachingIncidentAction = "no_show" | "technical";

/**
 * The two "bir sorun mu var?" reports of a coaching meeting (the other side did
 * not come, a technical failure): the note, the two requests, which one waits for
 * its confirmation. Shared by the room panel and the screen after the meeting, so
 * the report-a-problem entry points stay one call site instead of drifting apart.
 */
export function useCoachingIncidentReports({
  sessionId,
  viewerRole,
}: {
  sessionId: string;
  viewerRole: "student" | "tutor";
}) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<CoachingIncidentAction | null>(null);

  const invalidateTerminalIncident = () => {
    queryClient.invalidateQueries({ queryKey: COACHING_SESSION_QUERY_KEYS.detail(sessionId) });
    queryClient.invalidateQueries({ queryKey: COACHING_SESSION_QUERY_KEYS.studentList() });
    queryClient.invalidateQueries({ queryKey: COACHING_SESSION_QUERY_KEYS.tutorList() });
    queryClient.invalidateQueries({ queryKey: COACHING_SESSION_QUERY_KEYS.token(sessionId) });
  };

  const otherParty = viewerRole === "tutor" ? "student" : "tutor";

  const noShowMutation = useMutation({
    mutationFn: (party: "student" | "tutor") => reportCoachingSessionNoShow(sessionId, party, note),
    onSuccess: () => {
      toast.success("Bildirim kaydedildi.");
      setNote("");
      setPending(null);
      invalidateTerminalIncident();
    },
    onError: (err) => toast.error(extractCoachingErrorMessage(err)),
  });

  const technicalIssueMutation = useMutation({
    mutationFn: () => reportCoachingSessionTechnicalIssue(sessionId, note),
    onSuccess: () => {
      toast.success("Teknik sorun bildirildi.");
      setNote("");
      setPending(null);
      invalidateTerminalIncident();
    },
    onError: (err) => toast.error(extractCoachingErrorMessage(err)),
  });

  return {
    note,
    setNote,
    pending,
    setPending,
    otherParty,
    otherPartyLabel: NO_SHOW_PARTY_LABEL[otherParty],
    consequence: viewerRole === "tutor" ? NO_SHOW_CONSUMED_COPY : NO_SHOW_RIGHT_PRESERVED_COPY,
    isPending: noShowMutation.isPending || technicalIssueMutation.isPending,
    noShowPending: noShowMutation.isPending,
    technicalPending: technicalIssueMutation.isPending,
    reportNoShow: () => noShowMutation.mutate(otherParty),
    reportTechnical: () => technicalIssueMutation.mutate(),
  };
}

export type CoachingIncidentReports = ReturnType<typeof useCoachingIncidentReports>;
