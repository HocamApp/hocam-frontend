import type { ReactNode, Ref } from "react";

import { cn } from "@/lib/utils";

interface CoachmarkBodyProps {
  title: string;
  children: ReactNode;
  /** "Adım 1/2". Left out for a single step. */
  stepLabel?: string;
  actionLabel: string;
  onAction: () => void;
  actionRef?: Ref<HTMLButtonElement>;
  className?: string;
}

/**
 * The inside of a coachmark, shared by the floating bubble and the in-flow
 * panel. Layout follows a step tour: title, one sentence, then the step count
 * on the left and the single way forward on the right.
 *
 * It sits on `--ink-on-light`, not `--ink`: `--ink` flips to a light grey in
 * the dark theme and this surface has to stay dark in both. The button is the
 * inverted pill (white fill, ink text), the same construction DESIGN.md uses
 * for a ghost button on a dark surface.
 */
export function CoachmarkBody({ title, children, stepLabel, actionLabel, onAction, actionRef, className }: CoachmarkBodyProps) {
  return (
    <div className={cn("text-white", className)}>
      <p className="text-body font-medium">{title}</p>
      <p className="mt-1 text-small text-white/80">{children}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-label tabular-nums text-white/70">{stepLabel}</span>
        <button
          ref={actionRef}
          type="button"
          onClick={onAction}
          className="min-h-11 rounded-pill bg-white px-6 text-small font-medium text-[var(--ink-on-light)] transition-colors duration-[var(--duration-state)] hover:bg-[var(--line-on-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink-on-light)]"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
