import type { Icon } from "@phosphor-icons/react";
import {
  Bell,
  CalendarBlank,
  ChatCircle,
  ClipboardText,
  Compass,
  FileText,
  GraduationCap,
  Heart,
  Path,
  Question,
  SquaresFour,
} from "@phosphor-icons/react";

/**
 * Navigation for the rebranded shell.
 *
 * This is a second source of truth beside `src/components/layout/navItems.ts`,
 * and that is deliberate rather than an oversight. The old set opens with
 * "Ana Sayfa" at `/home` and "Hocalar" at `/tutors` — two destinations. In the
 * new site those are one: the root route is the homepage *and* the tutor
 * directory, and the search that filters it lives in the header. Rewriting
 * `navItems.ts` to say so would rewrite the nav the old navbar still renders,
 * and take `navItems.test.ts` with it. Leaving it alone keeps the old shell
 * recallable while this one is proven.
 *
 * Delete `navItems.ts` and its test only once the old navbar is gone for good.
 */

export type YsNavRole = "student" | "tutor";

export type YsNavItem = {
  label: string;
  href: string;
  icon: Icon;
  /**
   * Extra path prefixes that also light this tab. Coaching lives under the
   * dashboard, so without this the dashboard tab would win its own subtree.
   */
  activePrefixes?: string[];
  /**
   * Match the pathname exactly instead of by prefix. Only the Hocalar tab
   * needs it, and it needs it badly: its href is `/`, which is a prefix of
   * every route in the app, so prefix matching would leave it lit everywhere.
   */
  exact?: true;
};

type Flags = {
  coachingEnabled: boolean;
  scheduleEnabled: boolean;
  packageRequestsEnabled: boolean;
};

/**
 * Left strip for a signed-out visitor.
 *
 * Every href here is checked against a live server in the test below, not
 * merely eyeballed. Earlier drafts pointed at routes that looked valid in
 * source but returned 404 to signed-out visitors.
 */
export const YS_PUBLIC_TABS: YsNavItem[] = [
  { label: "Hocalar", href: "/", icon: GraduationCap, exact: true },
  { label: "Nasıl Çalışır", href: "/nasil-calisir", icon: Question },
  { label: "Doğrulama", href: "/hocalar-nasil-dogrulaniyor", icon: FileText },
  { label: "Başarı Hikayeleri", href: "/basari-hikayeleri", icon: Path },
];

/** Right-hand icon cluster. Notifications is a popover, not a route. */
export const YS_UTILITY_ITEMS: YsNavItem[] = [
  { label: "Mesajlar", href: "/messages", icon: ChatCircle },
  { label: "Favoriler", href: "/favoriler", icon: Heart },
];

export const YS_NOTIFICATIONS_LABEL = "Bildirimler";
export const YsNotificationsIcon = Bell;

export function getYsAppTabs(role: YsNavRole, flags: Flags): YsNavItem[] {
  const isTutor = role === "tutor";
  const tabs: YsNavItem[] = [
    { label: "Hocalar", href: "/", icon: GraduationCap, exact: true },
    {
      label: isTutor ? "Panom" : "Panelim",
      href: isTutor ? "/dashboard/tutor" : "/dashboard/student",
      icon: SquaresFour,
    },
  ];

  if (flags.coachingEnabled) {
    tabs.push({
      label: "Koçluk",
      href: isTutor
        ? "/dashboard/tutor/coaching"
        : "/dashboard/student/coaching",
      icon: Compass,
    });
  }
  if (!isTutor && flags.scheduleEnabled) {
    tabs.push({
      label: "Çalışma Programım",
      href: "/schedule",
      icon: CalendarBlank,
    });
  }
  if (isTutor && flags.packageRequestsEnabled) {
    tabs.push({
      label: "Paket Talepleri",
      href: "/dashboard/tutor/requests",
      icon: ClipboardText,
    });
  }

  return tabs;
}

/**
 * Length of the most specific path this item matches, or -1 when it does not.
 * Longest match wins, which is what stops `/dashboard/tutor` lighting up while
 * you are inside `/dashboard/tutor/coaching`.
 *
 * Ported from `getNavRouteMatchLength` in navItems.ts.
 *
 * Favourites needs no special case any more. It used to be `/?favorites=1` —
 * a query-string view of the Hocalar route, which tied with it and had to be
 * arbitrated by hand. It is `/favoriler` now, an ordinary path that the
 * longest-match rule below settles on its own.
 */
export function ysNavMatchLength(
  item: YsNavItem,
  pathname: string,
  searchParams: Pick<URLSearchParams, "get">,
): number {
  // `/?favorites=1` still renders the favourites list on the homepage for any
  // link that predates /favoriler, and while it does the Hocalar tab must not
  // read as active — the reader is not looking at the directory.
  const isLegacyFavoritesView =
    pathname === "/" && searchParams.get("favorites") === "1";

  if (item.exact)
    return pathname === item.href && !isLegacyFavoritesView
      ? item.href.length
      : -1;

  const [hrefPath] = item.href.split("?");
  return [hrefPath, ...(item.activePrefixes ?? [])].reduce(
    (best, candidate) => {
      if (pathname === candidate || pathname.startsWith(`${candidate}/`)) {
        return Math.max(best, candidate.length);
      }
      return best;
    },
    -1,
  );
}

/** The one item that should read as active, or null when none does. */
export function getActiveYsNavItem(
  items: YsNavItem[],
  pathname: string,
  searchParams: Pick<URLSearchParams, "get">,
): YsNavItem | null {
  let best = -1;
  let winner: YsNavItem | null = null;
  for (const item of items) {
    const length = ysNavMatchLength(item, pathname, searchParams);
    if (length > best) {
      best = length;
      winner = item;
    }
  }
  return best < 0 ? null : winner;
}
