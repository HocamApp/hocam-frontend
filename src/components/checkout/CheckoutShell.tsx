import type { ReactNode } from "react";

export function CheckoutShell({
  header,
  introduction,
  exploration,
  decision,
}: {
  header: ReactNode;
  introduction: ReactNode;
  exploration: ReactNode;
  decision: ReactNode;
}) {
  return (
    <div className="relative min-h-[100dvh] overflow-x-clip bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_20%_0%,hsl(var(--primary)/0.08),transparent_58%)]" aria-hidden="true" />
      <div className="relative">{header}</div>
      <main id="checkout-content" className="relative mx-auto w-full max-w-[84rem] px-4 pb-32 pt-8 sm:px-6 sm:pt-11 lg:px-8 lg:pb-16">
        <div className="max-w-3xl">{introduction}</div>
        {decision ? (
          <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.78fr)] xl:gap-14">
            <div className="min-w-0">{exploration}</div>
            <div className="min-w-0 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">{decision}</div>
          </div>
        ) : (
          <div className="mt-8">{exploration}</div>
        )}
      </main>
    </div>
  );
}
