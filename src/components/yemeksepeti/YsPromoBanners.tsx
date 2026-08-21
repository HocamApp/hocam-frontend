"use client";

import { Apple, Heart, Play, QrCode, UtensilsCrossed } from "lucide-react";

export function YsSignupBanner() {
  return (
    <div
      className="mt-6 flex items-center justify-between overflow-hidden rounded-lg"
      style={{ background: "var(--ys-brand-highlight)" }}
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

export function YsFavouritesBanner() {
  return (
    <div
      className="mt-6 flex items-center gap-6 rounded-lg p-6"
      style={{
        background:
          "linear-gradient(135deg, var(--ys-brand-highlight) 0%, var(--ys-interaction-primary-feedback) 50%, var(--ys-white) 100%)",
      }}
    >
      <div
        className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full sm:flex"
        style={{ background: "var(--ys-white)" }}
        aria-hidden
      >
        <Heart
          className="h-7 w-7"
          style={{ color: "var(--ys-interaction-primary)" }}
          fill="currentColor"
        />
      </div>
      <div className="flex flex-col items-start">
        <h2 className="text-2xl font-bold leading-[1.333]">Favoriler listenizi oluşturun</h2>
        <p className="text-base" style={{ color: "var(--ys-neutral-secondary)" }}>
          Sevdiğiniz yerleri kaydedin. Herhangi bir satıcıyı Favorilerinize eklemek için kalp
          simgesine tıklayın.
        </p>
        <button type="button" className="ys-btn ys-btn--primary ys-btn--small mt-4">
          Şimdi keşfet
        </button>
      </div>
    </div>
  );
}

export function YsAppBanner() {
  return (
    <section className="mt-8">
      <div
        className="flex items-center justify-between gap-8 rounded-lg p-6"
        style={{ background: "var(--ys-deal-highlight-1)" }}
      >
        <div className="flex items-center gap-6">
          <div
            className="hidden h-[104px] w-[104px] shrink-0 items-center justify-center rounded-lg bg-white sm:flex"
            aria-hidden
          >
            <QrCode className="h-16 w-16" style={{ color: "var(--ys-neutral-strong)" }} />
          </div>
          <div>
            <div className="mb-4">
              <div className="text-lg font-normal leading-[1.555]">
                Size özel kampanyalar ve çok daha fazlası{" "}
                <span className="font-bold" style={{ color: "var(--ys-deal-primary)" }}>
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
        <div
          className="hidden h-[140px] w-[120px] shrink-0 rounded-lg lg:block"
          style={{ background: "var(--ys-deal-secondary)" }}
          aria-hidden
        />
      </div>
    </section>
  );
}
