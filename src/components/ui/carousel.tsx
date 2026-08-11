"use client";

import * as React from "react";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Minimal, accessible carousel.
 *
 * Deliberately does not auto-advance: the coaching onboarding uses this to
 * present contractual obligations, and content a tutor is expected to read
 * must never slide away on a timer.
 *
 * Accessibility: the viewport is an `aria-roledescription="carousel"`
 * region that responds to Left/Right arrow keys; the previous/next buttons
 * carry visible-to-screen-reader labels; and the current position is
 * announced as text ("2 / 6") rather than conveyed by dots alone.
 */

type CarouselApi = UseEmblaCarouselType[1];

type CarouselContextValue = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: CarouselApi | undefined;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  selectedIndex: number;
  slideCount: number;
};

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }
  return context;
}

export interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Notified whenever the visible slide changes. */
  onSlideChange?: (index: number) => void;
  /** Accessible name for the carousel region. */
  label?: string;
}

export const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  function Carousel(
    { className, children, onSlideChange, label = "Tanıtım", ...props },
    ref
  ) {
    const [carouselRef, api] = useEmblaCarousel({ loop: false, align: "start" });
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [slideCount, setSlideCount] = React.useState(0);

    const onSelect = React.useCallback(
      (embla: CarouselApi) => {
        if (!embla) return;
        setCanScrollPrev(embla.canScrollPrev());
        setCanScrollNext(embla.canScrollNext());
        setSelectedIndex(embla.selectedScrollSnap());
        setSlideCount(embla.scrollSnapList().length);
        onSlideChange?.(embla.selectedScrollSnap());
      },
      [onSlideChange]
    );

    React.useEffect(() => {
      if (!api) return;
      onSelect(api);
      api.on("select", onSelect);
      api.on("reInit", onSelect);
      return () => {
        api.off("select", onSelect);
        api.off("reInit", onSelect);
      };
    }, [api, onSelect]);

    const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api]);
    const scrollNext = React.useCallback(() => api?.scrollNext(), [api]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext]
    );

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api,
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
          selectedIndex,
          slideCount,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          aria-label={label}
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  }
);

export const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CarouselContent({ className, ...props }, ref) {
  const { carouselRef } = useCarousel();
  return (
    // overflow-hidden on the viewport keeps the track from widening the
    // page on mobile, so a long carousel never causes horizontal scroll.
    <div ref={carouselRef} className="overflow-hidden">
      <div ref={ref} className={cn("flex", className)} {...props} />
    </div>
  );
});

export const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CarouselItem({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn("min-w-0 shrink-0 grow-0 basis-full", className)}
      {...props}
    />
  );
});

export const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(function CarouselPrevious({ className, ...props }, ref) {
  const { scrollPrev, canScrollPrev } = useCarousel();
  return (
    <Button
      ref={ref}
      type="button"
      variant="outline"
      size="icon"
      className={cn("h-9 w-9", className)}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Önceki slayt</span>
    </Button>
  );
});

export const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(function CarouselNext({ className, ...props }, ref) {
  const { scrollNext, canScrollNext } = useCarousel();
  return (
    <Button
      ref={ref}
      type="button"
      variant="outline"
      size="icon"
      className={cn("h-9 w-9", className)}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Sonraki slayt</span>
    </Button>
  );
});

/** Textual position, e.g. "2 / 6" — never colour or dots alone. */
export function CarouselCounter({ className }: { className?: string }) {
  const { selectedIndex, slideCount } = useCarousel();
  if (slideCount === 0) return null;
  return (
    <p className={cn("text-xs text-muted-foreground", className)} aria-live="polite">
      {selectedIndex + 1} / {slideCount}
    </p>
  );
}

export { useCarousel };
