import type { ReactNode } from "react";

export function CheckoutShell({
  header,
  exploration,
  decision,
}: {
  header: ReactNode;
  exploration: ReactNode;
  decision: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] overflow-x-clip bg-[var(--checkout-left-surface)]">
      {header}
      <main
        id="checkout-content"
        className="grid min-h-[calc(100dvh-4.625rem)] lg:grid-cols-[minmax(0,3fr)_minmax(26rem,2fr)]"
      >
        <section
          aria-label="Ders planı"
          className={`min-w-0 bg-[var(--checkout-left-surface)] px-4 pb-32 pt-7 sm:px-7 sm:pt-9 lg:px-10 lg:pb-12 xl:px-14 ${decision ? "" : "lg:col-span-2"}`}
        >
          <div className="mx-auto w-full max-w-[50rem] lg:ml-auto lg:mr-0">
            {exploration}
          </div>
        </section>
        {decision && (
          <aside
            aria-label="Paket kararı"
            className="min-w-0 border-t border-[var(--checkout-soft-line)] bg-[var(--checkout-right-surface)] px-4 pb-32 pt-7 sm:px-7 sm:pt-9 lg:border-l lg:border-t-0 lg:px-8 lg:pb-12 xl:px-10"
          >
            <div className="w-full max-w-[34rem] lg:mr-auto">{decision}</div>
          </aside>
        )}
      </main>
    </div>
  );
}
