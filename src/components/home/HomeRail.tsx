"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HomeRailProps {
  /** Accessible name for the scrollable region. */
  label: string;
  children: ReactNode;
  className?: string;
  onScrollAction?: (direction: "prev" | "next") => void;
}

/**
 * Horizontally scrollable card rail with desktop chevron affordances.
 *
 * Scroll-snap plus native overflow does the work, so touch swipe and
 * keyboard scrolling come for free and no carousel dependency is needed.
 * Chevrons are hidden below `md` where swiping is the expected gesture.
 *
 * On mobile the scroller breaks out of the section container (`-mx-4 px-4`).
 * Kept inside it, an 82vw card plus the gap consumes all the remaining room
 * and the next card shows as an unreadable few-pixel sliver; bleeding to the
 * screen edge turns that into a recognisable ~40px peek.
 */
export function HomeRail({ label, children, className, onScrollAction }: HomeRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const syncBounds = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const maxScroll = node.scrollWidth - node.clientWidth;
    setCanScrollPrev(node.scrollLeft > 4);
    setCanScrollNext(node.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    syncBounds();
    const node = scrollerRef.current;
    if (!node) return;

    const observer = new ResizeObserver(syncBounds);
    observer.observe(node);
    return () => observer.disconnect();
  }, [syncBounds, children]);

  const scrollByPage = (direction: "prev" | "next") => {
    const node = scrollerRef.current;
    if (!node) return;
    const delta = Math.max(node.clientWidth * 0.8, 240);
    node.scrollBy({ left: direction === "next" ? delta : -delta, behavior: "smooth" });
    onScrollAction?.(direction);
  };

  return (
    <div className={cn("relative min-w-0", className)}>
      <div
        ref={scrollerRef}
        onScroll={syncBounds}
        role="group"
        aria-label={label}
        tabIndex={0}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 sm:mx-0 sm:gap-4 sm:px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <RailButton
        direction="prev"
        disabled={!canScrollPrev}
        onClick={() => scrollByPage("prev")}
      />
      <RailButton
        direction="next"
        disabled={!canScrollNext}
        onClick={() => scrollByPage("next")}
      />
    </div>
  );
}

function RailButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Önceki kartlar" : "Sonraki kartlar"}
      className={cn(
        "absolute top-[calc(50%-4px)] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border bg-background/95 shadow-md backdrop-blur transition md:flex",
        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-0",
        direction === "prev" ? "-left-5" : "-right-5"
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
