"use client";

import { Cursor, HandPointing, Heart } from "@phosphor-icons/react";


/**
 * The "save your favourites" banner.
 *
 * The icon is a looping demonstration of the gesture it is describing: a
 * pointer arrives, becomes a pointing hand, presses, and the heart fills. It
 * says the same thing as the sentence beside it, so it is `aria-hidden` and a
 * reader on reduced motion just gets the filled heart. Timings live in
 * `.ys-fav-*` in yemeksepeti.css.
 */
export function YsFavouritesBanner() {
  return (
    <div
      className="relative h-full overflow-hidden rounded-card bg-gold text-gold-ink"
    >
      {/* One heart, low and to the right, at the brand pink barely turned on.
          There were two, sized for a full-width band, and they used a token
          that now resolves to the same pink-pale as the surface behind them —
          so they were both oversized and invisible. */}
      <Heart
        className="pointer-events-none absolute -bottom-10 -right-8 size-40 text-gold-ink/10"
        weight="fill"
        aria-hidden
      />

      <div className="relative flex h-full items-center gap-4 p-5">
        <div className="ys-fav-demo" aria-hidden>
          {/* Phosphor takes `weight`, not Lucide's `fill` and `strokeWidth`.
              Carried over unchanged in the icon swap, those props did nothing:
              the "filled" heart never filled and the pointing hand rendered as
              an empty outline, which is why the gesture read as a blank shape
              hovering over the disc. */}
          <span className="ys-fav-demo__disc">
            <Heart className="ys-fav-demo__heart size-6" weight="regular" />
            <Heart
              className="ys-fav-demo__heart ys-fav-demo__heart--fill size-6"
              weight="fill"
            />
          </span>

          <span className="ys-fav-demo__cursor size-5">
            <Cursor
              className="ys-fav-demo__pointer ys-fav-demo__pointer--arrow size-5"
              weight="fill"
            />
            <span className="ys-fav-demo__pointer ys-fav-demo__pointer--hand">
              <HandPointing className="absolute inset-0 size-6 text-white" weight="fill" />
              <HandPointing className="absolute inset-0 size-6" weight="bold" />
            </span>
          </span>
        </div>

        <div className="flex min-w-0 flex-col items-start justify-center">
          <h2 className="text-lg font-bold leading-snug text-gold-ink">
            Favori hocalarının listesini oluştur
          </h2>

        </div>
      </div>
    </div>
  );
}
