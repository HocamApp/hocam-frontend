"use client";

import { useEffect, useState } from "react";

/**
 * Holds a loading placeholder back until the wait is actually worth showing.
 *
 * Without this, a response that lands in 80ms still paints a skeleton for one
 * frame, and the flash reads as a glitch rather than as progress. The usual
 * threshold is ~200ms: below it people perceive the response as immediate, so
 * showing anything is worse than showing nothing.
 *
 * Returns false while `active` is false, and for the first `delayMs` after it
 * turns true. Resets immediately when `active` goes false again, so the
 * placeholder never lingers past the data it was standing in for.
 *
 *   const showSkeleton = useDelayedVisible(isLoading);
 *   {showSkeleton ? <ListSkeleton /> : null}
 *
 * Note the caller must still suppress the empty state for the whole of
 * `active`, not just while the skeleton shows — otherwise "nothing found"
 * flashes during the delay window.
 */
export function useDelayedVisible(active: boolean, delayMs = 200): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }

    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);

  return visible;
}
