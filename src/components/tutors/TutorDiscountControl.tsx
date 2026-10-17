"use client";

import { Info } from "@phosphor-icons/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";

export function TutorDiscountControl({
  label,
  catalogDiscount,
  maxDiscount,
  discount,
  price,
  lessonCount,
  disabled,
  onChange,
}: {
  label: string;
  catalogDiscount: number;
  maxDiscount: number;
  discount: number;
  price: string;
  lessonCount: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return <div className="space-y-2 pl-2">
    <div className="flex items-center justify-between gap-2 text-xs text-ink-mid">
      <span>İndirim <span className="text-ink-mid/80">Varsayılan: %{catalogDiscount}</span></span>
      <span className="font-medium text-ink">%{discount}</span>
    </div>
    <div className="relative pt-2">
      <span
        aria-label={`Varsayılan indirim: %${catalogDiscount}`}
        className="pointer-events-none absolute top-0 z-10 h-2 w-0.5 -translate-x-1/2 rounded-full bg-ink-mid"
        style={{ left: `${Math.max(0, Math.min(100, catalogDiscount / maxDiscount * 100))}%` }}
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
      <div className="mt-1 flex justify-between text-[11px] tabular-nums text-ink-mid" aria-hidden="true">
        <span>%0</span><span>%{maxDiscount}</span>
      </div>
    </div>
    {discount < catalogDiscount && <Alert role="status" className="border-amber-200 bg-amber-50 text-ink">
      <Info className="h-4 w-4 text-amber-700" aria-hidden="true" />
      <AlertDescription>Daha düşük indirim, paketin fiyatını artırır. Bu da öğrencilerin paketi tercih etmesini zorlaştırabilir.</AlertDescription>
    </Alert>}
    <p className="text-xs text-ink-mid">
      Öğrenci fiyatı: <span className="font-medium text-ink">{price}</span> ({lessonCount} ders)
    </p>
  </div>;
}
