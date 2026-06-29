"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LucideIcon,
  MessageCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
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
  | { kind: "route"; title: string; icon: LucideIcon; href: string }
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
 * in sync. Notifications and Support are placeholders that open a small popover.
 */
export function AnimatedNavbarLinks() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isTutor, isLoading } = useAuth();

  const { data: summary } = useQuery({
    queryKey: ["notification-summary"],
    queryFn: fetchNotificationSummary,
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });
  const hasUnread = summary?.has_unread ?? false;

  if (isLoading || !isAuthenticated) return null;

  const panomHref = isTutor ? "/dashboard/tutor" : "/dashboard/student";

  const descriptors: NavDescriptor[] = [
    { kind: "route", title: "Dersler", icon: GraduationCap, href: "/tutors" },
    { kind: "route", title: "Mesajlar", icon: MessageCircle, href: "/messages" },
    { kind: "route", title: "Panom", icon: LayoutDashboard, href: panomHref },
    { kind: "separator" },
    {
      kind: "popover",
      title: "Bildirimler",
      icon: Bell,
      contentNode: <NotificationPopoverContent />,
    },
    { kind: "route", title: "Destek", icon: LifeBuoy, href: "/support" },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const activeIndex = descriptors.findIndex(
    (d) => d.kind === "route" && isActive(d.href)
  );

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

  const tabs = descriptors.map((d) => {
    if (d.kind === "separator") return { type: "separator" as const };
    if (d.kind === "popover") {
      return { title: d.title, icon: d.icon, wrapper: makePopoverWrapper(d) };
    }
    return { title: d.title, icon: d.icon };
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
    />
  );
}
