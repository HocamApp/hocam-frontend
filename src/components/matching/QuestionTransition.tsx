"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type { MotionDirection } from "@/lib/matchingFlow";
import { MATCH_EASING, MATCH_MOTION } from "./motion";

export function QuestionTransition({
  step,
  direction,
  children,
  onEntered,
}: {
  step: number;
  direction: MotionDirection;
  children: ReactNode;
  onEntered?: () => void;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      layout={reducedMotion ? false : "size"}
      transition={{ layout: { duration: MATCH_MOTION.layout, ease: MATCH_EASING.enter } }}
      className="relative"
    >
      <AnimatePresence custom={direction} mode="popLayout">
        <motion.div
          key={step}
          data-testid="matching-question-panel"
          custom={direction}
          variants={{
            enter: (nextDirection: MotionDirection) => ({
              opacity: 0,
              x: reducedMotion ? 0 : nextDirection > 0 ? 16 : -16,
            }),
            center: { opacity: 1, x: 0 },
            exit: (nextDirection: MotionDirection) => ({
              opacity: 0,
              x: reducedMotion ? 0 : nextDirection > 0 ? -12 : 12,
            }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            opacity: {
              duration: reducedMotion ? 0.12 : MATCH_MOTION.stepEnter,
              ease: MATCH_EASING.enter,
            },
            x: { duration: MATCH_MOTION.stepEnter, ease: MATCH_EASING.enter },
          }}
          onAnimationComplete={onEntered}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
