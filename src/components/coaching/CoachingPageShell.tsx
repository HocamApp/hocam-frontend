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
       and a page offering two makes "skip to content" ambiguous. The paper
       ground comes from body, so this element only carries width and rhythm. */
    <div className="text-ink">
      <div
        data-testid="coaching-shell-stack"
        className={cn(
          "mx-auto w-full space-y-6 px-4 py-8 sm:px-6 sm:py-12",
          WIDTH_CLASS[width],
        )}
      >
        <header
          data-testid="coaching-page-header"
          className="overflow-hidden rounded-modal bg-ink p-6 text-white dark:bg-[var(--ink-on-light)] sm:p-8"
        >
          <nav aria-label="Sayfa yolu">
            <Link
              href={parentHref}
              className="inline-flex min-h-10 items-center gap-2 text-small font-medium text-white/70 transition-colors duration-[var(--duration-state)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <ArrowLeft
                aria-hidden="true"
                className="h-4 w-4"
                weight="regular"
              />
              {parentLabel}
            </Link>
          </nav>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              {eyebrow ? (
                <p className="text-label font-medium text-white/65">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="mt-2 max-w-[20ch] text-[1.875rem] font-bold leading-[1.05] tracking-[-0.02em] text-white text-balance sm:text-[2.75rem]">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-body leading-[1.6] text-white/72 text-pretty">
                {description}
              </p>
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
        </header>
        {currentHref && audience ? (
          <CoachingSubnav currentHref={currentHref} audience={audience} />
        ) : null}
        {children}
      </div>
    </div>
  );
}
