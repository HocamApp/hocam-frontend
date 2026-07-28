"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { IllustrationFrame } from "./illustrations/IllustrationFrame";
import { crossFadeVariants } from "./motion";
import type { HocaBulStepId } from "@/types/hocaBul";

/**
 * Desktop illustration column. Decorative: the panel carries no information the
 * question text does not already state, so it is hidden from assistive tech.
 */
export function IllustrationPanel({
  stepId,
  progress,
}: {
  stepId: HocaBulStepId;
  progress: number;
}) {
  const reducedMotion = useReducedMotion();
  const variants = crossFadeVariants(Boolean(reducedMotion));

  return (
    <div className="relative h-full w-full bg-muted/30" aria-hidden="true">
      {/* Default (sync) presence: the outgoing artwork fades out while the new
          one fades in, so there is never an empty column between steps. */}
      <AnimatePresence initial={false}>
        <motion.div
          key={stepId}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={variants.transition}
          className="absolute inset-0 h-full w-full"
        >
          <IllustrationFrame stepId={stepId} progress={progress} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
