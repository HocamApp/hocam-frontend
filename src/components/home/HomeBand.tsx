import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ScribbleLayers } from "@/components/decor/ScribbleLayer";
import type { ScribbleLayerSpec } from "@/lib/scribbles";

/**
 * Full-bleed horizontal band holding one homepage section.
 *
 * Sections alternate between the page surface and a tinted one so the page
 * reads as distinct chapters rather than a single column of white cards on
 * white. The band is full width but its inner container matches every other
 * section, so headings, rails and the navbar stay on one alignment grid.
 *
 * Because the band itself is full width, it also anchors the decorative
 * scribble layer: shapes measured from a page edge in Figma land on the
 * viewport edge here, with no `100vw` trickery.
 */
export function HomeBand({
  children,
  tinted = false,
  scribbles,
  className,
}: {
  children: ReactNode;
  tinted?: boolean;
  /** Purely decorative background shapes; omit for an undecorated band. */
  scribbles?: readonly ScribbleLayerSpec[];
  className?: string;
}) {
  const decorated = !!scribbles?.length;

  return (
    <div
      className={cn(
        tinted && "border-y bg-muted/40",
        decorated && "relative isolate",
        className
      )}
    >
      {decorated && <ScribbleLayers layers={scribbles} />}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">{children}</div>
    </div>
  );
}
