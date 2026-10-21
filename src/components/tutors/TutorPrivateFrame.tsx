"use client";

import type { ReactNode } from "react";

import { SectionBandCount, SectionBandHeading, sectionBandClass } from "@/components/shared/SectionBand";

export const TUTOR_PRIVATE_CAPTION = "Yalnızca sana görünür; öğrenciyle paylaşılmaz.";

/**
 * The frame the tutor's private notes and materials share: a card with an ink
 * band (the tutor's own record), the name, a count, and one line saying that
 * only the tutor sees it. The same two panels appear in the lesson room, on the
 * classroom page and on the coaching Hazırlan page. Where the row they sit in
 * already names them and says who sees them (Hazırlan), `bare` leaves the
 * content alone: no card, band or caption, so nothing is titled twice.
 */
export function TutorPrivateFrame({
  id,
  title,
  count,
  bare = false,
  compact = false,
  children,
}: {
  id: string;
  title: string;
  /** "3 not", "2 dosya"; left out while the list is loading or failed. */
  count?: string | null;
  bare?: boolean;
  /** The room's narrow side panel: tighter band and padding. */
  compact?: boolean;
  children: ReactNode;
}) {
  if (bare) return <div className="space-y-4">{children}</div>;
  return (
    <section aria-labelledby={`${id}-title`} className="overflow-hidden rounded-card border border-line bg-surface text-ink">
      <div className={sectionBandClass("ink", compact ? "flex-wrap px-4 py-3" : "flex-wrap")}>
        <SectionBandHeading id={`${id}-title`} title={title} />
        {count ? <SectionBandCount tone="ink">{count}</SectionBandCount> : null}
      </div>
      <div className={`space-y-4 pb-5 pt-4 ${compact ? "px-4" : "px-6"}`}>
        <p className="text-small text-ink-mid">{TUTOR_PRIVATE_CAPTION}</p>
        {children}
      </div>
    </section>
  );
}
