"use client";

import { Fire } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The study streak, as a badge.
 *
 * Adapted from the shadcn-style card the feature started from. Four things
 * changed, all of them DESIGN.md:
 *
 * - Phosphor `Fire`, not Lucide's `Flame` (pattern 2).
 * - Radius tokens rather than `rounded-3xl`, and `--line` / `--surface`
 *   rather than shadcn's `border-border/60` and `bg-card`, so the badge
 *   participates in the same two-theme system as everything else.
 *   No shadow: it sits in the document flow.
 * - Turkish labels, `sen` register, and the number reads "7 gün" rather than
 *   a pluralised English unit.
 * - A `compact` size the original did not have, because the navbar is where
 *   this actually lives and a 160px-wide vertical card cannot go there.
 *
 * The flame is `--ink`, never `--gold`: gold is a surface in this system and
 * fails contrast at every icon size.
 */

const streakBadgeVariants = cva(
  "inline-flex items-center text-center text-ink transition-colors duration-[--duration-state]",
  {
    variants: {
      size: {
        // The navbar one: one line, sits next to the avatar, pill radius
        // because it is badge-scale.
        compact: "h-8 gap-1.5 rounded-pill border border-line bg-surface px-3",
        sm: "w-28 flex-col justify-center gap-1.5 rounded-card border border-line bg-surface p-3",
        default:
          "w-40 flex-col justify-center gap-2.5 rounded-card border border-line bg-surface p-5",
        lg: "w-52 flex-col justify-center gap-3 rounded-modal border border-line bg-surface p-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

type StreakFrequency = "daily" | "weekly" | "monthly";

const UNIT_LABEL: Record<StreakFrequency, string> = {
  daily: "gün",
  weekly: "hafta",
  monthly: "ay",
};

/* Vowel harmony: günlük, haftalık, aylık. The suffix cannot be concatenated
   blindly, which is exactly the kind of thing that ships as "4 haftalük". */
const UNIT_ADJECTIVE: Record<StreakFrequency, string> = {
  daily: "günlük",
  weekly: "haftalık",
  monthly: "aylık",
};

interface StreakBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof streakBadgeVariants> {
  /** Streak length. */
  length?: number;
  /** Which unit the streak counts in. */
  frequency?: StreakFrequency;
  /** Line under the number. Only the stacked sizes render it. */
  subtitle?: string;
  /** Replaces the flame. */
  icon?: React.ReactNode;
}

const ICON_SIZE: Record<NonNullable<StreakBadgeProps["size"]>, number> = {
  compact: 20,
  sm: 24,
  default: 32,
  lg: 32,
};

const VALUE_CLASS: Record<NonNullable<StreakBadgeProps["size"]>, string> = {
  compact: "text-[15px]",
  sm: "text-2xl",
  default: "text-[40px] leading-none tracking-[-0.02em]",
  lg: "text-[44px] leading-none tracking-[-0.02em]",
};

const StreakBadge = React.forwardRef<HTMLDivElement, StreakBadgeProps>(
  (
    { className, size, length, frequency = "daily", subtitle, icon, ...props },
    ref,
  ) => {
    const streakLength = length ?? 0;
    const resolvedSize = size ?? "default";
    const unit = UNIT_LABEL[frequency];
    const isCompact = resolvedSize === "compact";

    // Turkish has no plural agreement after a number: "1 gün", "7 gün".
    const label = `${streakLength} ${UNIT_ADJECTIVE[frequency]} çalışma serisi`;

    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={cn(streakBadgeVariants({ size }), className)}
        {...props}
      >
        {icon ?? (
          <Fire
            size={ICON_SIZE[resolvedSize]}
            weight="regular"
            className="shrink-0 text-ink"
            aria-hidden
          />
        )}
        <span
          className={cn("font-semibold tabular-nums", VALUE_CLASS[resolvedSize])}
          aria-hidden
        >
          {streakLength}
          <span
            className={cn(
              "font-medium text-ink-mid",
              isCompact ? "ml-1 text-[13px]" : "ml-2",
            )}
          >
            {unit}
          </span>
        </span>
        {!isCompact && subtitle ? (
          <span
            className={cn(
              "font-normal text-ink-mid",
              resolvedSize === "sm" ? "text-xs" : "text-sm",
            )}
            aria-hidden
          >
            {subtitle}
          </span>
        ) : null}
      </div>
    );
  },
);
StreakBadge.displayName = "StreakBadge";

export { StreakBadge, streakBadgeVariants };
export type { StreakBadgeProps, StreakFrequency };
