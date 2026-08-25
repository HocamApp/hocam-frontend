"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Marker-pen highlight (Aceternity UI, `hero-highlight`).
 *
 * The stroke is a background gradient whose `background-size` grows from 0% to
 * 100% width, anchored left — which is why it reads as a pen drawn across the
 * word rather than a box fading in. `display: inline` has to stay inline style:
 * it overrides the `inline-block` class so the highlight breaks across lines
 * with the text instead of forcing the word onto its own line.
 *
 * Two departures from the published component:
 *
 * It draws on scroll rather than on mount. The original is written for a hero,
 * where mount and first sight are the same moment; ours sits mid-page, and a
 * stroke that finished before anyone scrolled to it is a stroke nobody sees.
 *
 * The gradient is the brand pink, not the indigo/purple of the original. Both
 * stops stay in the light end of the ramp because dark text sits on top of
 * them — `brand-500` and up would need white text and stop reading as a
 * highlighter.
 *
 * The registry entry also ships a `HeroHighlight` wrapper — a full-bleed dotted
 * grid with a cursor-following spotlight. Nothing here uses a hero of that
 * shape, so it is deliberately not copied rather than left unused.
 */
export function Highlight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  const shared = cn(
    "relative inline-block rounded-lg bg-gradient-to-r from-brand-100 to-brand-200 px-1 pb-1",
    className,
  );
  const paint = {
    backgroundRepeat: "no-repeat",
    backgroundPosition: "left center",
    display: "inline",
  } as const;

  // Reduced motion gets the finished stroke. The animation is decoration; the
  // highlight itself is the part that carries emphasis.
  if (reduceMotion) {
    return (
      <span className={shared} style={{ ...paint, backgroundSize: "100% 100%" }}>
        {children}
      </span>
    );
  }

  return (
    <motion.span
      initial={{ backgroundSize: "0% 100%" }}
      whileInView={{ backgroundSize: "100% 100%" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, ease: "linear", delay: 0.2 }}
      style={paint}
      className={shared}
    >
      {children}
    </motion.span>
  );
}
