import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const TONE_CLASS = {
  plain: "border-line bg-surface",
  soft: "border-line bg-surface",
  accent: "border-ink bg-surface",
  dark: "border-ink bg-ink text-paper",
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
      className={cn("rounded-card border", TONE_CLASS[tone], className)}
      {...props}
    />
  );
}
