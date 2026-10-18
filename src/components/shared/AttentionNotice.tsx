import type { ReactNode } from "react";
import { WarningCircle } from "@phosphor-icons/react/ssr";

import { cn } from "@/lib/utils";

/**
 * Something needs the reader's attention and may need an action: an overdue
 * report, a deadline that has passed.
 *
 * A hairline in the brand pink on the surface colour, a filled WarningCircle
 * in the same pink, ink text. The pink is the brand's own colour, not a
 * warning hue (DESIGN.md has none), and there is no coloured stripe or tinted
 * ground (§11 #11 and #31): the colour sits on the line and the icon, the
 * text stays ink. The circled exclamation is not `--error` either: that
 * colour belongs to a failure the reader can fix (InlineError), and this is a
 * state of affairs. The way forward is the one pink pill button, white text.
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
  /** One way forward, usually a pink pill button. */
  action?: ReactNode;
  role?: "status" | "alert";
  className?: string;
}) {
  return (
    <div
      role={role}
      className={cn(
        "flex w-full max-w-[32rem] gap-3 rounded-input border border-pink bg-surface px-4 py-3 text-ink",
        className,
      )}
    >
      <WarningCircle weight="fill" className="mt-0.5 h-5 w-5 shrink-0 text-pink" aria-hidden="true" />
      <div className="min-w-0 space-y-1">
        <p className="text-small font-medium">{title}</p>
        {children ? <div className="space-y-1 text-small text-ink-mid">{children}</div> : null}
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </div>
  );
}
