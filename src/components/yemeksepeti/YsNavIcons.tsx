"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { NotificationMark } from "@/components/shared/NotificationMark";
import { NotificationPopoverContent } from "@/components/shared/NotificationPopoverContent";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { fetchNotificationSummary } from "@/lib/notificationsApi";

import {
  YS_NOTIFICATIONS_LABEL,
  YS_UTILITY_ITEMS,
  YsNotificationsIcon,
  getActiveYsNavItem,
  type YsNavItem,
} from "./ysAppNav";

/**
 * The signed-in icon cluster: messages, notifications, favourites.
 *
 * Split out of the navbar so the notification poll lives beside the bell that
 * needs it rather than in the shell. It shares the `["notification-summary"]`
 * key with MobileTabBar, so the two deduplicate into one request per interval
 * instead of doubling it.
 *
 * Favourites is a plain link and stays one on purpose. `useFavorites()` would
 * fire `/favorites/` on every page in the app just to decide whether to fill a
 * heart, which is a request per navigation for a decoration.
 */
export function YsNavIcons({
  pathname,
  searchParams,
}: {
  pathname: string;
  searchParams: URLSearchParams;
}) {
  const isPageVisible = usePageVisibility();
  const { data: summary } = useQuery({
    queryKey: ["notification-summary"],
    queryFn: fetchNotificationSummary,
    refetchInterval: isPageVisible ? 30_000 : false,
  });
  const hasUnread = summary?.has_unread ?? false;

  const active = getActiveYsNavItem(YS_UTILITY_ITEMS, pathname, searchParams);

  return (
    <div
      className="hidden shrink-0 items-center gap-1 border-l pl-3 md:flex"
      style={{ borderColor: "var(--ys-neutral-divider)" }}
    >
      {YS_UTILITY_ITEMS.map((item: YsNavItem) => {
        const Icon = item.icon;
        const isActive = active === item;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="ys-icon-btn"
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-5 w-5" weight={isActive ? "fill" : "regular"} />
          </Link>
        );
      })}

      <Popover>
        <span className="relative inline-flex">
          <PopoverTrigger asChild>
            <button
              type="button"
              className="ys-icon-btn"
              aria-label={YS_NOTIFICATIONS_LABEL}
            >
              <YsNotificationsIcon className="h-5 w-5" />
            </button>
          </PopoverTrigger>
          {/* Only lights when there is something unread. A permanently lit
              badge is misinformation, not decoration. */}
          <NotificationMark
            hasUnread={hasUnread}
            className="absolute right-1 top-1"
          />
        </span>
        <PopoverContent align="end" className="w-[min(24rem,calc(100vw-1.5rem))] border-none bg-transparent p-0 shadow-none">
          <NotificationPopoverContent />
        </PopoverContent>
      </Popover>
    </div>
  );
}
