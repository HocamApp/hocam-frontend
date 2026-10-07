import { Children, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface YsStep {
  title: ReactNode;
  body: ReactNode[];
}

const TONES = {
  /* On paper or surface: the journey tabs' own look. */
  paper: {
    rule: "border-line",
    divider: "border-line",
    marker: "bg-ink",
    number: "text-ink-mid",
    title: "text-[19px] leading-[1.3] tracking-[-0.01em] md:text-[22px]",
    body: "mt-2 max-w-md text-base leading-[1.6] text-ink-mid",
    row: "py-[22px]",
  },
  /* On the ink band. `--ink` and `--paper` swap in dark mode together, so
     paper-on-ink holds in both themes. */
  ink: {
    rule: "border-paper/20",
    divider: "border-paper/[0.12]",
    marker: "bg-paper",
    number: "text-paper/55",
    title: "text-[20px] leading-[27px] tracking-[-0.2px]",
    body: "mt-1.5 max-w-[34rem] text-[15px] leading-6 text-paper/70",
    row: "py-5",
  },
} as const;

/**
 * Numbered steps, all visible at once.
 *
 * The same look as the journey's `VerticalTabs` rows (left rule, `01.` in
 * 13px, 22px medium titles, quiet bodies) without the tabbing: on the
 * homepage every step's text is on the page, not only the active one's. The
 * first step carries the ink marker the active tab has.
 */
export function YsStepList({
  steps,
  tone = "paper",
  className,
}: {
  steps: readonly YsStep[];
  tone?: keyof typeof TONES;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <ol className={cn("m-0 list-none border-l p-0", t.rule, className)}>
      {steps.map((step, index) => (
        <li
          key={index}
          className={cn("relative flex gap-3.5 border-t pl-4 first:border-t-0 first:pt-1", t.divider, t.row)}
        >
          {index === 0 && (
            <span aria-hidden className={cn("absolute -left-[2px] bottom-0 top-0 w-[2px]", t.marker)} />
          )}
          <span className={cn("mt-1.5 w-5 flex-none text-[13px] font-medium tabular-nums", t.number)}>
            {String(index + 1).padStart(2, "0")}.
          </span>
          <div className="min-w-0">
            <h3 className={cn("font-medium", t.title)}>{step.title}</h3>
            <p className={t.body}>{Children.toArray(step.body)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
