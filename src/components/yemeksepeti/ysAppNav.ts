import type { Icon } from "@phosphor-icons/react";
import {
  Bell,
  CalendarBlank,
  ChartBar,
  ChatCircle,
  ChatCircleDots,
  ClipboardText,
  Compass,
  GraduationCap,
  Heart,
  ListNumbers,
  SquaresFour,
  Users,
} from "@phosphor-icons/react";

/**
 * The app's navigation: the desktop header tabs, the mobile tab bar and the
 * active-route resolution all read from here and nowhere else.
 *
 * "Hocalar" is the root route because the homepage *is* the tutor directory;
 * the search that filters it lives in the header.
 */

/**
 * The homepage sections the public tabs scroll to. Exported so the sections
 * and the nav cannot drift apart: a renamed id here fails the nav test rather
 * than silently scrolling nowhere.
 */
export const JOURNEY_SECTION_ID = "nasil-calisir";
export const FAQ_SECTION_ID = "merak-edilenler";

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
  // Both of these are places on this page, not pages of their own. A visitor
  // who wants to know how it works is one scroll away from the answer, and
  // sending them to a separate route made them come back to start over.
  //
  // The icons say what the destination is rather than decorating it:
  // numbered steps for a four-step journey, a conversation for the questions
  // people actually ask. The old circled question mark said neither.
  { label: "Nasıl Çalışır", href: `/#${JOURNEY_SECTION_ID}`, icon: ListNumbers },
  { label: "Merak Edilenler", href: `/#${FAQ_SECTION_ID}`, icon: ChatCircleDots },
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
      label: isTutor ? "Panom" : "Derslerim",
      href: isTutor ? "/dashboard/tutor" : "/dashboard/student",
      icon: SquaresFour,
    },
  ];

  if (isTutor) {
    tabs.push(
      { label: "Sınıfım", href: "/dashboard/tutor/classroom", icon: Users },
      { label: "Takvim", href: "/dashboard/tutor/calendar", icon: CalendarBlank },
      { label: "İstatistiklerim", href: "/dashboard/tutor/statistics", icon: ChartBar },
    );
  }

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
