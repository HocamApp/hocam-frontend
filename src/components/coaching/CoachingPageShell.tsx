import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { CoachingSubnav } from "./CoachingSubnav";

type CoachingPageShellProps = {
  title: string;
  actions?: ReactNode;
  width?: "narrow" | "default" | "wide";
  currentHref?: string;
  audience?: "tutor" | "student";
  children: ReactNode;
};

const WIDTH_CLASS = {
  narrow: "max-w-3xl",
  default: "max-w-5xl",
  wide: "max-w-7xl",
} as const;

export function CoachingPageShell({
  title,
  actions,
  width = "default",
  currentHref,
  audience,
  children,
}: CoachingPageShellProps) {
  return (
    /* A div, not a main. The app shell in (main)/layout.tsx already owns the
       page's one <main id="ys-main-content">, and a second one nested inside
       it is invalid: assistive technology looks for a single primary landmark
       and a page offering two makes "skip to content" ambiguous. */
    <div className="text-ink">
      {/*
        The band carries the page title and nothing else.

        The breadcrumb, the eyebrow and the standfirst that used to sit here
        are gone. The tab strip immediately below is the navigation and the
        location indicator at once, so a back link and a category label above
        it were saying a third and fourth time what the highlighted tab
        already says. The standfirst restated the title in a longer sentence.

        Pale, not ink: --pink-pale is the palette's one large section surface
        and carries brand without taking the page over. Straight edges, since
        the diagonal belongs to the landing page.
      */}
      <header
        data-testid="coaching-page-header"
        className="band-full-bleed bg-band-pale py-10 sm:py-14"
      >
        <div
          className={cn(
            "mx-auto flex w-full flex-col gap-4 px-4 sm:flex-row sm:items-end sm:justify-between sm:px-6",
            WIDTH_CLASS[width],
          )}
        >
          <h1 className="max-w-[20ch] text-[1.875rem] font-bold leading-[1.05] tracking-[-0.02em] text-balance sm:text-[2.75rem]">
            {title}
          </h1>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </header>

      <div
        data-testid="coaching-shell-stack"
        className={cn(
          "mx-auto w-full space-y-6 px-4 pb-16 pt-8 sm:px-6 sm:pb-24",
          WIDTH_CLASS[width],
        )}
      >
        {currentHref && audience ? (
          <CoachingSubnav currentHref={currentHref} audience={audience} />
        ) : null}
        {children}
      </div>
    </div>
  );
}
