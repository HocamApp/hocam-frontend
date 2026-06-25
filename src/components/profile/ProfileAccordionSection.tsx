"use client";

import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileAccordionSectionProps {
  icon: ReactNode;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** A single collapsible section inside the profile menu, with a light gray divider. */
export function ProfileAccordionSection({
  icon,
  title,
  defaultOpen = false,
  children,
}: ProfileAccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground/70">
          {icon}
        </span>
        <span className="flex-1 text-sm font-semibold text-foreground">{title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="space-y-3 px-4 pb-4 pt-0.5">{children}</div>}
    </div>
  );
}
