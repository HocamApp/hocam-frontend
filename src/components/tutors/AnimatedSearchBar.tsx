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
        collapsedWidth={200}
        expandedWidth={360}
        expandedOffset={50}
        classNames={{
          trigger:
            "border border-input bg-muted/80 text-foreground ring-ring/30 hover:bg-accent focus-visible:ring-ring focus-visible:ring-offset-background",
          input: "text-foreground placeholder:text-muted-foreground",
          bubbleSurface:
            "border border-input bg-popover text-foreground ring-ring/30",
        }}
      />
    </div>
  );
}
