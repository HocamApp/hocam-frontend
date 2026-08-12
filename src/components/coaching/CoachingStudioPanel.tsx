import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const TONE_CLASS = {
  plain: "border-border/70 bg-card",
  soft: "border-border/60 bg-muted/35",
  accent: "border-primary/15 bg-primary/[0.055]",
  dark: "border-foreground/10 bg-foreground text-background",
} as const;

export function CoachingStudioPanel({
  tone = "plain",
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  tone?: keyof typeof TONE_CLASS;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border shadow-[0_18px_50px_-38px_hsl(var(--foreground)/0.38)]",
        TONE_CLASS[tone],
        className
      )}
      {...props}
    />
  );
}
