export type NavRole = "student" | "tutor";

export type MobileNavPlacement = "primary" | "overflow" | "hidden";

export type NavIconName =
  | "Bell"
  | "CircleHelp"
  | "ClipboardList"
  | "Compass"
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
  { kind: "separator", mobilePlacement: "hidden" },
  {
    kind: "popover",
    id: "notifications",
    title: "Bildirimler",
    icon: "Bell",
    mobilePlacement: "primary",
  },
];

/**
 * The tutor's coaching entry. Kept out of `tutorDescriptors` and spliced in
 * only when coaching is enabled, so the tab leaves no trace at all while the
 * feature is off — see getNavDescriptors' `coachingEnabled` option.
 */
const tutorCoachingDescriptor: NavRouteDescriptor = {
  kind: "route",
  title: "Koçluk",
  icon: "Compass",
  href: "/dashboard/tutor/coaching",
  mobilePlacement: "overflow",
};

/**
 * The student's coaching entry (Faz 5) — symmetric with
 * tutorCoachingDescriptor, spliced in only when coaching is enabled.
 * Before this, a student's only route to /dashboard/student/coaching was
 * the checkout-status CTA, no persistent nav entry.
 */
const studentCoachingDescriptor: NavRouteDescriptor = {
  kind: "route",
  title: "Koçluk",
  icon: "Compass",
  href: "/dashboard/student/coaching",
  mobilePlacement: "overflow",
};

/**
 * The tutor's package-requests entry. Separate from the coaching tab on
 * purpose: it also covers lesson-only requests, so its visibility follows
 * the payments-level acceptance rollout, not the coaching feature flag.
 */
const tutorRequestsDescriptor: NavRouteDescriptor = {
  kind: "route",
  title: "Paket Talepleri",
  icon: "ClipboardList",
  href: "/dashboard/tutor/requests",
  mobilePlacement: "overflow",
};

export type NavOptions = {
  /** Whether the coaching feature is on for this viewer. Defaults to off. */
  coachingEnabled?: boolean;
  /** Whether the tutor should be offered the package-requests screen. */
  packageRequestsEnabled?: boolean;
};

export function getNavDescriptors(
  role: NavRole,
  options: NavOptions = {}
): NavDescriptor[] {
  if (role !== "tutor") {
    if (!options.coachingEnabled) {
      return studentDescriptors;
    }
    const insertAfter = studentDescriptors.findIndex(
      (descriptor) =>
        descriptor.kind === "route" && descriptor.href === "/dashboard/student"
    );
    const index = insertAfter === -1 ? studentDescriptors.length : insertAfter + 1;
    return [
      ...studentDescriptors.slice(0, index),
      studentCoachingDescriptor,
      ...studentDescriptors.slice(index),
    ];
  }
  // Both extras sit right after "Panom": they are tutor workspaces, so
  // they belong with the dashboard rather than at the end of the overflow
  // list. Each is independent — a tutor can have package requests without
  // coaching, and vice versa.
  const extras: NavRouteDescriptor[] = [];
  if (options.coachingEnabled) extras.push(tutorCoachingDescriptor);
  if (options.packageRequestsEnabled) extras.push(tutorRequestsDescriptor);
  if (extras.length === 0) {
    return tutorDescriptors;
  }

  const insertAfter = tutorDescriptors.findIndex(
    (descriptor) =>
      descriptor.kind === "route" && descriptor.href === "/dashboard/tutor"
  );
  const index = insertAfter === -1 ? tutorDescriptors.length : insertAfter + 1;
  return [
    ...tutorDescriptors.slice(0, index),
    ...extras,
    ...tutorDescriptors.slice(index),
  ];
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
