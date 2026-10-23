import { PLAN_DURATION_DAYS, WEEKLY_LESSON_OPTIONS, formatPlanDuration } from "./lessonPricing";
import { formatTryMinor } from "./money";
import { formatPrice } from "./utils";

/**
 * "Haftada 3 ders · 3 ay": the package the schedule step put in the link
 * (`per_week` and `duration`, the term in days), for the coaching step's strip.
 *
 * Only what the catalog sells is believed: a value that is not one of its
 * weekly counts or terms is ignored, so a hand-edited link cannot print a
 * package that does not exist. Null when the link names neither half.
 */
export function checkoutPackageLabel(searchParams: URLSearchParams): string | null {
  const perWeek = Number(searchParams.get("per_week"));
  const days = Number(searchParams.get("duration"));
  const weekly = (WEEKLY_LESSON_OPTIONS as readonly number[]).includes(perWeek)
    ? `Haftada ${perWeek} ders`
    : null;
  const term = (PLAN_DURATION_DAYS as readonly number[]).includes(days)
    ? formatPlanDuration(days).toLocaleLowerCase("tr-TR")
    : null;

  if (weekly && term) return `${weekly} · ${term}`;
  return weekly ?? term;
}

/**
 * The price of one coaching meeting the way the product writes a lira amount:
 * "2.400 ₺", with the kuruş only when there are any ("450,50 ₺"), and a space
 * that cannot break so a wrapped line never strands the symbol. The server's
 * own `price_per_session_display` always carries ",00", so it is not shown.
 */
export function coachingMeetingPrice(minor: number): string {
  const label = minor % 100 === 0 ? formatPrice(minor / 100) : formatTryMinor(minor);
  return label.replace(" ₺", "\u00a0₺");
}
