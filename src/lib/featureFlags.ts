/**
 * The tutor-matching flow at /hoca-bul.
 *
 * Off by default. Local development opts in with
 * NEXT_PUBLIC_HOCA_BUL_ENABLED=true in .env.local; tests stub this module.
 */
export const HOCA_BUL_ENABLED =
  process.env.NEXT_PUBLIC_HOCA_BUL_ENABLED === "true";

/**
 * The student study programme at /schedule ("Çalışma Programım").
 *
 * On by default — the feature is live, so this is a kill switch, not a
 * rollout gate. Set NEXT_PUBLIC_STUDY_SCHEDULE_ENABLED=false to hide the nav
 * entry; the matching backend switch is STUDY_SCHEDULE_ENABLED, which
 * unmounts /api/schedule/* entirely. Turning one off without the other leaves
 * either a hidden-but-live API or a tab pointing at routes that 404, so they
 * are meant to move together.
 */
export const STUDY_SCHEDULE_ENABLED =
  process.env.NEXT_PUBLIC_STUDY_SCHEDULE_ENABLED !== "false";

/**
 * PayTR checkout entry points in the frontend build.
 *
 * Off unless the build sets NEXT_PUBLIC_PAYTR_ENABLED to exactly "true" — a
 * near miss like "TRUE" or "1" stays closed rather than guessing that someone
 * meant to take money. This flag only decides what the UI offers; the backend
 * PAYTR_ENABLED setting is what actually authorises a charge, and the two are
 * separate switches. NEXT_PUBLIC_* is inlined at build time, so flipping it
 * needs a rebuild and redeploy, not just an environment change.
 */
export function paytrEnabledFromEnv(value: string | undefined): boolean {
  return value === "true";
}

export const PAYTR_ENABLED = paytrEnabledFromEnv(
  process.env.NEXT_PUBLIC_PAYTR_ENABLED
);

/**
 * The rebuilt homepage (docs/design/product-home/homepage-rebuild/).
 *
 * Off unless the build sets NEXT_PUBLIC_HOME_V2 to exactly "true", the same
 * rule as NEXT_PUBLIC_PAYTR_ENABLED. With it off `/` renders the homepage as
 * it was before the rebuild. With it on, the rebuilt sections render and
 * scripts/check-home-facts.ts fails the build while any homepage fact is
 * still TODO, unless ALLOW_HOME_TODOS=1. Vercel Preview sets both; Production
 * sets neither until the facts are filled. NEXT_PUBLIC_* is inlined at build
 * time, so flipping it needs a rebuild and redeploy.
 */
export function homeV2EnabledFromEnv(value: string | undefined): boolean {
  return value === "true";
}

export const HOME_V2_ENABLED = homeV2EnabledFromEnv(process.env.NEXT_PUBLIC_HOME_V2);
