"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationMark } from "@/components/shared/NotificationMark";
import { NotificationPopoverContent } from "@/components/shared/NotificationPopoverContent";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { fetchNotificationSummary } from "@/lib/notificationsApi";
import {
  YS_NOTIFICATIONS_LABEL,
  YsNotificationsIcon,
} from "@/components/yemeksepeti/ysAppNav";

/**
 * The phone's notification bell, in the header row beside the avatar.
 *
 * It used to be the fourth slot of the bottom bar, which put a panel that
 * opens upward under the thumb and spent a permanent primary destination on
 * something people check rather than navigate to. Up here it matches where a
 * bell sits on the desktop header, and the bottom bar got its slot back for
 * the study programme.
 */
export function MobileNotificationsBell() {
  const [isOpen, setIsOpen] = React.useState(false);
  const isPageVisible = usePageVisibility();

  const { data: summary } = useQuery({
    queryKey: ["notification-summary"],
    queryFn: fetchNotificationSummary,
    refetchInterval: isPageVisible ? 30_000 : false,
  });
  const unreadCount = summary?.unread_count ?? 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            unreadCount > 0
              ? `${YS_NOTIFICATIONS_LABEL}, ${unreadCount} okunmamış`
              : YS_NOTIFICATIONS_LABEL
          }
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-pill text-ink transition-colors duration-[--duration-state] hover:bg-paper md:hidden"
        >
          <YsNotificationsIcon className="h-6 w-6" aria-hidden="true" />
          <NotificationMark
            unreadCount={unreadCount}
            className="absolute right-1.5 top-1.5"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        aria-label={YS_NOTIFICATIONS_LABEL}
        align="end"
        sideOffset={8}
        className="w-[min(22rem,calc(100vw-1.5rem))] border-none bg-transparent p-0 shadow-none"
      >
        <NotificationPopoverContent onNavigate={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
