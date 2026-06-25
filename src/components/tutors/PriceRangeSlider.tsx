"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export const MIN = 100;
export const MAX = 2000;
export const STEP = 50;

function fmt(n: number): string {
  return `₺${n.toLocaleString("tr-TR")}`;
}

/** Human-readable Turkish label for the selected price range. */
export function priceRangeLabel([min, max]: [number, number]): string {
  if (min <= MIN && max >= MAX) return "Tümü";
  if (max >= MAX) return `${fmt(min)}+`;
  return `${fmt(min)} – ${fmt(max)}`;
}

/** Convert a slider tuple into filter query values; defaults become "" (omitted). */
export function priceTupleToFilters([min, max]: [number, number]): {
  min_price: string;
  max_price: string;
} {
  return {
    min_price: min <= MIN ? "" : String(min),
    max_price: max >= MAX ? "" : String(max),
  };
}

/** Convert stored filter strings back into a slider tuple. */
export function filtersToPriceTuple(
  min_price?: string,
  max_price?: string,
): [number, number] {
  return [min_price ? Number(min_price) : MIN, max_price ? Number(max_price) : MAX];
}

interface PriceRangeSliderProps {
  value: [number, number];
  onValueCommit: (value: [number, number]) => void;
  disabled?: boolean;
  className?: string;
}

export function PriceRangeSlider({
  value,
  onValueCommit,
  disabled,
  className,
}: PriceRangeSliderProps) {
  // Local draft for smooth dragging + live label; committed to parent on release.
  const [draft, setDraft] = useState<[number, number]>(value);

  const [minValue, maxValue] = value;
  useEffect(() => {
    setDraft([minValue, maxValue]);
  }, [minValue, maxValue]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Fiyat aralığı</Label>
        <span className="text-sm font-semibold tabular-nums">
          {priceRangeLabel(draft)}
        </span>
      </div>
      <Slider
        min={MIN}
        max={MAX}
        step={STEP}
        value={draft}
        minStepsBetweenThumbs={1}
        onValueChange={(v) => setDraft([v[0], v[1]])}
        onValueCommit={(v) => onValueCommit([v[0], v[1]])}
        showTooltip
        tooltipContent={(v) => (v >= MAX ? "₺2.000+" : fmt(v))}
        disabled={disabled}
        aria-label="Fiyat aralığı filtresi"
      />
    </div>
  );
}
