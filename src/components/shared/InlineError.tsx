"use client";

import * as React from "react";

import { WarningCircle } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * The one way an error is shown next to the thing that failed.
 *
 * Inline errors were a scatter of plain `<p className="text-destructive">`
 * lines, a boxed Alert, and a form message with no icon, so a failure read
 * differently depending on which screen you were on. This is the single
 * treatment: a circled exclamation, then the sentence unrolling from its
 * right edge.
 *
 * DESIGN.md: colour is `--error` (#B33A24, deliberately orange-leaning so it
 * cannot be mistaken for the pink brand), and colour is never the only signal
 * — the icon and the text carry it too. The motion replays whenever the
 * message changes, because a second failure with the same wording is easy to
 * miss when nothing moves. `prefers-reduced-motion` gets the same layout with
 * no movement.
 */
export interface InlineErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Null/empty renders nothing, so callers can pass state directly. */
  message?: string | null;
  /** Optional bold first line for page-level failures. */
  title?: string;
  className?: string;
  /** Icon and text size. "sm" for field errors, "md" (default) elsewhere. */
  size?: "sm" | "md";
}

export const InlineError = React.forwardRef<HTMLDivElement, InlineErrorProps>(function InlineError(
  { message, title, className, size = "md", ...props },
  ref
) {
  const reduceMotion = useReducedMotion();
  if (!message) return null;

  const iconSize = size === "sm" ? 16 : 20;
  const duration = reduceMotion ? 0 : undefined;

  return (
    <div
      ref={ref}
      role="alert"
      {...props}
      className={cn(
        "flex items-start gap-2 text-error",
        size === "sm" ? "text-[0.8125rem]" : "text-sm",
        className
      )}
    >
      <motion.span
        // The icon lands first; the sentence then unrolls from behind it.
        key={`icon-${message}`}
        initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: duration ?? 0.16, ease: "easeOut" }}
        className="mt-px flex shrink-0 items-center justify-center"
      >
        <WarningCircle size={iconSize} weight="regular" aria-hidden="true" />
      </motion.span>
      <motion.span
        key={`text-${message}`}
        initial={reduceMotion ? false : { opacity: 0, x: -8, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, x: 0, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: duration ?? 0.22, ease: "easeOut", delay: reduceMotion ? 0 : 0.06 }}
        className="min-w-0"
      >
        {title && <strong className="mr-1 font-medium">{title}</strong>}
        {message}
      </motion.span>
    </div>
  );
});
