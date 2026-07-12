"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export const HIGHLIGHT_PARAM = "highlightBooking";
const HIGHLIGHT_MS = 2000;
export const HIGHLIGHT_CLASSNAME = "ring-2 ring-ring ring-offset-2 transition-shadow";

/**
 * Booking-card deep link: when the URL carries `?highlightBooking=<id>`,
 * scrolls `#booking-<id>` into view and returns that id for HIGHLIGHT_MS so
 * callers can flash it. Used by both dashboards from the notification
 * popover's booking links (see NotificationPopoverContent.getNotificationHref).
 *
 * `ready` must only become true once the target could plausibly be mounted —
 * bookings data loaded, on the tutor dashboard the Bookings tab active, AND
 * (the caller's responsibility) the target booking spliced into its section's
 * rendered list if the normal preview slice would otherwise have excluded it.
 * `HIGHLIGHT_PARAM` is exported so callers can look up the raw target id
 * against their already-fetched booking list for that injection. If the id
 * still isn't in the DOM once `ready`, it genuinely isn't one of the user's
 * own bookings (`/api/bookings/` already scopes to the current user) — this
 * shows a toast rather than silently failing, and still cleans up the URL.
 */
export function useHighlightTarget(ready: boolean): string | null {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetId = searchParams.get(HIGHLIGHT_PARAM);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !targetId) return;

    const frame = requestAnimationFrame(() => {
      const el = document.getElementById(`booking-${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedId(targetId);
        window.setTimeout(() => setHighlightedId(null), HIGHLIGHT_MS);
      } else {
        toast.error("İlgili rezervasyon bulunamadı.");
      }

      const next = new URLSearchParams(searchParams.toString());
      next.delete(HIGHLIGHT_PARAM);
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });

    return () => cancelAnimationFrame(frame);
  }, [ready, targetId, pathname, router, searchParams]);

  return highlightedId;
}
