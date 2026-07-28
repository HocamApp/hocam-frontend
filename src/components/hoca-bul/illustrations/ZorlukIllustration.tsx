"use client";

import { motion } from "framer-motion";

import { answerStateVariants } from "../motion";
import { Layer, Node, Plate, Rail } from "./primitives";
import { PAINT, RADIUS, STROKE } from "./illustrationTokens";
import type { MatchChallenge } from "@/types";
import type { StepIllustrationProps } from "./types";

/**
 * "What is holding you back?" — hurdles on a study track.
 *
 * Each challenge is one hurdle at a fixed post, so the picture never rearranges
 * when an answer changes: the chosen hurdles light up where they already stood.
 * Lighting a hurdle says "this one is in my way" — the obstacle is the thing
 * being named, not a failure being confessed.
 */

const TRACK_Y = 198;
const HURDLE = { width: 14, barY: 156, barHeight: 10, gap: 40 } as const;
const HURDLE_X0 = 53;

/**
 * Fixed post per challenge. Exhaustive on purpose: a challenge the build does
 * not know fails here at compile time instead of silently losing its hurdle.
 * Positional only — no label ever crosses into the SVG.
 */
const POST: Record<MatchChallenge, number> = {
  foundations: 0,
  question_solving: 1,
  speed_accuracy: 2,
  consistency: 3,
  where_to_start: 4,
  advanced_questions: 5,
};

function hurdleX(index: number) {
  return HURDLE_X0 + index * HURDLE.gap;
}

function Hurdle({ x, selected }: { x: number; selected: boolean }) {
  return (
    <g>
      {/* Posts: full-weight ink once the hurdle is chosen, so the whole
          obstacle reads as selected — not just the marker above it. */}
      <Rail
        x1={x}
        y1={HURDLE.barY + HURDLE.barHeight}
        x2={x}
        y2={TRACK_Y}
        strokeWidth={selected ? STROKE.primary : STROKE.hairline}
        className={selected ? undefined : PAINT.inkSecondary}
      />
      <Rail
        x1={x + HURDLE.width}
        y1={HURDLE.barY + HURDLE.barHeight}
        x2={x + HURDLE.width}
        y2={TRACK_Y}
        strokeWidth={selected ? STROKE.primary : STROKE.hairline}
        className={selected ? undefined : PAINT.inkSecondary}
      />
      {/* Crossbar: the part that lights up */}
      <Plate
        x={x - 2}
        y={HURDLE.barY}
        width={HURDLE.width + 4}
        height={HURDLE.barHeight}
        rx={RADIUS.chip}
        fill={selected ? PAINT.fillPrimary : PAINT.fillEmpty}
        strokeWidth={selected ? STROKE.primary : STROKE.hairline}
        className={selected ? undefined : PAINT.inkSecondary}
      />
      {selected ? (
        <Node
          cx={x + HURDLE.width / 2}
          cy={HURDLE.barY - 9}
          r={5}
          fill={PAINT.fillDeep}
          strokeWidth={STROKE.secondary}
        />
      ) : null}
    </g>
  );
}

export function ZorlukIllustration({
  state,
  reduced,
}: StepIllustrationProps<"zorluk">) {
  const { gates } = state;
  const variants = answerStateVariants(reduced, 8);

  return (
    <>
      <Layer name="foundation">
        {/* The track every hurdle stands on. */}
        <Rail
          x1={32}
          y1={TRACK_Y}
          x2={288}
          y2={TRACK_Y}
          strokeWidth={STROKE.hairline}
          className={PAINT.inkSecondary}
          opacity={0.55}
        />
      </Layer>

      <Layer name="primary-object">
        {/* Unchosen hurdles stay hairline outlines. */}
        {Object.values(POST).map((index) =>
          gates.some((gate) => POST[gate] === index) ? null : (
            <Hurdle key={index} x={hurdleX(index)} selected={false} />
          )
        )}
      </Layer>

      <Layer name="answer-state">
        {gates.map((gate, order) => (
          <motion.g
            key={gate}
            initial={variants.initial}
            animate={variants.animate}
            transition={{
              ...variants.transition,
              delay: reduced ? 0 : order * 0.05,
            }}
          >
            <Hurdle x={hurdleX(POST[gate])} selected />
          </motion.g>
        ))}
      </Layer>
    </>
  );
}
