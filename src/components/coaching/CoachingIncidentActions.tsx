"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CoachingConfirmDialog } from "@/components/coaching/CoachingConfirmDialog";
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
  const [pendingAction, setPendingAction] = useState<"no_show" | "technical" | null>(null);

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
      setPendingAction(null);
      invalidateTerminalIncident();
    },
    onError: (err) => toast.error(extractCoachingErrorMessage(err)),
  });

  const technicalIssueMutation = useMutation({
    mutationFn: () => reportCoachingSessionTechnicalIssue(sessionId, incidentNote),
    onSuccess: () => {
      toast.success("Teknik sorun bildirildi.");
      setIncidentNote("");
      setPendingAction(null);
      invalidateTerminalIncident();
    },
    onError: (err) => toast.error(extractCoachingErrorMessage(err)),
  });

  const otherParty = viewerRole === "tutor" ? "student" : "tutor";
  const otherPartyLabel = NO_SHOW_PARTY_LABEL[otherParty];

  const isPending = noShowMutation.isPending || technicalIssueMutation.isPending;
  const consequence =
    viewerRole === "tutor" ? NO_SHOW_CONSUMED_COPY : NO_SHOW_RIGHT_PRESERVED_COPY;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Bir sorun mu var?</p>
      <Textarea
        className="min-h-20"
        value={incidentNote}
        onChange={(event) => setIncidentNote(event.target.value)}
        placeholder="Kısa not (isteğe bağlı)"
        aria-label="Sorun notu"
      />
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        disabled={isPending}
        onClick={() => setPendingAction("no_show")}
      >
        {otherPartyLabel}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        disabled={isPending}
        onClick={() => setPendingAction("technical")}
      >
        Teknik sorun bildir
      </Button>
      <p className="text-xs text-muted-foreground">{consequence}</p>

      <CoachingConfirmDialog
        open={pendingAction === "no_show"}
        title={`"${otherPartyLabel}" bildirilsin mi?`}
        description={`Görüşme bu bildirimle kapanır ve geri alınamaz. ${consequence}`}
        confirmLabel="Bildir"
        isPending={noShowMutation.isPending}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => noShowMutation.mutate(otherParty)}
      />
      <CoachingConfirmDialog
        open={pendingAction === "technical"}
        title="Teknik sorun bildirilsin mi?"
        description="Görüşme teknik sorun olarak kapanır ve destek ekibi inceler. Bu işlem geri alınamaz."
        confirmLabel="Teknik sorunu bildir"
        isPending={technicalIssueMutation.isPending}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => technicalIssueMutation.mutate()}
      />
    </div>
  );
}
