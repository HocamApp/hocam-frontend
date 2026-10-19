"use client";

import { SectionBandHeading, sectionBandClass } from "@/components/shared/SectionBand";
import type { CoachingCapacityDetail } from "@/lib/coachingApi";

/**
 * Capacity panel.
 *
 * `can_accept_new_student` is computed by the backend from published state,
 * the tutor's own intake preference, the student count, the theoretical
 * capacity, and the current price cap — so this card never re-derives it.
 *
 * These are the tutor's own numbers, so the band is ink; pink is kept for the
 * offer a student sees. Each of the four figures is a number with one plain
 * sentence under it: the earlier labels ("teorik sınır", "seçili kapasite",
 * "slot") were the backend's vocabulary and meant nothing to a tutor.
 *
 * Plain class strings: tailwind-merge would drop a named size such as
 * `text-h2-m` next to a text colour.
 */
export function CapacityPreviewCard({
  capacity,
}: {
  capacity: CoachingCapacityDetail;
}) {
  return (
    <div
      role="region"
      aria-label="Koçluk kapasitesi"
      className="overflow-hidden rounded-card border border-line bg-surface"
    >
      <div className={sectionBandClass("ink", "flex-wrap gap-y-3")}>
        <SectionBandHeading id="coaching-capacity-title" title="Koçluk kapasiten" />
        <span className="inline-flex items-center rounded-pill border border-paper px-3 py-0.5 text-label text-paper">
          {capacity.can_accept_new_student
            ? "Yeni öğrenci alınabilir"
            : "Yeni öğrenci alımı kapalı"}
        </span>
      </div>

      <div className="px-6 pb-6 pt-5">
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-3">
          <CapacityNumber value={capacity.weekly_slot_count} caption="haftalık görüşme yeri açtın" />
          <CapacityNumber value={capacity.theoretical_capacity} caption="öğrenciye kadar alabilirsin (üst sınır)" />
          <CapacityNumber value={capacity.max_active_students} caption="öğrenciyle sınırladın" />
          <CapacityNumber value={capacity.active_students} caption="öğrenciyle şu an çalışıyorsun" />
        </ul>
        <p className="mt-4 text-label leading-5 text-ink-mid">
          Üst sınır, açtığın görüşme yerlerinden ve seçtiğin görüşme sıklığından hesaplanır.
        </p>
      </div>

      {capacity.weekly_slot_count === 0 ? (
        <div className="border-t border-line px-6 py-4">
          <p className="text-small text-ink-mid">
            Henüz koçluk saati eklemedin, bu yüzden hiç görüşme yerin yok. Koçluk saatlerin normal ders saatlerinden ayrıdır.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function CapacityNumber({ value, caption }: { value: number; caption: string }) {
  return (
    <li className="rounded-input border border-line p-4">
      <p className="text-h2-m font-bold tabular-nums text-ink md:text-h2">{value}</p>
      <p className="mt-1 text-small leading-5 text-ink-mid">{caption}</p>
    </li>
  );
}
