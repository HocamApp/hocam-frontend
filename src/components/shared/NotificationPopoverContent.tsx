"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, X } from "@phosphor-icons/react";
import { AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { formatRelativeTime } from "@/lib/utils";
import {
  fetchNotifications,
  markNotificationRead,
  deleteNotification,
} from "@/lib/notificationsApi";
import { getNotificationAppearance } from "@/components/shared/notificationAppearance";
import { AnimatedListItem } from "@/components/ui/animated-list";
import { cn } from "@/lib/utils";
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
      <div className="space-y-2 p-3">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex items-center gap-3 rounded-card p-3">
            <Skeleton className="size-10 shrink-0 rounded-[14px]" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
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
      /* The popover itself is transparent: with notifications in it, each row
         is its own white card and the page showing between them is the point.
         Empty, there are no cards, so the text sat directly on whatever
         happened to be underneath. This state brings its own surface — the
         one floating-panel treatment from DESIGN.md, since a popover is a
         thing that genuinely floats. */
      <div className="flex flex-col items-center gap-2 rounded-card border border-line bg-surface px-6 py-10 text-center shadow-float">
        <Bell className="size-8 text-ink-mid" weight="regular" aria-hidden />
        <p className="text-body font-medium text-ink">Yeni bildirim yok</p>
        <p className="text-small text-ink-mid">
          Ders ve mesaj hareketlerin burada görünür.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[440px] space-y-4 overflow-y-auto overflow-x-hidden p-1">
      <AnimatePresence>
        {items.map((n: Notification) => {
          const { icon, color } = getNotificationAppearance(
            n.type,
            n.related_object_type,
          );
          const body = getNotificationBody(n);
          return (
            /* The animation from the supplied component, item for item: scale
               0 to 1 on a 350/40 spring, and `layout` so deleting one closes
               the gap. Its `AnimatedList` wrapper is not used — that reveals
               one child at a time on an interval and then loops, which is
               right for a marketing demo and would drip-feed real
               notifications on a timer. */
            <AnimatedListItem key={n.id}>
              <figure
                role="button"
                tabIndex={0}
                className={cn(
                  "relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4",
                  "transition-all duration-200 ease-in-out hover:scale-[103%]",
                  // The rows are focusable, and Radix focuses the first one on
                  // open. Without this it takes the browser's blue default.
                  "outline-none focus-visible:ring-2 focus-visible:ring-black/15",
                  "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
                  "transform-gpu dark:bg-transparent dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]",
                )}
                onClick={() => handleNotificationClick(n)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleNotificationClick(n);
                  }
                }}
              >
                <div className="flex flex-row items-center gap-3">
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: color }}
                  >
                    <span className="text-lg">{icon}</span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <figcaption className="flex flex-wrap items-baseline font-medium dark:text-white">
                      <span className="text-sm sm:text-base">{n.title}</span>
                      <span className="mx-1">·</span>
                      <span className="shrink-0 text-xs text-gray-500">
                        {formatRelativeTime(n.created_at)}
                      </span>
                    </figcaption>
                    {body && (
                      <p className="line-clamp-2 text-sm font-normal text-gray-600 dark:text-white/60">
                        {body}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label="Bildirimi sil"
                    className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(n.id);
                    }}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </figure>
            </AnimatedListItem>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
