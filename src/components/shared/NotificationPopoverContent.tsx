"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { formatRelativeDate } from "@/lib/utils";
import { fetchNotifications, markNotificationRead } from "@/lib/notificationsApi";
import type { Notification } from "@/types/api";

function getNotificationHref(n: Notification, role?: string): string | null {
  if (n.related_object_type === "conversation" && n.related_object_id) {
    return `/messages/${n.related_object_id}`;
  }

  if (n.related_object_type === "lesson_request") {
    return role === "tutor" ? "/dashboard/tutor" : "/dashboard/student";
  }

  if (n.related_object_type === "booking") {
    return role === "tutor" ? "/dashboard/tutor" : "/dashboard/student";
  }

  return null;
}

export function NotificationPopoverContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-summary"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const items = notifications?.slice(0, 10) ?? [];

  const handleNotificationClick = (n: Notification) => {
    if (!n.is_read) markReadMutation.mutate(n.id);
    const href = getNotificationHref(n, user?.role);
    if (href) router.push(href);
  };

  if (items.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Bildirim yok
      </div>
    );
  }

  return (
    <div className="divide-y">
      {items.map((n: Notification) => (
        <button
          key={n.id}
          className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
          onClick={() => handleNotificationClick(n)}
        >
          <span
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
              n.is_read ? "bg-transparent" : "bg-blue-500"
            }`}
          />
          <div className="min-w-0 flex-1">
            <p
              className={`text-sm leading-snug ${
                n.is_read ? "font-normal" : "font-semibold"
              }`}
            >
              {n.title}
            </p>
            {n.body && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {n.body}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {formatRelativeDate(n.created_at)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
