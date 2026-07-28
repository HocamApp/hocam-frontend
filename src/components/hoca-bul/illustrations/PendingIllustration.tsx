"use client";

import { Layer, Plate, Rail } from "./primitives";
import { PAINT, RADIUS, STROKE } from "./illustrationTokens";

/**
 * The family's neutral scene, used by the steps whose own artwork lands in P4B.
 *
 * It is built from the same primitives, tokens and layer names as the finished
 * illustrations rather than from the old placeholder, so the column keeps one
 * visual language while the set is completed — and so swapping a real artwork in
 * changes only that file.
 *
 * It reacts to nothing on purpose: a neutral scene is honest about being
 * unfinished, whereas a half-reactive one would be misleading.
 */
export function PendingIllustration({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <Layer name="foundation">
        <Plate
          x={48}
          y={120}
          width={224}
          height={80}
          rx={RADIUS.plate}
          fill={PAINT.objectSurfaceAlt}
        />
      </Layer>

      <Layer name="primary-object">
        <Plate
          x={76}
          y={146}
          width={168}
          height={28}
          rx={RADIUS.chip}
          fill={PAINT.fillEmpty}
          strokeWidth={STROKE.secondary}
        />
      </Layer>

      {compact ? null : (
        <Layer name="foreground-detail">
          <Rail
            x1={76}
            y1={186}
            x2={168}
            y2={186}
            strokeWidth={STROKE.hairline}
            className={PAINT.inkSecondary}
            opacity={0.6}
          />
        </Layer>
      )}
    </>
  );
}
