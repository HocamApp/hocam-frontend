"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { formatRelativeDate } from "@/lib/utils";
import {
  fetchNotifications,
  markNotificationRead,
  deleteNotification,
} from "@/lib/notificationsApi";
import type { Notification, NotificationSummary } from "@/types/api";

function getNotificationHref(n: Notification, role?: string): string | null {
  if (n.related_object_type === "conversation" && n.related_object_id) {
    return `/messages/${n.related_object_id}`;
  }

  if (n.related_object_type === "booking") {
    if (n.related_object_id) {
      return role === "tutor"
        ? `/dashboard/tutor?tab=bookings&highlightBooking=${n.related_object_id}`
        : `/dashboard/student?highlightBooking=${n.related_object_id}`;
    }
    return role === "tutor" ? "/dashboard/tutor" : "/dashboard/student";
  }

  if (n.related_object_type === "lesson_request") {
    return role === "tutor" ? "/dashboard/tutor" : "/dashboard/student";
  }

  return null;
}

// Privacy: message notifications must never surface the message content;
// the sender is in the title, the body is replaced with a generic line.
function isMessageNotification(n: Notification): boolean {
  return n.type === "message" || n.related_object_type === "conversation";
}

function getNotificationBody(n: Notification): string | null {
  if (isMessageNotification(n)) return "Sana yeni bir mesaj gönderdi.";
  return n.body || null;
}

export function NotificationPopoverContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const updateNotificationCaches = (
    updater: (notifications: Notification[]) => Notification[]
  ) => {
    const previousNotifications =
      queryClient.getQueryData<Notification[]>(["notifications"]);
    const previousSummary =
      queryClient.getQueryData<NotificationSummary>(["notification-summary"]);

    if (previousNotifications) {
      const nextNotifications = updater(previousNotifications);
      const unreadCount = nextNotifications.filter((n) => !n.is_read).length;
      queryClient.setQueryData<Notification[]>(["notifications"], nextNotifications);
      queryClient.setQueryData<NotificationSummary>(["notification-summary"], {
        has_unread: unreadCount > 0,
        unread_count: unreadCount,
      });
    }

    return { previousNotifications, previousSummary };
  };

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      return updateNotificationCaches((old) =>
        old.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    },
    onError: (_error, _id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(["notifications"], context.previousNotifications);
      }
      if (context?.previousSummary) {
        queryClient.setQueryData(["notification-summary"], context.previousSummary);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-summary"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      return updateNotificationCaches((old) => old.filter((n) => n.id !== id));
    },
    onSuccess: () => {
      toast.success("Bildirim silindi.");
    },
    onError: (_error, _id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(["notifications"], context.previousNotifications);
      }
      if (context?.previousSummary) {
        queryClient.setQueryData(["notification-summary"], context.previousSummary);
      }
      toast.error("Bildirim silinemedi. Lütfen tekrar deneyin.");
    },
    onSettled: () => {
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

  const items = (notifications ?? []).filter((n) => !n.is_read).slice(0, 10);

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
        <div
          key={n.id}
          role="button"
          tabIndex={0}
          className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
          onClick={() => handleNotificationClick(n)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleNotificationClick(n);
            }
          }}
        >
          <span
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
              n.is_read ? "bg-transparent" : "bg-blue-500"
            }`}
          />
          <div className="min-w-0 flex-1 overflow-hidden">
            <p
              className={`break-words text-sm leading-snug [overflow-wrap:anywhere] ${
                n.is_read ? "font-normal" : "font-semibold"
              }`}
            >
              {n.title}
            </p>
            {getNotificationBody(n) && (
              <p className="mt-0.5 line-clamp-2 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
                {getNotificationBody(n)}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {formatRelativeDate(n.created_at)}
            </p>
          </div>
          <button
            type="button"
            aria-label="Bildirimi sil"
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              deleteMutation.mutate(n.id);
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
