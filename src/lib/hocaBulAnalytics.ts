import type { HocaBulAnalyticsPayload } from "@/types/hocaBul";

/**
 * Provider-neutral analytics for /hoca-bul, on the same `hocam:analytics`
 * CustomEvent seam the rest of the app uses. It lives in its own module rather
 * than in homeAnalytics.ts so this feature never has to touch a file the home
 * redesign is also editing.
 *
 * Privacy: the payload union is closed, so a caller cannot attach an unlisted
 * field. Deliberately never emitted — the student's answers (stage, challenges,
 * teaching styles, availability, subject keys), the budget segment or any
 * price, free text, the user id, tutor names, cached data, auth data. `goal` is
 * a four-value enum and `tutor_id` is the opaque id already present in the URL
 * the click navigates to.
 */
export function trackHocaBul(payload: HocaBulAnalyticsPayload): void {
  if (typeof window === "undefined") return;

  const { event, ...properties } = payload;
  window.dispatchEvent(
    new CustomEvent("hocam:analytics", {
      detail: { event, properties },
    })
  );
}
