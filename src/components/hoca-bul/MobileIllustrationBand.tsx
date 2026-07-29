"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { IllustrationFrame } from "./illustrations/IllustrationFrame";
import { crossFadeVariants } from "./motion";
import type { IllustrationState } from "./illustrations/illustrationState";

/**
 * Compact band above the question on tablet and mobile.
 *
 * On a short viewport it disappears entirely: the question and the primary
 * action matter more than decoration when there is no room for both.
 */
export function MobileIllustrationBand({ state }: { state: IllustrationState }) {
  const reducedMotion = useReducedMotion();
  const isShortViewport = useMediaQuery("(max-height: 640px)");
  const variants = crossFadeVariants(Boolean(reducedMotion));

  // The query answers `undefined` until its effect runs. Rendering on that would
  // mount the band and then pull it back out on exactly the short viewports it is
  // supposed to spare, so it waits for a real answer instead.
  if (isShortViewport !== false) return null;

  return (
    <div
      className="relative h-20 w-full overflow-hidden border-b bg-muted/30 sm:h-[120px] md:h-[180px] lg:hidden"
      aria-hidden="true"
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={state.step}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={variants.transition}
          className="absolute inset-0 h-full w-full"
        >
          <IllustrationFrame state={state} compact />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
