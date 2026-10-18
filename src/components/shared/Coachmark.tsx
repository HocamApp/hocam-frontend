"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { CoachmarkBody } from "@/components/shared/CoachmarkBody";

interface CoachmarkProps {
  open: boolean;
  /** The element the bubble points at. Nothing renders while it is not mounted. */
  anchorRef: RefObject<HTMLElement>;
  title: string;
  children: ReactNode;
  stepLabel?: string;
  actionLabel: string;
  onAction: () => void;
  /**
   * A forced coachmark closes only through its button: no Escape, no click
   * outside, and the button takes focus. A reminder is a courtesy: it closes
   * however the reader likes and never steals focus.
   */
  forced?: boolean;
  onDismiss?: () => void;
  /** Where the bubble sits relative to the anchor. A control at the bottom of the screen wants "top". */
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
}

/**
 * A dark bubble with an arrow, pointing at one control. Radix Popover does the
 * placement (it flips and shifts at the viewport edge and tracks the anchor
 * while the page scrolls); the look is the product's own dark notice.
 *
 * Entrance is a 200ms fade with an 8px slide, no scale, and none at all for
 * `prefers-reduced-motion`. It does not move afterwards.
 *
 * z-40 on purpose: the sticky header and the mobile tab bar are z-50 and must
 * stay on top when the page scrolls under the bubble.
 */
export function Coachmark({
  open,
  anchorRef,
  title,
  children,
  stepLabel,
  actionLabel,
  onAction,
  forced = false,
  onDismiss,
  side = "bottom",
  align = "center",
}: CoachmarkProps) {
  // The anchor is usually mounted in the same commit that opens the bubble, so
  // its ref is still empty during this render. Looking again after every commit
  // is what makes the bubble appear without something else forcing a render.
  const [anchored, setAnchored] = useState(false);
  // No dependency list on purpose: a ref change does not re-run an effect, and
  // the setState is guarded so it settles after one extra pass.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const present = Boolean(anchorRef.current);
    if (present !== anchored) setAnchored(present);
  });

  if (!open || !anchored || !anchorRef.current) return null;

  return (
    <PopoverPrimitive.Root open onOpenChange={(next) => { if (!next && !forced) onDismiss?.(); }}>
      <PopoverPrimitive.Anchor virtualRef={anchorRef} />
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side={side}
          align={align}
          sideOffset={12}
          collisionPadding={16}
          aria-label={title}
          onOpenAutoFocus={(event) => { if (!forced) event.preventDefault(); }}
          onEscapeKeyDown={(event) => { if (forced) event.preventDefault(); }}
          onInteractOutside={(event) => { if (forced) event.preventDefault(); }}
          className="z-40 w-[min(20rem,calc(100vw-2rem))] rounded-card bg-[var(--ink-on-light)] p-4 shadow-float outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-200 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 motion-reduce:animate-none"
        >
          <CoachmarkBody title={title} stepLabel={stepLabel} actionLabel={actionLabel} onAction={onAction}>
            {children}
          </CoachmarkBody>
          <PopoverPrimitive.Arrow width={16} height={8} className="fill-[var(--ink-on-light)]" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
