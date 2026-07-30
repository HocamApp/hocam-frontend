import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";
import {
  SCRIBBLE_ASSETS,
  fluidPx,
  shrinkingPx,
  type ScribblePlacement,
  type ScribbleVisibility,
} from "@/lib/scribbles";

/**
 * Static class strings so Tailwind can see them at build time. Visibility is a
 * CSS decision on purpose — measuring the viewport in JS would cost a client
 * component and risk a hydration mismatch.
 */
const VISIBILITY_CLASS: Record<ScribbleVisibility, string> = {
  always: "block",
  "narrow-up": "hidden min-[390px]:block",
  "md-up": "hidden md:block",
  "lg-up": "hidden lg:block",
};

/**
 * One decorative shape. Rendered as a background image on an empty span: no
 * child nodes, no JS bundle cost, and the browser caches the SVG across pages.
 */
export function Scribble({ placement }: { placement: ScribblePlacement }) {
  const asset = SCRIBBLE_ASSETS[placement.asset];
  const width = fluidPx(placement.width);

  const style: CSSProperties = {
    top: `${placement.top}%`,
    width,
    aspectRatio: `${asset.width} / ${asset.height}`,
    opacity: placement.opacity,
    backgroundImage: `url(${asset.src})`,
    transform: placement.rotate ? `rotate(${placement.rotate}deg)` : undefined,
  };

  if (placement.side === "inset-left" || placement.side === "inset-right") {
    // Anchored a fixed distance inside one edge of the section.
    const offset = shrinkingPx(placement.inset ?? 0);
    if (placement.side === "inset-left") style.left = offset;
    else style.right = offset;
  } else {
    // Bleeds off the page edge, leaving `reveal` px visible.
    const offset = `calc(${shrinkingPx(placement.reveal ?? 0)} - ${width})`;
    if (placement.side === "left") style.left = offset;
    else style.right = offset;
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute select-none bg-contain bg-center bg-no-repeat",
        VISIBILITY_CLASS[placement.visibility ?? "always"],
      )}
      style={style}
    />
  );
}
