import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared furniture for the story pages (`/hakkimizda-v2`,
 * `/iletisim`). Deliberately small — three section shells and a pill — so each
 * page stays readable and easy to redesign without unpicking an abstraction.
 *
 * These pages use the `--brand-*` ramp for accents and the semantic tokens for
 * surfaces, so they follow the app's light/dark theme normally. They are not
 * inside `.ys-root`.
 */

export function AboutEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-bold tracking-[0.14em] text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
      {children}
    </span>
  );
}

export function AboutSection({
  eyebrow,
  title,
  lede,
  align = "left",
  className,
  children,
}: {
  eyebrow?: string;
  title?: string;
  lede?: string;
  align?: "left" | "center";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("py-14 md:py-20", className)}>
      {(eyebrow || title || lede) && (
        <header className={cn("mb-10", align === "center" && "text-center")}>
          {eyebrow ? <AboutEyebrow>{eyebrow}</AboutEyebrow> : null}
          {title ? (
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
          ) : null}
          {lede ? (
            <p
              className={cn(
                "mt-4 text-base leading-7 text-muted-foreground md:text-lg",
                align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl",
              )}
            >
              {lede}
            </p>
          ) : null}
        </header>
      )}
      {children}
    </section>
  );
}

export function AboutShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>;
}
