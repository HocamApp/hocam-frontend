"use client";

import Image from "next/image";
import { Children, useId, useRef, useState, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

import type { YsStep } from "./YsStepList";

export interface YsStepShot {
  src: string;
  alt: string;
  caption: string;
}

export interface YsTabStep extends YsStep {
  /** The screenshot shown while this step is active. Steps may share one
      image; the caption is the step's own. */
  shot?: YsStepShot;
}

/* The screenshots' own ratio (2880 wide, 1640 to 1648 tall). */
const SHOT_WIDTH = 2880;
const SHOT_HEIGHT = 1645;

/* Every step's screenshot, once each, in first-use order. */
function uniqueShots(steps: readonly YsTabStep[]): YsStepShot[] {
  const shots = new Map<string, YsStepShot>();
  for (const step of steps) if (step.shot && !shots.has(step.shot.src)) shots.set(step.shot.src, step.shot);
  return Array.from(shots.values());
}

function stepNumber(index: number) {
  return `${String(index + 1).padStart(2, "0")}.`;
}

/**
 * Numbered steps where one is active at a time, as on the pre-rebuild
 * homepage: clicking a step (or moving to it with the arrow keys) makes it
 * active and shows only its screenshot.
 *
 * Unlike the old tabs, every step's body stays on the page. Only the title
 * colour and the ink marker on the left rule follow the active step, so all
 * the text is in the server HTML.
 *
 * With screenshots, wide screens (960px and up, the mockup's breakpoint) get
 * one sticky frame beside the steps that crossfades between them; narrower
 * screens show the active step's screenshot directly under that step. The
 * fade stops under `prefers-reduced-motion`.
 */
export function YsStepTabs({
  steps,
  label,
  className,
}: {
  steps: readonly YsTabStep[];
  /** The tab list's accessible name. */
  label: string;
  className?: string;
}) {
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [active, setActive] = useState(0);

  const shots = uniqueShots(steps);
  const hasShots = shots.length > 0;
  const activeShot = steps[active]?.shot;
  const tabId = (index: number) => `${baseId}-tab-${index}`;
  const panelId = `${baseId}-panel`;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = steps.length - 1;
    const next =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? index === last ? 0 : index + 1
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? index === 0 ? last : index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const caption = (shot: YsStepShot) => (
    <figcaption className="border-t border-line bg-surface px-[18px] py-3 text-[13px] leading-6 text-ink-mid">
      {shot.caption}
    </figcaption>
  );

  return (
    <div
      className={cn(
        "grid grid-cols-1 items-start gap-x-16 gap-y-8",
        hasShots && "min-[960px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]",
        className,
      )}
    >
      <div role="tablist" aria-label={label} aria-orientation="vertical" className="min-w-0 border-l border-line">
        {steps.map((step, index) => {
          const selected = index === active;
          return (
            <div key={index} className="border-t border-line first:border-t-0">
              <button
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                id={tabId(index)}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={hasShots ? panelId : undefined}
                aria-labelledby={`${tabId(index)}-title`}
                aria-describedby={`${tabId(index)}-body`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={cn(
                  "group relative flex w-full gap-3.5 py-[22px] pl-4 pr-2 text-left outline-none",
                  index === 0 && "pt-1",
                  "focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-paper",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute -left-px bottom-0 top-0 w-[2px] transition-colors duration-[--duration-state]",
                    selected ? "bg-ink" : "bg-transparent",
                  )}
                />
                <span className="mt-1.5 w-5 flex-none text-[13px] font-medium leading-[19px] tabular-nums text-ink-mid">
                  {stepNumber(index)}
                </span>
                <span className="min-w-0">
                  <span
                    id={`${tabId(index)}-title`}
                    className={cn(
                      "block text-[22px] font-medium leading-[28.6px] tracking-[-0.22px] transition-colors duration-[--duration-state]",
                      selected ? "text-ink" : "text-ink-mid group-hover:text-ink",
                    )}
                  >
                    {step.title}
                  </span>
                  <span
                    id={`${tabId(index)}-body`}
                    className="mt-2 block max-w-[28rem] text-base leading-[25.6px] text-ink-mid"
                  >
                    {Children.toArray(step.body)}
                  </span>
                </span>
              </button>

              {/* Narrow screens: the active step's screenshot sits right under
                  it. Decorative here, since the step's text says the same
                  thing and the labelled panel is the wide-screen one. */}
              {selected && step.shot && (
                <figure
                  aria-hidden
                  className="mx-4 mb-6 overflow-hidden rounded-card border border-line bg-paper motion-safe:duration-300 motion-safe:animate-in motion-safe:fade-in-0 min-[960px]:hidden"
                >
                  <Image
                    src={step.shot.src}
                    alt=""
                    width={SHOT_WIDTH}
                    height={SHOT_HEIGHT}
                    sizes="100vw"
                    className="h-auto w-full"
                  />
                  {caption(step.shot)}
                </figure>
              )}
            </div>
          );
        })}
      </div>

      {hasShots && (
        <figure
          id={panelId}
          role="tabpanel"
          aria-labelledby={`${tabId(active)}-title`}
          className="sticky top-[calc(var(--app-header-h)+24px)] m-0 hidden min-w-0 overflow-hidden rounded-card border border-line bg-paper min-[960px]:block"
        >
          <div className="relative aspect-[2880/1645]">
            {shots.map((shot) => {
              const visible = shot.src === activeShot?.src;
              return (
                <Image
                  key={shot.src}
                  src={shot.src}
                  alt={visible ? shot.alt : ""}
                  aria-hidden={!visible}
                  fill
                  sizes="(min-width: 960px) 55vw, 100vw"
                  className={cn(
                    "object-cover transition-opacity duration-300 ease-out motion-reduce:transition-none",
                    visible ? "opacity-100" : "opacity-0",
                  )}
                />
              );
            })}
          </div>
          {activeShot && caption(activeShot)}
        </figure>
      )}
    </div>
  );
}
