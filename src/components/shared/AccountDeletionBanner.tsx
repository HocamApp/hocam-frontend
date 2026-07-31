"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

import { fetchDeletionStatus } from "@/lib/authApi";
import { useAuth } from "@/hooks/useAuth";

function formatBannerDate(value: string): string {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * App-wide amber info bar shown while a scheduled account deletion is inside
 * its grace window. Hidden for every other state (inactive, blocked,
 * offboarding) — those are handled on the security page itself.
 */
export function AccountDeletionBanner() {
  const { isAuthenticated, isLoading } = useAuth();
  const { data } = useQuery({
    queryKey: ["account-deletion-status"],
    queryFn: fetchDeletionStatus,
    staleTime: 60_000,
    retry: false,
    enabled: isAuthenticated && !isLoading,
  });

  if (!data || !data.active || data.status !== "scheduled") return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-sm">
        <span className="inline-flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Hesabınızın silinmesi planlandı:{" "}
            <time dateTime={data.scheduled_deletion_at} className="font-medium">
              {formatBannerDate(data.scheduled_deletion_at)}
            </time>
          </span>
        </span>
        <Link
          href="/profile/security"
          className="font-medium underline underline-offset-4 hover:no-underline"
        >
          Güvenlik ayarlarından yönetin
        </Link>
      </div>
    </div>
  );
}
