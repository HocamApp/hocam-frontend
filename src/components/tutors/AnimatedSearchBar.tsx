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
  /**
   * Colour of the detached search bubble. "brand" is the red circle the tutor
   * directory uses; "neutral" falls through to the component's own
   * foreground/background pair. Defaults to "brand" so existing call sites
   * are untouched.
   */
  tone?: "brand" | "neutral";
}

export function AnimatedSearchBar({
  value,
  onChange,
  onCommit,
  disabled,
  className,
  tone = "brand",
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
          /* The trigger is overridden to a light pill above, so the clear
             button needs dark-on-light rather than GooeyInput's own
             light-on-dark default. */
          clear: "text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
          bubbleSurface:
            tone === "brand"
              ? "border border-brand-600 bg-brand-600 text-white ring-brand-600/30 dark:border-brand-500 dark:bg-brand-500"
              : undefined,
        }}
      />
    </div>
  );
}
