/**
 * Shared tone vocabulary for the homepage artwork.
 *
 * The hero scenes in `HomeHeroArt` pick one of these five colour families.
 * Brand pink stays the lead voice; the supporting tones exist so a long rail
 * of slides does not read as the same stamp repeated.
 *
 * This file used to also export a `HomeVisual` component that drew flat
 * geometric motifs, and later a `HomeScene` vocabulary for illustrated card
 * scenes. The discovery and goal cards now lead with editorial photography
 * (see `docs/design/product-home/image-sources.md`), so only the shared tone
 * type remains.
 */
export type HomeVisualTone = "brand" | "sky" | "cream" | "violet" | "slate";
