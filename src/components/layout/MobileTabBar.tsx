"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  FileQuestion,
  GraduationCap,
  Heart,
  Home,
  LayoutDashboard,
  type LucideIcon,
  MessageCircle,
  MoreHorizontal,
  Route,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationMark } from "@/components/shared/NotificationMark";
import { NotificationPopoverContent } from "@/components/shared/NotificationPopoverContent";
import { fetchNotificationSummary } from "@/lib/notificationsApi";
import { cn } from "@/lib/utils";
import {
  getNavDescriptors,
  isNavRouteActive,
  type NavIconName,
  type NavPopoverDescriptor,
  type NavRouteDescriptor,
} from "@/components/layout/navItems";

const iconByName = {
  Bell,
  FileQuestion,
  GraduationCap,
  Heart,
  Home,
  LayoutDashboard,
  MessageCircle,
  Route,
} satisfies Record<NavIconName, LucideIcon>;

const itemClassName =
  "relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-[10px] font-medium leading-tight transition-colors";

/** Mobile-only navigation for authenticated users. Mounted by the main layout in Task 2. */
export function MobileTabBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, isTutor, isLoading } = useAuth();
  const isPageVisible = usePageVisibility();
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);

  const { data: summary } = useQuery({
    queryKey: ["notification-summary"],
    queryFn: fetchNotificationSummary,
    enabled: isAuthenticated,
    refetchInterval: isPageVisible ? 30_000 : false,
  });

  if (isLoading || !isAuthenticated) return null;

  const descriptors = getNavDescriptors(isTutor ? "tutor" : "student");
  const primaryDescriptors = descriptors.filter(
    (
      descriptor
    ): descriptor is NavRouteDescriptor | NavPopoverDescriptor =>
      descriptor.kind !== "separator" &&
      descriptor.mobilePlacement === "primary"
  );
  const overflowDescriptors = descriptors.filter(
    (descriptor): descriptor is NavRouteDescriptor =>
      descriptor.kind === "route" &&
      descriptor.mobilePlacement === "overflow"
  );
  const hasActiveOverflowRoute = overflowDescriptors.some((descriptor) =>
    isNavRouteActive(
      descriptor,
      descriptors,
      pathname,
      searchParams
    )
  );

  const renderRouteButton = (descriptor: NavRouteDescriptor) => {
    const Icon = iconByName[descriptor.icon];
    const isActive = isNavRouteActive(
      descriptor,
      descriptors,
      pathname,
      searchParams
    );

    return (
      <Link
        key={descriptor.href}
        href={descriptor.href}
        aria-current={isActive ? "page" : undefined}
        aria-label={descriptor.title}
        className={cn(
          itemClassName,
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
        <span>{descriptor.title}</span>
      </Link>
    );
  };

  const renderNotificationButton = (descriptor: NavPopoverDescriptor) => {
    const Icon = iconByName[descriptor.icon];

    return (
      <Popover key={descriptor.id}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={descriptor.title}
            className={cn(
              itemClassName,
              "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="relative">
              <Icon className="h-5 w-5" aria-hidden="true" />
              <NotificationMark
                hasUnread={summary?.has_unread ?? false}
                className="absolute -right-2.5 -top-2"
              />
            </span>
            <span>{descriptor.title}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          sideOffset={8}
          className="w-[min(20rem,calc(100vw-1rem))] p-0"
        >
          {descriptor.id === "notifications" && <NotificationPopoverContent />}
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
      <nav
        aria-label="Mobil ana menü"
        className={cn(
          "grid h-16 items-center px-1",
          isTutor ? "grid-cols-5" : "grid-cols-6"
        )}
      >
        {primaryDescriptors.map((descriptor) =>
          descriptor.kind === "route"
            ? renderRouteButton(descriptor)
            : renderNotificationButton(descriptor)
        )}

        {!isTutor && (
          <Popover open={isMoreOpen} onOpenChange={setIsMoreOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Daha Fazla"
                aria-current={hasActiveOverflowRoute ? "page" : undefined}
                className={cn(
                  itemClassName,
                  hasActiveOverflowRoute
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                <span>Daha Fazla</span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              sideOffset={8}
              className="w-56 p-1.5"
            >
              {overflowDescriptors.map((descriptor) => {
                const Icon = iconByName[descriptor.icon];
                const isActive = isNavRouteActive(
                  descriptor,
                  descriptors,
                  pathname,
                  searchParams
                );

                return (
                  <Link
                    key={descriptor.href}
                    href={descriptor.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setIsMoreOpen(false)}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition-colors hover:bg-muted",
                      isActive ? "text-primary" : "text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span>{descriptor.title}</span>
                  </Link>
                );
              })}
            </PopoverContent>
          </Popover>
        )}
      </nav>
    </div>
  );
}
