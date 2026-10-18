import type { ReactNode } from "react";
import { WarningCircle } from "@phosphor-icons/react/ssr";

import { cn } from "@/lib/utils";

/**
 * Something needs the reader's attention and may need an action: an overdue
 * report, a deadline that has passed.
 *
 * The same construction as the "N işlem seni bekliyor" card on Panom: an ink
 * hairline, the surface colour, a filled WarningCircle in ink. Nothing here
 * is a warning colour, because DESIGN.md has none ("warnings use ink"), and
 * there is no coloured stripe or tinted ground (§11 #11 and #31). The circled
 * exclamation is not `--error` either: that colour belongs to a failure the
 * reader can fix (InlineError), and this is a state of affairs.
 *
 * 10px, not the card radius: it usually sits inside a 20px card with padding,
 * and the nesting rule leaves no room for a bigger one.
 */
export function AttentionNotice({
  title,
  children,
  action,
  role = "status",
  className,
}: {
  title: string;
  children?: ReactNode;
  /** One way forward, usually an outline pill button. */
  action?: ReactNode;
  role?: "status" | "alert";
  className?: string;
}) {
  return (
    <div
      role={role}
      className={cn(
        "flex w-full max-w-[32rem] gap-3 rounded-input border border-ink bg-surface px-4 py-3 text-ink",
        className,
      )}
    >
      <WarningCircle weight="fill" className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 space-y-1">
        <p className="text-small font-medium">{title}</p>
        {children ? <div className="space-y-1 text-small text-ink-mid">{children}</div> : null}
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </div>
  );
}
