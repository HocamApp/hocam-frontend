"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

interface VisualViewportState {
  height: number | null;
  offsetTop: number;
  isKeyboardOpen: boolean;
}

const KEYBOARD_HEIGHT_THRESHOLD = 150;
const FOCUS_TRANSITION_MS = 700;

/** Tracks the portion of the page that is actually visible above a mobile
 * keyboard. `dvh` still follows the layout viewport on iOS Safari, while the
 * Visual Viewport API reports the keyboard-reduced height. */
export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>({
    height: null,
    offsetTop: 0,
    isKeyboardOpen: false,
  });
  const baselineHeight = useRef(0);

  useEffect(() => {
    let frame = 0;
    let trackUntil = 0;
    const viewport = window.visualViewport;
    const isEditing = () => window.matchMedia("(max-width: 767px)").matches &&
      Boolean(document.activeElement?.matches("textarea:not(:disabled), input:not(:disabled):not([type=file]):not([type=checkbox]):not([type=radio]), [contenteditable=true]"));

    const update = () => {
      const height = viewport?.height ?? window.innerHeight;
      const editing = isEditing();
      if (baselineHeight.current === 0 || height > baselineHeight.current) {
        baselineHeight.current = editing
          ? Math.max(height, document.documentElement.clientHeight)
          : height;
      }
      const isKeyboardOpen = editing || baselineHeight.current - height >= KEYBOARD_HEIGHT_THRESHOLD;
      const layoutHeight = document.documentElement.clientHeight || baselineHeight.current;
      // Safari can restore height before clearing the old pan. Closed layout
      // always starts at zero, even if expanded address bars mean its height
      // is smaller than the historical maximum. Clamp open-layout pan too.
      const offsetTop = isKeyboardOpen
        ? Math.max(0, Math.min(viewport?.offsetTop ?? 0, layoutHeight - height))
        : 0;
      const next = {
        height,
        offsetTop,
        isKeyboardOpen,
      };
      setState((previous) => previous.height === next.height &&
        previous.offsetTop === next.offsetTop && previous.isKeyboardOpen === next.isKeyboardOpen
        ? previous : next);
    };

    const tick = () => {
      frame = 0;
      // Commit paired resize/pan measurements before paint, not in a later
      // React render after Safari has already moved the visible viewport.
      flushSync(update);
      if (performance.now() < trackUntil) frame = window.requestAnimationFrame(tick);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(tick);
    };
    const trackFocusTransition = () => {
      // WebKit can update viewport properties between/delayed resize events.
      // Poll only around focus transitions, never as a permanent animation loop.
      trackUntil = performance.now() + FOCUS_TRANSITION_MS;
      schedule();
    };
    const resetBaseline = () => {
      baselineHeight.current = 0;
      trackFocusTransition();
    };

    update();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule);
    window.addEventListener("orientationchange", resetBaseline);
    document.addEventListener("focusin", trackFocusTransition);
    document.addEventListener("focusout", trackFocusTransition);
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("orientationchange", resetBaseline);
      document.removeEventListener("focusin", trackFocusTransition);
      document.removeEventListener("focusout", trackFocusTransition);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
    };
  }, []);

  return state;
}
