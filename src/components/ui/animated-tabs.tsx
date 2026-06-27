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
}

export function AnimatedTabs({ tabs, value, onValueChange }: AnimatedTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (container && value) {
      const activeTabElement = activeTabRef.current;

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
  }, [value]);

  return (
    <div className="relative bg-secondary/50 border border-primary/10 mx-auto flex w-fit flex-col items-center rounded-full py-2 px-4">
      <div
        ref={containerRef}
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
              ref={isActive ? activeTabRef : null}
              onClick={() => onValueChange(tab.value)}
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
