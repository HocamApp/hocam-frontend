"use client";

import { useReducedMotion } from "framer-motion";

import {
  COMPACT_VIEWBOX,
  ILLUSTRATION_VIEWBOX,
} from "./illustrationTokens";
import { renderIllustration } from "./registry";
import type { IllustrationState } from "./illustrationState";

/**
 * The frame every artwork is drawn inside.
 *
 * It owns the three things that must not vary between the nine illustrations:
 *
 *  - The canvas. One square viewBox, scaled with `meet` rather than `slice`, so
 *    nothing is ever cropped to fill the column. The compact band reframes the
 *    same canvas to its authored middle rather than cropping the tall one.
 *  - The ink. `text-foreground` inverts near-black to near-white between themes;
 *    every stroke below is `currentColor`, so one class flips the whole family.
 *    `text-primary` is deliberately not used — it is near-black in light but
 *    bright blue in dark, which would change the hue rather than the lightness.
 *  - The motion preference, read once here and passed down, rather than nine
 *    components subscribing to the same media query.
 *
 * The artwork carries no information the question text does not already state,
 * so the whole subtree is hidden from assistive technology.
 */
export interface IllustrationFrameProps {
  state: IllustrationState;
  /** The band above the question on tablet and mobile, where height is scarce. */
  compact?: boolean;
}

export function IllustrationFrame({
  state,
  compact = false,
}: IllustrationFrameProps) {
  const reducedMotion = useReducedMotion();

  return (
    <svg
      viewBox={compact ? COMPACT_VIEWBOX : ILLUSTRATION_VIEWBOX}
      className="h-full w-full text-foreground"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      role="presentation"
      data-step={state.step}
      data-compact={compact || undefined}
    >
      {renderIllustration(state, { compact, reduced: Boolean(reducedMotion) })}
    </svg>
  );
}
