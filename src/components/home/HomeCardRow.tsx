"use client";

import { Children, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface HomeCardRowProps {
  children: ReactNode;
  /** Columns from the xl breakpoint upwards. Tablet always renders two. */
  columns?: 2 | 3;
  className?: string;
}

/**
 * The shared card-row grammar for the student home.
 *
 * - Mobile: one horizontally snapped scroll row. The next card deliberately
 *   peeks, because scrollbars are hidden globally (`globals.css`), so the peek
 *   is the only affordance telling the student there is more sideways.
 * - Tablet and up: a plain grid, so nothing scrolls off-screen unnoticed.
 *
 * `minmax(0,1fr)` tracks plus `min-w-0` children keep long tutor names from
 * widening the row and leaking page-level horizontal scroll.
 */
export function HomeCardRow({
  children,
  columns = 3,
  className,
}: HomeCardRowProps) {
  const items = Children.toArray(children);
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        // Mobile: snap scroll row.
        "scrollbar-none flex snap-x snap-mandatory gap-5 overflow-x-auto pb-1",
        // Tablet+: grid, no scrolling.
        "md:grid md:snap-none md:overflow-visible md:pb-0",
        "md:[grid-template-columns:repeat(2,minmax(0,1fr))]",
        columns === 3 && "xl:[grid-template-columns:repeat(3,minmax(0,1fr))]",
        className
      )}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            "min-w-0 shrink-0 snap-start",
            // ~85vw leaves the next card visibly peeking on a phone.
            "basis-[85%] sm:basis-[62%]",
            "md:shrink md:basis-auto"
          )}
        >
          {item}
        </div>
      ))}
    </div>
  );
}
