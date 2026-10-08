import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The pink pill around a heading's last words. Shared with
 * `YsJourneyHeading`, whose pill rotates; this one stands still.
 */
export const YS_PILL_CLASSNAME =
  "inline-flex w-auto max-w-full items-center justify-center gap-2 overflow-hidden rounded-card bg-pink px-4 py-1 text-white md:w-auto md:max-w-none md:gap-3 md:px-5 md:py-2";

/** The section heading the journey uses: display type, centred, at the
    mockup's `.big-h` sizes (36/38 on phones, 56/53 on wide screens). */
export const YS_SECTION_HEADING_CLASSNAME =
  "text-center text-[36px] font-bold leading-[38px] tracking-[-1px] text-ink lg:text-[56px] lg:leading-[53px] lg:tracking-[-1.68px]";

/**
 * "Ne kadar [ödersin?]": a centred section heading whose last words sit in
 * the journey heading's pink pill, without the rotation.
 */
export function YsPillHeading({
  id,
  lead,
  pill,
  className,
}: {
  id: string;
  lead: ReactNode;
  pill: ReactNode;
  className?: string;
}) {
  return (
    <h2 id={id} className={cn(YS_SECTION_HEADING_CLASSNAME, className)}>
      <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <span>{lead}</span>
        <span className={cn(YS_PILL_CLASSNAME, "leading-[1.2]")}>{pill}</span>
      </span>
    </h2>
  );
}
