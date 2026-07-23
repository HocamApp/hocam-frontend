"use client";

import { CSSProperties, useCallback, useEffect, useId, useState } from "react";
import { useReducedMotion } from "framer-motion";

const SPOTLIGHT_PADDING = 8;

export interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function measureTargets(targets: string[]): SpotlightRect[] {
  if (typeof document === "undefined") return [];
  return targets
    .map((name) =>
      document.querySelector<HTMLElement>(`[data-tutorial-target="${name}"]`)
    )
    .filter((el): el is HTMLElement => el !== null)
    .map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left - SPOTLIGHT_PADDING,
        y: rect.top - SPOTLIGHT_PADDING,
        width: rect.width + SPOTLIGHT_PADDING * 2,
        height: rect.height + SPOTLIGHT_PADDING * 2,
      };
    })
    .filter((rect) => rect.width > SPOTLIGHT_PADDING * 2 && rect.height > 0);
}

export function unionRect(rects: SpotlightRect[]): SpotlightRect | null {
  if (rects.length === 0) return null;
  const left = Math.min(...rects.map((r) => r.x));
  const top = Math.min(...rects.map((r) => r.y));
  const right = Math.max(...rects.map((r) => r.x + r.width));
  const bottom = Math.max(...rects.map((r) => r.y + r.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

/** Continuously tracks target rects (step change, resize, scroll, layout). */
export function useSpotlightRects(targets: string[]): SpotlightRect[] {
  const [rects, setRects] = useState<SpotlightRect[]>([]);
  const key = targets.join("|");

  const remeasure = useCallback(() => {
    setRects((prev) => {
      const next = measureTargets(targets);
      const changed =
        next.length !== prev.length ||
        next.some(
          (r, i) =>
            Math.abs(r.x - prev[i].x) > 1 ||
            Math.abs(r.y - prev[i].y) > 1 ||
            Math.abs(r.width - prev[i].width) > 1 ||
            Math.abs(r.height - prev[i].height) > 1
        );
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    // Bring the first target into view (the control bar is overflow-x-auto on
    // narrow screens) before the first measurement.
    const first = targets[0]
      ? document.querySelector(`[data-tutorial-target="${targets[0]}"]`)
      : null;
    first?.scrollIntoView({ block: "nearest", inline: "center", behavior: "auto" });
    remeasure();

    window.addEventListener("resize", remeasure);
    window.addEventListener("orientationchange", remeasure);
    document.addEventListener("scroll", remeasure, true);
    // Panels opening/closing shift layout without firing resize; a slow poll
    // keeps the hole glued to its control without observing the whole DOM.
    const interval = window.setInterval(remeasure, 300);
    return () => {
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("orientationchange", remeasure);
      document.removeEventListener("scroll", remeasure, true);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, remeasure]);

  return rects;
}

interface TutorialOverlayProps {
  rects: SpotlightRect[];
  /** When true, clicks outside the spotlight holes are swallowed. */
  shielded: boolean;
}

/**
 * Darkens the whole screen except animated holes over the spotlighted
 * controls. Hole movement animates via CSS transitions on the SVG geometry
 * properties (x/y/width/height are CSS-animatable per SVG2) — deliberately
 * not framer-motion, whose SVG attribute springs proved unreliable here.
 * The SVG never intercepts pointer events; separate shield rectangles around
 * the union hole block stray clicks on "try" steps.
 */
export function TutorialOverlay({ rects, shielded }: TutorialOverlayProps) {
  const reducedMotion = useReducedMotion();
  const maskId = useId();
  const union = unionRect(rects);
  const geometryTransition: CSSProperties = reducedMotion
    ? { transition: "none" }
    : {
        transition:
          "x 0.3s cubic-bezier(0.22,1,0.36,1), y 0.3s cubic-bezier(0.22,1,0.36,1), width 0.3s cubic-bezier(0.22,1,0.36,1), height 0.3s cubic-bezier(0.22,1,0.36,1)",
      };

  return (
    <>
      <svg
        className="pointer-events-none fixed inset-0 z-50 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            {rects.map((rect, index) => (
              <rect
                key={index}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                rx={10}
                fill="black"
                style={geometryTransition}
              />
            ))}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgb(0 0 0)"
          opacity={0.72}
          mask={`url(#${maskId})`}
          style={
            reducedMotion ? undefined : { transition: "opacity 0.2s ease-out" }
          }
        />
        {rects.map((rect, index) => (
          <rect
            key={`ring-${index}`}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            rx={10}
            fill="none"
            stroke="rgb(56 189 248)"
            strokeWidth={2}
            style={geometryTransition}
          />
        ))}
      </svg>
      {shielded && <ClickShields hole={union} />}
    </>
  );
}

/** Four rectangles around the hole (or one full-screen when no hole). */
function ClickShields({ hole }: { hole: SpotlightRect | null }) {
  if (!hole) {
    return <div className="fixed inset-0 z-40" aria-hidden="true" />;
  }
  const bottomOfHole = hole.y + hole.height;
  const rightOfHole = hole.x + hole.width;
  return (
    <div aria-hidden="true">
      <div
        className="fixed inset-x-0 top-0 z-40"
        style={{ height: Math.max(hole.y, 0) }}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-40"
        style={{ top: bottomOfHole }}
      />
      <div
        className="fixed z-40"
        style={{ top: hole.y, height: hole.height, left: 0, width: Math.max(hole.x, 0) }}
      />
      <div
        className="fixed z-40"
        style={{ top: hole.y, height: hole.height, left: rightOfHole, right: 0 }}
      />
    </div>
  );
}
