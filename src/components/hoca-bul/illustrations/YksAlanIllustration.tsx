"use client";

import { motion } from "framer-motion";

import { answerStateVariants } from "../motion";
import { Layer, Node, Plate, Rail } from "./primitives";
import { PAINT, RADIUS, STROKE } from "./illustrationTokens";
import type { StepIllustrationProps } from "./types";

/**
 * "Which YKS fields are you aiming at?" — three parallel exam paths.
 *
 * Three lanes run side by side, one per field. Any subset can be lit, because
 * the answer itself is a multi-select; the lanes never move, so toggling one
 * reads as a light going on, not as the picture rearranging itself.
 *
 * "Unsure" is not a fourth lane and not all three: it is one undecided route
 * still finding its way, drawn dashed in the same language as the goal step's
 * trajectory. The lanes stay open behind it.
 */

const LANE = { x: 52, width: 216, height: 18 } as const;
const LANE_Y = [134, 160, 186] as const;

/** Lane index per field. Positional only — no label ever crosses into the SVG. */
const LANES = ["tyt", "ayt", "ydt"] as const;

/** The undecided route, meandering across the open lanes. */
const ROUTE = "M64 170 C 112 148, 168 194, 246 158";

function LaneEnd({ cy }: { cy: number }) {
  return (
    <Node
      cx={LANE.x + LANE.width - 20}
      cy={cy}
      r={7}
      fill={PAINT.fillDeep}
      strokeWidth={STROKE.secondary}
    />
  );
}

export function YksAlanIllustration({
  state,
  reduced,
}: StepIllustrationProps<"yks_alan">) {
  const { lanes, unsure } = state;
  const variants = answerStateVariants(reduced, 6);

  return (
    <>
      <Layer name="primary-object">
        {/* Unchosen lanes stay hairline outlines, so the panel shows through and
            an unchosen path cannot read as a chosen one in either theme. */}
        {LANE_Y.map((y) => (
          <Plate
            key={y}
            x={LANE.x}
            y={y - LANE.height / 2}
            width={LANE.width}
            height={LANE.height}
            rx={RADIUS.chip}
            fill={PAINT.fillEmpty}
            strokeWidth={STROKE.secondary}
            className={PAINT.inkSecondary}
          />
        ))}
      </Layer>

      <Layer name="answer-state">
        {LANES.map((key, index) =>
          !lanes[key] ? null : (
            <motion.g
              key={key}
              initial={variants.initial}
              animate={variants.animate}
              transition={{
                ...variants.transition,
                delay: reduced ? 0 : index * 0.05,
              }}
            >
              <Plate
                x={LANE.x}
                y={LANE_Y[index] - LANE.height / 2}
                width={LANE.width}
                height={LANE.height}
                rx={RADIUS.chip}
                fill={PAINT.fillPrimary}
                strokeWidth={STROKE.primary}
              />
              <LaneEnd cy={LANE_Y[index]} />
            </motion.g>
          )
        )}

        {unsure ? (
          <motion.g
            initial={variants.initial}
            animate={variants.animate}
            transition={variants.transition}
          >
            <path
              d={ROUTE}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE.secondary}
              strokeLinecap="round"
              strokeDasharray="6 6"
            />
            {/* The route's head: still travelling, so it is an open pointer,
                not a landed arrowhead. Big enough to read at band size. */}
            <polygon
              points="256,156 238,150 241,168"
              className={PAINT.fillDeep}
              stroke="currentColor"
              strokeWidth={STROKE.secondary}
              strokeLinejoin="round"
            />
          </motion.g>
        ) : null}
      </Layer>

      <Layer name="secondary-object">
        {/* Direction ticks at the lanes' origin, so they read as paths going
            somewhere rather than as three buttons. */}
        {LANE_Y.map((y) => (
          <Rail
            key={y}
            x1={LANE.x - 14}
            y1={y}
            x2={LANE.x - 6}
            y2={y}
            strokeWidth={STROKE.hairline}
            className={PAINT.inkSecondary}
            opacity={0.6}
          />
        ))}
      </Layer>
    </>
  );
}
