"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import type * as React from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  /** "default" (size-9 cells, ~36px) is used everywhere. "lg" (size-14,
   * ~56px) is for a single-month calendar that has the horizontal space
   * two size-9 months used to occupy — currently only AvailabilityCalendar.
   * "responsive" keeps those large cells from widening a phone viewport.
   * Shared with other, width-constrained calendars (e.g. the sidebar
   * calendar in StudentLessonsWorkspace), so this is a variant rather than
   * a global size bump. */
  size?: "default" | "lg" | "responsive";
};

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  size = "default",
  ...props
}: CalendarProps) {
  const cell =
    size === "lg"
      ? "size-14"
      : size === "responsive"
        ? "size-9 sm:size-14"
        : "size-9";
  const dayTextSize =
    size === "lg"
      ? "text-base"
      : size === "responsive"
        ? "text-sm sm:text-base"
        : "text-sm";
  const weekdayTextSize =
    size === "lg"
      ? "text-sm"
      : size === "responsive"
        ? "text-xs sm:text-sm"
        : "text-xs";
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-fit", className)}
      classNames={{
        months: "relative flex flex-col gap-4",
        month: "w-full",
        month_caption: "relative mx-10 mb-1 flex h-9 items-center justify-center",
        caption_label: "text-sm font-medium",
        nav: "absolute top-0 flex w-full justify-between",
        button_previous: cn(buttonVariants({ variant: "ghost" }), "size-9 p-0 text-muted-foreground hover:text-foreground"),
        button_next: cn(buttonVariants({ variant: "ghost" }), "size-9 p-0 text-muted-foreground hover:text-foreground"),
        weekday: cn(cell, weekdayTextSize, "p-0 font-medium text-muted-foreground"),
        day: cn(cell, dayTextSize, "p-0"),
        day_button: cn(
          cell,
          "relative flex items-center justify-center rounded-lg p-0 hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
        ),
        today: "font-semibold text-primary",
        outside: "text-muted-foreground/40",
        disabled: "text-muted-foreground/30 line-through",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...iconProps }) =>
          orientation === "left" ? <ChevronLeft size={16} {...iconProps} /> : <ChevronRight size={16} {...iconProps} />,
      }}
      {...props}
    />
  );
}
