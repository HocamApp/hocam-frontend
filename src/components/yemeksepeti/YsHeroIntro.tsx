import { ArrowDown } from "@phosphor-icons/react";
import Link from "next/link";

import { CircularGallery } from "@/components/ui/circular-gallery";

import { YS_CAMPUS_ITEMS } from "./ysCampusGallery";
import { hero } from "./ysHomeCopy";

/* Each pill jumps to the part of this page written for that reader. */
const AUDIENCE = [
  { href: "#ogrenciler", label: hero.audience.students },
  { href: "#veliler", label: hero.audience.parents },
  { href: "#hocalar", label: hero.audience.tutors },
] as const;

/* The mockup's `.btn-lg`: 50px, and smaller on phones. Class strings are
   joined by hand here, not with `cn`: tailwind-merge does not know the
   custom type scale and would drop `text-white` against `text-body`. */
const HERO_BUTTON_V2 = "h-[50px] px-[22px] text-[15px] sm:px-8 sm:text-body";
const HERO_BUTTON = "h-12 px-8 text-body";

/**
 * The page's opening statement.
 *
 * Left aligned, on paper — the mock's proportions: a display headline, a
 * subline about a third its size, and two buttons under it. The yellow chip
 * and the sample tutor card the mock had beside it are deliberately not here.
 *
 * The right of the row was empty. It carries a slowly turning ring of campus
 * illustrations now — the schools the tutors below came from, which is the
 * claim the whole page rests on, said in pictures instead of a sentence. It
 * is a 7/5 split rather than 6/6, per the layout rule: the heavier column
 * carries the type.
 *
 * The bottom padding is measured rather than chosen. It was set so the band
 * started at 723px the way it does in the mock, giving back the 45px our
 * navbar takes over the mock's single row. The directory sits under the hero
 * now and the band has moved below it, so the number no longer lands on the
 * band — it is kept because it is still the distance that puts the first row
 * of tutor cards at the fold rather than half above it.
 *
 * Both buttons say "hoca" rather than "öğretmen". Everything else on the page
 * does — the nav tab, the directory heading, the footer's own "Hoca ol" link
 * — and the brand is Hocam.
 *
 * Text comes from `ysHomeCopy.ts`. `v2` (NEXT_PUBLIC_HOME_V2) turns on the
 * rebuild's changes: the lowercase headline, "Hoca ol" to /hoca-ol,
 * and the audience row. Off, the hero is the pre-rebuild one.
 */
export function YsHeroIntro({ v2 = false }: { v2?: boolean }) {
  const heroButtonSize = v2 ? HERO_BUTTON_V2 : HERO_BUTTON;
  return (
    <section
      className="py-16 md:pb-[90px] md:pt-24"
      aria-labelledby="ys-hero-title"
    >
      <div className="grid items-center gap-12 lg:grid-cols-[7fr_5fr] lg:gap-8">
        <div className="relative z-10 min-w-0">
          {/* v2 follows the mockup's mobile sizes: a 40px line on the 40px
              headline, a 21/30 subline capped at 30ch, 15px buttons. */}
          <h1 id="ys-hero-title" className={`text-display-m md:text-display${v2 ? " max-md:leading-10" : ""}`}>
            {hero.titleLine1}
            <br />
            {v2 ? hero.titleLine2 : hero.titleLine2Legacy}
          </h1>

          <p
            className={
              v2
                ? "mt-4 max-w-[30ch] text-[21px] leading-[30px] tracking-[-0.26px] text-ink-mid md:text-hero-sub"
                : "mt-6 max-w-[34ch] text-hero-sub-m text-ink-mid md:text-hero-sub"
            }
          >
            {hero.sub}
          </p>

          <div className={`flex flex-wrap gap-3 ${v2 ? "mt-11" : "mt-10"}`}>
            {/* The directory is further down this same page, so this scrolls
            rather than navigating to /tutors and reloading the same list. */}
            <Link
              href="#ys-tutor-list-title"
              className={`inline-flex items-center rounded-pill bg-pink font-semibold text-white transition-colors duration-[--duration-state] hover:bg-pink-deep ${heroButtonSize}`}
            >
              {hero.ctaTutors}
            </Link>
            {/* With the rebuild on, every "Hoca ol" goes to /hoca-ol, which
                answers "can I, and how" before the registration form. */}
            <Link
              href={v2 ? "/hoca-ol" : "/register?role=tutor"}
              className={`inline-flex items-center rounded-pill border border-ink font-semibold text-ink transition-colors duration-[--duration-state] hover:bg-ink hover:text-paper ${heroButtonSize}`}
            >
              {hero.ctaBecomeTutor}
            </Link>
          </div>

          {/* Three readers land here: a student, a parent, a would-be tutor.
              The row lets each skip to their own section. Outline pills on
              the card surface; only the border changes on hover. */}
          {v2 && (
            <div className="mt-9 flex flex-col gap-3">
              <span className="text-small font-medium text-ink-mid">{hero.audienceLabel}</span>
              <div className="flex flex-wrap gap-2">
                {AUDIENCE.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex h-11 items-center gap-2.5 rounded-pill border border-line bg-surface pl-[18px] pr-2 text-[0.875rem] font-medium text-ink transition-colors duration-[--duration-state] hover:border-ink sm:text-[0.9375rem]"
                  >
                    {item.label}
                    <span className="grid h-7 w-6 place-items-center text-ink">
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* The ring is wider than the column it sits in, on purpose: the cards
            at the sides run off the edge rather than being squeezed into a
            circle small enough to fit whole. The extra width is given to an
            absolutely positioned child rather than to this box, so the ring
            is clipped without the page itself growing a horizontal scroll. */}
        {/* The clipping box reaches back into the headline's column on wide
            screens. Centred in its own 5fr cell the ring left a lane of empty
            paper between the type and the first card; a negative margin moves
            the box rather than the ring inside it, so the front card comes
            closer without being cut off by its own frame. */}
        {/* The bleed follows `.ys-shell`'s own padding, which steps at 960 and
            1264 rather than at Tailwind's breakpoints. `sm:-mx-6` used to pull
            24px out of a shell that still had 16px of padding between 640 and
            960, and those 8px per side were the page's horizontal scroll at
            tablet widths. */}
        <div className="relative -mx-4 h-[300px] overflow-hidden sm:h-[340px] min-[960px]:-mx-8 lg:mx-0 lg:-ml-20 lg:h-[360px] xl:-ml-32">
          {/* Scaled rather than re-measured per breakpoint: perspective already
              magnifies the front card by about a third, so a phone gets a card
              wider than the screen at the desktop size. One transform keeps
              the ring's proportions and the card's own radius intact. */}
          <div className="absolute left-1/2 top-0 h-full w-[1100px] -translate-x-1/2 scale-[0.62] sm:scale-[0.8] lg:scale-100">
            <CircularGallery items={YS_CAMPUS_ITEMS} />
          </div>
        </div>
      </div>
    </section>
  );
}
