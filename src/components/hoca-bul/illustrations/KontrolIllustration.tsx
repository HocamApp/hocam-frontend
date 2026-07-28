"use client";

import { motion } from "framer-motion";

import { assemblyVariants } from "../motion";
import { Layer, Plate, Rail } from "./primitives";
import { PAINT, RADIUS, STROKE } from "./illustrationTokens";
import type { StepIllustrationProps } from "./types";

/**
 * "Check your answers" — the checklist the flow has been writing.
 *
 * One row per answered question, laid out as a card the student has been
 * filling in all along. Rows assemble with the review's own staggered motion
 * contract — the only staggered motion in the family, reserved for this step.
 *
 * A filled row is an answer that exists, not a success: the tick and the fill
 * stay the same whether one row or every row is done, so the card can never
 * read as a score, a match result or a submission.
 */

const CARD = { x: 72, y: 124, width: 176, height: 74 } as const;
const CLIP = { width: 40, height: 10 } as const;

const COLUMNS = [92, 168] as const;
const ROW_Y = [140, 153, 166, 179] as const;
const BOX = 10;

/** Row index -> grid position, filling column by column. */
function rowPosition(index: number) {
  const column = Math.floor(index / ROW_Y.length);
  const row = index % ROW_Y.length;
  return { x: COLUMNS[column] ?? COLUMNS[0], y: ROW_Y[row] ?? ROW_Y[0] };
}

function Row({ index, filled }: { index: number; filled: boolean }) {
  const { x, y } = rowPosition(index);
  return (
    <g>
      <Plate
        x={x}
        y={y}
        width={BOX}
        height={BOX}
        rx={2}
        fill={filled ? PAINT.fillPrimary : PAINT.fillEmpty}
        strokeWidth={filled ? STROKE.secondary : STROKE.hairline}
        className={filled ? undefined : PAINT.inkSecondary}
      />
      {filled ? (
        <polyline
          points={`${x + 2.5},${y + 5.5} ${x + 4.5},${y + 7.5} ${x + 7.5},${y + 2.5}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE.hairline}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {/* The answer's line on the card — a rule, never text. */}
      <Rail
        x1={x + BOX + 6}
        y1={y + BOX / 2}
        x2={x + BOX + 38}
        y2={y + BOX / 2}
        strokeWidth={STROKE.hairline}
        className={filled ? undefined : PAINT.inkSecondary}
        opacity={filled ? 0.8 : 0.5}
      />
    </g>
  );
}

export function KontrolIllustration({
  state,
  reduced,
}: StepIllustrationProps<"kontrol">) {
  const { filled, total } = state;

  return (
    <>
      <Layer name="primary-object">
        {/* The card and its clip: the one object every row lives on. */}
        <Plate
          x={CARD.x}
          y={CARD.y}
          width={CARD.width}
          height={CARD.height}
          rx={RADIUS.plate}
          fill={PAINT.objectSurface}
        />
        <Plate
          x={CARD.x + CARD.width / 2 - CLIP.width / 2}
          y={CARD.y - 4}
          width={CLIP.width}
          height={CLIP.height}
          rx={RADIUS.chip}
          fill={PAINT.objectSurfaceAlt}
          strokeWidth={STROKE.secondary}
        />
      </Layer>

      <Layer name="secondary-object">
        {/* Rows still open stay hairline outlines. */}
        {Array.from({ length: total }, (_, index) =>
          index < filled ? null : (
            <motion.g
              key={index}
              initial={assemblyVariants(reduced, index).initial}
              animate={assemblyVariants(reduced, index).animate}
              transition={assemblyVariants(reduced, index).transition}
            >
              <Row index={index} filled={false} />
            </motion.g>
          )
        )}
      </Layer>

      <Layer name="answer-state">
        {Array.from({ length: Math.min(filled, total) }, (_, index) => (
          <motion.g
            key={index}
            initial={assemblyVariants(reduced, index).initial}
            animate={assemblyVariants(reduced, index).animate}
            transition={assemblyVariants(reduced, index).transition}
          >
            <Row index={index} filled />
          </motion.g>
        ))}
      </Layer>
    </>
  );
}
