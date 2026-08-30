"use client";

import { ReactNode, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CaretUp,
  CheckCircle,
  CursorClick,
} from "@phosphor-icons/react";

import { TutorialStep } from "@/lib/liveLessonTutorialSteps";
import { SpotlightRect, unionRect } from "./TutorialOverlay";

const CARD_WIDTH = 380;
const CARD_MARGIN = 16;

interface TutorialCardProps {
  step: TutorialStep;
  stepNumber: number;
  totalSteps: number;
  rects: SpotlightRect[];
  /** For "try" steps: whether the requested action has been performed. */
  actionDone: boolean;
  canGoBack: boolean;
  onBack: () => void;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryPending?: boolean;
  /** Inline error slot (completion failures render here, never as a toast). */
  errorSlot?: ReactNode;
  children?: ReactNode;
}

export function TutorialCard({
  step,
  stepNumber,
  totalSteps,
  rects,
  actionDone,
  canGoBack,
  onBack,
  onPrimary,
  primaryDisabled,
  primaryPending,
  errorSlot,
  children,
}: TutorialCardProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step.id]);

  const union = unionRect(rects);
  const position = useMemo(() => {
    if (typeof window === "undefined" || !union) return null;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    if (viewportWidth < 640) return null; // bottom sheet on mobile
    const width = Math.min(CARD_WIDTH, viewportWidth - CARD_MARGIN * 2);
    const left = Math.min(
      Math.max(union.x + union.width / 2 - width / 2, CARD_MARGIN),
      viewportWidth - width - CARD_MARGIN
    );
    const targetOnTop = union.y + union.height / 2 < viewportHeight / 2;
    return {
      width,
      left,
      top: targetOnTop ? union.y + union.height + CARD_MARGIN : undefined,
      bottom: targetOnTop
        ? undefined
        : viewportHeight - union.y + CARD_MARGIN,
      arrowUp: targetOnTop,
    };
  }, [union]);

  const centered = !union;
  const showTryState = step.kind === "try";
  const primaryLabel = step.ctaLabel;

  const card = (
    <div
      key={step.id}
      role="dialog"
      aria-labelledby="tutorial-step-title"
      aria-describedby="tutorial-step-body"
      className="pointer-events-auto rounded-modal border border-line bg-surface p-5 text-ink shadow-float"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="rounded-pill bg-gold px-2.5 py-1 text-xs font-bold text-gold-ink">
          Adım {stepNumber}/{totalSteps}
        </span>
        {position && !centered && (
          <span
            aria-hidden="true"
            className="text-ink-mid"
          >
            <CaretUp
              className={`h-4 w-4 ${position.arrowUp ? "" : "rotate-180"}`}
            />
          </span>
        )}
      </div>
      <h2
        id="tutorial-step-title"
        ref={headingRef}
        tabIndex={-1}
        className="text-xl font-bold leading-tight text-balance outline-none"
      >
        {step.title}
      </h2>
      <p id="tutorial-step-body" className="mt-2 text-sm leading-relaxed text-ink-mid">
        {step.body}
      </p>
      {step.note && (
        <p className="mt-2 text-xs leading-relaxed text-ink-mid">{step.note}</p>
      )}
      {showTryState && (
        <div
          className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
            actionDone
              ? "border-success bg-success-soft text-success"
              : "border-line bg-paper text-ink-mid"
          }`}
        >
          {actionDone ? (
            <CheckCircle className="h-4 w-4 shrink-0" weight="fill" aria-hidden="true" />
          ) : (
            <CursorClick className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span>{actionDone ? "Harika, tam olarak böyle!" : step.tryHint}</span>
        </div>
      )}
      {children}
      {errorSlot}
      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className="inline-flex items-center gap-1.5 rounded-pill border border-ink px-3 py-2 text-xs font-semibold text-ink transition-colors duration-state hover:bg-paper disabled:invisible"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Geri
        </button>
        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled || primaryPending}
          className="inline-flex items-center gap-1.5 rounded-pill bg-pink px-4 py-2 text-sm font-bold text-white transition-colors duration-state hover:bg-pink-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          {primaryPending ? "Gönderiliyor..." : primaryLabel}
          {step.kind !== "final" && !primaryPending && (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );

  if (centered) {
    return (
      <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="w-full max-w-md">{card}</div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop: floated near the target. */}
      <div
        className="pointer-events-none fixed z-[70] hidden sm:block"
        style={
          position
            ? {
                width: position.width,
                left: position.left,
                top: position.top,
                bottom: position.bottom,
              }
            : undefined
        }
      >
        {card}
      </div>
      {/* Mobile: bottom sheet, arrow hidden by layout. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] p-3 sm:hidden">
        {card}
      </div>
    </>
  );
}
