"use client";

import type { ReactNode, SVGProps } from "react";

import { cn } from "@/lib/utils";
import {
  PAINT,
  RADIUS,
  STROKE,
  type IllustrationLayer,
} from "./illustrationTokens";

/**
 * The shared shape vocabulary. Three rules hold across every primitive:
 *
 *  - Outlines are `currentColor`, so one class on the frame flips the whole
 *    family's ink between themes.
 *  - No `<defs>`, gradient or filter appears anywhere. Two illustrations are
 *    mounted at once while the desktop column cross-fades, so any id would be
 *    duplicated in the document.
 *  - Depth comes from outlines and overlapping solids, never from a shadow or an
 *    offset silhouette.
 */

/**
 * Groups every shape under a name from the closed layer vocabulary, which is how
 * a test can assert a composition — and a compact reduction — without ever
 * reading a path.
 */
export function Layer({
  name,
  children,
  ...props
}: { name: IllustrationLayer; children: ReactNode } & SVGProps<SVGGElement>) {
  return (
    <g data-layer={name} {...props}>
      {children}
    </g>
  );
}

/** A rounded plate: filled body plus outline, the family's workhorse shape. */
export function Plate({
  x,
  y,
  width,
  height,
  rx = RADIUS.standard,
  fill = PAINT.fillEmpty,
  strokeWidth = STROKE.primary,
  className,
  ...props
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
  fill?: string;
  strokeWidth?: number;
  className?: string;
} & Omit<SVGProps<SVGRectElement>, "x" | "y" | "width" | "height" | "fill">) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={rx}
      className={cn(fill, className)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      {...props}
    />
  );
}

/**
 * One isometric volume: front face, top face and right face on the family's
 * shared 2:1 rise. Every solid object in the flow is built from this, which is
 * what stops the nine screens drifting into nine perspectives.
 */
export function Slab({
  x,
  y,
  width,
  height,
  depth = 14,
  fill = PAINT.fillEmpty,
  topFill = PAINT.objectSurface,
  strokeWidth = STROKE.primary,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  depth?: number;
  fill?: string;
  topFill?: string;
  strokeWidth?: number;
}) {
  const rise = depth / 2;
  const top = `${x},${y} ${x + width},${y} ${x + width + depth},${y - rise} ${x + depth},${y - rise}`;
  const side = `${x + width},${y} ${x + width + depth},${y - rise} ${x + width + depth},${y - rise + height} ${x + width},${y + height}`;

  return (
    <g stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="miter">
      <rect x={x} y={y} width={width} height={height} className={fill} />
      <polygon points={side} className={PAINT.objectSurfaceAlt} />
      <polygon points={top} className={topFill} />
    </g>
  );
}

/** A marker or route node. */
export function Node({
  cx,
  cy,
  r,
  fill = PAINT.fillEmpty,
  strokeWidth = STROKE.primary,
  className,
  ...props
}: {
  cx: number;
  cy: number;
  r: number;
  fill?: string;
  strokeWidth?: number;
  className?: string;
} & Omit<SVGProps<SVGCircleElement>, "cx" | "cy" | "r" | "fill">) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      className={cn(fill, className)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}

/** A straight structural line: rails, ground lines, posts. */
export function Rail({
  x1,
  y1,
  x2,
  y2,
  strokeWidth = STROKE.primary,
  className,
  ...props
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeWidth?: number;
  className?: string;
} & Omit<SVGProps<SVGLineElement>, "x1" | "y1" | "x2" | "y2">) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={className}
      {...props}
    />
  );
}

/**
 * Depth is carried by the outline and by overlapping solid shapes, not by an
 * offset silhouette. The earlier offset copy read as a misregistered second
 * border rather than a shadow — obvious in dark, where an 8% white rim sat
 * outside every object.
 */
