"use client";

import type { Icon } from "@phosphor-icons/react";
import { forwardRef } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * One of the small actions beside a tutor's booking CTA: save, report, share.
 *
 * A bordered 44px square rather than a bare ghost icon. The old row read as
 * three loose glyphs under two full-width buttons; giving each one a box
 * makes it obvious they are buttons at all, and 44px is the comfortable
 * touch size rather than the 24px floor.
 *
 * The label is on a tooltip that opens **below** the button. Above would put
 * it over the message CTA, which is the one thing in this column a reader is
 * most likely to be aiming at.
 *
 * DESIGN.md says an icon never appears on a button without a label, and this
 * is the documented exception in the making: three secondary actions in a row
 * beside a labelled primary, each carrying its name in a tooltip and in
 * `aria-label`. Written down here rather than left implicit.
 */

type TutorActionButtonProps = {
  icon: Icon;
  /** Tooltip text and accessible name. */
  label: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Pressed state for a toggle, e.g. saved to the list. */
  pressed?: boolean;
  disabled?: boolean;
  className?: string;
};

export const TutorActionButton = forwardRef<
  HTMLButtonElement,
  TutorActionButtonProps
>(function TutorActionButton(
  { icon: IconComponent, label, onClick, pressed, disabled, className },
  ref,
) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={ref}
            type="button"
            aria-label={label}
            aria-pressed={pressed}
            disabled={disabled}
            onClick={onClick}
            className={cn(
              "group inline-flex h-11 w-full items-center justify-center rounded-input border border-line bg-surface text-ink transition-colors duration-[--duration-state]",
              "hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
              "disabled:cursor-not-allowed disabled:opacity-50",
              pressed && "border-pink text-pink",
              className,
            )}
          >
            <IconComponent
              // Filled when the toggle is on, outline otherwise: DESIGN.md
              // uses icon weight as the state, not a colour swap alone.
              weight={pressed ? "fill" : "regular"}
              className="h-5 w-5 transition-transform duration-[--duration-state] motion-safe:group-hover:scale-110 motion-safe:group-active:scale-95"
              aria-hidden
            />
          </button>
        </TooltipTrigger>
        {/* Ink panel with paper text and the float shadow: DESIGN.md gives
            floating surfaces exactly one shadow, and a tooltip is one of the
            four things that genuinely float. */}
        <TooltipContent
          side="bottom"
          sideOffset={8}
          className="border-0 bg-ink px-2.5 py-1.5 text-label text-paper shadow-float"
        >
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
