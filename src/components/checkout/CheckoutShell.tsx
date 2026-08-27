import type { ReactNode } from "react";
import type { CheckoutPalette } from "./checkoutPalette";

export function CheckoutShell({
  header,
  exploration,
  decision,
  palette = "01",
}: {
  header: ReactNode;
  exploration: ReactNode;
  decision: ReactNode;
  palette?: CheckoutPalette;
}) {
  return (
    <div
      data-checkout-palette={palette}
      className="min-h-[100dvh] overflow-x-clip bg-[var(--checkout-page-surface)] text-[var(--checkout-page-ink)]"
    >
      {header}
      <main
        id="checkout-content"
        className="grid min-h-[calc(100dvh-var(--app-header-row-1-h))] lg:grid-cols-[minmax(0,3fr)_minmax(26rem,2fr)]"
      >
        <section
          aria-label="Ders planı"
          className={`min-w-0 bg-[var(--checkout-left-surface)] px-4 pb-32 pt-5 text-[var(--checkout-left-ink)] sm:px-7 sm:pt-6 lg:px-10 lg:pb-8 xl:px-14 ${decision ? "" : "lg:col-span-2"}`}
        >
          <div className="mx-auto w-full max-w-[50rem] lg:ml-auto lg:mr-0">
            {exploration}
          </div>
        </section>
        {decision && (
          <aside
            aria-label="Paket kararı"
            className="min-w-0 border-t border-[var(--checkout-soft-line)] bg-[var(--checkout-right-surface)] px-4 pb-32 pt-5 text-[var(--checkout-right-ink)] sm:px-7 sm:pt-6 lg:border-l lg:border-t-0 lg:px-7 lg:pb-8 xl:px-9"
          >
            <div className="w-full max-w-[34rem] lg:mr-auto">{decision}</div>
          </aside>
        )}
      </main>
    </div>
  );
}
