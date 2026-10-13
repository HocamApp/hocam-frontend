import { PAYMENTS_HREF } from "@/lib/refundRoutes";

/** Where a student puts the credits of one paid package onto the calendar. */
export const PLACE_LESSONS_HREF = `${PAYMENTS_HREF}/place`;

export function placeLessonsHref(purchaseId: string): string {
  return `${PLACE_LESSONS_HREF}?${new URLSearchParams({ purchase: purchaseId }).toString()}`;
}
