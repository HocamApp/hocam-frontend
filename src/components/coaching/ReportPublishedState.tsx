"use client";

import Link from "next/link";

import {
  SectionBandCount,
  SectionBandHeading,
  sectionBandClass,
} from "@/components/shared/SectionBand";
import { Button } from "@/components/ui/button";
import type { CoachingSessionReportRevision } from "@/lib/coachingApi";
import { coachingDateTimeLabel } from "@/lib/coachingTime";

/**
 * What the tutor sees once the report is out: that it is, which version, and
 * the way back to the records. Correcting it is a deliberate second step (a
 * new version the student is told about), never an open form by default.
 */
export function ReportPublishedState({
  revision,
  justPublished,
  onNewRevision,
  history,
}: {
  revision: CoachingSessionReportRevision;
  justPublished: boolean;
  onNewRevision: () => void;
  history: readonly CoachingSessionReportRevision[];
}) {
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-card border border-line bg-surface">
        <div className={sectionBandClass("ink", "flex-wrap")}>
          <SectionBandHeading
            id="report-published-title"
            title="Rapor yayınlandı"
            subtitle={`Sürüm ${revision.revision_number} · ${coachingDateTimeLabel(revision.published_at)}`}
          />
          <SectionBandCount tone="ink">{`Sürüm ${revision.revision_number}`}</SectionBandCount>
        </div>
        <div className="space-y-4 px-6 py-5">
          <p className="text-body text-ink">
            {justPublished ? "Öğrenciye bildirildi." : "Öğrenci yalnız en son yayınlanan sürümü görür."}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Button asChild variant="gold" className="min-h-11">
              <Link href="/dashboard/tutor/coaching/reports">Kayıtlar&apos;a dön</Link>
            </Button>
            <button
              type="button"
              onClick={onNewRevision}
              className="min-h-11 text-small font-medium text-ink underline underline-offset-4"
            >
              Yeni sürüm yaz
            </button>
          </div>
        </div>
      </section>

      {history.length > 0 ? (
        <section className="overflow-hidden rounded-card border border-line bg-surface">
          <div className={sectionBandClass("ink", "flex-wrap")}>
            <SectionBandHeading id="report-history-title" title="Yayın geçmişi" />
            <SectionBandCount tone="ink">{history.length}</SectionBandCount>
          </div>
          <ol className="divide-y divide-line">
            {history.map((item) => (
              <li key={item.id} className="px-6 py-3 text-small text-ink">
                <span className="font-medium tabular-nums">Sürüm {item.revision_number}</span>
                {" · "}
                <span className="tabular-nums">{coachingDateTimeLabel(item.published_at)}</span>
                {item.change_note ? <span className="block text-ink-mid">{item.change_note}</span> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
