import type { ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionBandHeading, sectionBandClass } from "@/components/shared/SectionBand";
import { COACHING_HOW_IT_WORKS } from "@/lib/coachingApi";
import { formatTryMinor } from "@/lib/money";

const INCLUDED = [
  "Çalışma programı",
  "Deneme değerlendirmesi",
  "İlerleme raporu",
  "Kaynak önerileri",
  "Mesajlara 24 saat içinde yanıt",
];

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
 * (capacity, earnings) wear the ink band. The price is a flat gold pill on it,
 * the one gold-on-pink pairing DESIGN.md allows at badge scale. It sits in a
 * column next to the profile's booking card and in a half-width preview, so
 * nothing here switches layout on the viewport: the facts and the list wrap by
 * what fits.
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
          className="inline-flex shrink-0 items-baseline gap-1.5 rounded-pill bg-gold px-4 py-1 tabular-nums text-gold-ink"
        >
          {offer.isFree ? (
            <span className="text-small font-bold">Ders paketinle ücretsiz</span>
          ) : (
            <>
              <span className="text-small font-bold">{formatTryMinor(offer.priceMinor)}</span>
              <span className="text-label font-medium">görüşme başına</span>
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

        <dl className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-x-4 gap-y-3 border-y border-line py-3">
          <div>
            <dt className="text-label text-ink-mid">Sıklık</dt>
            <dd className="mt-0.5 text-body font-medium text-ink">{offer.frequencyLabel}</dd>
          </div>
          <div>
            <dt className="text-label text-ink-mid">Süre</dt>
            <dd className="mt-0.5 text-body font-medium text-ink">
              {offer.sessionDurationMinutes} dakika
            </dd>
          </div>
          {offer.examTypes.length ? (
            <div>
              <dt className="text-label text-ink-mid">Sınav odağı</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {offer.examTypes.map((exam) => (
                  <span
                    key={exam}
                    className="inline-flex items-center rounded-pill border border-ink px-3 py-0.5 text-label text-ink"
                  >
                    {exam}
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>

        <p className="mt-5 text-label text-ink-mid">Koçluğa dahil</p>
        <ul className="mt-1 grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-x-6">
          {INCLUDED.map((item) => (
            <li key={item} className="border-t border-line py-2.5 text-small text-ink">
              {item}
            </li>
          ))}
        </ul>

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
