"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
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
  const [pointerInside, setPointerInside] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
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
    pointerInside ||
    focusInside ||
    !isInView ||
    !documentVisible ||
    items.length < 2;

  useEffect(() => {
    if (autoplayPaused) return;

    const interval = setInterval(() => {
      setDirection(1);
      setActiveIndex((current) => (current + 1) % items.length);
    }, autoplayMs);

    return () => clearInterval(interval);
  }, [activeIndex, autoplayMs, autoplayPaused, items.length, selectionEpoch]);

  if (items.length === 0) return null;

  const safeActiveIndex = Math.min(activeIndex, items.length - 1);
  const activeItem = items[safeActiveIndex];
  const tabId = (index: number) => `${headingId}-tab-${index}`;
  const panelId = `${headingId}-panel`;
  const imageVariants = {
    enter: (nextDirection: number) =>
      reduceMotion
        ? { opacity: 1, y: "0%" }
        : { opacity: 0, y: nextDirection > 0 ? "-100%" : "100%" },
    center: { opacity: 1, y: "0%", zIndex: 1 },
    exit: (nextDirection: number) =>
      reduceMotion
        ? { opacity: 1, y: "0%" }
        : { opacity: 0, y: nextDirection > 0 ? "100%" : "-100%", zIndex: 0 },
  };

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
      onMouseEnter={() => setPointerInside(true)}
      onMouseLeave={() => setPointerInside(false)}
      onFocusCapture={() => setFocusInside(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocusInside(false);
        }
      }}
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
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={activeItem.id}
              custom={direction}
              data-direction={direction > 0 ? "forward" : "backward"}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      y: { type: "spring", stiffness: 260, damping: 32 },
                      opacity: { duration: 0.4 },
                    }
              }
              className="absolute inset-0"
            >
              <Image
                src={activeItem.imageSrc}
                alt={activeItem.imageAlt}
                fill
                sizes="(min-width: 1024px) 58vw, (min-width: 768px) 100vw, 100vw"
                className="object-contain"
              />
            </motion.div>
          </AnimatePresence>
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
                  "group relative flex w-full items-start gap-4 border-t border-line py-5 pl-5 pr-2 text-left outline-none first:border-t-0 md:py-6",
                  "focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-paper",
                )}
              >
                <span
                  aria-hidden
                  className="absolute bottom-0 left-0 top-0 w-px bg-line"
                >
                  {isActive ? (
                    <span
                      key={`${item.id}-${activeIndex}-${selectionEpoch}`}
                      className="vertical-tabs-progress block h-full w-px origin-top bg-ink"
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
                  <AnimatePresence initial={false} mode="wait">
                    {isActive ? (
                      <motion.span
                        key={`${item.id}-description`}
                        initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : { duration: 0.3, ease: [0.23, 1, 0.32, 1] }
                        }
                        className="mt-2 block max-w-md overflow-hidden text-base font-normal leading-[1.6] text-ink-mid"
                      >
                        {item.description}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
