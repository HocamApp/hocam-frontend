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

type NavDescriptor =
  | {
      kind: "route";
      title: string;
      icon: LucideIcon;
      href: string;
      /** Extra path prefixes that should also mark this item active. */
      activePrefixes?: string[];
    }
  | { kind: "separator" }
  | {
      kind: "popover";
      title: string;
      icon: LucideIcon;
      content?: { title: string; body: string };
      contentNode?: React.ReactNode;
      badge?: boolean;
    };

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

  const panomHref = isTutor ? "/dashboard/tutor" : "/dashboard/student";
  const isFavoritesView =
    pathname === "/tutors" && searchParams.get("favorites") === "1";

  const descriptors: NavDescriptor[] = isTutor
    ? [
        { kind: "route", title: "Ana Sayfa", icon: Home, href: "/home" },
        { kind: "route", title: "Dersler", icon: GraduationCap, href: "/tutors" },
        { kind: "route", title: "Mesajlar", icon: MessageCircle, href: "/messages" },
        { kind: "route", title: "Panom", icon: LayoutDashboard, href: panomHref },
        {
          kind: "route",
          title: "Çıkmış Sorular",
          icon: FileQuestion,
          href: "/cikmis-sorular",
        },
        { kind: "separator" },
        {
          kind: "popover",
          title: "Bildirimler",
          icon: Bell,
          contentNode: <NotificationPopoverContent />,
        },
      ]
    : [
        { kind: "route", title: "Ana Sayfa", icon: Home, href: "/home" },
        { kind: "route", title: "Hocalar", icon: GraduationCap, href: "/tutors" },
        {
          kind: "route",
          title: "Öğrenme",
          icon: Route,
          href: "/dashboard/student/learning",
          activePrefixes: ["/dashboard/student/hedefler"],
        },
        {
          kind: "route",
          title: "Çıkmış Sorular",
          icon: FileQuestion,
          href: "/cikmis-sorular",
        },
        { kind: "route", title: "Panelim", icon: LayoutDashboard, href: panomHref },
        { kind: "separator" },
        { kind: "route", title: "Mesajlar", icon: MessageCircle, href: "/messages" },
        {
          kind: "popover",
          title: "Bildirimler",
          icon: Bell,
          contentNode: <NotificationPopoverContent />,
        },
        { kind: "route", title: "Favoriler", icon: Heart, href: "/tutors?favorites=1" },
      ];

  // Returns the length of the most specific matched path for a route, or -1 if
  // it isn't active. Longer match wins so nested routes (e.g. the learning hub)
  // don't get shadowed by a shorter prefix like Panom's /dashboard/student.
  const routeMatchLength = (descriptor: NavDescriptor): number => {
    if (descriptor.kind !== "route") return -1;
    const { href, activePrefixes } = descriptor;

    if (href === "/tutors?favorites=1") return isFavoritesView ? href.length : -1;
    if (href === "/tutors" && isFavoritesView) return -1;

    const [hrefPathname] = href.split("?");
    const candidates = [hrefPathname, ...(activePrefixes ?? [])];
    let best = -1;
    for (const candidate of candidates) {
      if (pathname === candidate || pathname.startsWith(`${candidate}/`)) {
        best = Math.max(best, candidate.length);
      }
    }
    return best;
  };

  let activeIndex = -1;
  let bestMatch = -1;
  descriptors.forEach((descriptor, index) => {
    const length = routeMatchLength(descriptor);
    if (length > bestMatch) {
      bestMatch = length;
      activeIndex = index;
    }
  });

  const makePopoverWrapper = (descriptor: NavDescriptor & { kind: "popover" }) => {
    const showBadge = descriptor.contentNode != null ? hasUnread : (descriptor.badge ?? false);
    // eslint-disable-next-line react/display-name -- render fn, not a component
    return (node: React.ReactNode) => (
      <Popover>
        <span className="relative inline-flex">
          <PopoverTrigger asChild>{node}</PopoverTrigger>
          {showBadge && (
            <NotificationMark hasUnread={showBadge} className="absolute right-0.5 top-0.5" />
          )}
        </span>
        <PopoverContent align="end" className="w-80 p-0">
          {descriptor.contentNode != null ? (
            descriptor.contentNode
          ) : (
            <div className="p-4">
              <p className="text-sm font-semibold text-foreground">
                {descriptor.content?.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {descriptor.content?.body}
              </p>
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  };

  const separatorIndex = descriptors.findIndex((descriptor) => descriptor.kind === "separator");
  const tabs = descriptors.map((d, index) => {
    if (d.kind === "separator") return { type: "separator" as const };
    if (d.kind === "popover") {
      return { title: d.title, icon: d.icon, wrapper: makePopoverWrapper(d) };
    }
    return {
      title: d.title,
      icon: d.icon,
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
      className="w-max flex-nowrap rounded-xl sm:w-auto"
    />
  );
}
