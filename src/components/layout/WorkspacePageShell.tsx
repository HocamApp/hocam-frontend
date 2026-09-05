import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type WorkspacePageShellProps = {
  title: string;
  actions?: ReactNode;
  width?: "narrow" | "default" | "wide";
  children: ReactNode;
};

const WIDTH_CLASS = {
  narrow: "max-w-3xl",
  default: "max-w-5xl",
  wide: "max-w-7xl",
} as const;

export function WorkspacePageShell({
  title,
  actions,
  width = "default",
  children,
}: WorkspacePageShellProps) {
  return (
    /* A div, not a main. The app shell in (main)/layout.tsx already owns the
       page's one <main id="ys-main-content">, and a second one nested inside
       it is invalid: assistive technology looks for a single primary landmark
       and a page offering two makes "skip to content" ambiguous. */
    <div className="text-ink">
      <header
        data-testid="workspace-page-header"
        className={cn(
          "mx-auto flex w-full min-w-0 flex-col gap-4 px-4 pt-10 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:pt-14",
          WIDTH_CLASS[width],
        )}
      >
        <h1 className="min-w-0 max-w-[20ch] break-words text-[1.875rem] font-bold leading-[1.05] tracking-[-0.02em] text-balance sm:text-[2.75rem]">
          {title}
        </h1>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </header>

      <div
        data-testid="workspace-shell-stack"
        className={cn(
          "mx-auto w-full space-y-6 px-4 pb-16 pt-6 sm:px-6 sm:pb-24 sm:pt-8",
          WIDTH_CLASS[width],
        )}
      >
        {children}
      </div>
    </div>
  );
}
