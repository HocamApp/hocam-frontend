"use client";

import { YsTutorDirectory } from "./YsTutorDirectory";

/**
 * The favourites screen.
 *
 * Nothing but the directory in favourites mode. No hero, no promo bands, no
 * testimonials, no FAQ: the reader arrived from the heart in the header with
 * one question, and every band between them and the answer is a band they
 * have to scroll past.
 *
 * 64/96px of top padding, the section rhythm from DESIGN.md. The directory
 * drops its own top margin in this mode, so the padding here is the whole
 * distance rather than two margins collapsing into each other.
 *
 * The padding sits on an inner wrapper rather than on `.ys-shell`: that class
 * sets `padding: 0 <inline>` as a shorthand, which resets the block padding
 * and beats a `pt-*` utility on the same element. A `pt-24` written there
 * computes to 0 and the heading ends up flush against the header.
 */
export function YsFavoritesPage() {
  return (
    <div className="ys-root">
      <div className="ys-shell">
        <div className="pb-24 pt-16 md:pt-24">
          <YsTutorDirectory favoritesOnly />
        </div>
      </div>
    </div>
  );
}
