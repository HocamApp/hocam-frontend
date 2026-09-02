"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { DotsThree, X, type Icon } from "@phosphor-icons/react";

import { useAuth } from "@/hooks/useAuth";
import { useCoachingFlag } from "@/hooks/useCoachingFlag";
import { useScheduleFlag } from "@/hooks/useScheduleFlag";
import { useTutorAcceptanceConfig } from "@/hooks/useTutorAcceptanceConfig";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationMark } from "@/components/shared/NotificationMark";
import { NotificationPopoverContent } from "@/components/shared/NotificationPopoverContent";
import { fetchNotificationSummary } from "@/lib/notificationsApi";
import { cn } from "@/lib/utils";
import {
  YS_NOTIFICATIONS_LABEL,
  YS_UTILITY_ITEMS,
  YsNotificationsIcon,
  getActiveYsNavItem,
  getYsAppTabs,
  type YsNavItem,
} from "@/components/yemeksepeti/ysAppNav";

const itemClassName =
  "relative flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium leading-tight text-ink-mid transition-colors duration-[--duration-state]";

type MobileIconProps = {
  Icon: Icon;
  active?: boolean;
  children?: React.ReactNode;
};

function MobileIcon({ Icon, active = false, children }: MobileIconProps) {
  const weight = active ? "fill" : "regular";

  return (
    <span
      className={cn(
        "relative inline-flex h-7 min-w-10 items-center justify-center rounded-pill px-2 transition-colors duration-[--duration-state]",
        active ? "bg-ink text-white" : "text-ink-mid",
      )}
    >
      <Icon
        size={20}
        weight={weight}
        data-icon-weight={weight}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

/** Mobile-only, role-aware primary navigation for authenticated users. */
export function MobileTabBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, isTutor, isLoading } = useAuth();
  const isPageVisible = usePageVisibility();
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);

  const { enabled: coachingEnabled } = useCoachingFlag();
  const scheduleEnabled = useScheduleFlag();
  const { showPackageRequests } = useTutorAcceptanceConfig();
  const { data: summary } = useQuery({
    queryKey: ["notification-summary"],
    queryFn: fetchNotificationSummary,
    enabled: isAuthenticated,
    refetchInterval: isPageVisible ? 30_000 : false,
  });

  if (isLoading || !isAuthenticated) return null;

  const appTabs = getYsAppTabs(isTutor ? "tutor" : "student", {
    coachingEnabled,
    packageRequestsEnabled: showPackageRequests,
    scheduleEnabled,
  });
  const messages = YS_UTILITY_ITEMS.find((item) => item.href === "/messages");
  const primaryRoutes = appTabs.slice(0, 2);
  const overflowRoutes = [
    ...appTabs.slice(2),
    ...YS_UTILITY_ITEMS.filter((item) => item.href !== "/messages"),
  ];
  const allRoutes = [...appTabs, ...YS_UTILITY_ITEMS];
  const activeRoute = getActiveYsNavItem(allRoutes, pathname, searchParams);
  const hasActiveOverflowRoute = overflowRoutes.some(
    (item) => item.href === activeRoute?.href,
  );

  const renderRoute = (item: YsNavItem) => {
    const isActive = item.href === activeRoute?.href;

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        aria-label={item.label}
        className={cn(itemClassName, isActive && "text-ink")}
      >
        <MobileIcon Icon={item.icon} active={isActive} />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 w-[100dvw] max-w-none border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      <nav
        aria-label="Mobil ana menü"
        className="grid h-16 w-full items-center px-0"
        style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}
      >
        {primaryRoutes.map(renderRoute)}
        {messages && renderRoute(messages)}

        <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={YS_NOTIFICATIONS_LABEL}
              className={cn(itemClassName, isNotificationsOpen && "text-ink")}
            >
              <MobileIcon Icon={YsNotificationsIcon} active={isNotificationsOpen}>
                <NotificationMark
                  unreadCount={summary?.unread_count ?? 0}
                  className="absolute -right-1 -top-1"
                />
              </MobileIcon>
              <span>{YS_NOTIFICATIONS_LABEL}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            sideOffset={8}
            className="w-[min(20rem,calc(100vw-1rem))] border-none bg-transparent p-0 shadow-none"
          >
            <NotificationPopoverContent />
          </PopoverContent>
        </Popover>

        <DialogPrimitive.Root open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <DialogPrimitive.Trigger asChild>
            <button
              type="button"
              aria-label="Daha Fazla"
              aria-current={hasActiveOverflowRoute ? "page" : undefined}
              className={cn(itemClassName, hasActiveOverflowRoute && "text-ink")}
            >
              <MobileIcon Icon={DotsThree} active={hasActiveOverflowRoute} />
              <span>Daha Fazla</span>
            </button>
          </DialogPrimitive.Trigger>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40" />
            <DialogPrimitive.Content
              aria-describedby={undefined}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-modal border border-b-0 border-line bg-surface pb-[env(safe-area-inset-bottom)] text-ink shadow-float focus:outline-none"
            >
              <div className="flex min-h-16 items-center justify-between border-b border-line px-5">
                <DialogPrimitive.Title className="text-lg font-bold">
                  Daha Fazla
                </DialogPrimitive.Title>
                <DialogPrimitive.Close
                  aria-label="Kapat"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-pill text-ink transition-colors duration-[--duration-state] hover:bg-paper"
                >
                  <X size={20} weight="regular" aria-hidden="true" />
                </DialogPrimitive.Close>
              </div>
              <div className="grid gap-1 p-3">
                {overflowRoutes.map((item) => {
                  const isActive = item.href === activeRoute?.href;
                  const ItemIcon = item.icon;
                  const weight = isActive ? "fill" : "regular";

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={item.label}
                      onClick={() => setIsMoreOpen(false)}
                      className={cn(
                        "flex min-h-12 w-full items-center gap-3 rounded-input px-3 text-left text-sm font-medium text-ink transition-colors duration-[--duration-state] hover:bg-paper",
                        isActive && "bg-ink text-white hover:bg-ink",
                      )}
                    >
                      <ItemIcon
                        size={20}
                        weight={weight}
                        data-icon-weight={weight}
                        aria-hidden="true"
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </nav>
    </div>
  );
}
