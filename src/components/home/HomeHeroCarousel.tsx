"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackHomeEvent } from "@/lib/homeAnalytics";
import { HomeHeroArt } from "@/components/home/HomeHeroArt";
import { HOME_HERO_SLIDES } from "@/components/home/homeShowcaseContent";
import { Button } from "@/components/ui/button";

const AUTO_ADVANCE_MS = 7000;
const SWIPE_THRESHOLD_PX = 48;

function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setPrefersReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return prefersReduced;
}

/**
 * Large top showcase for the student home: a sliding hero with arrow controls,
 * dot pagination and touch swipe. Auto-advance pauses on hover/focus and is
 * disabled entirely under `prefers-reduced-motion`.
 */
export function HomeHeroCarousel({ greetingName }: { greetingName?: string }) {
  const slides = HOME_HERO_SLIDES;
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  // Bumped on every manual interaction so the auto-advance effect tears down
  // its interval and starts a fresh one — otherwise a slide picked late in the
  // cycle would be replaced almost immediately by the pending tick.
  const [restartNonce, setRestartNonce] = useState(0);
  const pointerStartX = useRef<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const goTo = useCallback(
    (next: number, method: "arrow" | "dot" | "swipe" | "auto") => {
      const bounded = (next + slides.length) % slides.length;
      setIndex(bounded);
      if (method !== "auto") {
        setRestartNonce((current) => current + 1);
        trackHomeEvent("home_hero_slide_changed", {
          slide_id: slides[bounded]?.id ?? null,
          position: bounded + 1,
          method,
        });
      }
    },
    [slides]
  );

  useEffect(() => {
    if (isPaused || prefersReducedMotion || slides.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [isPaused, prefersReducedMotion, slides.length, restartNonce]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1, "arrow");
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1, "arrow");
    }
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Hocam öne çıkanlar"
      className="relative border-b bg-muted/30"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div
        className="relative overflow-hidden"
        onKeyDown={handleKeyDown}
        onPointerDown={(event) => {
          pointerStartX.current = event.clientX;
        }}
        onPointerUp={(event) => {
          const start = pointerStartX.current;
          pointerStartX.current = null;
          if (start === null) return;
          const delta = event.clientX - start;
          if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
          goTo(delta < 0 ? index + 1 : index - 1, "swipe");
        }}
      >
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, slideIndex) => (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${slideIndex + 1} / ${slides.length}`}
              aria-hidden={slideIndex !== index}
              className="relative w-full shrink-0"
            >
              <HomeHeroArt scene={slide.scene} tone={slide.tone} />
              <div className="relative mx-auto flex min-h-[420px] max-w-7xl items-center px-4 py-12 sm:px-6 sm:py-14 lg:min-h-[460px] lg:px-8">
                <div className="w-full max-w-xl rounded-2xl border bg-card/95 p-6 shadow-lg backdrop-blur-sm sm:p-8">
                  {slideIndex === 0 && greetingName && (
                    <p className="mb-3 text-sm font-medium text-muted-foreground">
                      Merhaba {greetingName}, bugün neye odaklanmak istersin?
                    </p>
                  )}
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    {slide.eyebrow}
                  </p>
                  <h1 className="mt-3 text-3xl font-bold leading-[1.1] tracking-[-0.03em] sm:text-4xl lg:text-[2.75rem]">
                    {slide.title}
                  </h1>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">
                    {slide.description}
                  </p>
                  <Button
                    asChild
                    size="lg"
                    className="mt-6 rounded-xl"
                    tabIndex={slideIndex === index ? undefined : -1}
                  >
                    <Link
                      href={slide.ctaHref}
                      onClick={() =>
                        trackHomeEvent("home_hero_cta_clicked", {
                          slide_id: slide.id,
                          position: slideIndex + 1,
                        })
                      }
                    >
                      {slide.ctaLabel}
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <HeroArrow direction="prev" onClick={() => goTo(index - 1, "arrow")} />
        <HeroArrow direction="next" onClick={() => goTo(index + 1, "arrow")} />
      </div>

      <div className="flex items-center justify-center gap-2 pb-5">
        {slides.map((slide, slideIndex) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => goTo(slideIndex, "dot")}
            aria-label={`${slideIndex + 1}. slayta git`}
            aria-current={slideIndex === index}
            className={cn(
              "h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              slideIndex === index ? "w-7 bg-primary" : "w-2.5 bg-border hover:bg-muted-foreground/40"
            )}
          />
        ))}
      </div>
    </section>
  );
}

function HeroArrow({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Önceki slayt" : "Sonraki slayt"}
      className={cn(
        "absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border bg-background/90 shadow-md backdrop-blur transition hover:bg-background sm:flex",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        direction === "prev" ? "left-4" : "right-4"
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
