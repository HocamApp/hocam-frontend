"use client";

import { ReactNode, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronUp, Sparkles } from "lucide-react";

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
    // CSS entrance animation (tailwindcss-animate), not framer-motion — see
    // TutorialOverlay for why; motion-reduce disables it entirely.
    <div
      key={step.id}
      role="dialog"
      aria-labelledby="tutorial-step-title"
      aria-describedby="tutorial-step-body"
      className="pointer-events-auto animate-in fade-in slide-in-from-bottom-3 rounded-xl border border-white/10 bg-gray-900 p-5 text-white shadow-2xl duration-300 motion-reduce:animate-none"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-sky-300">
          Adım {stepNumber}/{totalSteps}
        </span>
        {position && !centered && (
          <span
            aria-hidden="true"
            className="animate-pulse text-sky-300 motion-reduce:animate-none"
          >
            <ChevronUp
              className={`h-4 w-4 ${position.arrowUp ? "" : "rotate-180"}`}
            />
          </span>
        )}
      </div>
      <h2
        id="tutorial-step-title"
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-semibold outline-none"
      >
        {step.title}
      </h2>
      <p id="tutorial-step-body" className="mt-2 text-sm leading-relaxed text-gray-200">
        {step.body}
      </p>
      {step.note && (
        <p className="mt-2 text-xs leading-relaxed text-gray-400">{step.note}</p>
      )}
      {showTryState && (
        <div
          className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
            actionDone
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-sky-500/40 bg-sky-500/10 text-sky-200"
          }`}
        >
          {actionDone ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
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
          className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-white/10 disabled:invisible"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Geri
        </button>
        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled || primaryPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
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
