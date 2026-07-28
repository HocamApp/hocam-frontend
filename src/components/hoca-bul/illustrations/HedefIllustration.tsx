"use client";

import { motion } from "framer-motion";

import { answerStateVariants } from "../motion";
import { Layer, Node, Rail } from "./primitives";
import { PAINT, STROKE } from "./illustrationTokens";
import type { StepIllustrationProps } from "./types";

/**
 * "Which exam are you preparing for?" — an archery target with an arrow on its
 * way to it.
 *
 * The target never moves. Choosing an answer only changes what happens *at* the
 * target, so switching goals can never make the composition jump — the previous
 * signpost slid its only plate the whole length of the post when the goal
 * changed, which read as breakage rather than a change of answer.
 *
 * Undecided is the honest middle state: the arrow exists and is aimed, but has
 * not landed, and the target stays open.
 */

const TARGET = { cx: 196, cy: 160 } as const;

/**
 * Outermost first. Sized so the outer ring's stroke clears the compact band's
 * edges rather than being shaved off by them.
 */
const RINGS = [40, 30, 20, 10] as const;

/** How many rings fill inwards for each goal. Distinguishes the answers; implies no ranking. */
const FILLED_RINGS: Record<string, number> = {
  YKS: 4,
  DGS: 3,
  KPSS: 2,
};

/** Trajectory the arrow travels toward the target. */
const FLIGHT = "M52 192 C 100 186, 136 176, 168 166";

function Arrow({ landed }: { landed: boolean }) {
  // Landed: the head is buried in the target. In flight: the whole arrow sits
  // back along the trajectory, still short of it.
  const tipX = landed ? 188 : 130;
  const tipY = landed ? 161 : 178;
  const tailX = tipX - 58;
  const tailY = tipY + 14;

  // Fletching is drawn as feather strokes, not a filled triangle. A triangle at
  // the tail reads as a second arrowhead pointing the same way.
  const feather = (t: number) => {
    const fx = tailX + (tipX - tailX) * t;
    const fy = tailY + (tipY - tailY) * t;
    return (
      <Rail
        key={t}
        x1={fx}
        y1={fy}
        x2={fx + 4}
        y2={fy - 10}
        strokeWidth={STROKE.hairline}
      />
    );
  };

  return (
    <g>
      <Rail x1={tailX} y1={tailY} x2={tipX} y2={tipY} strokeWidth={STROKE.secondary} />
      <polygon
        points={`${tipX},${tipY} ${tipX - 14},${tipY - 4} ${tipX - 12},${tipY + 8}`}
        className={PAINT.fillDeep}
        stroke="currentColor"
        strokeWidth={STROKE.secondary}
        strokeLinejoin="round"
      />
      {[0, 0.1, 0.2].map(feather)}
    </g>
  );
}

export function HedefIllustration({
  state,
  compact = false,
  reduced,
}: StepIllustrationProps<"hedef">) {
  const { goal } = state;
  const decided = goal !== null && goal !== "UNDECIDED";
  const filled = goal ? FILLED_RINGS[goal] ?? 0 : 0;
  const variants = answerStateVariants(reduced, 6);

  return (
    <>
      {compact ? null : (
        <Layer name="background">
          {/* Ground the target sits on, and a horizon to stop it floating. */}
          <Rail
            x1={40}
            y1={244}
            x2={280}
            y2={244}
            strokeWidth={STROKE.hairline}
            className={PAINT.inkSecondary}
            opacity={0.55}
          />
          <Rail
            x1={TARGET.cx}
            y1={198}
            x2={TARGET.cx - 16}
            y2={244}
            strokeWidth={STROKE.secondary}
          />
          <Rail
            x1={TARGET.cx}
            y1={198}
            x2={TARGET.cx + 16}
            y2={244}
            strokeWidth={STROKE.secondary}
          />
        </Layer>
      )}

      <Layer name="primary-object">
        {/* The target itself: fixed, and the same object in every answer state. */}
        {RINGS.map((r, index) => (
          <Node
            key={r}
            cx={TARGET.cx}
            cy={TARGET.cy}
            r={r}
            fill={index === 0 ? PAINT.objectSurface : PAINT.fillEmpty}
            strokeWidth={index === 0 ? STROKE.primary : STROKE.secondary}
          />
        ))}
      </Layer>

      <Layer name="answer-state">
        {/* Rings fill from the centre outwards, so each goal reads differently
            without any of them looking like more or less of an achievement. */}
        {RINGS.map((r, index) => {
          const depth = RINGS.length - index; // 1 = bullseye
          if (depth > filled) return null;
          return (
            <motion.g
              key={r}
              initial={variants.initial}
              animate={variants.animate}
              transition={{
                ...variants.transition,
                delay: reduced ? 0 : (filled - depth) * 0.05,
              }}
            >
              <Node
                cx={TARGET.cx}
                cy={TARGET.cy}
                r={r}
                fill={depth === 1 ? PAINT.fillDeep : PAINT.fillPrimary}
                strokeWidth={index === 0 ? STROKE.primary : STROKE.secondary}
              />
            </motion.g>
          );
        })}

        {goal === null ? null : (
          <motion.g
            initial={variants.initial}
            animate={variants.animate}
            transition={variants.transition}
          >
            <Arrow landed={decided} />
          </motion.g>
        )}
      </Layer>

      <Layer name="secondary-object">
        {/* Dashed while the arrow is still travelling, solid once it has landed. */}
        <path
          d={FLIGHT}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE.hairline}
          strokeLinecap="round"
          strokeDasharray={decided ? undefined : "5 7"}
          opacity={goal === null ? 0.3 : 0.6}
        />
      </Layer>
    </>
  );
}
