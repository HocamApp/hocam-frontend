"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { IllustrationFrame } from "./illustrations/IllustrationFrame";
import { crossFadeVariants } from "./motion";
import type { IllustrationState } from "./illustrations/illustrationState";

/**
 * Desktop illustration column. Decorative: the panel carries no information the
 * question text does not already state, so it is hidden from assistive tech.
 */
export function IllustrationPanel({ state }: { state: IllustrationState }) {
  const reducedMotion = useReducedMotion();
  const variants = crossFadeVariants(Boolean(reducedMotion));

  return (
    <div
      className="relative flex h-full w-full items-center justify-center bg-muted/30"
      aria-hidden="true"
    >
      {/* Default (sync) presence: the outgoing artwork fades out while the new
          one fades in, so there is never an empty column between steps. */}
      <AnimatePresence initial={false}>
        <motion.div
          key={state.step}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={variants.transition}
          className="absolute inset-0 flex h-full w-full items-center justify-center p-6 xl:p-10"
        >
          {/* A square holds the canvas' aspect ratio inside a very tall column,
              so `meet` scales the artwork instead of stranding it. The cap is
              generous on purpose: at 26rem the artwork read as a small vignette
              marooned in a very tall column. */}
          <div className="aspect-square w-full max-w-[34rem]">
            <IllustrationFrame state={state} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
