import type { ReactNode } from "react";

import { CoachmarkBody } from "@/components/shared/CoachmarkBody";

interface HintPanelProps {
  title: string;
  children: ReactNode;
  actionLabel?: string;
  onAcknowledge: () => void;
}

/**
 * The coachmark for places a floating bubble cannot reach: inside a modal
 * dialog everything outside it is inert, so the hint is an in-flow block at
 * the top of the dialog instead. Same surface, same words, no arrow.
 *
 * 10px, not the card radius: it sits inside a 28px dialog with 24px of
 * padding, and the nesting rule (inner = outer minus the gap) leaves no room
 * for a bigger one.
 */
export function HintPanel({ title, children, actionLabel = "Anladım", onAcknowledge }: HintPanelProps) {
  return (
    <section aria-label={title} className="rounded-input bg-[var(--ink-on-light)] p-4">
      <CoachmarkBody title={title} actionLabel={actionLabel} onAction={onAcknowledge}>
        {children}
      </CoachmarkBody>
    </section>
  );
}
