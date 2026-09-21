/**
 * How far a signed-out visitor gets through the tutor directory.
 *
 * Two pages, then a free account. The shape is the metered wall every
 * marketplace and publisher converged on, and the two numbers that matter are
 * both deliberate:
 *
 * - The meter is generous enough to be useful before it asks. A wall on page
 *   one reads as a broken site, drives the bounce rate up, and search engines
 *   answer that by sending less traffic. Two pages is 24 tutors here, plus
 *   every filter and every profile — enough for a visitor to decide the
 *   product is worth an account.
 * - It is an interaction gate, not a profile-visibility gate. The first two
 *   URL-backed pages are public and indexable; deeper directory pages are
 *   noindex and send signed-out visitors to registration after auth settles.
 *   Every public tutor profile remains discoverable through the sitemap.
 *
 * Keep server HTML and client enforcement aligned. Rendering a deeper page to
 * signed-out visitors and gating only the pagination click bypasses the meter.
 */
export const ANONYMOUS_PAGE_LIMIT = 2;

/** Where a gated page turn sends the visitor, with the way back attached. */
export function signupUrlForGatedPage(returnUrl: string): string {
  return `/register?returnUrl=${encodeURIComponent(returnUrl)}`;
}

export function isGatedPage(page: number, isAuthenticated: boolean): boolean {
  return !isAuthenticated && page > ANONYMOUS_PAGE_LIMIT;
}
