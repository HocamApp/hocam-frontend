"use client";

import { LifeBuoy, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountDrawerFooterProps {
  onSupport: () => void;
  onLogout: () => void;
  loggingOut: boolean;
}

/** Stable footer: support navigation + sign out, separated from settings. */
export function AccountDrawerFooter({
  onSupport,
  onLogout,
  loggingOut,
}: AccountDrawerFooterProps) {
  return (
    <div className="space-y-1 border-t border-border px-1 pt-3">
      <button
        type="button"
        onClick={onSupport}
        className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
      >
        <LifeBuoy className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1">Destek</span>
      </button>
      <button
        type="button"
        onClick={onLogout}
        disabled={loggingOut}
        aria-busy={loggingOut}
        className={cn(
          "flex min-h-[44px] w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        {loggingOut ? (
          <span
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
        ) : (
          <LogOut className="h-4 w-4 shrink-0" />
        )}
        <span className="flex-1">{loggingOut ? "Çıkış yapılıyor…" : "Çıkış yap"}</span>
      </button>
    </div>
  );
}
