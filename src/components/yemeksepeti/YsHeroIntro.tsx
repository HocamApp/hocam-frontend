import Link from "next/link";

import { CircularGallery } from "@/components/ui/circular-gallery";

import { YS_CAMPUS_ITEMS } from "./ysCampusGallery";

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
 * The bottom padding is measured, not chosen. The band below has to start at
 * 723px the way it does in the mock, and our navbar is 45px taller than the
 * mock's single row — so the hero gives back what the navbar took. Trim it and
 * the band's heading rises into the first screen, where the mock shows only
 * the cut.
 *
 * Both buttons say "hoca" rather than "öğretmen". Everything else on the page
 * does — the nav tab, the directory heading, the footer's own "Hoca ol" link
 * pointing at this same route — and the brand is Hocam.
 */
export function YsHeroIntro() {
  return (
    <section
      className="py-16 md:pb-[90px] md:pt-24"
      aria-labelledby="ys-hero-title"
    >
      <div className="grid items-center gap-12 lg:grid-cols-[7fr_5fr] lg:gap-8">
        <div className="relative z-10 min-w-0">
          <h1 id="ys-hero-title" className="text-display-m md:text-display">
            Dünün öğrencisi,
            <br />
            Bugünün öğretmeni
          </h1>

          <p className="mt-6 max-w-[34ch] text-hero-sub-m text-ink-mid md:text-hero-sub">
            YKS&apos;de derece yapmış öğrencileri, derece yapacaklarla
            buluşturuyoruz.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            {/* The directory is further down this same page, so this scrolls
            rather than navigating to /tutors and reloading the same list. */}
            <Link
              href="#ys-tutor-list-title"
              className="inline-flex h-12 items-center rounded-pill bg-pink px-8 text-body font-semibold text-white transition-colors duration-[--duration-state] hover:bg-pink-deep"
            >
              Hocaları gör
            </Link>
            <Link
              href="/register?role=tutor"
              className="inline-flex h-12 items-center rounded-pill border border-ink px-8 text-body font-semibold text-ink transition-colors duration-[--duration-state] hover:bg-ink hover:text-paper"
            >
              Hoca ol
            </Link>
          </div>
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
        <div className="relative -mx-4 h-[300px] overflow-hidden sm:-mx-6 sm:h-[340px] lg:mx-0 lg:-ml-20 lg:h-[360px] xl:-ml-32">
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
