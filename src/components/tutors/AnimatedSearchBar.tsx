"use client";

import { type FocusEvent, type KeyboardEvent, useCallback } from "react";
import { GooeyInput } from "@/components/ui/gooey-input";
import { cn } from "@/lib/utils";

interface AnimatedSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onCommit: (value: string | undefined) => void;
  disabled?: boolean;
  className?: string;
}

export function AnimatedSearchBar({
  value,
  onChange,
  onCommit,
  disabled,
  className,
}: AnimatedSearchBarProps) {
  const commitSearch = useCallback(
    (nextValue = value) => {
      onCommit(nextValue.trim() || undefined);
    },
    [onCommit, value],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      const nextTarget = event.relatedTarget;
      if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
        return;
      }

      const input = event.currentTarget.querySelector<HTMLInputElement>('input[type="search"]');
      commitSearch(input?.value ?? value);
    },
    [commitSearch, value],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter" || !(event.target instanceof HTMLInputElement)) {
        return;
      }

      event.preventDefault();
      commitSearch(event.target.value);
    },
    [commitSearch],
  );

  return (
    <div
      className={cn("w-fit max-w-full", className)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <GooeyInput
        placeholder="Hoca veya üniversite ara..."
        collapsedPlaceholder="Hoca ara..."
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        collapsedWidth={148}
        expandedWidth={300}
        expandedOffset={50}
        classNames={{
          trigger:
            "border border-slate-300/60 bg-slate-100/90 text-slate-700 ring-slate-300/80 hover:bg-slate-100 focus-visible:ring-blue-400 focus-visible:ring-offset-white",
          input: "text-slate-700 placeholder:text-slate-500",
          bubbleSurface:
            "border border-slate-300/60 bg-slate-100/90 text-slate-700 ring-slate-300/80",
        }}
      />
    </div>
  );
}
