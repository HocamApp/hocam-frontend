"use client";

import { CoachingConfirmDialog } from "@/components/coaching/CoachingConfirmDialog";
import type { CoachingIncidentReports } from "@/components/coaching/useCoachingIncidentReports";

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
