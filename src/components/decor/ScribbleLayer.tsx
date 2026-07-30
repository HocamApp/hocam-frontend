import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";
import type { ScribbleLayerSpec } from "@/lib/scribbles";

import { Scribble } from "./Scribble";

/**
 * Decorative background layer for a single section.
 *
 * Drop it as the first child of a `relative isolate` section. It sits behind
 * the content (`-z-10` inside the section's own stacking context) and always
 * clips horizontally, so a decoration can never widen the document or create
 * horizontal scroll.
 *
 * Vertically the clip box can extend past the section (`bleedTop` /
 * `bleedBottom`) for shapes meant to cross a section boundary. Leaving a bleed
 * at 0 clips the shape exactly on that edge — which is how the two-tone pink
 * transition between "Sınav hedeflerini keşfet" and "Öne çıkan hocalar" works:
 * the same shape is drawn on both sides of the seam at two opacities.
 *
 * An inner box is restored to the section's exact bounds so every placement's
 * `top` percentage stays relative to the section, not to the bled clip box.
 */
export function ScribbleLayer({
  items,
  bleedTop = 0,
  bleedBottom = 0,
  className,
}: ScribbleLayerSpec & { className?: string }) {
  if (items.length === 0) return null;

  const clipStyle: CSSProperties = {
    top: bleedTop ? `-${bleedTop}px` : 0,
    bottom: bleedBottom ? `-${bleedBottom}px` : 0,
  };
  const sectionBoxStyle: CSSProperties = {
    top: bleedTop ? `${bleedTop}px` : 0,
    bottom: bleedBottom ? `${bleedBottom}px` : 0,
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 -z-10 select-none overflow-hidden",
        className,
      )}
      style={clipStyle}
    >
      <div className="absolute inset-x-0" style={sectionBoxStyle}>
        {items.map((placement) => (
          <Scribble key={placement.id} placement={placement} />
        ))}
      </div>
    </div>
  );
}

/** Renders every layer a section needs. */
export function ScribbleLayers({
  layers,
}: {
  layers: readonly ScribbleLayerSpec[];
}) {
  return (
    <>
      {layers.map((layer, index) => (
        <ScribbleLayer key={layer.items[0]?.id ?? index} {...layer} />
      ))}
    </>
  );
}
