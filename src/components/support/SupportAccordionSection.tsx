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

interface SupportAccordionSectionProps {
  heading: ReactNode;
  items: SupportAccordionSectionItem[];
}

export function SupportAccordionSection({
  heading,
  items,
}: SupportAccordionSectionProps) {
  return (
    <section className="mt-10 border-t border-border/70 py-12 md:py-16">
      <div className="grid gap-10 md:grid-cols-[0.85fr_1.15fr] md:gap-14">
        <div>{heading}</div>

        <Accordion type="single" collapsible className="w-full">
          {items.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              id={item.anchorId}
              className={cn(
                "border-dotted",
                item.anchorId && "scroll-mt-24"
              )}
            >
              <AccordionTrigger className="cursor-pointer text-base hover:no-underline">
                {item.title}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
