/**
 * The tutor-matching flow at /hoca-bul.
 *
 * Off by default. Local development opts in with
 * NEXT_PUBLIC_HOCA_BUL_ENABLED=true in .env.local; tests stub this module.
 */
export const HOCA_BUL_ENABLED =
  process.env.NEXT_PUBLIC_HOCA_BUL_ENABLED === "true";
