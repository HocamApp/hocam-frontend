import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Infinite horizontal marquee (magicui, via shadcnspace's `marquee-01`).
 *
 * The loop is seamless because the same children are rendered `repeat` times
 * and each copy translates by exactly its own width plus one gap — so as copy
 * one leaves, copy two is already sitting where it started. `repeat` must be
 * high enough that the copies together overflow the viewport, otherwise the
 * reset is visible as a jump. Four covers a full-width row of ~350px cards.
 *
 * Pure CSS animation, no rAF — it keeps running while JS is busy, and
 * `prefers-reduced-motion` stops it outright below.
 */

interface MarqueeProps extends React.ComponentPropsWithoutRef<"div"> {
  /** Scroll right-to-left instead of left-to-right. */
  reverse?: boolean;
  /** Freeze the whole row while the pointer is inside it. */
  pauseOnHover?: boolean;
  children: React.ReactNode;
  repeat?: number;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  repeat = 4,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        "group flex flex-row overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
        className,
      )}
    >
      {Array.from({ length: repeat }, (_, index) => (
        <div
          key={index}
          className={cn(
            "flex shrink-0 flex-row justify-around [gap:var(--gap)]",
            "animate-marquee motion-reduce:animate-none",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
            reverse && "[animation-direction:reverse]",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
