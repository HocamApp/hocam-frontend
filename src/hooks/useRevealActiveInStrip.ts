import { useEffect, type DependencyList, type RefObject } from "react";

/**
 * Keep the `aria-current="page"` item of a horizontally scrolling strip in view.
 *
 * Moves only the strip's own scrollLeft. scrollIntoView would also scroll the
 * document, which on a phone yanks the page away from wherever the reader was.
 * Re-runs when the strip resizes, because a font swap or rotation can push the
 * selected item back out after the first pass.
 */
export function useRevealActiveInStrip(
  stripRef: RefObject<HTMLElement>,
  deps: DependencyList,
) {
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const revealActive = () => {
      const selected = strip.querySelector<HTMLElement>('[aria-current="page"]');
      if (!selected) return;
      const bounds = strip.getBoundingClientRect();
      const item = selected.getBoundingClientRect();
      if (item.left < bounds.left) strip.scrollLeft -= bounds.left - item.left;
      else if (item.right > bounds.right) strip.scrollLeft += item.right - bounds.right;
    };
    revealActive();
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(revealActive) : null;
    observer?.observe(strip);
    return () => observer?.disconnect();
    // The caller names what should re-trigger the reveal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
