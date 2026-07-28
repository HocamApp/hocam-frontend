"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { stepPanelVariants, type WizardDirection } from "./motion";
import type { HocaBulStepId } from "@/types/hocaBul";

/**
 * One question per screen. The heading is the focus destination after every
 * transition, so a keyboard or screen-reader user lands on the new question
 * instead of somewhere in the middle of the page.
 */
export function WizardQuestionPanel({
  stepId,
  title,
  helper,
  direction,
  validationMessage,
  noticeMessage,
  children,
}: {
  stepId: HocaBulStepId;
  title: string;
  helper: string;
  direction: WizardDirection;
  validationMessage?: string | null;
  noticeMessage?: string | null;
  children: ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Moving focus to the new heading is what announces the step change; there is
  // no separate live region for it, so nothing is read out twice.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [stepId]);

  const variants = stepPanelVariants(direction, Boolean(reducedMotion));

  return (
    // Keyed rather than wrapped in AnimatePresence: the outgoing question
    // leaves immediately and only the incoming one animates. Waiting for an
    // exit animation would leave the student looking at nothing, and would
    // stall entirely anywhere the animation frame loop does not run.
    <motion.section
      key={stepId}
      initial={variants.initial}
      animate={variants.animate}
      transition={variants.transition}
    >
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-3xl font-bold tracking-tight text-foreground outline-none sm:text-4xl"
      >
        {title}
      </h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">{helper}</p>

      {noticeMessage ? (
        <p className="mt-5 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground">
          {noticeMessage}
        </p>
      ) : null}

      <div className="mt-7">{children}</div>

      {validationMessage ? (
        <p role="alert" className="mt-4 text-sm font-medium text-destructive">
          {validationMessage}
        </p>
      ) : null}
    </motion.section>
  );
}
