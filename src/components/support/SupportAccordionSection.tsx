"use client";

import type { ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export interface SupportAccordionSectionItem {
  id: string;
  title: string;
  content: ReactNode;
  anchorId?: string;
}

export type SupportAccordionSectionLayout = "split" | "stacked";

interface SupportAccordionSectionProps {
  heading: ReactNode;
  items: SupportAccordionSectionItem[];
  value?: string;
  onValueChange?: (value: string) => void;
  layout?: SupportAccordionSectionLayout;
  className?: string;
}

export function SupportAccordionSection({
  heading,
  items,
  value,
  onValueChange,
  layout = "split",
  className,
}: SupportAccordionSectionProps) {
  return (
    <section
      className={cn(
        "border-t border-[var(--line)]",
        layout === "split" ? "mt-10 py-12 md:py-16" : "py-8",
        className
      )}
    >
      <div
        className={cn(
          "grid",
          layout === "split"
            ? "gap-10 md:grid-cols-[0.85fr_1.15fr] md:gap-14"
            : "gap-4"
        )}
      >
        <div>{heading}</div>

        <Accordion
          type="single"
          collapsible
          value={value}
          onValueChange={onValueChange}
          className="w-full"
        >
          {items.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              id={item.anchorId}
              className={cn(
                "border-[var(--line)]",
                item.anchorId && "scroll-mt-24"
              )}
            >
              <AccordionTrigger className="min-h-12 cursor-pointer text-left text-base text-ink hover:no-underline">
                {item.title}
              </AccordionTrigger>
              <AccordionContent className="text-ink-mid">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
