import Link from "next/link";
import { ArrowRight, Check } from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export function PublicSeoBreadcrumbs({
  items,
}: {
  items: ReadonlyArray<BreadcrumbItem>;
}) {
  return (
    <nav aria-label="Sayfa yolu" className="text-sm text-ink-mid">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">/</span>}
            {index === items.length - 1 ? (
              <span aria-current="page" className="text-ink">
                {item.label}
              </span>
            ) : (
              /* min-h-6: a breadcrumb is a row of destinations rather than a
                 link inside a sentence, so WCAG 2.2's 24px floor applies and
                 a 14px line box measures 20. */
              <Link
                className="inline-flex min-h-6 items-center hover:text-ink"
                href={item.href}
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PublicSeoHero({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  illustration,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  illustration?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className={cn("py-8 md:py-12", illustration && "grid items-center gap-8 lg:grid-cols-[7fr_5fr] lg:gap-12")}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-label uppercase tracking-[0.08em] text-ink-mid">
            {eyebrow}
          </p>
        ) : null}
        <h1 className={cn("max-w-4xl text-h1-m tracking-[-0.02em] text-ink sm:text-h1", eyebrow && "mt-4")}>
          {title}
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-[1.6] text-ink-mid">
          {description}
        </p>
        {(primaryAction || secondaryAction) && (
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {primaryAction && (
              <Button asChild size="lg" className="text-base text-white">
                <Link href={primaryAction.href}>
                  {primaryAction.label}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            )}
            {secondaryAction && (
              <Button asChild size="lg" variant="outline">
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            )}
          </div>
        )}
        {children}
      </div>
      {illustration}
    </header>
  );
}

export function PublicSeoSection({
  title,
  intro,
  children,
  className,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("py-16 md:py-24", className)}>
      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold leading-[1.15] tracking-[-0.015em] text-ink sm:text-[32px]">
          {title}
        </h2>
        {intro && (
          <p className="mt-3 text-base leading-7 text-ink-mid">
            {intro}
          </p>
        )}
      </div>
      <div className="mt-7">{children}</div>
    </section>
  );
}

export function PublicSeoStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-card border border-line bg-[var(--surface)] px-5 py-4">
      <p className="text-2xl font-medium text-ink">{value}</p>
      <p className="mt-1 text-sm text-ink-mid">{label}</p>
    </div>
  );
}

export function PublicSeoInfoCard({
  title,
  children,
  href,
  linkLabel,
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <Card className="h-full rounded-card border-line bg-[var(--surface)] shadow-none transition-colors duration-[var(--duration-state)] ease-linear hover:border-ink">
      <CardContent className="flex h-full flex-col p-6">
        <h3 className="text-[19px] font-medium leading-[1.3] text-ink md:text-[22px]">{title}</h3>
        <div className="mt-3 flex-1 text-base leading-[1.6] text-ink-mid">
          {children}
        </div>
        {href && linkLabel && (
          <Link
            href={href}
            /* min-h-6: WCAG 2.2's 24px target floor. The line box of a 14px
               link is 20, and this one is a card action rather than a link
               inside a sentence, so the exemption does not cover it. */
            className="mt-5 inline-flex min-h-6 items-center text-sm font-medium text-primary hover:underline"
          >
            {linkLabel}
            <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export function PublicSeoChecklist({
  items,
}: {
  items: ReadonlyArray<string>;
}) {
  return (
    /* One surface with hairline rows rather than a box per item. The old
       version wrapped every line in its own bordered pill and marked it with
       a tinted disc (`bg-primary/10 text-primary`) — the tint fill DESIGN.md
       bans outright, and four floating pills read as a placeholder rather
       than a list. */
    <ul className="grid rounded-card border border-line bg-[var(--surface)] px-5 sm:grid-cols-2 sm:gap-x-10 sm:px-7">
      {items.map((item, index) => (
        <li
          key={item}
          className={cn(
            "flex items-start gap-3 border-b border-line py-4 text-base leading-[1.6] last:border-b-0",
            // In two columns the final row is the last two items, not the
            // last one, so the rule under both of them has to go.
            index >= items.length - 2 && "sm:border-b-0",
          )}
        >
          <Check
            className="mt-[3px] h-4 w-4 shrink-0 text-ink"
            weight="regular"
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Titled rows on one surface, separated by hairlines, with the title held in
 * its own column on wide screens.
 *
 * Replaces the "two cards then one full-width card" grids these pages used
 * for three-item groups. That shape came from DESIGN.md banning a row of
 * three equal cards, but the workaround looked like a layout accident. Rows
 * carry the same content with no orphan card, and an ordered list can number
 * itself when the items are genuinely a sequence.
 */
export function PublicSeoRows({
  items,
  ordered = false,
}: {
  items: ReadonlyArray<{ title: string; body: React.ReactNode }>;
  ordered?: boolean;
}) {
  const List = ordered ? "ol" : "ul";

  return (
    <List className="rounded-card border border-line bg-[var(--surface)] px-5 sm:px-7">
      {items.map((item, index) => (
        <li
          key={item.title}
          className="grid gap-x-10 gap-y-2 border-b border-line py-6 last:border-b-0 md:grid-cols-[5fr_7fr]"
        >
          <div className="flex items-baseline gap-3">
            {ordered && (
              <span
                className="text-label tabular-nums text-ink-mid"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
            )}
            <h3 className="text-[19px] font-medium leading-[1.3] text-ink md:text-[22px]">
              {item.title}
            </h3>
          </div>
          <div className="max-w-[60ch] text-base leading-[1.6] text-ink-mid">
            {item.body}
          </div>
        </li>
      ))}
    </List>
  );
}

export function PublicSeoFaq({
  items,
}: {
  items: ReadonlyArray<{ question: string; answer: React.ReactNode }>;
}) {
  return (
    <div className="divide-y divide-line rounded-card border border-line bg-[var(--surface)] px-5 sm:px-7">
      {items.map((item) => (
        <div key={item.question} className="py-6">
          <h3 className="text-[19px] font-medium leading-[1.3]">{item.question}</h3>
          <div className="mt-2 text-base leading-[1.6] text-ink-mid">
            {item.answer}
          </div>
        </div>
      ))}
    </div>
  );
}
