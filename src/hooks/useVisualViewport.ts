"use client";

import { useEffect, useRef, useState } from "react";

interface VisualViewportState {
  height: number | null;
  offsetTop: number;
  isKeyboardOpen: boolean;
}

const KEYBOARD_HEIGHT_THRESHOLD = 150;

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
    const update = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      if (baselineHeight.current === 0 || height > baselineHeight.current) {
        baselineHeight.current = height;
      }
      setState({
        height,
        offsetTop: window.visualViewport?.offsetTop ?? 0,
        isKeyboardOpen:
          baselineHeight.current - height >= KEYBOARD_HEIGHT_THRESHOLD,
      });
    };

    const resetBaseline = () => {
      baselineHeight.current = 0;
      update();
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", resetBaseline);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", resetBaseline);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, []);

  return state;
}
