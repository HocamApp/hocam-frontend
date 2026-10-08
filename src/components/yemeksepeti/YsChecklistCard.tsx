import { Check } from "@phosphor-icons/react/dist/ssr";
import { Children, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const VARIANTS = {
  /* On the pink band, which is pink in both themes: literal white with the
     light theme's inks (`--ink-on-light`, `--ink-mid-on-light`,
     `--line-on-light`), the same exception as the band's white pill. */
  band: {
    card: "bg-white text-[var(--ink-on-light)]",
    divider: "border-[var(--line-on-light)]",
    sub: "text-[var(--ink-mid-on-light)]",
  },
  /* Off the band, on the page: themed surface with a hairline. */
  surface: {
    card: "border border-line bg-surface text-ink",
    divider: "border-line",
    sub: "text-ink-mid",
  },
} as const;

/**
 * A titled checklist card: the verified band's "kontrol ettiklerimiz" card,
 * reusable off the band. `Check` in --success with no container, rows split
 * by a hairline. In flow, so no shadow.
 *
 * Server-safe (Phosphor's SSR build), so public pages can render it directly.
 */
export function YsChecklistCard({
  title,
  items,
  footer,
  variant,
  className,
}: {
  title: ReactNode;
  items: readonly { label: ReactNode; sub?: ReactNode }[];
  footer?: ReactNode;
  variant: keyof typeof VARIANTS;
  className?: string;
}) {
  const v = VARIANTS[variant];
  return (
    <div className={cn("w-full min-w-0 max-w-[500px] rounded-card p-7", v.card, className)}>
      <h3 className="text-[1.125rem] font-bold leading-[26px]">{title}</h3>
      <ul className="mt-4 flex flex-col">
        {items.map((item, index) => (
          <li
            key={index}
            className={cn("flex items-start gap-3.5 border-t py-3.5 first:border-t-0", v.divider)}
          >
            <span className="grid h-6 w-6 flex-none place-items-center text-success">
              <Check className="h-[22px] w-[22px]" aria-hidden />
            </span>
            <div className="min-w-0">
              <b className="block text-[0.9375rem] font-semibold leading-[22px]">
                {Array.isArray(item.label) ? Children.toArray(item.label) : item.label}
              </b>
              {item.sub && <span className={cn("block text-[14px] leading-5", v.sub)}>{item.sub}</span>}
            </div>
          </li>
        ))}
      </ul>
      {footer && (
        /* Sizes in px rather than the `small`/`label` tokens: tailwind-merge
           reads those as colours and drops them against `v.sub`. */
        <p className={cn("mt-1.5 border-t pt-3.5 text-[13px] font-normal leading-[19px]", v.divider, v.sub)}>
          {footer}
        </p>
      )}
    </div>
  );
}
