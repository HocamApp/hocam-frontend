"use client";

import { Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchTeachingAttributes } from "@/lib/tutorsApi";

export function TeachingAttributeSelector({ value, onChange, error }: {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string | null;
}) {
  const { data: options = [], isLoading, isError } = useQuery({
    queryKey: ["teaching-attributes"], queryFn: fetchTeachingAttributes, staleTime: Infinity,
  });
  const toggle = (code: string) => {
    if (value.includes(code)) onChange(value.filter((item) => item !== code));
    else if (value.length < 5) onChange([...value, code]);
  };
  return (
    <section className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
      <div>
        <h2 className="font-semibold">Ders anlatım özelliklerin</h2>
        <p className="mt-1 text-sm text-muted-foreground">Seni en iyi anlatan 3–5 özelliği seç. Bunlar şimdilik kendi beyanındır.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = value.includes(option.code);
          return (
            <button key={option.code} type="button" aria-pressed={selected}
              disabled={isLoading || (!selected && value.length >= 5)} onClick={() => toggle(option.code)}
              className={`flex min-h-16 items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${selected ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/50"}`}>
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                {selected && <Check className="h-3 w-3" />}
              </span>
              <span><span className="block font-medium">{option.name}</span><span className="mt-0.5 block text-xs text-muted-foreground">{option.description}</span></span>
            </button>
          );
        })}
      </div>
      {isError && <p className="text-sm text-destructive">Özellikler yüklenemedi. Sayfayı yenileyip tekrar dene.</p>}
      <p className="text-xs text-muted-foreground">{value.length}/5 seçildi</p>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </section>
  );
}
