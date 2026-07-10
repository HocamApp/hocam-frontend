"use client";

import * as React from "react";
import { useEffect, useRef } from "react";

export interface AnimatedTabItem {
  label: string;
  value: string;
}

export interface AnimatedTabsProps {
  tabs: AnimatedTabItem[];
  value: string;
  onValueChange: (value: string) => void;
  idPrefix?: string;
}

export function AnimatedTabs({ tabs, value, onValueChange, idPrefix }: AnimatedTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;

    if (container && value) {
      const activeIndex = tabs.findIndex((tab) => tab.value === value);
      const activeTabElement = activeIndex >= 0 ? tabRefs.current[activeIndex] : null;

      if (activeTabElement) {
        const { offsetLeft, offsetWidth } = activeTabElement;

        const clipLeft = offsetLeft + 16;
        const clipRight = offsetLeft + offsetWidth + 16;

        container.style.clipPath = `inset(0 ${Number(
          100 - (clipRight / container.offsetWidth) * 100,
        ).toFixed()}% 0 ${Number(
          (clipLeft / container.offsetWidth) * 100,
        ).toFixed()}% round 17px)`;
      }
    }
  }, [value, tabs]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + delta + tabs.length) % tabs.length;
    onValueChange(tabs[nextIndex].value);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="tablist"
      className="relative bg-secondary/50 border border-primary/10 mx-auto flex w-fit flex-col items-center rounded-full py-2 px-4"
    >
      <div
        ref={containerRef}
        aria-hidden="true"
        className="absolute z-10 w-full overflow-hidden [clip-path:inset(0px_75%_0px_0%_round_17px)] [transition:clip-path_0.25s_ease]"
      >
        <div className="relative flex w-full justify-center bg-primary">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => onValueChange(tab.value)}
              className="flex h-10 items-center rounded-full px-4 text-sm font-medium text-primary-foreground"
              tabIndex={-1}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex w-full justify-center">
        {tabs.map((tab, index) => {
          const isActive = value === tab.value;

          return (
            <button
              key={index}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              id={idPrefix ? `${idPrefix}-tab-${tab.value}` : undefined}
              aria-controls={idPrefix ? `${idPrefix}-tabpanel-${tab.value}` : undefined}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onValueChange(tab.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className="flex h-10 items-center cursor-pointer rounded-full px-4 text-sm font-medium text-muted-foreground"
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
