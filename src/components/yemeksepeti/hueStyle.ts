import type { CSSProperties } from "react";

/**
 * Feeds a mock record's hue into the `.ys-placeholder` gradient. The experiment
 * bundles no third-party imagery, so every tile paints a deterministic
 * gradient derived from this value instead of a photo.
 */
export function hueStyle(hue: number): CSSProperties {
  return { "--ys-hue": hue } as CSSProperties;
}
