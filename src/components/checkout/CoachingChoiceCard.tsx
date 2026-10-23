"use client";

import { SectionBandCount, SectionBandHeading, sectionBandClass } from "@/components/shared/SectionBand";
import { Button } from "@/components/ui/button";
import { coachingMeetingPrice } from "@/lib/coachingCheckoutStep";
import {
  COACHING_INCLUDED,
  coachingFrequencyLabel,
  type CoachingEligibility,
} from "@/lib/coachingApi";

/**
 * The coaching add-on on the checkout step: one offer card, the way the
 * profile shows the offer. A pink band (what is on offer), the list of what is
 * included on the left, the price per meeting and the one button on the right.
 *
 * Never pre-selected, not even when it is free (master spec §13.4): the
 * student adds it, and the same button takes it back. A chosen card is framed
 * in ink and says "Seçili" in the band, flat gold on pink as the badge pairing
 * DESIGN.md §1 allows.
 *
 * Colours come from the global tokens. This route lives in the (main) group,
 * where the `--checkout-*` variables the old card read are not loaded, so the
 * card had transparent surfaces and borders in the text colour.
 *
 * No `cn()` here: tailwind-merge reads the named sizes (`text-label`,
 * `text-small`) as colours and drops one of the two.
 */
export function CoachingChoiceCard({
  eligibility,
  selected,
  onToggle,
}: {
  eligibility: CoachingEligibility;
  selected: boolean;
  onToggle: () => void;
}) {
  const plan = eligibility.plan;
  if (!plan) return null;

  const disabled = !eligibility.eligible;
  const meta = `${coachingFrequencyLabel(plan.frequency)} · ${plan.session_duration_minutes} dk`;

  return (
    <section
      aria-labelledby="coaching-choice-title"
      data-selected={selected ? "true" : "false"}
      className={`overflow-hidden rounded-card bg-surface text-ink ${
        selected ? "border-2 border-ink" : "border border-line"
      }`}
    >
      <div className={sectionBandClass("pink", "flex-wrap gap-y-2")}>
        <SectionBandHeading id="coaching-choice-title" title="Çalışma Koçluğu" />
        {selected ? (
          <SectionBandCount tone="pink">Seçili</SectionBandCount>
        ) : disabled ? (
          <span className="text-small">Şu anda seçilemez</span>
        ) : (
          <span className="text-small">{meta}</span>
        )}
      </div>

      {disabled ? (
        <p className="px-6 py-5 text-small leading-6 text-ink-mid">{eligibility.message}</p>
      ) : (
        <div className="grid gap-5 px-6 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-8">
          <div className="min-w-0">
            <ul className="divide-y divide-line">
              {COACHING_INCLUDED.map((item) => (
                <li key={item} className="py-2 text-body text-ink first:pt-0 last:pb-0">
                  {item}
                </li>
              ))}
            </ul>
            {plan.description ? (
              <p className="mt-4 text-small leading-6 text-ink-mid">{plan.description}</p>
            ) : null}
          </div>

          <div className="sm:min-w-[12rem] sm:text-right">
            {plan.is_free ? (
              <>
                <p className="text-[1.75rem] font-medium leading-tight text-ink">Ücretsiz</p>
                <p className="mt-1 text-small text-ink-mid">Ders paketine dahil.</p>
              </>
            ) : (
              <>
                <p className="text-[1.75rem] font-medium leading-tight tabular-nums text-ink">
                  {coachingMeetingPrice(plan.price_per_session_minor)}{" "}
                  <span className="text-small font-normal text-ink-mid">/ görüşme</span>
                </p>
                <p className="mt-1 text-small text-ink-mid">
                  Toplam, paket süresine göre sonraki adımda hesaplanır.
                </p>
              </>
            )}
            {selected ? <p className="mt-1 text-small text-ink-mid">{meta}</p> : null}
            <Button
              type="button"
              variant={selected ? "outline" : "default"}
              className="mt-4 w-full sm:w-auto"
              onClick={onToggle}
            >
              {selected ? "Koçluğu kaldır" : "Koçluk ekle"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
