"use client";

import { Info } from "@phosphor-icons/react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

/** Half of the slider thumb (`h-5 w-5` in ui/slider.tsx). The marker has to know it, see below. */
const THUMB_HALF_PX = 10;

/**
 * Where the default-discount marker sits horizontally.
 *
 * Radix does not put the thumb at `p%` of the track: it keeps the thumb inside
 * the track, so its centre is at `p% + (half − p·half·2/100)px`. A marker at a
 * bare `p%` drifts off the thumb by up to half a thumb width, and at either end
 * it sticks out of the control. Same formula, so the marker and the thumb agree
 * at every value, including the ends.
 */
export function defaultMarkerLeft(defaultValue: number, max: number): string {
  const percent = Math.max(0, Math.min(100, (defaultValue / max) * 100));
  const offset = THUMB_HALF_PX - (percent * THUMB_HALF_PX * 2) / 100;
  const round = (value: number) => Number(value.toFixed(2));
  return `calc(${round(percent)}% ${offset < 0 ? "-" : "+"} ${round(Math.abs(offset))}px)`;
}

export function TutorDiscountControl({
  label,
  catalogDiscount,
  maxDiscount,
  discount,
  disabled,
  onChange,
}: {
  label: string;
  catalogDiscount: number;
  maxDiscount: number;
  discount: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return <div className="space-y-2 pl-2">
    <div className="flex items-center justify-between gap-2 text-xs text-ink-mid">
      <span>İndirim <span>Varsayılan: %{catalogDiscount}</span></span>
      <span className="font-medium text-ink">%{discount}</span>
    </div>
    <div>
      {/* py-1.5: the thumb is 20px on an 8px track, so it needs 6px above and
          below. This box holds only the track row, so the marker's vertical
          centre is the track's. The marker comes before the slider in the DOM
          so the thumb is painted over it: on the default it covers the notch
          instead of floating over it. */}
      <div className="relative py-1.5">
        <span
          aria-label={`Varsayılan indirim: %${catalogDiscount}`}
          className={cn(
            "pointer-events-none absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-mid",
            disabled && "opacity-50",
          )}
          style={{ left: defaultMarkerLeft(catalogDiscount, maxDiscount) }}
        />
        <Slider
          thumbAriaLabel={`${label} indirimi`}
          min={0}
          max={maxDiscount}
          step={1}
          value={[discount]}
          onValueChange={([value]) => onChange(value)}
          disabled={disabled}
        />
      </div>
      <div className="mt-0.5 flex justify-between text-xs tabular-nums text-ink-mid" aria-hidden="true">
        <span>%0</span><span>%{maxDiscount}</span>
      </div>
    </div>
    {discount < catalogDiscount && <p role="status" className="flex items-start gap-2 text-small text-ink-mid">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>Daha düşük indirim, paketin fiyatını artırır. Öğrenciler bu paketi daha az tercih edebilir.</span>
    </p>}
  </div>;
}
