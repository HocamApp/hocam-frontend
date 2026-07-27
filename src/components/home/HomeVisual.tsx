/**
 * Shared tone vocabulary for the homepage artwork.
 *
 * Every generated illustration on the home page — the hero scenes in
 * `HomeHeroArt` and the card scenes in `HomeSceneArt` — picks one of these
 * five colour families. Brand pink stays the lead voice; the supporting tones
 * exist so a long rail of cards does not read as the same stamp repeated.
 *
 * This file used to also export a `HomeVisual` component that drew flat
 * geometric motifs. Those were replaced by the layered scenes in
 * `HomeSceneArt`, and the teacher cards now lead with the tutor's portrait
 * rather than decorative art, so only the shared tone type remains.
 */
export type HomeVisualTone = "brand" | "sky" | "cream" | "violet" | "slate";
