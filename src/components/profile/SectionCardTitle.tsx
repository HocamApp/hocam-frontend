import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Same visual style as `CardTitle` (components/ui/card.tsx) but renders an
 * <h2> instead of an <h3>. Scoped to the student profile page, where "Hoca
 * Bilgileri" / "Hocam'daki öğrenme durumun" / "Hesap tercihleri" are major
 * sibling sections sitting directly under the page's single <h1> and need
 * h2-level semantics — unlike `CardTitle`'s many other usages elsewhere in
 * the app, which are correctly nested under a page-level <h2> already.
 * `CardTitle` itself is left untouched so no other page is affected.
 */
export const SectionCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
SectionCardTitle.displayName = "SectionCardTitle";
