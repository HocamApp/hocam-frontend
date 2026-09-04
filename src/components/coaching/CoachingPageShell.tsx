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
        A full-bleed band with a diagonal cut, not a rounded dark box sitting
        inside the content column. DESIGN.md is explicit that sections separate
        by colour rather than by containers, and that the diagonal is the
        primary device for it: a boxed dark panel says "another card", a band
        says "a different part of the page".

        The cut eats into the bottom edge, so the bottom padding carries an
        extra --band-cut on top of the section rhythm. Without it the last line
        of the description is what the angle slices through.
      */}
      <header
        data-testid="coaching-page-header"
        className="band-cut-bottom bg-ink-fixed pt-16 text-on-ink sm:pt-24"
      >
        <div
          className={cn(
            "mx-auto w-full px-4 pb-[calc(4rem+var(--band-cut))] sm:px-6 sm:pb-[calc(6rem+var(--band-cut))]",
            WIDTH_CLASS[width],
          )}
        >
          <nav aria-label="Sayfa yolu">
            <Link
              href={parentHref}
              className="inline-flex min-h-10 items-center gap-2 text-small font-medium text-on-ink-mid transition-colors duration-[var(--duration-state)] hover:text-on-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ink-fixed"
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
                <p className="text-label uppercase tracking-[0.16em] text-pink">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="mt-2 max-w-[20ch] text-[1.875rem] font-bold leading-[1.05] tracking-[-0.02em] text-balance sm:text-[2.75rem]">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-[1rem] leading-[1.6] text-on-ink-mid text-pretty">
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
