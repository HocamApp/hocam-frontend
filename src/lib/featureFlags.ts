/**
 * Keep unfinished product flows in the codebase while preventing users from
 * discovering or opening them. Set this to true when the matching experience
 * is ready to return.
 */
export const MATCHING_FEATURE_ENABLED = false;

/**
 * The rebuilt tutor-matching flow at /hoca-bul. Deliberately separate from
 * MATCHING_FEATURE_ENABLED: the legacy /match route keeps its own gate until it
 * is retired, so the old flow can stay reachable (or stay hidden) without
 * affecting the new one.
 *
 * Off by default. Local development opts in with
 * NEXT_PUBLIC_HOCA_BUL_ENABLED=true in .env.local; tests stub this module.
 */
export const HOCA_BUL_ENABLED =
  process.env.NEXT_PUBLIC_HOCA_BUL_ENABLED === "true";
