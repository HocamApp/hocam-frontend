import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/ssr";

import { cn } from "@/lib/utils";
import { CoachingSubnav } from "./CoachingSubnav";

type CoachingPageShellProps = {
  title: string;
  description: string;
  parentHref: string;
  parentLabel: string;
  eyebrow?: string;
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
  description,
  parentHref,
  parentLabel,
  eyebrow,
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
        A full-bleed band, and the page's colour at the point a tutor enters
        it. Sections separate by colour rather than by nesting another
        bordered box, so the header is a strip of a different surface with no
        border, no shadow and no wrapper.

        Pale, not ink. A dark slab reads as the heaviest thing on the screen
        and then has to be answered by every surface under it; --pink-pale is
        the palette's one large section surface and carries brand without
        taking the page over. Straight edges: the diagonal is the landing
        page's device and does not follow the user into the product.
      */}
      <header
        data-testid="coaching-page-header"
        className="band-full-bleed bg-band-pale py-16 sm:py-24"
      >
        <div
          className={cn(
            "mx-auto w-full px-4 sm:px-6",
            WIDTH_CLASS[width],
          )}
        >
          <nav aria-label="Sayfa yolu">
            <Link
              href={parentHref}
              className="inline-flex min-h-10 items-center gap-2 text-small font-medium text-ink-mid transition-colors duration-[var(--duration-state)] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
            >
              <ArrowLeft aria-hidden="true" className="h-5 w-5" weight="regular" />
              {parentLabel}
            </Link>
          </nav>
          {/* 7/5, not 6/6. Asymmetry is the default for content sections; true
              centring is reserved for the hero and section headers. */}
          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end">
            <div>
              {eyebrow ? (
                /* Ink-mid, not pink. A pale surface carrying saturated text of
                   its own hue is the tint construction DESIGN.md bans, and a
                   pink-pale band with pink type on it is that pattern at
                   section scale. */
                <p className="text-label uppercase tracking-[0.16em] text-ink-mid">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="mt-2 max-w-[20ch] text-[1.875rem] font-bold leading-[1.05] tracking-[-0.02em] text-balance sm:text-[2.75rem]">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-[1rem] leading-[1.6] text-ink-mid text-pretty">
                {description}
              </p>
            </div>
            {actions ? <div className="shrink-0 lg:justify-self-end">{actions}</div> : null}
          </div>
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
