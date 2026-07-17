"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  GraduationCap,
  FileQuestion,
  Heart,
  Home,
  LayoutDashboard,
  LucideIcon,
  MessageCircle,
  Route,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationMark } from "@/components/shared/NotificationMark";
import { NotificationPopoverContent } from "@/components/shared/NotificationPopoverContent";
import { fetchNotificationSummary } from "@/lib/notificationsApi";
import {
  getActiveNavIndex,
  getNavDescriptors,
  type NavIconName,
  type NavPopoverDescriptor,
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

/**
 * Animated icon navigation for authenticated users. Active item is derived from
 * the current route (route-driven), so the browser back/forward buttons keep it
 * in sync. Notifications open a small popover.
 */
export function AnimatedNavbarLinks() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isTutor, isLoading } = useAuth();
  const isPageVisible = usePageVisibility();

  const { data: summary } = useQuery({
    queryKey: ["notification-summary"],
    queryFn: fetchNotificationSummary,
    enabled: isAuthenticated,
    refetchInterval: isPageVisible ? 30_000 : false,
  });
  const hasUnread = summary?.has_unread ?? false;

  if (isLoading || !isAuthenticated) return null;

  const descriptors = getNavDescriptors(isTutor ? "tutor" : "student");
  const activeIndex = getActiveNavIndex(descriptors, pathname, searchParams);

  const makePopoverWrapper = (descriptor: NavPopoverDescriptor) => {
    // eslint-disable-next-line react/display-name -- render fn, not a component
    return (node: React.ReactNode) => (
      <Popover>
        <span className="relative inline-flex">
          <PopoverTrigger asChild>{node}</PopoverTrigger>
          <NotificationMark
            hasUnread={hasUnread}
            className="absolute right-0.5 top-0.5"
          />
        </span>
        <PopoverContent align="end" className="w-80 p-0">
          {descriptor.id === "notifications" && <NotificationPopoverContent />}
        </PopoverContent>
      </Popover>
    );
  };

  const separatorIndex = descriptors.findIndex((descriptor) => descriptor.kind === "separator");
  const tabs = descriptors.map((d, index) => {
    if (d.kind === "separator") return { type: "separator" as const };
    if (d.kind === "popover") {
      return {
        title: d.title,
        icon: iconByName[d.icon],
        wrapper: makePopoverWrapper(d),
      };
    }
    return {
      title: d.title,
      icon: iconByName[d.icon],
      alwaysShowLabel: separatorIndex >= 0 && index < separatorIndex,
    };
  });

  const handleChange = (index: number | null) => {
    if (index === null) return;
    const descriptor = descriptors[index];
    if (descriptor?.kind === "route") {
      router.push(descriptor.href);
    }
    // popover / separator: handled by the Popover itself — no navigation.
  };

  return (
    <ExpandableTabs
      tabs={tabs}
      selected={activeIndex >= 0 ? activeIndex : null}
      onChange={handleChange}
      tabletCompact
      className="w-max flex-nowrap rounded-xl sm:w-auto"
    />
  );
}
