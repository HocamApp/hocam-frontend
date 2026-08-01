"use client";

import { motion } from "framer-motion";

import { answerStateVariants } from "../motion";
import { Layer, Node, Plate, Rail } from "./primitives";
import { PAINT, RADIUS, STROKE } from "./illustrationTokens";
import type { ConcreteWindow } from "./illustrationState";
import type { StepIllustrationProps } from "./types";

/**
 * "When can you usually take lessons?" — a calendar page.
 *
 * The grid is the answer set rather than a decoration of it: seven day columns
 * split five weekday / two weekend, two rows split day / evening. Each of the
 * four concrete windows lights the cells it actually means, so the artwork and
 * the options cannot drift apart.
 *
 * Flexible replaces the cells with one continuous band instead of lighting all
 * of them. Lighting everything says "I picked all four windows"; a single band
 * says "any time", which is what the answer means. The cells are not drawn at
 * all in that state — an earlier pass laid a translucent panel over them and the
 * grid bled through as a cross in dark mode.
 */

const PAGE = { x: 44, y: 120, width: 232, height: 80 } as const;
const HEADER_HEIGHT = 22;

const COLUMNS = 7;
const WEEKEND_FROM = 5;
const CELL = { width: 28, height: 22, gap: 3, x: 53 } as const;
const ROW_Y = [150, 176] as const;

function cellX(column: number) {
  return CELL.x + column * (CELL.width + CELL.gap);
}

/** Which columns and row a window owns. */
const WINDOW_AREA: Record<ConcreteWindow, { row: 0 | 1; weekend: boolean }> = {
  weekday_day: { row: 0, weekend: false },
  weekday_evening: { row: 1, weekend: false },
  weekend_day: { row: 0, weekend: true },
  weekend_evening: { row: 1, weekend: true },
};

function columnsFor(weekend: boolean) {
  return Array.from({ length: COLUMNS }, (_, index) => index).filter((index) =>
    weekend ? index >= WEEKEND_FROM : index < WEEKEND_FROM
  );
}

export function UygunZamanlarIllustration({
  state,
  compact = false,
  reduced,
}: StepIllustrationProps<"uygun_zamanlar">) {
  const { windows, flexible } = state;
  const variants = answerStateVariants(reduced, 6);

  return (
    <>
      {compact ? null : (
        <Layer name="background">
          {/* Binder rings, so the page reads as a wall calendar rather than a table. */}
          {[110, 210].map((cx) => (
            <g key={cx}>
              <Rail x1={cx} y1={104} x2={cx} y2={124} strokeWidth={STROKE.secondary} />
              <Node
                cx={cx}
                cy={100}
                r={7}
                fill={PAINT.fillEmpty}
                strokeWidth={STROKE.secondary}
              />
            </g>
          ))}
        </Layer>
      )}

      <Layer name="primary-object">
        <Plate
          x={PAGE.x}
          y={PAGE.y}
          width={PAGE.width}
          height={PAGE.height}
          rx={RADIUS.plate}
          fill={PAINT.objectSurface}
        />
        {/* Header band */}
        <path
          d={`M${PAGE.x + RADIUS.plate} ${PAGE.y}
              H${PAGE.x + PAGE.width - RADIUS.plate}
              A${RADIUS.plate} ${RADIUS.plate} 0 0 1 ${PAGE.x + PAGE.width} ${PAGE.y + RADIUS.plate}
              V${PAGE.y + HEADER_HEIGHT}
              H${PAGE.x}
              V${PAGE.y + RADIUS.plate}
              A${RADIUS.plate} ${RADIUS.plate} 0 0 1 ${PAGE.x + RADIUS.plate} ${PAGE.y}
              Z`}
          className={PAINT.accentCoolSoft}
          stroke="currentColor"
          strokeWidth={STROKE.secondary}
          strokeLinejoin="round"
        />
        {/* Weekday / weekend divider, the only structural hint in the header */}
        <Rail
          x1={cellX(WEEKEND_FROM) - CELL.gap / 2}
          y1={PAGE.y + HEADER_HEIGHT}
          x2={cellX(WEEKEND_FROM) - CELL.gap / 2}
          y2={PAGE.y + PAGE.height}
          strokeWidth={STROKE.hairline}
          className={PAINT.inkSecondary}
          opacity={0.7}
        />
      </Layer>

      {flexible ? null : (
        <Layer name="secondary-object">
          {/* Empty day cells: outline only, so the page shows through and an
              unchosen slot cannot read as a chosen one in either theme. */}
          {ROW_Y.map((y) =>
            Array.from({ length: COLUMNS }, (_, column) => (
              <Plate
                key={`${y}-${column}`}
                x={cellX(column)}
                y={y}
                width={CELL.width}
                height={CELL.height}
                rx={RADIUS.chip}
                fill={PAINT.fillEmpty}
                strokeWidth={STROKE.hairline}
                className={PAINT.inkSecondary}
              />
            ))
          )}
        </Layer>
      )}

      <Layer name="answer-state">
        {flexible ? (
          // One continuous stretch of time, not four selections.
          <motion.g
            initial={variants.initial}
            animate={variants.animate}
            transition={variants.transition}
          >
            <Plate
              x={CELL.x}
              y={ROW_Y[0]}
              width={COLUMNS * CELL.width + (COLUMNS - 1) * CELL.gap}
              height={ROW_Y[1] + CELL.height - ROW_Y[0]}
              rx={RADIUS.standard}
              fill={PAINT.accentCoolFill}
              className={PAINT.accentCoolInk}
              strokeWidth={STROKE.secondary}
            />
          </motion.g>
        ) : (
          (Object.keys(WINDOW_AREA) as ConcreteWindow[])
            .filter((key) => windows[key])
            .map((key) => {
              const area = WINDOW_AREA[key];
              return (
                <motion.g
                  key={key}
                  initial={variants.initial}
                  animate={variants.animate}
                  transition={variants.transition}
                >
                  {columnsFor(area.weekend).map((column) => (
                    <Plate
                      key={column}
                      x={cellX(column)}
                      y={ROW_Y[area.row]}
                      width={CELL.width}
                      height={CELL.height}
                      rx={RADIUS.chip}
                      fill={PAINT.accentCoolFill}
                      className={PAINT.accentCoolInk}
                      strokeWidth={STROKE.secondary}
                    />
                  ))}
                </motion.g>
              );
            })
        )}
      </Layer>
    </>
  );
}
