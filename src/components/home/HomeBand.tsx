import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Full-bleed horizontal band holding one homepage section.
 *
 * Sections alternate between the page surface and a tinted one so the page
 * reads as distinct chapters rather than a single column of white cards on
 * white. The band is full width but its inner container matches every other
 * section, so headings, rails and the navbar stay on one alignment grid.
 */
export function HomeBand({
  children,
  tinted = false,
  className,
}: {
  children: ReactNode;
  tinted?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(tinted && "border-y bg-muted/40", className)}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">{children}</div>
    </div>
  );
}
