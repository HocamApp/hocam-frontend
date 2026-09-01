import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

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
    <nav aria-label="Sayfa yolu" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">/</span>}
            {index === items.length - 1 ? (
              <span aria-current="page" className="text-foreground">
                {item.label}
              </span>
            ) : (
              /* min-h-6: a breadcrumb is a row of destinations rather than a
                 link inside a sentence, so WCAG 2.2's 24px floor applies and
                 a 14px line box measures 20. */
              <Link
                className="inline-flex min-h-6 items-center hover:text-foreground"
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
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  children?: React.ReactNode;
}) {
  return (
    <header className="overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/5 via-background to-violet-500/5 px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
      <p className="text-sm font-semibold tracking-wide text-primary">
        {eyebrow}
      </p>
      <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        {title}
      </h1>
      <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
        {description}
      </p>
      {(primaryAction || secondaryAction) && (
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          {primaryAction && (
            <Button asChild size="lg">
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
    <section className={cn("py-10 sm:py-14", className)}>
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        {intro && (
          <p className="mt-3 text-base leading-7 text-muted-foreground">
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
    <div className="rounded-2xl border bg-background/80 px-5 py-4">
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
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
    <Card className="h-full rounded-2xl">
      <CardContent className="flex h-full flex-col p-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
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
          className="flex gap-3 rounded-xl border bg-card px-4 py-3 text-sm leading-6"
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
    <div className="divide-y rounded-2xl border bg-card px-5 sm:px-7">
      {items.map((item) => (
        <div key={item.question} className="py-6">
          <h3 className="font-semibold">{item.question}</h3>
          <div className="mt-2 text-sm leading-6 text-muted-foreground">
            {item.answer}
          </div>
        </div>
      ))}
    </div>
  );
}
