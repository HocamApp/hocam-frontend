"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type VerticalTabItem = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
};

export type VerticalTabsProps = {
  heading: ReactNode;
  intro: ReactNode;
  items: readonly VerticalTabItem[];
  autoplayMs?: number;
  className?: string;
};

const DEFAULT_AUTOPLAY_MS = 5_000;

export function VerticalTabs({
  heading,
  intro,
  items,
  autoplayMs = DEFAULT_AUTOPLAY_MS,
  className,
}: VerticalTabsProps) {
  const headingId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectionEpoch, setSelectionEpoch] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isInView, setIsInView] = useState(true);
  const [documentVisible, setDocumentVisible] = useState(true);

  const selectItem = useCallback(
    (index: number, nextDirection?: number) => {
      setDirection(nextDirection ?? (index >= activeIndex ? 1 : -1));
      setActiveIndex(index);
      setSelectionEpoch((current) => current + 1);
    },
    [activeIndex],
  );

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReduceMotion(preference.matches);
    syncPreference();
    preference.addEventListener("change", syncPreference);
    return () => preference.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    });
    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const syncVisibility = () => setDocumentVisible(!document.hidden);
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => document.removeEventListener("visibilitychange", syncVisibility);
  }, []);

  const autoplayPaused =
    Boolean(reduceMotion) ||
    !isInView ||
    !documentVisible ||
    items.length < 2;

  const advance = useCallback(() => {
    setDirection(1);
    setActiveIndex((current) => (current + 1) % items.length);
  }, [items.length]);

  if (items.length === 0) return null;

  const safeActiveIndex = Math.min(activeIndex, items.length - 1);
  const tabId = (index: number) => `${headingId}-tab-${index}`;
  const panelId = `${headingId}-panel`;
  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    let nextDirection: number | undefined;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (index + 1) % items.length;
      nextDirection = 1;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = (index - 1 + items.length) % items.length;
      nextDirection = -1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    selectItem(nextIndex, nextDirection ?? (nextIndex >= index ? 1 : -1));
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby={headingId}
      className={cn("w-full", className)}
    >
      <div className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-12 lg:gap-y-12">
        <h2
          id={headingId}
          className="text-2xl font-bold leading-[1.15] tracking-[-0.015em] text-ink lg:col-span-5 lg:row-start-1 lg:text-[32px]"
        >
          {heading}
        </h2>

        <div className="max-w-xl text-lg leading-[1.6] text-ink-mid lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:self-end">
          {intro}
        </div>

        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={tabId(safeActiveIndex)}
          className="relative aspect-[16/9] min-w-0 overflow-hidden rounded-modal border border-line bg-surface lg:col-span-7 lg:col-start-6 lg:row-start-2"
        >
          <div
            data-vertical-tabs-preload
            className="absolute inset-0"
          >
            {items.map((item, index) => {
              const isActive = index === safeActiveIndex;
              return (
                <div
                  key={item.id}
                  aria-hidden={!isActive}
                  data-active={isActive ? "true" : "false"}
                  data-travel={direction > 0 ? "forward" : "backward"}
                  data-direction={
                    isActive ? (direction > 0 ? "forward" : "backward") : undefined
                  }
                  className="vertical-tabs-image-layer absolute inset-0"
                >
                  <Image
                    src={item.imageSrc}
                    alt={isActive ? item.imageAlt : ""}
                    fill
                    loading="eager"
                    sizes="(min-width: 1024px) 58vw, (min-width: 768px) 100vw, 100vw"
                    className="object-contain"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Süreç adımları"
          aria-orientation="vertical"
          className="min-w-0 lg:col-span-5 lg:col-start-1 lg:row-start-2"
        >
          {items.map((item, index) => {
            const isActive = safeActiveIndex === index;
            return (
              <button
                key={item.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                id={tabId(index)}
                type="button"
                role="tab"
                aria-label={`${item.id}. ${item.title}`}
                aria-selected={isActive}
                aria-controls={panelId}
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectItem(index)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
                className={cn(
                  "group relative flex w-full items-start gap-4 border-t border-line py-5 pl-5 pr-2 text-left outline-none first:border-t-0 md:py-6 lg:h-36",
                  "focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-paper",
                )}
              >
                <span
                  aria-hidden
                  className="absolute bottom-0 left-0 top-0 w-[2px] bg-line"
                >
                  {isActive ? (
                    <span
                      key={`${item.id}-${activeIndex}-${selectionEpoch}`}
                      className="vertical-tabs-progress block h-full w-[2px] origin-top bg-ink"
                      onAnimationEnd={() => {
                        if (!autoplayPaused) advance();
                      }}
                      style={
                        {
                          "--vertical-tabs-duration": `${autoplayMs}ms`,
                          animationPlayState: autoplayPaused ? "paused" : "running",
                        } as CSSProperties
                      }
                    />
                  ) : null}
                </span>

                <span className="mt-1 shrink-0 text-[13px] font-medium tabular-nums text-ink-mid">
                  {item.id}.
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-[19px] font-medium leading-[1.3] tracking-[-0.01em] transition-colors md:text-[22px]",
                      isActive ? "text-ink" : "text-ink-mid group-hover:text-ink",
                    )}
                    style={{ transitionDuration: "var(--duration-state)" }}
                  >
                    {item.title}
                  </span>
                  {isActive ? (
                    <span
                      key={`${item.id}-description`}
                      className="vertical-tabs-description-enter mt-2 block max-w-md text-base font-normal leading-[1.6] text-ink-mid"
                    >
                      {item.description}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
