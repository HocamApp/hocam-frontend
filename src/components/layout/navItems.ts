export type NavRole = "student" | "tutor";

export type MobileNavPlacement = "primary" | "overflow" | "hidden";

export type NavIconName =
  | "Bell"
  | "FileQuestion"
  | "GraduationCap"
  | "Heart"
  | "Home"
  | "LayoutDashboard"
  | "MessageCircle"
  | "Route";

export type NavRouteDescriptor = {
  kind: "route";
  title: string;
  icon: NavIconName;
  href: string;
  mobilePlacement: MobileNavPlacement;
  /** Extra path prefixes that should also mark this item active. */
  activePrefixes?: string[];
};

export type NavSeparatorDescriptor = {
  kind: "separator";
  mobilePlacement: "hidden";
};

export type NavPopoverDescriptor = {
  kind: "popover";
  id: "notifications";
  title: string;
  icon: NavIconName;
  mobilePlacement: MobileNavPlacement;
};

export type NavDescriptor =
  | NavRouteDescriptor
  | NavSeparatorDescriptor
  | NavPopoverDescriptor;

type SearchParamsReader = Pick<URLSearchParams, "get">;

const studentDescriptors: NavDescriptor[] = [
  {
    kind: "route",
    title: "Ana Sayfa",
    icon: "Home",
    href: "/home",
    mobilePlacement: "primary",
  },
  {
    kind: "route",
    title: "Hocalar",
    icon: "GraduationCap",
    href: "/tutors",
    mobilePlacement: "primary",
  },
  {
    kind: "route",
    title: "Öğrenme",
    icon: "Route",
    href: "/dashboard/student/learning",
    activePrefixes: ["/dashboard/student/hedefler"],
    mobilePlacement: "primary",
  },
  {
    kind: "route",
    title: "Çıkmış Sorular",
    icon: "FileQuestion",
    href: "/cikmis-sorular",
    mobilePlacement: "overflow",
  },
  {
    kind: "route",
    title: "Panelim",
    icon: "LayoutDashboard",
    href: "/dashboard/student",
    mobilePlacement: "overflow",
  },
  { kind: "separator", mobilePlacement: "hidden" },
  {
    kind: "route",
    title: "Mesajlar",
    icon: "MessageCircle",
    href: "/messages",
    mobilePlacement: "primary",
  },
  {
    kind: "popover",
    id: "notifications",
    title: "Bildirimler",
    icon: "Bell",
    mobilePlacement: "primary",
  },
  {
    kind: "route",
    title: "Favoriler",
    icon: "Heart",
    href: "/tutors?favorites=1",
    mobilePlacement: "overflow",
  },
];

const tutorDescriptors: NavDescriptor[] = [
  {
    kind: "route",
    title: "Ana Sayfa",
    icon: "Home",
    href: "/home",
    mobilePlacement: "primary",
  },
  {
    kind: "route",
    title: "Dersler",
    icon: "GraduationCap",
    href: "/tutors",
    mobilePlacement: "primary",
  },
  {
    kind: "route",
    title: "Mesajlar",
    icon: "MessageCircle",
    href: "/messages",
    mobilePlacement: "primary",
  },
  {
    kind: "route",
    title: "Panom",
    icon: "LayoutDashboard",
    href: "/dashboard/tutor",
    mobilePlacement: "primary",
  },
  {
    kind: "route",
    title: "Çıkmış Sorular",
    icon: "FileQuestion",
    href: "/cikmis-sorular",
    mobilePlacement: "overflow",
  },
  { kind: "separator", mobilePlacement: "hidden" },
  {
    kind: "popover",
    id: "notifications",
    title: "Bildirimler",
    icon: "Bell",
    mobilePlacement: "primary",
  },
];

export function getNavDescriptors(role: NavRole): NavDescriptor[] {
  return role === "tutor" ? tutorDescriptors : studentDescriptors;
}

/**
 * Returns the length of the most specific matched path for a route, or -1 when
 * it is inactive. The favorites query is intentionally treated as a distinct
 * view from the ordinary tutors route.
 */
export function getNavRouteMatchLength(
  descriptor: NavDescriptor,
  pathname: string,
  searchParams: SearchParamsReader
): number {
  if (descriptor.kind !== "route") return -1;

  const isFavoritesView =
    pathname === "/tutors" && searchParams.get("favorites") === "1";

  if (descriptor.href === "/tutors?favorites=1") {
    return isFavoritesView ? descriptor.href.length : -1;
  }
  if (descriptor.href === "/tutors" && isFavoritesView) return -1;

  const [hrefPathname] = descriptor.href.split("?");
  const candidates = [hrefPathname, ...(descriptor.activePrefixes ?? [])];

  return candidates.reduce((best, candidate) => {
    if (pathname === candidate || pathname.startsWith(`${candidate}/`)) {
      return Math.max(best, candidate.length);
    }
    return best;
  }, -1);
}

export function getActiveNavIndex(
  descriptors: NavDescriptor[],
  pathname: string,
  searchParams: SearchParamsReader
): number {
  let activeIndex = -1;
  let bestMatch = -1;

  descriptors.forEach((descriptor, index) => {
    const matchLength = getNavRouteMatchLength(
      descriptor,
      pathname,
      searchParams
    );
    if (matchLength > bestMatch) {
      bestMatch = matchLength;
      activeIndex = index;
    }
  });

  return activeIndex;
}

export function isNavRouteActive(
  descriptor: NavDescriptor,
  descriptors: NavDescriptor[],
  pathname: string,
  searchParams: SearchParamsReader
): boolean {
  if (descriptor.kind !== "route") return false;
  return (
    descriptors[getActiveNavIndex(descriptors, pathname, searchParams)] ===
    descriptor
  );
}
