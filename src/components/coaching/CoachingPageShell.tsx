import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

type CoachingPageShellProps = {
  title: string;
  description: string;
  parentHref: string;
  parentLabel: string;
  eyebrow?: string;
  actions?: ReactNode;
  width?: "narrow" | "default" | "wide";
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
  children,
}: CoachingPageShellProps) {
  return (
    <main className={cn("mx-auto w-full space-y-7 px-4 py-6 sm:px-6 sm:py-8", WIDTH_CLASS[width])}>
      <header className="space-y-4 border-b border-border/70 pb-6">
        <nav aria-label="Sayfa yolu">
          <Link
            href={parentHref}
            className="inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            {parentLabel}
          </Link>
        </nav>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl space-y-2">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </header>
      {children}
    </main>
  );
}
