"use client";

import { motion } from "framer-motion";

import { answerStateVariants } from "../motion";
import { Layer, Plate, Rail } from "./primitives";
import { PAINT, RADIUS, STROKE } from "./illustrationTokens";
import type { StepIllustrationProps } from "./types";

/**
 * "Which subjects do you need help with?" — books filling a shelf.
 *
 * Three standing books make the three-subject limit legible without a sentence,
 * the way the old rack did, but as an object a student recognises rather than a
 * row of empty input fields.
 *
 * Every selected book takes the same brand fill. An earlier pass cycled three
 * different hues by slot, which implied the subjects differed in kind and left
 * the third book so pale in light mode that it read as an empty slot.
 */

const SHELF = { x: 40, y: 192, width: 240, height: 8 } as const;
const BOOK = { width: 56, height: 68, top: 124 } as const;
const SLOTS = [60, 132, 204] as const;

function Book({ x, selected }: { x: number; selected: boolean }) {
  const spineWidth = 14;
  return (
    <g>
      {/* Cover */}
      <Plate
        x={x}
        y={BOOK.top}
        width={BOOK.width}
        height={BOOK.height}
        rx={RADIUS.chip}
        fill={selected ? PAINT.fillPrimary : PAINT.fillEmpty}
        strokeWidth={selected ? STROKE.primary : STROKE.secondary}
      />
      {/* Spine band down the left edge */}
      <Plate
        x={x}
        y={BOOK.top}
        width={spineWidth}
        height={BOOK.height}
        rx={RADIUS.chip}
        fill={selected ? PAINT.fillDeep : PAINT.fillEmpty}
        strokeWidth={selected ? STROKE.secondary : STROKE.hairline}
      />
      {/* Page block along the right edge, so the cover reads as a book */}
      <Rail
        x1={x + BOOK.width - 7}
        y1={BOOK.top + 8}
        x2={x + BOOK.width - 7}
        y2={BOOK.top + BOOK.height - 8}
        strokeWidth={STROKE.hairline}
        className={selected ? undefined : PAINT.inkSecondary}
        opacity={selected ? 0.7 : 0.5}
      />
      {selected ? (
        <>
          {/* Title rules, only once the book is actually chosen */}
          <Rail
            x1={x + spineWidth + 10}
            y1={BOOK.top + 26}
            x2={x + BOOK.width - 16}
            y2={BOOK.top + 26}
            strokeWidth={STROKE.hairline}
            opacity={0.75}
          />
          <Rail
            x1={x + spineWidth + 10}
            y1={BOOK.top + 38}
            x2={x + BOOK.width - 24}
            y2={BOOK.top + 38}
            strokeWidth={STROKE.hairline}
            opacity={0.75}
          />
          {/* Bookmark ribbon */}
          <polygon
            points={`${x + BOOK.width - 22},${BOOK.top} ${x + BOOK.width - 22},${BOOK.top + 26} ${x + BOOK.width - 30},${BOOK.top + 19} ${x + BOOK.width - 38},${BOOK.top + 26} ${x + BOOK.width - 38},${BOOK.top}`}
            className={PAINT.fillSecondary}
            stroke="currentColor"
            strokeWidth={STROKE.hairline}
            strokeLinejoin="round"
          />
        </>
      ) : null}
    </g>
  );
}

export function DerslerIllustration({
  state,
  compact = false,
  reduced,
}: StepIllustrationProps<"dersler">) {
  const { count } = state;
  const variants = answerStateVariants(reduced, 10);

  return (
    <>
      {compact ? null : (
        <Layer name="background">
          {/* An open book resting above the shelf, for context on desktop only. */}
          <g opacity={0.5}>
            <path
              d="M116 86 C 134 76, 152 76, 160 82 C 168 76, 186 76, 204 86 L 204 62 C 186 54, 168 54, 160 60 C 152 54, 134 54, 116 62 Z"
              className={PAINT.objectSurfaceAlt}
              stroke="currentColor"
              strokeWidth={STROKE.secondary}
              strokeLinejoin="round"
            />
            <Rail x1={160} y1={60} x2={160} y2={82} strokeWidth={STROKE.hairline} />
          </g>
        </Layer>
      )}

      <Layer name="primary-object">
        {/* Empty books stay as outlines only, so the panel shows through and an
            unchosen subject can never read as a chosen one in either theme. */}
        {SLOTS.map((x, index) =>
          index < count ? null : <Book key={x} x={x} selected={false} />
        )}
      </Layer>

      <Layer name="answer-state">
        {SLOTS.slice(0, count).map((x, index) => (
          <motion.g
            key={x}
            initial={variants.initial}
            animate={variants.animate}
            transition={{
              ...variants.transition,
              delay: reduced ? 0 : index * 0.05,
            }}
          >
            <Book x={x} selected />
          </motion.g>
        ))}
      </Layer>

      <Layer name="foundation">
        <Plate
          x={SHELF.x}
          y={SHELF.y}
          width={SHELF.width}
          height={SHELF.height}
          rx={RADIUS.chip}
          fill={PAINT.objectSurfaceAlt}
        />
      </Layer>
    </>
  );
}
