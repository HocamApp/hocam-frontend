"use client";

import { motion, useReducedMotion } from "framer-motion";

import { HB_EASE, HB_MOTION } from "./motion";
import type { HocaBulStepTotal } from "@/types/hocaBul";

/**
 * The only progress signal in the flow: a real count of the branch's steps.
 * The bar is decorative — the announced value is the text.
 */
export function WizardProgress({
  humanIndex,
  total,
}: {
  humanIndex: number;
  total: HocaBulStepTotal;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <div className="w-full">
      <p className="text-sm font-semibold text-muted-foreground" aria-live="polite">
        <span className="notranslate tabular-nums" translate="no">
          {humanIndex} / {total}
        </span>
      </p>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
        aria-hidden="true"
      >
        <motion.div
          className="h-full origin-left rounded-full bg-primary"
          initial={false}
          animate={{ scaleX: humanIndex / total }}
          transition={{
            duration: reducedMotion ? 0 : HB_MOTION.progress.duration,
            ease: HB_EASE.enter,
          }}
        />
      </div>
    </div>
  );
}
