export const PRIVATE_CRAWL_PATHS = [
  "/admin-control",
  "/ai",
  "/checkout",
  "/dashboard",
  "/forgot-password",
  "/hoca-bul",
  "/home",
  "/login",
  "/messages",
  "/profile",
  "/register",
  "/reset-password",
  "/session",
  "/support",
  "/tutor/",
  "/*/checkout",
] as const;

export const PUBLIC_CRAWL_EXAMPLES = [
  "/",
  "/yks-ozel-ders",
  "/yks/tyt/matematik-ozel-ders",
  "/yks/ayt/matematik-ozel-ders",
  "/tutors/public-tutor-id",
] as const;

/** Google-style path matching for the small robots vocabulary used here. */
export function robotsRuleMatches(path: string, rule: string) {
  const expression = rule
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${expression}`).test(path);
}

export function isBlockedByRobots(path: string) {
  return PRIVATE_CRAWL_PATHS.some((rule) => robotsRuleMatches(path, rule));
}
