"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategoryNavItem {
  id: string;
  title: string;
  /** Optional: omitted when a category has no meaningful icon. */
  icon?: LucideIcon;
  /** Optional: omitted when no honest count is available for the category. */
  count?: number;
}

interface CategoryNavProps {
  items: CategoryNavItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  /** Accessible name for the nav landmark. Defaults to the catalog wording. */
  label?: string;
}

/** Desktop sidebar list of catalog categories. */
export function CategoryNavSidebar({
  items,
  activeId,
  onSelect,
  label = "Paket kategorileri",
}: CategoryNavProps) {
  return (
    <nav aria-label={label} className="space-y-1">
      {items.map(({ id, title, icon: Icon, count }) => {
        const isActive = id === activeId;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
              isActive
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
            <span className="min-w-0 flex-1 truncate">{title}</span>
            {typeof count === "number" && (
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                  isActive ? "bg-primary/10" : "bg-muted"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

/** Horizontally scrollable category pills for small screens. */
export function CategoryNavPills({
  items,
  activeId,
  onSelect,
  label = "Paket kategorileri",
}: CategoryNavProps) {
  return (
    <nav
      aria-label={label}
      className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map(({ id, title, icon: Icon }) => {
        const isActive = id === activeId;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              isActive
                ? "border-primary/30 bg-primary/10 font-medium text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
            {title}
          </button>
        );
      })}
    </nav>
  );
}
