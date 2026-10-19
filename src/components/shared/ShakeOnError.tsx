"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useAnimationControls, useReducedMotion } from "motion/react";

/**
 * Shakes its children once each time `trigger` goes up: the small sideways
 * jolt the one-time-code field already gives on a wrong code
 * (`components/ui/otp-input.tsx`), so a wrong value reads the same everywhere.
 *
 * It drives the animation with controls rather than a `key`, because a key
 * would remount the field and drop the caret in the middle of typing.
 * `prefers-reduced-motion` gets no movement at all; the red border and the
 * sentence under the field still carry the message, since motion is never the
 * only signal (DESIGN.md).
 */
export function ShakeOnError({
  trigger,
  children,
  className,
}: {
  /** A counter. Each increase is one shake; the first value never shakes. */
  trigger: number;
  children: ReactNode;
  className?: string;
}) {
  const controls = useAnimationControls();
  const reduceMotion = useReducedMotion();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (trigger > 0 && !reduceMotion) {
      void controls.start({ x: [0, -6, 5, -4, 0], transition: { duration: 0.32 } });
    }
  }, [trigger, reduceMotion, controls]);

  return (
    <motion.div animate={controls} className={className}>
      {children}
    </motion.div>
  );
}
