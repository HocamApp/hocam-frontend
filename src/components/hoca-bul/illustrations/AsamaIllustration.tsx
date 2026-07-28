"use client";

import { motion } from "framer-motion";

import { answerStateVariants } from "../motion";
import { Layer, Node, Rail, Slab } from "./primitives";
import { PAINT, STROKE } from "./illustrationTokens";
import type { StagePhase } from "./illustrationState";
import type { StepIllustrationProps } from "./types";

/**
 * "Where are you in your preparation?" — a staircase of learning steps.
 *
 * Five ascending steps stand for the five phases, lowest to highest. The steps
 * themselves never move; answering only lights the step the student is on, so
 * switching stages can never make the composition jump — the same contract the
 * target keeps on the goal step.
 *
 * "Returning" sits at the top like any other phase but carries one extra mark:
 * a restrained circular-return accent around its marker, because coming back to
 * preparation is a phase with a history, not just a higher step.
 */

const STEP = { width: 46, gap: 8, baseline: 198, depth: 6 } as const;
const HEIGHTS = [22, 32, 42, 52, 62] as const;

/** Stair position per phase. Positional only — no label ever crosses into the SVG. */
const PHASE_STEP: Record<StagePhase, number> = {
  exploring: 0,
  early: 1,
  active: 2,
  final: 3,
  returning: 4,
};

function stepX(index: number) {
  return 29 + index * (STEP.width + STEP.gap);
}

/** The circular-return accent: one open arc and a small head, nothing louder. */
function ReturnAccent({ cx, cy }: { cx: number; cy: number }) {
  const r = 13;
  // From just below-left of the marker, clockwise around the top to the right.
  const sx = cx - r * 0.94;
  const sy = cy + r * 0.34;
  const ex = cx + r * 0.5;
  const ey = cy - r * 0.87;
  return (
    <g>
      <path
        d={`M${sx} ${sy} A${r} ${r} 0 1 1 ${ex} ${ey}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE.hairline}
        strokeLinecap="round"
      />
      <polygon
        points={`${ex},${ey} ${ex - 9},${ey - 2} ${ex - 3},${ey + 8}`}
        className={PAINT.fillDeep}
        stroke="currentColor"
        strokeWidth={STROKE.hairline}
        strokeLinejoin="round"
      />
    </g>
  );
}

export function AsamaIllustration({
  state,
  compact = false,
  reduced,
}: StepIllustrationProps<"asama">) {
  const { phase } = state;
  const selected = phase === null ? null : PHASE_STEP[phase];
  const variants = answerStateVariants(reduced, 8);

  return (
    <>
      <Layer name="foundation">
        {/* Ground line the staircase stands on. */}
        <Rail
          x1={24}
          y1={STEP.baseline}
          x2={296}
          y2={STEP.baseline}
          strokeWidth={STROKE.hairline}
          className={PAINT.inkSecondary}
          opacity={0.55}
        />
      </Layer>

      <Layer name="primary-object">
        {/* Unlit steps stay outlines only, so an unreached step can never read
            as the current one in either theme. */}
        {HEIGHTS.map((height, index) =>
          index === selected ? null : (
            <Slab
              key={index}
              x={stepX(index)}
              y={STEP.baseline - height}
              width={STEP.width}
              height={height}
              depth={STEP.depth}
              fill={PAINT.fillEmpty}
              strokeWidth={STROKE.secondary}
            />
          )
        )}
      </Layer>

      <Layer name="answer-state">
        {selected === null ? null : (
          <motion.g
            initial={variants.initial}
            animate={variants.animate}
            transition={variants.transition}
          >
            <Slab
              x={stepX(selected)}
              y={STEP.baseline - HEIGHTS[selected]}
              width={STEP.width}
              height={HEIGHTS[selected]}
              depth={STEP.depth}
              fill={PAINT.fillPrimary}
              topFill={PAINT.fillSecondary}
              strokeWidth={STROKE.primary}
            />
            <Node
              cx={stepX(selected) + STEP.width / 2}
              cy={STEP.baseline - HEIGHTS[selected] - STEP.depth / 2 - 6}
              r={5}
              fill={PAINT.fillDeep}
              strokeWidth={STROKE.secondary}
            />
          </motion.g>
        )}
      </Layer>

      {compact || phase !== "returning" ? null : (
        <Layer name="motion-accent">
          <ReturnAccent
            cx={stepX(PHASE_STEP.returning) + STEP.width / 2}
            cy={STEP.baseline - HEIGHTS[PHASE_STEP.returning] - STEP.depth / 2 - 6}
          />
        </Layer>
      )}
    </>
  );
}
