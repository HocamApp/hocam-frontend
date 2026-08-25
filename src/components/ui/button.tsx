import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    /*
   * Pills, and the single highest-leverage line in the rebrand: buttons appear
   * on every screen, and shadcn's 6px default is the most recognisable tell in
   * the whole system.
   *
   * `transition-colors` at 120ms and nothing else. No transform, no shadow, no
   * scale. The lift-on-hover pattern is both a generic tell and an
   * accessibility liability, since it needs its own prefers-reduced-motion
   * escape hatch; a colour change needs no exception and degrades to nothing.
   *
   * Disabled is a neutral fill rather than a faded brand colour. A washed-out
   * pink reads as a rendering bug rather than a state.
   */
  "inline-flex items-center justify-center whitespace-nowrap rounded-pill font-medium ring-offset-background transition-colors duration-[--duration-state] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:border-transparent disabled:bg-line disabled:text-ink-mid",
  {
    variants: {
      variant: {
        /* Primary. One per screen region. Was navy — DESIGN.md removes the
           blue outright to hold the palette at three hues. */
        default: "bg-pink text-white hover:bg-pink-deep",
        /* Secondary: transparent until hover, then it fills solid and the
           text inverts. */
        outline: "border border-ink bg-transparent text-ink hover:bg-ink hover:text-white",
        /* Tertiary: no container at all. Dismissals, back, cancel. */
        ghost: "text-ink hover:bg-paper",
        /* Tutor-side actions only, and never beside a pink button: both are
           fully saturated and large adjacent areas visually vibrate. */
        gold: "bg-gold text-gold-ink hover:brightness-95",
        destructive: "bg-error text-white hover:brightness-95",
        secondary: "bg-paper text-ink hover:bg-line",
        link: "text-pink underline-offset-4 hover:underline",
      },
      size: {
        /* Padding, not height, carries the size. Pills need horizontal room,
           and Turkish runs 15 to 20% longer than English for the same
           meaning, so the label needs the slack. Heights stay where they are
           because they are already at an accessible touch target. */
        default: "h-10 px-7 text-[0.9375rem]",
        sm: "h-9 px-[22px] text-small",
        lg: "h-11 px-[34px] text-body",
        icon: "h-10 w-10 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
