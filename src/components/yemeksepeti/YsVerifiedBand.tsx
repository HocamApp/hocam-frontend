import { Check } from "@phosphor-icons/react";
import Link from "next/link";
import { Children } from "react";

import { RankMark } from "@/components/brand/marks";

import { YsFact } from "./YsFact";
import { band as copy } from "./ysHomeCopy";
import {
  isTodo,
  MAX_TUTOR_YKS_RANK,
  VERIFICATION_DOCS_DELETED_AFTER,
  VERIFICATION_REVIEW_DAYS,
} from "./ysHomeFacts";

/**
 * The diagonal band, on the one claim that carries the product.
 *
 * It sits under the opening section rather than above it, which is where the
 * device works: the page opens on paper, and the cut arrives as you scroll
 * into it. Leading with it puts a saturated slab under the navbar and blows
 * the colour budget on the first screen — pink is meant to be roughly a fifth
 * of a viewport, and a full-bleed band alone is more than twice that.
 *
 * Directly above the university strip on purpose: the band says the tutors
 * are verified, the logos underneath are what the verification produced.
 *
 * Full bleed, so it renders outside `.ys-shell` and opens a shell of its own
 * for the text. The cut itself lives in `.ys-band`.
 *
 * Two columns: the claim on the left, and on the right the checklist that
 * backs it, one row per TutorVerification document.
 *
 * The button is a white pill rather than DESIGN.md's secondary treatment: a
 * transparent fill with an ink border disappears against the pink. Inside the
 * band the primary is simply inverted.
 *
 * Text comes from `ysHomeCopy.ts`, numbers from `ysHomeFacts.ts`.
 */
export function YsVerifiedBand() {
  /* The footer line quotes two facts that are not decided yet. In production
     a sentence with holes in it is worse than no sentence. */
  const footPending = isTodo(VERIFICATION_REVIEW_DAYS) || isTodo(VERIFICATION_DOCS_DELETED_AFTER);
  const showFoot = !footPending || process.env.NODE_ENV !== "production";

  return (
    // The mockup's padding: the checklist card made the band taller than the
    // 96/108 it carried while it held only the text.
    <section
      className="ys-band pb-[100px] pt-[84px] md:pb-[124px] md:pt-[132px]"
      aria-labelledby="ys-band-title"
    >
      <div className="ys-shell grid items-center gap-12 md:grid-cols-2">
        <div className="min-w-0">
          <h2 id="ys-band-title" className="max-w-[13ch] text-h1-m font-bold md:text-h1">
            {copy.title}
          </h2>

          {/* The three documents are the TutorVerification fields. */}
          <p className="mt-4 max-w-[44ch] text-body-l text-white/[0.88]">{copy.lead}</p>

          {/* The rank lockup is the tutor card's own gold badge: gold as a
              surface with --gold-ink on it, which also holds on pink at this
              scale. The number is the setup form's enforced maximum. */}
          <p className="mt-[18px] flex flex-wrap items-center gap-2 text-body-l font-semibold">
            {Children.toArray(
              copy.eligibility(
                <span className="inline-flex items-center gap-1.5 rounded-[14px] bg-gold px-2 py-0.5 text-lg font-bold leading-tight tabular-nums text-gold-ink">
                  <RankMark className="h-3.5 w-3.5" />
                  {copy.rankBadge(MAX_TUTOR_YKS_RANK)}
                </span>,
              ),
            )}
          </p>

          {/* White, not --surface: the band is pink in both themes, so this is
              an inverted primary rather than a card. Its ink is the literal
              light-theme value for the same reason. */}
          <Link
            href="/hocalar-nasil-dogrulaniyor"
            className="mt-8 inline-flex h-11 items-center rounded-pill bg-white px-[34px] text-body font-semibold text-[#02171a] transition-colors duration-[--duration-state] hover:bg-[#f2ecec]"
          >
            {copy.cta}
          </Link>
        </div>

        {/* Literal white with the light theme's inks, for the same reason as
            the pill above: the band does not change with the theme, so neither
            does what sits on it. `--ink-mid-on-light` is the repo's token for
            exactly that, and the hairline is the light --line. In flow, so no
            shadow. */}
        <div className="w-full min-w-0 max-w-[500px] rounded-card bg-white p-7 text-[#02171a] md:justify-self-end">
          <h3 className="text-[1.125rem] font-bold leading-[26px]">{copy.checklistTitle}</h3>
          <ul className="mt-4 flex flex-col">
            {copy.checklist.map((item) => (
              <li
                key={item.label}
                className="flex items-start gap-3.5 border-t border-[#e6dddd] py-3.5 first:border-t-0"
              >
                <span className="grid h-6 w-6 flex-none place-items-center text-success">
                  <Check className="h-[22px] w-[22px]" aria-hidden />
                </span>
                <div className="min-w-0">
                  <b className="block text-[0.9375rem] font-semibold leading-[22px]">{item.label}</b>
                  <span className="text-small leading-5 text-[var(--ink-mid-on-light)]">{item.sub}</span>
                </div>
              </li>
            ))}
          </ul>
          {showFoot && (
            <p className="mt-1.5 border-t border-[#e6dddd] pt-3.5 text-label font-normal leading-[19px] text-[var(--ink-mid-on-light)]">
              {Children.toArray(
                copy.checklistFoot({
                  reviewDays: <YsFact value={VERIFICATION_REVIEW_DAYS} label="X" />,
                  docsDeletedAfter: <YsFact value={VERIFICATION_DOCS_DELETED_AFTER} label="SÜRE" />,
                }),
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
