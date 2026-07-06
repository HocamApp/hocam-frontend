"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategoryNavItem {
  id: string;
  title: string;
  icon: LucideIcon;
  count: number;
}

interface CategoryNavProps {
  items: CategoryNavItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

/** Desktop sidebar list of catalog categories. */
export function CategoryNavSidebar({ items, activeId, onSelect }: CategoryNavProps) {
  return (
    <nav aria-label="Paket kategorileri" className="space-y-1">
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
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{title}</span>
            <span
              className={cn(
                "shrink-0 rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                isActive ? "bg-primary/10" : "bg-muted"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/** Horizontally scrollable category pills for small screens. */
export function CategoryNavPills({ items, activeId, onSelect }: CategoryNavProps) {
  return (
    <nav
      aria-label="Paket kategorileri"
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
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {title}
          </button>
        );
      })}
    </nav>
  );
}
