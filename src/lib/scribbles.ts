/**
 * Decorative scribble assets exported from the Figma file
 * "Hocam — Scribble Foundation" (page "05 — Editable Website Capture").
 *
 * These are purely ornamental background shapes. They carry no meaning, are
 * never announced to assistive technology and never react to pointer input.
 * See `docs/design/scribbles/README.md` for the Figma frame ↔ asset mapping.
 */

export type ScribbleAssetName =
  | "blob-pink-dotted"
  | "blob-yellow"
  | "blob-blue"
  | "blob-pink-flame"
  | "accent-curl"
  | "accent-target-ring"
  | "accent-diamond"
  | "accent-vertical-curl"
  | "accent-spark";

export interface ScribbleAsset {
  src: string;
  /** Intrinsic size of the SVG, used to keep the aspect ratio locked. */
  width: number;
  height: number;
}

export const SCRIBBLE_ASSETS: Record<ScribbleAssetName, ScribbleAsset> = {
  "blob-pink-dotted": {
    src: "/scribbles/blob-pink-dotted.svg",
    width: 283,
    height: 300,
  },
  "blob-yellow": { src: "/scribbles/blob-yellow.svg", width: 200, height: 198 },
  "blob-blue": { src: "/scribbles/blob-blue.svg", width: 156, height: 136 },
  "blob-pink-flame": {
    src: "/scribbles/blob-pink-flame.svg",
    width: 123,
    height: 138,
  },
  "accent-curl": { src: "/scribbles/accent-curl.svg", width: 34, height: 51 },
  "accent-target-ring": {
    src: "/scribbles/accent-target-ring.svg",
    width: 87,
    height: 89,
  },
  "accent-diamond": {
    src: "/scribbles/accent-diamond.svg",
    width: 28,
    height: 36,
  },
  "accent-vertical-curl": {
    src: "/scribbles/accent-vertical-curl.svg",
    width: 42,
    height: 97,
  },
  "accent-spark": { src: "/scribbles/accent-spark.svg", width: 40, height: 54 },
};

/**
 * Which breakpoints a decoration is allowed to show at. Resolved to static
 * Tailwind classes so the decision stays in CSS — no viewport measurement in
 * JS, no hydration mismatch.
 */
export type ScribbleVisibility = "always" | "narrow-up" | "md-up" | "lg-up";

/**
 * `left` / `right` bleed off that page edge and leave `reveal` px visible.
 * `inset-left` / `inset-right` sit fully inside, `inset` px from that edge.
 */
export type ScribbleSide = "left" | "right" | "inset-left" | "inset-right";

export interface ScribblePlacement {
  asset: ScribbleAssetName;
  /** Vertical anchor as a percentage of the host section's height. */
  top: number;
  /** Width at a 1440px viewport, in px. Scales down proportionally below that. */
  width: number;
  opacity: number;
  /**
   * Degrees, applied via CSS transform so one SVG serves every rotation.
   * Note the sign: CSS rotates clockwise while Figma rotates counter-clockwise,
   * so a Figma rotation of `r` is transcribed here as `-r`.
   */
  rotate?: number;
  side: ScribbleSide;
  /** Bleeding sides: px of the shape that stay inside the viewport edge. */
  reveal?: number;
  /** Inset sides: distance from that edge in px. */
  inset?: number;
  visibility?: ScribbleVisibility;
  /** Stable key + a hint of intent for anyone reading the DOM. */
  id: string;
}

/**
 * One clip box worth of decorations. A section usually needs a single layer;
 * it needs more only when two shapes want different vertical clipping — e.g.
 * one bleeding up across the section boundary while another is deliberately cut
 * off exactly at it.
 */
export interface ScribbleLayerSpec {
  items: readonly ScribblePlacement[];
  /** px the clip box extends above the section. 0 clips on the section edge. */
  bleedTop?: number;
  /** px the clip box extends below the section. */
  bleedBottom?: number;
}

/** The design reference is a 1440px-wide Figma frame. */
export const SCRIBBLE_REFERENCE_WIDTH = 1440;

/** Smallest share of the desktop size a decoration may shrink to. */
const MIN_SCALE = 0.45;

/**
 * A px value from the 1440px design that scales with the viewport but never
 * grows past its design size. `x vw` equals `x * 14.4` px at 1440px wide.
 */
export function fluidPx(designPx: number, minScale = MIN_SCALE): string {
  const vw = (designPx / SCRIBBLE_REFERENCE_WIDTH) * 100;
  return `clamp(${Math.round(designPx * minScale)}px, ${vw.toFixed(3)}vw, ${designPx}px)`;
}

/** Same idea, but without a floor — used for edge reveal distances. */
export function shrinkingPx(designPx: number): string {
  const vw = (designPx / SCRIBBLE_REFERENCE_WIDTH) * 100;
  return `min(${designPx}px, ${vw.toFixed(3)}vw)`;
}
