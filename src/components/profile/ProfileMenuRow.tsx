"use client";

import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProfileMenuRowProps {
  icon?: ReactNode;
  label: string;
  badgeCount?: number;
  showChevron?: boolean;
  onClick?: () => void;
  danger?: boolean;
}

/** A tappable row: icon + label, optional count badge / chevron. */
export function ProfileMenuRow({
  icon,
  label,
  badgeCount,
  showChevron,
  onClick,
  danger,
}: ProfileMenuRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors",
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
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  icon?: ReactNode;
}

/** A row with a label and an accessible on/off switch. */
export function ProfileToggleRow({
  label,
  checked,
  onChange,
  disabled,
  icon,
}: ProfileToggleRowProps) {
  return (
    <div className="flex items-center gap-3 px-2 py-1.5 text-sm">
      {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      <span className="flex-1 text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
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
