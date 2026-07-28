"use client";

import { motion } from "framer-motion";

import { answerStateVariants } from "../motion";
import { Layer, Plate, Rail, Slab } from "./primitives";
import { PAINT, RADIUS, STROKE } from "./illustrationTokens";
import type { StepIllustrationProps } from "./types";

/**
 * "What budget feels right?" — three plain value levels.
 *
 * Three ascending platforms stand for the three bands. They are deliberately
 * neutral: no coins, no currency, no price is ever drawn — the step the
 * student lights is a position on a scale, nothing about wealth or status.
 *
 * Flexible is not a fourth level and not all three lit: it is one broad band
 * spanning the whole scale, the same "one continuous range" language the
 * availability step uses for "any time".
 */

const LEVEL = { width: 56, gap: 12, baseline: 196, depth: 8 } as const;
const HEIGHTS = [24, 44, 64] as const;

function levelX(index: number) {
  return 64 + index * (LEVEL.width + LEVEL.gap);
}

export function ButceIllustration({
  state,
  reduced,
}: StepIllustrationProps<"butce">) {
  const { band, flexible } = state;
  const variants = answerStateVariants(reduced, 8);

  return (
    <>
      <Layer name="foundation">
        {/* Ground line the scale stands on. */}
        <Rail
          x1={48}
          y1={LEVEL.baseline}
          x2={272}
          y2={LEVEL.baseline}
          strokeWidth={STROKE.hairline}
          className={PAINT.inkSecondary}
          opacity={0.55}
        />
      </Layer>

      <Layer name="primary-object">
        {/* Unlit levels stay outlines only. */}
        {HEIGHTS.map((height, index) =>
          band === index + 1 ? null : (
            <Slab
              key={index}
              x={levelX(index)}
              y={LEVEL.baseline - height}
              width={LEVEL.width}
              height={height}
              depth={LEVEL.depth}
              fill={PAINT.fillEmpty}
              strokeWidth={STROKE.secondary}
            />
          )
        )}
      </Layer>

      <Layer name="answer-state">
        {band !== null && !flexible ? (
          <motion.g
            initial={variants.initial}
            animate={variants.animate}
            transition={variants.transition}
          >
            <Slab
              x={levelX(band - 1)}
              y={LEVEL.baseline - HEIGHTS[band - 1]}
              width={LEVEL.width}
              height={HEIGHTS[band - 1]}
              depth={LEVEL.depth}
              fill={PAINT.fillPrimary}
              topFill={PAINT.fillSecondary}
              strokeWidth={STROKE.primary}
            />
          </motion.g>
        ) : null}

        {flexible ? (
          // One broad range across the whole scale, not three selections.
          <motion.g
            initial={variants.initial}
            animate={variants.animate}
            transition={variants.transition}
          >
            <Plate
              x={levelX(0) - 8}
              y={124}
              width={3 * LEVEL.width + 2 * LEVEL.gap + 16}
              height={18}
              rx={RADIUS.standard}
              fill={PAINT.accentCoolFill}
              className={PAINT.accentCoolInk}
              strokeWidth={STROKE.secondary}
            />
          </motion.g>
        ) : null}
      </Layer>
    </>
  );
}
