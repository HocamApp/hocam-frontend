"use client";

import { CoachingConfirmDialog } from "@/components/coaching/CoachingConfirmDialog";
import {
  useCoachingIncidentReports,
  type CoachingIncidentReports,
} from "@/components/coaching/useCoachingIncidentReports";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * The two confirmations in front of a report that cannot be undone. Each one
 * says what closing the meeting means; nothing is sent until it is confirmed.
 */
export function CoachingIncidentDialogs({
  reports,
  noShowLabel,
}: {
  reports: CoachingIncidentReports;
  /** The no-show button's own words, when it is not the room panel's "Öğretmen gelmedi". */
  noShowLabel?: string;
}) {
  const label = noShowLabel ?? reports.otherPartyLabel;
  return (
    <>
      <CoachingConfirmDialog
        open={reports.pending === "no_show"}
        title={`"${label}" bildirilsin mi?`}
        description={`Görüşme bu bildirimle kapanır ve geri alınamaz. ${reports.consequence}`}
        confirmLabel="Bildir"
        isPending={reports.noShowPending}
        onCancel={() => reports.setPending(null)}
        onConfirm={reports.reportNoShow}
      />
      <CoachingConfirmDialog
        open={reports.pending === "technical"}
        title="Teknik sorun bildirilsin mi?"
        description="Görüşme teknik sorun olarak kapanır ve destek ekibi inceler. Bu işlem geri alınamaz."
        confirmLabel="Teknik sorunu bildir"
        isPending={reports.technicalPending}
        onCancel={() => reports.setPending(null)}
        onConfirm={reports.reportTechnical}
      />
    </>
  );
}

/**
 * Shared "bir sorun mu var?" controls (no-show / technical issue) for the live
 * session room panel. The screen after the meeting builds its own face on the
 * same `useCoachingIncidentReports`.
 */
export function CoachingIncidentActions({
  sessionId,
  viewerRole,
}: {
  sessionId: string;
  viewerRole: "student" | "tutor";
}) {
  const reports = useCoachingIncidentReports({ sessionId, viewerRole });

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Bir sorun mu var?</p>
      <Textarea
        className="min-h-20"
        value={reports.note}
        onChange={(event) => reports.setNote(event.target.value)}
        placeholder="Kısa not (isteğe bağlı)"
        aria-label="Sorun notu"
      />
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        disabled={reports.isPending}
        onClick={() => reports.setPending("no_show")}
      >
        {reports.otherPartyLabel}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        disabled={reports.isPending}
        onClick={() => reports.setPending("technical")}
      >
        Teknik sorun bildir
      </Button>
      <p className="text-xs text-ink-mid">{reports.consequence}</p>

      <CoachingIncidentDialogs reports={reports} />
    </div>
  );
}
