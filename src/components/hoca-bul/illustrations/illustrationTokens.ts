/**
 * Paint and geometry vocabulary for the /hoca-bul illustration family.
 *
 * Every artwork references a role from here rather than a colour, so the whole
 * family follows the theme through one place. Two rules make dark mode work
 * without a second palette:
 *
 *  - Outline ink is `currentColor`, and the frame sets `text-foreground`, which
 *    inverts near-black to near-white. `--primary` is deliberately unused: it is
 *    near-black in light but bright blue in dark, so it would flip the ink hue
 *    rather than its lightness.
 *  - Fills name both halves explicitly (`fill-x dark:fill-y`), because an
 *    answered shape has to stay readable against two very different surfaces.
 *
 * No gradients, filters or `<defs>`: the desktop column cross-fades two
 * illustrations at once, so any generated id would exist twice in the document.
 */

/** Square canvas shared by every illustration. */
export const ILLUSTRATION_VIEWBOX = "0 0 320 320";

/**
 * The compact band reframes the canvas rather than cropping it.
 *
 * 3:1, chosen against the band the app actually ships — 390x120 on mobile, so
 * 3.25:1. The previous 2:1 framing letterboxed roughly a third of the width away
 * on each side and left the artwork stranded in the middle of a wide strip.
 */
export const COMPACT_VIEWBOX = "16 112 288 96";

/**
 * Everything that carries meaning lives inside this box, which is what lets the
 * band be a reframe instead of a crop. Desktop-only context may sit outside it;
 * the primary object and every answer state may not.
 *
 * It is deliberately 8 units narrower than COMPACT_VIEWBOX on the top and bottom.
 * Sizing an object to exactly fill the compact frame clipped its outer stroke
 * against the band edges and left no breathing room at all.
 */
export const CORE_BAND = {
  x: 16,
  width: 288,
  top: 120,
  bottom: 200,
} as const;

export const STROKE = {
  primary: 2.5,
  secondary: 1.75,
  hairline: 1.25,
} as const;

export const RADIUS = {
  chip: 4,
  standard: 8,
  plate: 12,
} as const;

/**
 * Layer names double as `data-layer` values, so tests can assert composition
 * and compact reduction without reading a single path.
 */
export type IllustrationLayer =
  | "background"
  | "foundation"
  | "primary-object"
  | "secondary-object"
  | "answer-state"
  | "motion-accent"
  | "foreground-detail";

/** Layers dropped in the compact band, where there is a fifth of the height. */
export const COMPACT_HIDDEN_LAYERS: readonly IllustrationLayer[] = [
  "background",
  "motion-accent",
  "foreground-detail",
];

export const PAINT = {
  /** Object bodies. In dark this sits darker than the panel; the outline separates it. */
  objectSurface: "fill-background",
  /** Second plane. Gives dark mode a depth step light mode does not need. */
  objectSurfaceAlt: "fill-card",
  /**
   * Unanswered. Fully transparent, so the panel shows through and an empty slot
   * cannot be mistaken for a filled one. An earlier pass used `fill-muted`, which
   * is a warm brown against the dark panel — empty racks and empty calendars read
   * as already chosen, the exact opposite of the truth.
   */
  fillEmpty: "fill-none",
  /** Answered. One brand step, shared by every selected item on a screen. */
  fillPrimary: "fill-brand-200 dark:fill-brand-800",
  /** Inner detail on an already-selected object — never a second selection colour. */
  fillSecondary: "fill-brand-100 dark:fill-brand-900",
  /** Deeper brand step for spines, bands and bullseyes. */
  fillDeep: "fill-brand-400 dark:fill-brand-700",
  /**
   * The one secondary hue, reserved for time and schedule. Opaque in both themes:
   * a translucent fill let the shapes beneath bleed through and read as separate
   * selections.
   */
  accentCoolFill: "fill-sky-100 dark:fill-sky-900",
  accentCoolSoft: "fill-sky-50 dark:fill-sky-950",
  accentCoolInk: "stroke-sky-700 dark:stroke-sky-300",
  /**
   * Unemphasised structure. Never carries meaning on its own: --border sits at
   * 27% lightness in dark, where it is effectively invisible.
   */
  borderHairline: "stroke-border",
  /** Hairlines and ticks that still have to be legible in both themes. */
  inkSecondary: "stroke-muted-foreground",
} as const;
