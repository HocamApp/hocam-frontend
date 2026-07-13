"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { setTheme as persistTheme, type Theme } from "@/lib/theme";

interface ThemeSegmentedControlProps {
  onThemeChange?: (theme: Theme) => void;
}

/** Explicit two-state Açık/Koyu control — the app only supports light/dark, no "system" mode. */
export function ThemeSegmentedControl({ onThemeChange }: ThemeSegmentedControlProps) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    setThemeState(
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    );
  }, []);

  const select = (next: Theme) => {
    if (next === theme) return;
    setThemeState(next);
    persistTheme(next);
    onThemeChange?.(next);
  };

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Açık", icon: Sun },
    { value: "dark", label: "Koyu", icon: Moon },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className="inline-flex shrink-0 rounded-lg border border-input bg-muted/40 p-0.5"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const selected = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => select(value)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
