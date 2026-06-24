"use client";

import { motion } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

const FILL_DURATION = 0.5;
const FILL_EASE_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";
const FILL_TRANSITION = `clip-path ${FILL_DURATION}s ${FILL_EASE_CSS}`;

function getCoverRadius(
  width: number,
  height: number,
  x: number,
  y: number
): number {
  return Math.ceil(
    Math.max(
      Math.hypot(x, y),
      Math.hypot(width - x, y),
      Math.hypot(x, height - y),
      Math.hypot(width - x, height - y)
    )
  );
}

function assignRef<T>(ref: React.ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref) {
    ref.current = value;
  }
}

type ButtonHTMLAttributesForMotion = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onAnimationStart"
  | "onDrag"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragExit"
  | "onDragLeave"
  | "onDragOver"
  | "onDragStart"
  | "onDrop"
>;

type OriginButtonProps = ButtonHTMLAttributesForMotion & {
  children?: React.ReactNode;
  loading?: boolean;
};

const OriginButton = React.forwardRef<HTMLButtonElement, OriginButtonProps>(
  (
    {
      children,
      className,
      disabled = false,
      loading = false,
      type = "button",
      onBlur,
      onClick,
      onFocus,
      onKeyDown,
      onKeyUp,
      onPointerCancel,
      onPointerDown,
      onPointerEnter,
      onPointerLeave,
      onPointerUp,
      ...props
    },
    ref
  ) => {
    const buttonRef = React.useRef<HTMLButtonElement | null>(null);
    const overlayRef = React.useRef<HTMLDivElement>(null);
    // Tracks last known entry origin so collapse animates from the right center
    const lastOriginRef = React.useRef({ x: 0, y: 0 });
    const [isPressed, setIsPressed] = React.useState(false);
    const isDisabled = Boolean(disabled || loading);

    const expandOverlay = React.useCallback(
      (x: number, y: number, radius: number) => {
        const el = overlayRef.current;
        if (!el) return;
        lastOriginRef.current = { x, y };
        // Step 1: snap circle center to entry point at radius 0 (no transition).
        // getBoundingClientRect() forces the browser to flush this style before
        // we apply the transition, so the expansion always starts from exactly
        // where the cursor entered — never from the previous circle position.
        el.style.transition = "none";
        el.style.clipPath = `circle(0px at ${x}px ${y}px)`;
        el.getBoundingClientRect();
        // Step 2: animate radius to full cover.
        el.style.transition = FILL_TRANSITION;
        el.style.clipPath = `circle(${radius}px at ${x}px ${y}px)`;
      },
      []
    );

    const collapseOverlay = React.useCallback(() => {
      const el = overlayRef.current;
      if (!el) return;
      const { x, y } = lastOriginRef.current;
      el.style.transition = FILL_TRANSITION;
      el.style.clipPath = `circle(0px at ${x}px ${y}px)`;
    }, []);

    const expandFromPointer = React.useCallback(
      (event: React.PointerEvent<HTMLButtonElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        expandOverlay(x, y, getCoverRadius(rect.width, rect.height, x, y));
      },
      [expandOverlay]
    );

    const expandFromCenter = React.useCallback(() => {
      const node = buttonRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const x = rect.width / 2;
      const y = rect.height / 2;
      expandOverlay(x, y, getCoverRadius(rect.width, rect.height, x, y));
    }, [expandOverlay]);

    const setMergedRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        buttonRef.current = node;
        assignRef(ref, node);
      },
      [ref]
    );

    return (
      <motion.button
        {...props}
        aria-busy={loading || undefined}
        className={cn(
          "relative inline-flex h-12 cursor-pointer touch-manipulation select-none items-center justify-center overflow-hidden rounded-xl px-8 font-medium text-[15px] tracking-[-0.02em]",
          "border-[0.5px] border-[#2a2a2a] bg-[#111111]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]",
          "disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        data-pressed={isPressed ? "true" : "false"}
        disabled={isDisabled}
        onBlur={(event) => {
          onBlur?.(event);
          setIsPressed(false);
          if (!event.defaultPrevented) collapseOverlay();
        }}
        onClick={onClick}
        onFocus={(event) => {
          onFocus?.(event);
          if (isDisabled || event.defaultPrevented) return;
          if (event.currentTarget.matches(":focus-visible")) {
            expandFromCenter();
          }
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (
            event.defaultPrevented ||
            isDisabled ||
            event.repeat ||
            (event.key !== " " && event.key !== "Enter")
          )
            return;
          if (event.key === " ") event.preventDefault();
          expandFromCenter();
          setIsPressed(true);
        }}
        onKeyUp={(event) => {
          onKeyUp?.(event);
          if (event.key === " " || event.key === "Enter") {
            setIsPressed(false);
            if (!event.currentTarget.matches(":focus-visible")) {
              collapseOverlay();
            }
          }
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          setIsPressed(false);
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (event.defaultPrevented || isDisabled || event.button !== 0)
            return;
          expandFromPointer(event);
          setIsPressed(true);
        }}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (isDisabled || event.defaultPrevented) return;
          expandFromPointer(event);
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          collapseOverlay();
          setIsPressed(false);
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          setIsPressed(false);
        }}
        ref={setMergedRef}
        type={type}
        whileTap={isDisabled ? undefined : { scale: 0.985 }}
      >
        {/* Layer 1 — base: black button, white text (accessible) */}
        <span className="relative inline-flex select-none items-center justify-center gap-2 text-white">
          {children}
        </span>

        {/* Layer 2 — overlay: white background, black text, clipped to expanding circle */}
        <div
          ref={overlayRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 flex select-none items-center justify-center gap-2 bg-white text-[#111111]"
          style={{ clipPath: "circle(0px at 0px 0px)" }}
        >
          {children}
        </div>
      </motion.button>
    );
  }
);

OriginButton.displayName = "OriginButton";

export { OriginButton };
export type { OriginButtonProps };
