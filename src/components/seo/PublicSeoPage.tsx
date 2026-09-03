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
  eyebrow: string;
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
        <p className="text-[13px] font-medium text-ink-mid">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.15] tracking-[-0.02em] text-ink sm:text-5xl">
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
    <div className="rounded-[20px] border bg-background/80 px-5 py-4">
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
    <Card className="h-full rounded-[20px] border-line bg-[var(--surface)] shadow-none">
      <CardContent className="flex h-full flex-col p-6">
        <h3 className="text-[19px] font-medium leading-[1.3] md:text-[22px]">{title}</h3>
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
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-3 rounded-[20px] border bg-[var(--surface)] px-4 py-3 text-base leading-[1.6]"
        >
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function PublicSeoFaq({
  items,
}: {
  items: ReadonlyArray<{ question: string; answer: React.ReactNode }>;
}) {
  return (
    <div className="divide-y rounded-[20px] border bg-[var(--surface)] px-5 sm:px-7">
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
