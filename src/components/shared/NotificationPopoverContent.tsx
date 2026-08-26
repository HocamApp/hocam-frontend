"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { formatRelativeTime } from "@/lib/utils";
import {
  fetchNotifications,
  markNotificationRead,
  deleteNotification,
} from "@/lib/notificationsApi";
import {
  NOTIFICATION_TONE_CLASS,
  getNotificationAppearance,
} from "@/components/shared/notificationAppearance";
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
      <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
        <Bell className="size-8 text-ink-mid" weight="regular" aria-hidden />
        <p className="text-body font-medium text-ink">Yeni bildirim yok</p>
        <p className="text-small text-ink-mid">
          Ders ve mesaj hareketlerin burada görünür.
        </p>
      </div>
    );
  }

  return (
    /* `AnimatePresence` and `layout` are the useful half of the reference
       component. Its interval that reveals one child at a time and loops is
       demo behaviour — on a real list it would drip-feed notifications on a
       timer and start over. What is kept is the part that communicates state:
       delete a row and the rest close the gap instead of teleporting. */
    /* No padding and no surface of its own: the popover's chrome is off, so
       these cards float directly and the shell that used to sit behind them
       was a box drawn around a box. */
    <div className="max-h-[420px] space-y-2 overflow-y-auto overflow-x-hidden">
      <AnimatePresence>
        {items.map((n: Notification, cardIndex: number) => {
          const { icon: Icon, tone } = getNotificationAppearance(
            n.type,
            n.related_object_type,
          );
          const body = getNotificationBody(n);
          return (
            /* The spring is the one from the supplied component — stiffness
               350, damping 40, which is damped enough to settle rather than
               wobble. What is not taken is its interval: that reveals one child
               at a time and then loops, which on a real list would drip-feed
               notifications on a timer and start over.
               Staggered by index so the stack reads as arriving in order.
               Capped at five steps, or a long list would still be animating
               after the reader has finished with it. */
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 350,
                  damping: 40,
                  delay: Math.min(cardIndex, 5) * 0.05,
                },
              }}
              exit={{ opacity: 0, scale: 0.96, height: 0, marginTop: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 40 }}
            >
              <div
                role="button"
                tabIndex={0}
                /* These carry the shadow now. The popover's own panel is gone,
                   so each card is the floating surface rather than a row
                   inside one — which is exactly when DESIGN.md allows a
                   shadow. Focus moves the border to ink instead of taking the
                   browser's blue default, which is not a colour this palette
                   owns. */
                className="group flex w-full items-start gap-3 rounded-card border border-line bg-surface p-3 text-left shadow-float transition-colors duration-[--duration-state] hover:border-ink focus-visible:border-ink focus-visible:outline-none"
                onClick={() => handleNotificationClick(n)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleNotificationClick(n);
                  }
                }}
              >
                {/* 14px inside the 20px card, following the nesting
                    subtraction rule. */}
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-[14px] ${NOTIFICATION_TONE_CLASS[tone]}`}
                  aria-hidden
                >
                  <Icon className="size-5" weight="regular" />
                </span>

                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="flex flex-wrap items-baseline gap-x-1.5 text-body font-medium leading-snug text-ink">
                    <span className="break-words [overflow-wrap:anywhere]">
                      {n.title}
                    </span>
                    <span className="text-small font-normal text-ink-mid">
                      · {formatRelativeTime(n.created_at)}
                    </span>
                  </p>
                  {body && (
                    <p className="mt-0.5 line-clamp-2 break-words text-small text-ink-mid [overflow-wrap:anywhere]">
                      {body}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  aria-label="Bildirimi sil"
                  className="shrink-0 rounded-input p-1 text-line transition-colors duration-[--duration-state] hover:text-error focus-visible:text-error group-hover:text-ink-mid"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(n.id);
                  }}
                >
                  <X className="size-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
