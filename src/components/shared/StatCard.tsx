import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCard({
  icon,
  label,
  value,
  detail,
  isLoading,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  detail: string;
  isLoading?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-6 w-14" />
          ) : (
            <p className="text-xl font-semibold leading-tight">{value}</p>
          )}
        </div>
      </div>
      <p className="mt-2 truncate text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
