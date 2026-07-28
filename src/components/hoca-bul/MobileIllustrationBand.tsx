"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { IllustrationFrame } from "./illustrations/IllustrationFrame";
import { crossFadeVariants } from "./motion";
import type { HocaBulStepId } from "@/types/hocaBul";

/**
 * Compact band above the question on tablet and mobile.
 *
 * On a short viewport it disappears entirely: the question and the primary
 * action matter more than decoration when there is no room for both.
 */
export function MobileIllustrationBand({
  stepId,
  progress,
}: {
  stepId: HocaBulStepId;
  progress: number;
}) {
  const reducedMotion = useReducedMotion();
  const isShortViewport = useMediaQuery("(max-height: 640px)");
  const variants = crossFadeVariants(Boolean(reducedMotion));

  if (isShortViewport) return null;

  return (
    <div
      className="relative h-[120px] w-full overflow-hidden border-b bg-muted/30 md:h-[180px] lg:hidden"
      aria-hidden="true"
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={stepId}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={variants.transition}
          className="absolute inset-0 h-full w-full"
        >
          <IllustrationFrame stepId={stepId} progress={progress} variant="band" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
