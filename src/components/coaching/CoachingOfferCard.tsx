import type { ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionBandHeading, sectionBandClass } from "@/components/shared/SectionBand";
import { COACHING_HOW_IT_WORKS, COACHING_INCLUDED } from "@/lib/coachingApi";
import { formatTryMinor } from "@/lib/money";

export type CoachingOfferView = {
  frequencyLabel: string;
  sessionDurationMinutes: number;
  priceMinor: number;
  isFree: boolean;
  examTypes: string[];
  description: string;
  capacityAvailable: boolean;
};

/**
 * The coaching offer as a student reads it, on a tutor's public profile and in
 * the tutor's own preview of it.
 *
 * Pink band, because this is the thing on offer; the tutor's private numbers
 * (capacity, earnings) wear the ink band. The price is set large in white on
 * the band, like the price on the booking card beside it: white on pink is
 * 4.05:1, which passes as large bold text, and gold would be text (DESIGN.md
 * §1: gold is a surface only). It sits in a column next to that booking card
 * and in a half-width preview, so nothing here switches layout on the
 * viewport: the facts and the list wrap by what fits.
 *
 * No `cn()` below: tailwind-merge reads named sizes such as `text-label` as
 * colours and drops one of the two.
 */
export function CoachingOfferCard({
  offer,
  action,
  statusMessage,
  showHowItWorks = false,
}: {
  offer: CoachingOfferView;
  action?: ReactNode;
  statusMessage?: string | null;
  showHowItWorks?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className={sectionBandClass("pink", "flex-wrap gap-y-3")}>
        <SectionBandHeading
          id="coaching-offer-title"
          title="Çalışma Koçluğu"
          subtitle="Ders paketine ek hizmet"
        />
        <div
          role="region"
          aria-label="Koçluk ücret özeti"
          className="flex shrink-0 flex-wrap items-baseline gap-x-2 tabular-nums"
        >
          {offer.isFree ? (
            <span className="text-h3-m font-bold md:text-h3 md:font-bold">Ders paketinle ücretsiz</span>
          ) : (
            <>
              <span className="text-h2-m font-bold md:text-h2">{formatTryMinor(offer.priceMinor)}</span>
              <span className="text-small">görüşme başına</span>
            </>
          )}
        </div>
      </div>

      <div className="px-6 pb-6 pt-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="text-h3-m font-bold text-ink md:text-h3 md:font-bold">
            Planlı çalış, ilerlemeni görünür kıl
          </h3>
          {!offer.capacityAvailable ? (
            <span className="inline-flex items-center rounded-pill border border-ink px-3 py-0.5 text-label text-ink">
              Kontenjan dolu
            </span>
          ) : null}
        </div>
        {offer.description ? (
          <p className="mt-2 text-small leading-6 text-ink-mid">{offer.description}</p>
        ) : null}

        <dl className="mt-5 flex flex-wrap gap-3">
          <div className="flex-auto rounded-input border border-line bg-paper px-4 py-3">
            <dt className="text-label text-ink-mid">Sıklık</dt>
            <dd className="mt-0.5 text-body font-bold text-ink">{offer.frequencyLabel}</dd>
          </div>
          <div className="flex-auto rounded-input border border-line bg-paper px-4 py-3">
            <dt className="text-label text-ink-mid">Süre</dt>
            <dd className="mt-0.5 text-body font-bold text-ink">{offer.sessionDurationMinutes} dakika</dd>
          </div>
          {offer.examTypes.length ? (
            <div className="flex-auto rounded-input border border-line bg-paper px-4 py-3">
              <dt className="text-label text-ink-mid">Sınav odağı</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {offer.examTypes.map((exam) => (
                  <span
                    key={exam}
                    className="inline-flex items-center rounded-pill border border-ink px-3 py-0.5 text-label font-medium text-ink"
                  >
                    {exam}
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-4 rounded-input border border-line p-4">
          <p className="text-label font-bold uppercase tracking-[0.08em] text-ink">Koçluğa dahil</p>
          <ul className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-x-6 gap-y-2">
            {COACHING_INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-3 text-body text-ink">
                {/* A short rule, not an em dash character: DESIGN.md bans the dash in copy. */}
                <span aria-hidden="true" className="mt-[0.8em] h-px w-3 shrink-0 bg-ink" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {statusMessage ? (
          <p className="mt-5 rounded-input border border-line p-3 text-small text-ink-mid">
            {statusMessage}
          </p>
        ) : null}
        <p className="mt-4 text-label leading-5 text-ink-mid">
          Koçluk yalnız ders paketiyle birlikte alınır. Talebin öğretmene ders paketi ve koçluk hizmeti birlikte iletilir; kabul edilmeden başlamaz.
        </p>
        {action ? <div className="mt-5">{action}</div> : null}

        {showHowItWorks ? (
          <Accordion type="single" collapsible className="mt-4 border-t border-line">
            <AccordionItem value="how" className="border-b-0">
              <AccordionTrigger className="text-small">Koçluk nasıl çalışır?</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-small text-ink-mid">
                  {COACHING_HOW_IT_WORKS.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span aria-hidden>·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : null}
      </div>
    </div>
  );
}
