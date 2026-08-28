import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
 * DESIGN.md permits a badge exactly three constructions: a solid fill with
 * inverted text, an outline with no fill, or no container at all. The tint
 * fill it replaces — a pale surface carrying dark text of the same family —
 * is banned everywhere, badges included, because it is the single most
 * recognisable generated-dashboard tell in the list.
 *
 * `secondary` is therefore the outline, not a lighter fill: it is the variant
 * most call sites reach for when they mean "this is a status, not an
 * advertisement", and the outline is what that means here.
 *
 * The default is ink rather than pink. Pink has a viewport budget and is
 * load-bearing precisely because it is not on every status chip; a badge that
 * merely reports state has no claim on the CTA colour.
 *
 * The label size is spelled as an arbitrary value rather than `text-label`:
 * tailwind-merge cannot tell a custom `text-*` size from a custom `text-*`
 * colour, so `text-label` in the base was being dropped by every variant that
 * sets a text colour. An arbitrary length is unambiguous to the merger.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-pill border px-3 py-0.5 text-[0.8125rem] font-medium leading-[1.4] tracking-[0.01em] transition-colors duration-[--duration-state] focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-ink text-paper",
        pink: "border-transparent bg-pink text-white",
        gold: "border-transparent bg-gold text-gold-ink",
        success: "border-transparent bg-success text-white",
        destructive: "border-transparent bg-error text-white",
        secondary: "border-line bg-transparent text-ink",
        outline: "border-line bg-transparent text-ink",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
