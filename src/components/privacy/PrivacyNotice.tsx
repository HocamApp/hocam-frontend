import type { ReactNode } from "react";
import { Info, Warning } from "@phosphor-icons/react/ssr";

import { cn } from "@/lib/utils";

/**
 * The framed explanation that sits above a disabled surface.
 *
 * Deliberately not a tinted panel. `bg-amber-50 / text-amber-700` is the
 * banned tint fill from DESIGN.md item 31, and it reads as a warning about
 * something the reader did wrong. Nothing here is the reader's fault: these
 * boxes explain that a feature is off, which is a statement of fact.
 * Hairline plus the page ground, with the icon carrying the tone.
 */
export function PrivacyNotice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "attention";
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const Icon = tone === "attention" ? Warning : Info;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-input border border-line bg-paper p-4",
        className,
      )}
    >
      <Icon
        weight="regular"
        className="mt-0.5 h-5 w-5 shrink-0 text-ink-mid"
        aria-hidden
      />
      <div className="min-w-0 space-y-1">
        {title ? (
          <p className="text-body font-medium text-ink">{title}</p>
        ) : null}
        <div className="text-small leading-[1.6] text-ink-mid">{children}</div>
      </div>
    </div>
  );
}
