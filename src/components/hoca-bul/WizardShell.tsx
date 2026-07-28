"use client";

import type { ReactNode } from "react";

/**
 * The focused two-pane frame: a visually stable illustration column beside the
 * question column on desktop, a compact band above it on smaller screens.
 *
 * dvh rather than vh so mobile browser chrome cannot push the footer off-screen.
 */
export function WizardShell({
  illustration,
  mobileIllustration,
  header,
  children,
  footer,
}: {
  illustration: ReactNode;
  mobileIllustration: ReactNode;
  header: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-background lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="hidden lg:sticky lg:top-0 lg:block lg:h-dvh lg:overflow-hidden lg:border-r">
        {illustration}
      </div>

      <div className="flex min-h-dvh min-w-0 flex-col">
        {mobileIllustration}
        {header}

        <div className="flex-1 px-5 pb-8 pt-4 sm:px-8 lg:px-12 lg:pt-8">
          <div className="mx-auto w-full max-w-[38rem]">{children}</div>
        </div>

        {footer}
      </div>
    </main>
  );
}
