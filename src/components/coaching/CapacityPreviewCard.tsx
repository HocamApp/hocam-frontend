"use client";

import { Users } from "@phosphor-icons/react";

import {
  SectionBandCount,
  SectionBandHeading,
  sectionBandClass,
} from "@/components/shared/SectionBand";
import type { CoachingCapacityDetail } from "@/lib/coachingApi";

/**
 * Capacity panel.
 *
 * `can_accept_new_student` is computed by the backend from published state,
 * the tutor's own intake preference, the student count, the theoretical
 * capacity, and the current price cap — so this card never re-derives it.
 *
 * These are the tutor's own numbers, so the band is ink; pink is kept for the
 * offer a student sees.
 */
export function CapacityPreviewCard({
  capacity,
}: {
  capacity: CoachingCapacityDetail;
}) {
  const safeTheoretical = Math.max(1, capacity.theoretical_capacity);
  const selectedPercent = Math.min(100, Math.round((capacity.max_active_students / safeTheoretical) * 100));
  const activePercent = Math.min(100, Math.round((capacity.active_students / safeTheoretical) * 100));

  return (
    <div
      role="region"
      aria-label="Koçluk kapasitesi"
      className="overflow-hidden rounded-card border border-line bg-surface"
    >
      <div className={sectionBandClass("ink")}>
        <SectionBandHeading id="coaching-capacity-title" title="Kapasite" />
        <SectionBandCount tone="ink">%{selectedPercent} seçili</SectionBandCount>
      </div>

      <div className="px-6 pb-6 pt-5">
        <p className="text-small leading-6 text-ink-mid">
          Koçluk için ayırdığın 30 dakikalık saatler, seçtiğin görüşme sıklığına göre en fazla kaç öğrenci alabileceğini belirler.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 text-small font-medium text-ink">
          <span className={`h-2 w-2 rounded-full ${capacity.can_accept_new_student ? "bg-success" : "bg-ink-mid"}`} />
          {capacity.can_accept_new_student
            ? "Yeni öğrenci alınabilir"
            : "Yeni öğrenci alımı kapalı"}
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CapacityValue value={`${capacity.weekly_slot_count} haftalık slot`} label="Müsaitliğinden oluşan" />
          <CapacityValue value={`${capacity.theoretical_capacity} öğrenci teorik sınırı`} label="Görüşme düzenine göre" />
          <CapacityValue value={`${capacity.max_active_students} öğrenci seçili kapasite`} label="Senin belirlediğin" />
          <CapacityValue value={`${capacity.active_students} aktif öğrenci`} label="Şu anda hizmet alan" />
        </dl>

        {capacity.theoretical_capacity > 0 ? (
          <div className="mt-5 space-y-4" aria-label="Kapasite kullanımı">
            <CapacityBar label="Seçili kapasite" percent={selectedPercent} className="bg-ink" />
            <CapacityBar label="Aktif öğrenci yükü" percent={activePercent} className="bg-pink" />
          </div>
        ) : null}
      </div>

      {capacity.weekly_slot_count === 0 ? (
        <div className="border-t border-line px-6 py-4">
          <p className="flex items-start gap-2 text-small text-ink-mid">
            <Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Koçluk müsaitliğin yok, bu yüzden kullanılabilir koçluk slotun da
            yok. Koçluk saatlerin normal ders saatlerinden ayrıdır.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function CapacityValue({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-input border border-line p-3">
      <dt className="text-label text-ink-mid">{label}</dt>
      <dd className="mt-1 font-bold tabular-nums text-ink">{value}</dd>
    </div>
  );
}

function CapacityBar({ label, percent, className }: { label: string; percent: number; className: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-label text-ink-mid">
        <span>{label}</span>
        <span className="tabular-nums">%{percent}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
