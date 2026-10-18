"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";

import { Coachmark } from "@/components/shared/Coachmark";
import { useUiHints } from "@/hooks/useUiHints";
import { acknowledgedPatch, type UiHintKey } from "@/lib/tutorSetupHints";

const SHOW_DELAY_MS = 600;

export type PageIntroKey = Extract<UiHintKey, `tutor_intro_${string}`>;

interface PageIntroHintProps {
  hintKey: PageIntroKey;
  /** The page title's text, see `WorkspacePageShell`'s `titleRef`. */
  anchorRef: RefObject<HTMLElement>;
  title: string;
  children: ReactNode;
  delayMs?: number;
}

/**
 * "What this page is for", once. It points at the page title, has a single
 * button, and is gone for good after it is answered, by the button or by
 * dismissing it any other way: this is orientation, not a task, so it does not
 * come back on a schedule the way the Panom tour does.
 *
 * Each page calls `useUiHints` once, here. A page that shows two hints should
 * share one result rather than call it twice.
 */
export function PageIntroHint({ hintKey, anchorRef, title, children, delayMs = SHOW_DELAY_MS }: PageIntroHintProps) {
  const { hints, ready, record } = useUiHints();
  const [open, setOpen] = useState(false);
  const eligible = ready && !hints[hintKey]?.acknowledged_at;

  useEffect(() => {
    if (!eligible || open) return;
    const timer = window.setTimeout(() => {
      // A dialog already has the reader's attention: try again next visit.
      if (document.querySelector('[role="dialog"]')) return;
      setOpen(true);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [eligible, open, delayMs]);

  const answer = () => {
    setOpen(false);
    record(hintKey, acknowledgedPatch());
  };

  return (
    <Coachmark
      open={open && eligible}
      anchorRef={anchorRef}
      title={title}
      actionLabel="Anladım"
      onAction={answer}
      onDismiss={answer}
    >
      {children}
    </Coachmark>
  );
}
