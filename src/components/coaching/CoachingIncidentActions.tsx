"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

/**
 * Shared "bir sorun mu var?" controls (no-show / technical issue) — used
 * both in the live session room panel and the post-session summary
 * screen, so the report-a-problem entry points stay a single call site
 * instead of drifting apart.
 */
export function CoachingIncidentActions({
  sessionId,
  viewerRole,
}: {
  sessionId: string;
  viewerRole: "student" | "tutor";
}) {
  const queryClient = useQueryClient();
  const [incidentNote, setIncidentNote] = useState("");

  const invalidateTerminalIncident = () => {
    queryClient.invalidateQueries({ queryKey: COACHING_SESSION_QUERY_KEYS.detail(sessionId) });
    queryClient.invalidateQueries({ queryKey: COACHING_SESSION_QUERY_KEYS.studentList() });
    queryClient.invalidateQueries({ queryKey: COACHING_SESSION_QUERY_KEYS.tutorList() });
    queryClient.invalidateQueries({ queryKey: COACHING_SESSION_QUERY_KEYS.token(sessionId) });
  };

  const noShowMutation = useMutation({
    mutationFn: (party: "student" | "tutor") => reportCoachingSessionNoShow(sessionId, party, incidentNote),
    onSuccess: () => {
      toast.success("Bildirim kaydedildi.");
      setIncidentNote("");
      invalidateTerminalIncident();
    },
    onError: (err) => toast.error(extractCoachingErrorMessage(err)),
  });

  const technicalIssueMutation = useMutation({
    mutationFn: () => reportCoachingSessionTechnicalIssue(sessionId, incidentNote),
    onSuccess: () => {
      toast.success("Teknik sorun bildirildi.");
      setIncidentNote("");
      invalidateTerminalIncident();
    },
    onError: (err) => toast.error(extractCoachingErrorMessage(err)),
  });

  const otherParty = viewerRole === "tutor" ? "student" : "tutor";
  const otherPartyLabel = NO_SHOW_PARTY_LABEL[otherParty];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Bir sorun mu var?</p>
      <Textarea
        className="min-h-20"
        value={incidentNote}
        onChange={(event) => setIncidentNote(event.target.value)}
        placeholder="Kısa incident notu (opsiyonel)"
        aria-label="Incident notu"
      />
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        disabled={noShowMutation.isPending}
        onClick={() => noShowMutation.mutate(otherParty)}
      >
        {otherPartyLabel}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        disabled={technicalIssueMutation.isPending}
        onClick={() => technicalIssueMutation.mutate()}
      >
        Teknik sorun bildir
      </Button>
      {viewerRole === "tutor" && (
        <p className="text-xs text-muted-foreground">{NO_SHOW_CONSUMED_COPY}</p>
      )}
      {viewerRole === "student" && (
        <p className="text-xs text-muted-foreground">{NO_SHOW_RIGHT_PRESERVED_COPY}</p>
      )}
    </div>
  );
}
