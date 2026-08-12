import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    <main className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.055),transparent_32rem),linear-gradient(to_bottom,hsl(var(--muted)/0.2),transparent_28rem)]">
      <div className={cn("mx-auto w-full space-y-6 px-4 py-5 sm:px-6 sm:py-8", WIDTH_CLASS[width])}>
      <header className="space-y-4 rounded-[1.5rem] border border-border/60 bg-card/90 p-5 shadow-[0_18px_50px_-42px_hsl(var(--foreground)/0.45)] backdrop-blur sm:p-7">
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
            <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
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
    </main>
  );
}
