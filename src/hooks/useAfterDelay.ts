"use client";

import { useEffect, useState } from "react";

/**
 * True once `waiting` has been true for `ms` without a break; false again as
 * soon as it stops. For a screen that waits on a nice-to-have request: it may
 * hold the page back briefly, never for as long as that request takes to fail.
 */
export function useAfterDelay(waiting: boolean, ms: number): boolean {
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    if (!waiting) {
      setElapsed(false);
      return;
    }
    const timer = setTimeout(() => setElapsed(true), ms);
    return () => clearTimeout(timer);
  }, [waiting, ms]);

  return waiting && elapsed;
}
