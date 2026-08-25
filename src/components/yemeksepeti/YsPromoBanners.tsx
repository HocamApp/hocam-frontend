"use client";

import { Cursor, ForkKnife, HandPointing, Heart, QrCode } from "@phosphor-icons/react";

import { AppStoreBadge, GooglePlayBadge } from "@/components/ui/store-badges";

export function YsSignupBanner() {
  return (
    <div
      className="mt-16 md:mt-24 flex items-center justify-between overflow-hidden rounded-card"
      style={{ background: "var(--pink-pale)" }}
    >
      <div className="flex flex-col items-start gap-4 p-6">
        <h1 className="text-2xl font-semibold leading-[1.3125] md:text-[2rem]">
          İlk siparişinizde ücretsiz teslimat için kaydolun
        </h1>
        <button type="button" className="ys-btn ys-btn--primary ys-btn--small">
          Üye ol
        </button>
      </div>
      <div
        className="hidden h-[160px] w-[220px] shrink-0 items-center justify-center sm:flex"
        style={{ background: "var(--ys-brand-highlight-1)" }}
        aria-hidden
      >
        <ForkKnife className="h-16 w-16" style={{ color: "var(--ys-interaction-primary)" }} />
      </div>
    </div>
  );
}

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
      className="relative h-full overflow-hidden rounded-card"
      /* Was a three-stop gradient. Flat fill: DESIGN.md bans gradients
          outright, and --pink-pale exists precisely to be a section surface. */
      style={{ background: "var(--pink-pale)" }}
    >
      {/* One heart, low and to the right, at the brand pink barely turned on.
          There were two, sized for a full-width band, and they used a token
          that now resolves to the same pink-pale as the surface behind them —
          so they were both oversized and invisible. */}
      <Heart
        className="pointer-events-none absolute -bottom-10 -right-8 size-40 text-[rgb(250_0_80_/_0.07)]"
        weight="fill"
        aria-hidden
      />

      <div className="relative flex items-start gap-4 p-5">
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
          <h2 className="text-lg font-bold leading-snug">
            Favori hocalarının listesini oluştur
          </h2>
          <p className="mt-1 text-sm leading-6" style={{ color: "var(--ys-neutral-secondary)" }}>
            Beğendiğin hocaları kaydet. Kartlardaki kalbe dokunman yeterli.
          </p>

        </div>
      </div>
    </div>
  );
}

export function YsAppBanner() {
  return (
    <section className="mt-16 md:mt-24">
      {/* A white in-flow surface on paper, separated by a hairline. It was a
          full-bleed slab of the old green accent; mapping that onto gold made
          it worse, because gold at this scale sits directly against the pink
          bands above and below it and the two vibrate. Gold is a badge-scale
          surface here, not a section. */}
      <div className="flex items-center justify-between gap-8 rounded-card border border-line bg-white p-6">
        <div className="flex items-center gap-6">
          <div
            className="hidden h-[104px] w-[104px] shrink-0 items-center justify-center rounded-card border border-line sm:flex"
            aria-hidden
          >
            <QrCode className="h-16 w-16" style={{ color: "var(--ys-neutral-strong)" }} />
          </div>
          <div>
            <div className="mb-4">
              <div className="text-lg font-normal leading-[1.555]">
                Size özel kampanyalar ve çok daha fazlası{" "}
                <span className="font-bold" style={{ color: "var(--pink)" }}>
                  Mobil uygulamamız
                </span>{" "}
                ile
              </div>
              <div className="text-xs" style={{ color: "var(--ys-neutral-secondary)" }}>
                Yemekten market ürünlerine ve fazlasına özel fırsatlar Yemeksepeti&apos;nde
              </div>
            </div>
            {/* The real badges, same as the footer. Two different
                approximations of a store badge on one page is worse than
                either of them. Both stay inert until the apps exist. */}
            <div className="flex flex-wrap gap-2">
              <AppStoreBadge />
              <GooglePlayBadge />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
