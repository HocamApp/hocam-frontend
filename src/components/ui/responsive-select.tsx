"use client";

import { useSyncExternalStore } from "react";
import { CaretDown } from "@phosphor-icons/react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface ResponsiveSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

function useDesktopPicker(nativeUntil: "md" | "lg") {
  const query = nativeUntil === "lg" ? "(min-width: 1024px)" : "(min-width: 768px)";

  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () =>
      typeof window.matchMedia === "function" && window.matchMedia(query).matches,
    () => true,
  );
}

interface ResponsiveSelectProps {
  label: string;
  value: string;
  options: ResponsiveSelectOption[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  className?: string;
  nativeUntil?: "md" | "lg";
}

/** Uses the operating system picker on touch-sized layouts and preserves the
 * existing Radix presentation at the requested desktop breakpoint. Native
 * pickers avoid nested portal/focus races inside Sheet and Dialog on iOS. */
export function ResponsiveSelect({
  label,
  value,
  options,
  onValueChange,
  disabled,
  id,
  placeholder,
  className,
  nativeUntil = "md",
}: ResponsiveSelectProps) {
  const useDesktop = useDesktopPicker(nativeUntil);

  if (!useDesktop) {
    return (
      <div className="relative">
        <select
          id={id}
          aria-label={label}
          value={value}
          disabled={disabled}
          onChange={(event) => onValueChange(event.target.value)}
          className={cn(
            "h-11 w-full appearance-none rounded-input border border-line bg-surface px-3 pr-10 text-[16px] text-ink outline-none transition-colors focus:border-ink focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:bg-paper disabled:text-ink-mid",
            className,
          )}
        >
          {placeholder && !options.some((option) => option.value === value) && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <CaretDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mid"
        />
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={id} aria-label={label} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
