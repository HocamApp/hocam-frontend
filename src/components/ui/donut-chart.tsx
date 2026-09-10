"use client";

/**
 * Animated donut, taken from the supplied component. Two notes:
 *
 * - `hsl(var(--border) / 0.5)` works here because `--border` is stored as a
 *   bare HSL triplet (`globals.css`), the form the Tailwind config wraps.
 *   Do not "fix" it into `var(--line)`, which is a hex and would produce
 *   `hsl(#e6dddd)`.
 * - Segments animate their own `strokeDashoffset`, so `framer-motion` drives
 *   the draw-on rather than a CSS transition; the component is client-only.
 */

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface DonutChartSegment {
  value: number;
  /** Any valid CSS colour. */
  color: string;
  label: string;
}

interface DonutChartProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  data: DonutChartSegment[];
  totalValue?: number;
  size?: number;
  strokeWidth?: number;
  animationDuration?: number;
  animationDelayPerSegment?: number;
  highlightOnHover?: boolean;
  centerContent?: React.ReactNode;
  /** The segment currently under the pointer, or null. */
  activeLabel?: string | null;
  /** Called when a segment is hovered or left. */
  onSegmentHover?: (segment: DonutChartSegment | null) => void;
}

const DonutChart = React.forwardRef<HTMLDivElement, DonutChartProps>(
  (
    {
      data,
      totalValue: propTotalValue,
      size = 200,
      strokeWidth = 20,
      animationDuration = 1,
      animationDelayPerSegment = 0.05,
      highlightOnHover = true,
      centerContent,
      activeLabel = null,
      onSegmentHover,
      className,
      ...props
    },
    ref,
  ) => {
    const internalTotalValue = React.useMemo(
      () => propTotalValue || data.reduce((sum, segment) => sum + segment.value, 0),
      [data, propTotalValue],
    );

    const radius = size / 2 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;
    let cumulativePercentage = 0;

    return (
      <div
        ref={ref}
        className={cn("relative flex items-center justify-center", className)}
        style={{ width: size, height: size }}
        onMouseLeave={() => onSegmentHover?.(null)}
        {...props}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
          /* Rotated so the first segment starts at twelve o'clock. */
          className="-rotate-90 overflow-visible"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="hsl(var(--border) / 0.5)"
            strokeWidth={strokeWidth}
          />

          <AnimatePresence>
            {data.map((segment, index) => {
              if (segment.value === 0) return null;

              const percentage =
                internalTotalValue === 0
                  ? 0
                  : (segment.value / internalTotalValue) * 100;

              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = (cumulativePercentage / 100) * circumference;

              const isActive = activeLabel === segment.label;

              cumulativePercentage += percentage;

              return (
                <motion.circle
                  key={segment.label || index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={-strokeDashoffset}
                  strokeLinecap="round"
                  initial={{ opacity: 0, strokeDashoffset: circumference }}
                  animate={{ opacity: 1, strokeDashoffset: -strokeDashoffset }}
                  transition={{
                    opacity: {
                      duration: 0.3,
                      delay: index * animationDelayPerSegment,
                    },
                    strokeDashoffset: {
                      duration: animationDuration,
                      delay: index * animationDelayPerSegment,
                      ease: "easeOut",
                    },
                  }}
                  className={cn(
                    "origin-center",
                    highlightOnHover && "cursor-pointer",
                  )}
                  style={{
                    filter: isActive
                      ? `drop-shadow(0px 0px 6px ${segment.color}) brightness(1.1)`
                      : "none",
                    transform: isActive ? "scale(1.03)" : "scale(1)",
                    transition: "filter 0.2s ease-out, transform 0.2s ease-out",
                  }}
                  onMouseEnter={() => onSegmentHover?.(segment)}
                />
              );
            })}
          </AnimatePresence>
        </svg>

        {centerContent && (
          <div
            className="pointer-events-none absolute flex flex-col items-center justify-center"
            style={{
              width: size - strokeWidth * 2.5,
              height: size - strokeWidth * 2.5,
            }}
          >
            {centerContent}
          </div>
        )}
      </div>
    );
  },
);

DonutChart.displayName = "DonutChart";

export { DonutChart };
