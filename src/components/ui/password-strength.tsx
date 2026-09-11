"use client";

import { motion, useReducedMotion } from "motion/react";

import { evaluatePassword } from "@/lib/passwordPolicy";
import { cn } from "@/lib/utils";

type PasswordStrengthProps = {
  value: string;
  className?: string;
};

export function PasswordStrength({ value, className }: PasswordStrengthProps) {
  const reducedMotion = useReducedMotion();
  const result = evaluatePassword(value);
  const tone = result.score === 0
    ? "bg-muted-foreground/25"
    : result.score === 1
      ? "bg-destructive"
      : result.score === 2
        ? "bg-amber-500"
        : "bg-emerald-500";
  const textTone = result.score === 1
    ? "text-destructive"
    : result.score === 2
      ? "text-amber-600 dark:text-amber-400"
      : result.score === 3
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-current opacity-70";

  return (
    <div className={cn("w-full", className)}>
      <div
        role="meter"
        aria-label="Şifre gücü"
        aria-valuemin={0}
        aria-valuemax={result.max}
        aria-valuenow={result.score}
        aria-valuetext={result.label}
        className="grid grid-cols-3 gap-1.5"
      >
        {Array.from({ length: result.max }, (_, index) => (
          <div key={index} className="h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.span
              className={cn("block h-full origin-left rounded-full", tone)}
              initial={false}
              animate={{ scaleX: index < result.score ? 1 : 0 }}
              transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 35 }}
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex min-h-5 items-center justify-between text-xs">
        <span className={cn("font-medium", textTone)}>{result.label}</span>
        {result.guessable && (
          <span className="text-amber-600 dark:text-amber-400">Kolay tahmin edilebilir</span>
        )}
      </div>

      <ul className="mt-2 grid gap-1.5">
        {result.rules.map((rule) => (
          <li key={rule.id} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden="true"
              className={cn(
                "grid size-4 shrink-0 place-items-center rounded-[5px] border text-[11px] font-bold transition-colors",
                rule.met
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-current opacity-70"
              )}
            >
              {rule.met ? "✓" : null}
            </span>
            <span className={rule.met ? "text-current" : "text-current opacity-70"}>
              {rule.label}
            </span>
            <span className="sr-only">{rule.met ? "karşılandı" : "karşılanmadı"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PasswordStrength;
