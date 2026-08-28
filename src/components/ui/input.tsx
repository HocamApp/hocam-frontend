import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-input border border-line bg-surface px-3 py-2 text-body text-ink transition-colors duration-[--duration-state] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-mid focus-visible:border-ink focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-paper disabled:text-ink-mid",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
