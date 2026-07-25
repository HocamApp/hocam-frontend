"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { resolveProfileImageUrl } from "@/lib/profileImages";
import { cn } from "@/lib/utils";

type AvatarShape = "square" | "circle";

// AvatarFallback reads this instead of taking its own `shape` prop — a
// photo that fails to load must fall back to the same shape the image
// would have had, and context makes that automatic instead of relying on
// every call site to set the same prop in two places.
const AvatarShapeContext = React.createContext<AvatarShape>("square");

interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  /** "square" (default) is a soft rounded-corner square (rounded-lg, i.e.
   * var(--radius) = 8px — the same radius Card uses), not a hard 90°
   * corner. Pass "circle" to opt out — reserved for messaging avatars,
   * which stay round intentionally. */
  shape?: AvatarShape;
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, shape = "square", ...props }, ref) => (
  <AvatarShapeContext.Provider value={shape}>
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden",
        shape === "circle" ? "rounded-full" : "rounded-lg",
        className
      )}
      {...props}
    />
  </AvatarShapeContext.Provider>
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    src={resolveProfileImageUrl(src)}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => {
  const shape = React.useContext(AvatarShapeContext);
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center bg-muted",
        shape === "circle" ? "rounded-full" : "rounded-lg",
        className
      )}
      {...props}
    />
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
