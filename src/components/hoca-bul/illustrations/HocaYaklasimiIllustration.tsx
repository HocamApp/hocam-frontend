"use client";

import { motion } from "framer-motion";
import type { ReactElement } from "react";

import { answerStateVariants } from "../motion";
import { Layer, Node, Plate, Rail } from "./primitives";
import { PAINT, RADIUS, STROKE } from "./illustrationTokens";
import type { TutorTeachingStyle } from "@/types";
import type { StepIllustrationProps } from "./types";

/**
 * "How should your tutor teach?" — the tools on a tutor's desk.
 *
 * One recognisable tool per teaching style, standing at a fixed place on the
 * desk. Choosing a style lights its tool; the desk and the other tools stay
 * exactly where they were. No hands, no people: the approach is told through
 * what the tutor works with.
 */

const DESK = { x: 40, y: 196, width: 240, height: 8 } as const;

/** Desk slot per style. Positional only — no label ever crosses into the SVG. */
const SLOT: Record<TutorTeachingStyle, number> = {
  foundations_patient: 0,
  question_speed: 1,
  planning_accountability: 2,
  motivating_communication: 3,
  high_target: 4,
};

function slotX(index: number) {
  return 64 + index * 48;
}

function ToolBook({ x, selected }: { x: number; selected: boolean }) {
  return (
    <g>
      <Plate
        x={x - 14}
        y={158}
        width={28}
        height={38}
        rx={RADIUS.chip}
        fill={selected ? PAINT.fillPrimary : PAINT.fillEmpty}
        strokeWidth={selected ? STROKE.secondary : STROKE.hairline}
        className={selected ? undefined : PAINT.inkSecondary}
      />
      {/* Spine band */}
      <Rail
        x1={x - 7}
        y1={165}
        x2={x - 7}
        y2={189}
        strokeWidth={STROKE.hairline}
        opacity={0.7}
      />
      {/* Page edge along the right side, so the cover reads as a book */}
      <Rail
        x1={x + 9}
        y1={165}
        x2={x + 9}
        y2={189}
        strokeWidth={STROKE.hairline}
        opacity={0.7}
      />
    </g>
  );
}

function ToolPencil({ x, selected }: { x: number; selected: boolean }) {
  return (
    <g transform={`rotate(-20 ${x} ${DESK.y})`}>
      <Plate
        x={x - 5}
        y={162}
        width={10}
        height={28}
        rx={2}
        fill={selected ? PAINT.fillPrimary : PAINT.fillEmpty}
        strokeWidth={selected ? STROKE.secondary : STROKE.hairline}
        className={selected ? undefined : PAINT.inkSecondary}
      />
      {/* Sharpened tip */}
      <polygon
        points={`${x - 5},162 ${x + 5},162 ${x},152`}
        className={selected ? PAINT.fillDeep : PAINT.fillEmpty}
        stroke="currentColor"
        strokeWidth={STROKE.hairline}
        strokeLinejoin="round"
      />
    </g>
  );
}

function ToolRuler({ x, selected }: { x: number; selected: boolean }) {
  return (
    <g>
      <Plate
        x={x - 20}
        y={178}
        width={40}
        height={12}
        rx={2}
        fill={selected ? PAINT.fillPrimary : PAINT.fillEmpty}
        strokeWidth={selected ? STROKE.secondary : STROKE.hairline}
        className={selected ? undefined : PAINT.inkSecondary}
      />
      {/* Measuring ticks */}
      {[-13, -4, 5, 14].map((offset) => (
        <Rail
          key={offset}
          x1={x + offset}
          y1={178}
          x2={x + offset}
          y2={184}
          strokeWidth={STROKE.hairline}
          opacity={0.7}
        />
      ))}
    </g>
  );
}

function ToolBubble({ x, selected }: { x: number; selected: boolean }) {
  return (
    <g>
      <Plate
        x={x - 16}
        y={156}
        width={32}
        height={20}
        rx={RADIUS.standard}
        fill={selected ? PAINT.fillPrimary : PAINT.fillEmpty}
        strokeWidth={selected ? STROKE.secondary : STROKE.hairline}
        className={selected ? undefined : PAINT.inkSecondary}
      />
      {/* Speech tail */}
      <polygon
        points={`${x - 9},175 ${x - 2},175 ${x - 11},187`}
        className={selected ? PAINT.fillPrimary : PAINT.fillEmpty}
        stroke="currentColor"
        strokeWidth={STROKE.hairline}
        strokeLinejoin="round"
      />
    </g>
  );
}

function ToolTarget({ x, selected }: { x: number; selected: boolean }) {
  return (
    <g>
      {[15, 9.5, 4].map((r, index) => (
        <Node
          key={r}
          cx={x}
          cy={176}
          r={r}
          fill={
            index === 2
              ? selected
                ? PAINT.fillDeep
                : PAINT.fillEmpty
              : index === 1 && selected
                ? PAINT.fillPrimary
                : PAINT.fillEmpty
          }
          strokeWidth={index === 0 ? STROKE.secondary : STROKE.hairline}
          className={selected ? undefined : PAINT.inkSecondary}
        />
      ))}
    </g>
  );
}

const TOOL: Record<
  TutorTeachingStyle,
  (props: { x: number; selected: boolean }) => ReactElement
> = {
  foundations_patient: ToolBook,
  question_speed: ToolPencil,
  planning_accountability: ToolRuler,
  motivating_communication: ToolBubble,
  high_target: ToolTarget,
};

export function HocaYaklasimiIllustration({
  state,
  reduced,
}: StepIllustrationProps<"hoca_yaklasimi">) {
  const { tools } = state;
  const variants = answerStateVariants(reduced, 8);

  return (
    <>
      <Layer name="foundation">
        <Plate
          x={DESK.x}
          y={DESK.y}
          width={DESK.width}
          height={DESK.height}
          rx={RADIUS.chip}
          fill={PAINT.objectSurfaceAlt}
        />
      </Layer>

      <Layer name="primary-object">
        {/* Unchosen tools stay hairline outlines on the desk. */}
        {(Object.keys(SLOT) as TutorTeachingStyle[]).map((style) =>
          tools.includes(style) ? null : (
            <g key={style}>
              {TOOL[style]({ x: slotX(SLOT[style]), selected: false })}
            </g>
          )
        )}
      </Layer>

      <Layer name="answer-state">
        {tools.map((style, order) => (
          <motion.g
            key={style}
            initial={variants.initial}
            animate={variants.animate}
            transition={{
              ...variants.transition,
              delay: reduced ? 0 : order * 0.05,
            }}
          >
            {TOOL[style]({ x: slotX(SLOT[style]), selected: true })}
          </motion.g>
        ))}
      </Layer>
    </>
  );
}
