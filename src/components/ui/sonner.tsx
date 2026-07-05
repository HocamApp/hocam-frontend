"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Hocam snackbar: compact, token-based toast surface. Colors come from the
 * theme CSS variables so light/dark follow the `.dark` class automatically —
 * no `richColors` (that produced the solid green/red alert bars).
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-center"
      duration={3500}
      gap={10}
      offset={20}
      mobileOffset={16}
      style={
        {
          fontFamily: "inherit",
          "--width": "340px",
          "--normal-bg": "hsl(var(--popover))",
          "--normal-text": "hsl(var(--popover-foreground))",
          "--normal-border": "hsl(var(--border))",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "!rounded-lg !border !border-border !bg-popover !text-popover-foreground !shadow-lg !px-4 !py-3",
          title: "!text-sm !font-medium",
          description: "!text-xs !text-muted-foreground",
          success:
            "[&_[data-icon]]:!text-green-600 dark:[&_[data-icon]]:!text-green-400",
          error: "[&_[data-icon]]:!text-destructive",
          info: "[&_[data-icon]]:!text-blue-600 dark:[&_[data-icon]]:!text-blue-400",
          warning:
            "[&_[data-icon]]:!text-amber-600 dark:[&_[data-icon]]:!text-amber-400",
        },
      }}
      {...props}
    />
  );
}
