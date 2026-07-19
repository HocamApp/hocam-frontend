"use client";

import { Check } from "lucide-react";
import type { TutorTeachingStyle } from "@/types";

export const TUTOR_TEACHING_STYLE_OPTIONS: Array<{
  value: TutorTeachingStyle;
  label: string;
}> = [
  { value: "foundations_patient", label: "Sabırla temelden anlatırım" },
  { value: "question_speed", label: "Bol soru çözer, hız kazandırırım" },
  { value: "planning_accountability", label: "Program hazırlar ve takip ederim" },
  { value: "motivating_communication", label: "Motivasyon ve iletişime önem veririm" },
  { value: "high_target", label: "Zorlayıcı ve yüksek hedef odaklıyım" },
];

export function TeachingStyleSelector({
  value,
  onChange,
  error,
}: {
  value: TutorTeachingStyle[];
  onChange: (value: TutorTeachingStyle[]) => void;
  error?: string | null;
}) {
  const toggle = (style: TutorTeachingStyle) => {
    if (value.includes(style)) {
      onChange(value.filter((item) => item !== style));
    } else if (value.length < 3) {
      onChange([...value, style]);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
      <div>
        <h2 className="font-semibold">Ders anlatım yaklaşımın</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Öğrencilerin seni daha doğru bulabilmesi için en fazla 3 yaklaşım seç.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {TUTOR_TEACHING_STYLE_OPTIONS.map((option) => {
          const selected = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(option.value)}
              className={`flex min-h-12 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                selected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background hover:border-primary/50"
              }`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                {selected && <Check className="h-3 w-3" />}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </section>
  );
}
