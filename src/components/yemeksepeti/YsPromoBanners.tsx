"use client";

import Link from "next/link";
import { Apple, Heart, MousePointer2, Play, Pointer, QrCode, UtensilsCrossed } from "lucide-react";

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
        <UtensilsCrossed className="h-16 w-16" style={{ color: "var(--ys-interaction-primary)" }} />
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
      className="relative mt-16 md:mt-24 overflow-hidden rounded-card"
      /* Was a three-stop gradient. Flat fill: DESIGN.md bans gradients
          outright, and --pink-pale exists precisely to be a section surface. */
      style={{ background: "var(--pink-pale)" }}
    >
      {/* Soft heart drift in the trailing corner, matching the reference. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 sm:block" aria-hidden>
        <Heart
          className="absolute -bottom-16 right-4 size-56"
          style={{ color: "var(--ys-brand-highlight-1)" }}
          fill="currentColor"
          strokeWidth={0}
        />
        <Heart
          className="absolute -top-6 right-40 size-24"
          style={{ color: "var(--ys-brand-highlight-1)" }}
          fill="currentColor"
          strokeWidth={0}
        />
      </div>

      <div className="relative flex items-center gap-5 p-6">
        <div className="ys-fav-demo" aria-hidden>
          <span className="ys-fav-demo__disc">
            <Heart className="ys-fav-demo__heart size-6" strokeWidth={2} />
            <Heart className="ys-fav-demo__heart ys-fav-demo__heart--fill size-6" fill="currentColor" strokeWidth={0} />
          </span>

          <span className="ys-fav-demo__cursor size-5">
            <MousePointer2
              className="ys-fav-demo__pointer ys-fav-demo__pointer--arrow size-5"
              fill="currentColor"
              strokeWidth={1.5}
            />
            <Pointer
              className="ys-fav-demo__pointer ys-fav-demo__pointer--hand size-5"
              fill="var(--ys-white)"
              strokeWidth={1.75}
            />
          </span>
        </div>

        <div className="flex min-w-0 flex-col items-start">
          <h2 className="text-2xl font-bold leading-[1.333]">
            Favori hocalarının listesini oluştur
          </h2>
          <p className="text-base" style={{ color: "var(--ys-neutral-secondary)" }}>
            Beğendiğin hocaları kaydet. Hoca kartındaki kalp simgesine dokunman yeterli.
          </p>
          <Link href="/tutors" className="ys-btn ys-btn--primary ys-btn--small mt-4">
            Şimdi keşfet
          </Link>
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
            <div className="flex flex-wrap gap-2">
              <button type="button" className="ys-btn ys-btn--secondary ys-btn--small">
                <Apple className="h-4 w-4" />
                App Store
              </button>
              <button type="button" className="ys-btn ys-btn--secondary ys-btn--small">
                <Play className="h-4 w-4" />
                Play Store
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
