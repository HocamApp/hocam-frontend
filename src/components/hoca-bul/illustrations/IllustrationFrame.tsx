"use client";

import type { HocaBulStepId } from "@/types/hocaBul";

/**
 * Structural placeholder for the per-step artwork built in a later phase.
 *
 * It already establishes the contract the real illustrations will honour: a
 * fixed viewBox, decorative-only semantics, and colours taken from theme tokens
 * via currentColor so light and dark both work without a second palette.
 */
export interface IllustrationProps {
  stepId: HocaBulStepId;
  /** How far along the flow the student is, 0–1. */
  progress: number;
  variant?: "panel" | "band";
}

const LANE_STOPS = [0.08, 0.24, 0.4, 0.56, 0.72, 0.88];

export function IllustrationFrame({
  stepId,
  progress,
  variant = "panel",
}: IllustrationProps) {
  const isBand = variant === "band";

  return (
    <svg
      viewBox={isBand ? "0 120 480 240" : "0 0 480 640"}
      className="h-full w-full text-primary"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      role="presentation"
      data-step={stepId}
    >
      <rect x="0" y="0" width="480" height="640" className="fill-muted/40" />
      <path
        d="M60 560 C 150 500, 180 380, 240 300 S 360 150, 420 90"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="10 12"
      />
      {LANE_STOPS.map((stop, index) => {
        const reached = progress >= stop;
        const x = 60 + stop * 360;
        const y = 560 - stop * 470;
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r={reached ? 11 : 7}
            fill={reached ? "currentColor" : "none"}
            fillOpacity={reached ? 0.9 : 0}
            stroke="currentColor"
            strokeOpacity={reached ? 0.9 : 0.3}
            strokeWidth="3"
          />
        );
      })}
    </svg>
  );
}
