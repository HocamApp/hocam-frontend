import Link from "next/link";
import { Children } from "react";

import { RankMark } from "@/components/brand/marks";

import { YsChecklistCard } from "./YsChecklistCard";
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
 * With `v2` (NEXT_PUBLIC_HOME_V2) it is two columns: the claim plus the rank
 * line on the left, and on the right the checklist that backs it, one row per
 * TutorVerification document. Off, it is the pre-rebuild single column.
 *
 * The button is a white pill rather than DESIGN.md's secondary treatment: a
 * transparent fill with an ink border disappears against the pink. Inside the
 * band the primary is simply inverted.
 *
 * Text comes from `ysHomeCopy.ts`, numbers from `ysHomeFacts.ts`.
 */
export function YsVerifiedBand({ v2 = false }: { v2?: boolean }) {
  /* The footer line quotes two facts that are not decided yet. In production
     a sentence with holes in it is worse than no sentence. */
  const footPending = isTodo(VERIFICATION_REVIEW_DAYS) || isTodo(VERIFICATION_DOCS_DELETED_AFTER);
  const showFoot = !footPending || process.env.NODE_ENV !== "production";

  const claim = (
    <>
      <h2 id="ys-band-title" className="max-w-[13ch] text-h1-m font-bold md:text-h1">
        {copy.title}
      </h2>

      {/* The three documents are the TutorVerification fields. */}
      <p className="mt-4 max-w-[44ch] text-body-l text-white/[0.88]">{copy.lead}</p>

      {/* The rank lockup is the tutor card's own gold badge: gold as a
          surface with --gold-ink on it, which also holds on pink at this
          scale. The number is the setup form's enforced maximum. */}
      {v2 && (
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
      )}

      {/* White, not --surface: the band is pink in both themes, so this is
          an inverted primary rather than a card. Its ink is the literal
          light-theme value for the same reason. */}
      <Link
        href="/hocalar-nasil-dogrulaniyor"
        className="mt-8 inline-flex h-11 items-center rounded-pill bg-white px-[34px] text-body font-semibold text-[#02171a] transition-colors duration-[--duration-state] hover:bg-[#f2ecec]"
      >
        {copy.cta}
      </Link>
    </>
  );

  if (!v2) {
    return (
      // 96/108 is the mock's own padding, kept to the pixel. At 80/80 the band
      // read as a thin wedge and its right-hand end, the shallow end of the cut,
      // fell off the first screen entirely.
      <section
        className="ys-band pb-24 pt-20 md:pb-[108px] md:pt-24"
        aria-labelledby="ys-band-title"
      >
        <div className="ys-shell">{claim}</div>
      </section>
    );
  }

  return (
    // The rebuild mockup's padding: the checklist card makes the band taller
    // than the 96/108 it carried while it held only the text.
    <section
      className="ys-band pb-[100px] pt-[84px] md:pb-[124px] md:pt-[132px]"
      aria-labelledby="ys-band-title"
    >
      <div className="ys-shell grid items-center gap-12 md:grid-cols-2">
        <div className="min-w-0">{claim}</div>

        <YsChecklistCard
          variant="band"
          className="md:justify-self-end"
          title={copy.checklistTitle}
          items={copy.checklist}
          footer={
            showFoot
              ? Children.toArray(
                  copy.checklistFoot({
                    reviewDays: <YsFact value={VERIFICATION_REVIEW_DAYS} label="X" />,
                    docsDeletedAfter: <YsFact value={VERIFICATION_DOCS_DELETED_AFTER} label="SÜRE" />,
                  }),
                )
              : undefined
          }
        />
      </div>
    </section>
  );
}
