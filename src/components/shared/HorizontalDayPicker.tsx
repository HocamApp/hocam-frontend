"use client";

import { cn } from "@/lib/utils";

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

interface HorizontalDayPickerProps {
  dates: Date[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  getCount?: (date: Date, index: number) => number;
  className?: string;
}

/** Shared compact day selector used by schedule and calendar surfaces. */
export function HorizontalDayPicker({
  dates,
  selectedIndex,
  onSelect,
  getCount,
  className,
}: HorizontalDayPickerProps) {
  const today = new Date().toDateString();

  return (
    <div className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)]", className)}>
      <div className="-mx-1 flex min-w-0 snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {dates.map((date, index) => {
          const count = getCount?.(date, index) ?? 0;
          const isToday = date.toDateString() === today;
          const isSelected = index === selectedIndex;
          const backendDay = (date.getDay() + 6) % 7;

          return (
            <button
              key={`${date.toISOString()}-${index}`}
              type="button"
              onClick={() => onSelect(index)}
              aria-pressed={isSelected}
              className={cn(
                "flex w-14 shrink-0 snap-start flex-col items-center gap-1 rounded-xl border p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected ? "border-primary bg-primary/5" : "border-border",
                !isSelected && isToday && "border-primary/40"
              )}
            >
              <span className="text-xs font-semibold">{DAY_NAMES[backendDay]}</span>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isToday && "bg-primary text-primary-foreground"
                )}
              >
                {date.getDate()}
              </span>
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  count > 0 ? "bg-primary" : "bg-transparent"
                )}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
