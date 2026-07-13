"use client";

import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProfileMenuRowProps {
  icon?: ReactNode;
  label: string;
  /** Compact status text shown before the chevron, e.g. "Eklenmedi" or "3 gün tanımlı". */
  trailingText?: string;
  badgeCount?: number;
  showChevron?: boolean;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

/** A tappable row: icon + label, optional trailing status / count badge / chevron. */
export function ProfileMenuRow({
  icon,
  label,
  trailingText,
  badgeCount,
  showChevron,
  onClick,
  danger,
  disabled,
}: ProfileMenuRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-[44px] w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          : "text-foreground hover:bg-muted"
      )}
    >
      {icon && (
        <span className={cn("shrink-0", danger ? "text-red-500 dark:text-red-400" : "text-muted-foreground")}>
          {icon}
        </span>
      )}
      <span className="flex-1 truncate">{label}</span>
      {trailingText && (
        <span className="shrink-0 truncate text-xs text-muted-foreground">{trailingText}</span>
      )}
      {typeof badgeCount === "number" && badgeCount > 0 && (
        <Badge
          variant="secondary"
          className="h-5 min-w-[1.25rem] justify-center rounded-full px-1.5 text-xs"
        >
          {badgeCount}
        </Badge>
      )}
      {showChevron && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </button>
  );
}

interface ProfileToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** Shows a small spinner next to the switch and blocks further clicks while a save is in flight. */
  loading?: boolean;
  icon?: ReactNode;
}

/** A row with a label and an accessible on/off switch. */
export function ProfileToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  loading,
  icon,
}: ProfileToggleRowProps) {
  return (
    <div className="flex items-center gap-3 px-2 py-1.5 text-sm">
      {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      <div className="min-w-0 flex-1">
        <span className="block text-foreground">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        )}
      </div>
      {loading && (
        <span
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-muted-foreground"
          aria-hidden
        />
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-primary" : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}
