/**
 * Structural motion for the /hoca-bul shell. Values live here so the step
 * transition, the illustration cross-fade and the later per-answer animation
 * all move on the same clock.
 *
 * Nothing here blocks input: the primary action stays usable while a panel is
 * still settling, and there is no synthetic progress animation — the only
 * progress signal is the real step counter.
 */

export const HB_EASE = {
  enter: [0.16, 1, 0.3, 1],
  exit: [0.55, 0, 1, 0.45],
  interaction: [0.2, 0, 0, 1],
} as const;

export const HB_MOTION = {
  stepForward: { duration: 0.34, offset: 24 },
  stepBackward: { duration: 0.3, offset: -24 },
  stepExit: { duration: 0.16 },
  illustration: { duration: 0.42 },
  progress: { duration: 0.28 },
} as const;

/** Reduced motion keeps the same timing budget but never translates anything. */
export const HB_REDUCED_DURATION = 0.12;

export type WizardDirection = 1 | -1;

export function stepPanelVariants(direction: WizardDirection, reduced: boolean) {
  const offset =
    direction === 1 ? HB_MOTION.stepForward.offset : HB_MOTION.stepBackward.offset;
  const duration =
    direction === 1 ? HB_MOTION.stepForward.duration : HB_MOTION.stepBackward.duration;

  if (reduced) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: HB_REDUCED_DURATION, ease: "linear" as const },
    };
  }

  return {
    initial: { opacity: 0, x: offset },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -offset / 2 },
    transition: { duration, ease: HB_EASE.enter },
  };
}

export function crossFadeVariants(reduced: boolean) {
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      duration: reduced ? HB_REDUCED_DURATION : HB_MOTION.illustration.duration,
      ease: reduced ? ("linear" as const) : HB_EASE.enter,
    },
  };
}
