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
