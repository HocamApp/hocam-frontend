"use client";

import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  name?: string;
  className?: string;
}

/**
 * Subtle "karşı taraf yazıyor" indicator with three animated dots.
 *
 * NOTE: This is a UI-ready component. Messaging currently uses HTTP polling
 * (no realtime presence channel), so there is no live signal for when the other
 * participant is typing. Wire `isOtherTyping` to a realtime/presence source
 * (e.g. Supabase Realtime or a typing-status endpoint) when one exists.
 */
export function TypingIndicator({ name, className }: TypingIndicatorProps) {
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="status"
      aria-live="polite"
      aria-label={name ? `${name} yazıyor` : "Karşı taraf yazıyor"}
    >
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
        <span className="h-2 w-2 animate-typing-dot rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-typing-dot rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-typing-dot rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
      </div>
      <span className="text-xs text-muted-foreground">
        {name ? `${name} yazıyor…` : "yazıyor…"}
      </span>
    </div>
  );
}
