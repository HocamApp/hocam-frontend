"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import type * as React from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
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
        weekday: "size-9 p-0 text-xs font-medium text-muted-foreground",
        day: "size-9 p-0 text-sm",
        day_button: "relative flex size-9 items-center justify-center rounded-lg p-0 hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
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
