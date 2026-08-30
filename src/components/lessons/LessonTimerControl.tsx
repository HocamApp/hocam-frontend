"use client";

import { useEffect, useState } from "react";
import { Clock } from "@phosphor-icons/react";
import { formatDuration } from "@/lib/lessonSessionState";

interface LessonTimerControlProps {
  bookingId: string;
  remainingMs: number;
  elapsedMs: number;
  isLowTime: boolean;
  isOvertime: boolean;
}

const TOGGLE_KEY = (bookingId: string) => `lesson-timer-mode:${bookingId}`;

/**
 * The single, server-synced lesson clock. Shows remaining time by default;
 * click / Enter / Space toggles to elapsed, in place. The remaining/elapsed
 * choice is remembered per booking only. Never negative; a calm amber tint in
 * the last five minutes.
 */
export function LessonTimerControl({
  bookingId,
  remainingMs,
  elapsedMs,
  isLowTime,
  isOvertime,
}: LessonTimerControlProps) {
  const [showElapsed, setShowElapsed] = useState(false);

  useEffect(() => {
    try {
      setShowElapsed(sessionStorage.getItem(TOGGLE_KEY(bookingId)) === "elapsed");
    } catch {
      // sessionStorage unavailable — default to remaining.
    }
  }, [bookingId]);

  const toggle = () => {
    setShowElapsed((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(TOGGLE_KEY(bookingId), next ? "elapsed" : "remaining");
      } catch {
        // Non-fatal: preference just won't persist.
      }
      return next;
    });
  };

  const ariaLabel = showElapsed
    ? "Geçen süre. Kalan süreyi görmek için tıkla."
    : "Kalan süre. Geçen süreyi görmek için tıkla.";

  const prefix = showElapsed ? "Geçen" : "Kalan";
  const value = showElapsed ? elapsedMs : remainingMs;
  const showOvertime = isOvertime && !showElapsed;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={ariaLabel}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-pill border px-3 text-xs font-medium tabular-nums transition-colors duration-[--duration-state] ${
        showOvertime
          ? "border-error bg-error text-white"
          : isLowTime && !showElapsed
            ? "border-gold bg-gold text-gold-ink"
            : "border-line bg-surface text-ink hover:bg-paper"
      }`}
    >
      <Clock className="h-4 w-4" aria-hidden="true" />
      {showOvertime ? "Süre doldu" : `${prefix} ${formatDuration(value)}`}
    </button>
  );
}
