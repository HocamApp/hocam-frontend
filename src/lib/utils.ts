import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Sanitize a post-login returnUrl: only same-origin absolute paths are
// allowed. Rejects scheme-relative ("//evil.com"), backslash tricks and
// absolute URLs ("https://evil.com") so login can never redirect off-site.
export function safeReturnUrl(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/")) return null;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return null;
  const beforeFirstSlash = raw.slice(1).split("/")[0] ?? "";
  if (beforeFirstSlash.includes(":")) return null;
  return raw;
}

/**
 * Turkish Lira, with the symbol after the number: `980 ₺`, not `₺980`.
 *
 * `Intl` with `style: "currency"` puts the symbol in front for tr-TR, which is
 * not how it is written in Turkish. Every prototype built during the design
 * process had this backwards, so the decimal formatter does the number and the
 * suffix is appended by hand. The thousands period and decimal comma still
 * come from the tr-TR locale.
 */
export function formatPrice(price: number | string): string {
  const amount = new Intl.NumberFormat("tr-TR", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(Number(price));
  return `${amount} ₺`;
}

// Format a rating to one decimal place
export function formatRating(rating: number | string): string {
  return Number(rating).toFixed(1);
}

export function formatLessonCount(count: number): string {
  if (!Number.isFinite(count) || count < 0) return "0";
  if (count < 1000) return String(count);

  const compact = count / 1000;
  const formatted =
    Number.isInteger(compact)
      ? Math.round(compact).toString()
      : compact.toFixed(1).replace(".", ",");

  return `${formatted} B`;
}

// Format a date string to Turkish locale
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Backend: 0=Monday, 6=Sunday. JS getDay(): 0=Sunday, 6=Saturday.
export function jsDayToBackendDay(jsDay: number): number {
  return (jsDay + 6) % 7;
}

export function getNext14Days(): Date[] {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const next = new Date(d);
    next.setDate(d.getDate() + i);
    out.push(next);
  }
  return out;
}

// Local (not UTC) YYYY-MM-DD — must not use toISOString(), which would
// convert to UTC and shift the calendar date by a day for Turkey (UTC+3).
export function formatDateLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Lesson dispute categories — used by BookingCard for booking.dispute_category.
 *
 * Not the coaching vocabulary: coaching disputes have their own, larger set
 * (message_sla, program_absent, report_absent, scope_deficient, …) with
 * different codes for the same idea — "technical" there, "technical_issue"
 * here. Use coachingDisputeCategoryLabel from @/lib/coachingApi for those;
 * routing them through this map falls through to the raw code for most of them.
 */
const DISPUTE_CATEGORY_LABELS: Record<string, string> = {
  tutor_no_show: "Hocanın derse katılmaması",
  technical_issue: "Teknik sorun",
  interrupted: "Ders yarıda kesildi",
  conduct: "Davranış şikayeti",
  other: "Diğer",
};

export function formatDisputeCategory(category: string): string {
  return DISPUTE_CATEGORY_LABELS[category] ?? category;
}

// Format a date as a Turkish relative string ("2 gün önce", "1 hafta önce", etc.)
// Falls back to formatDate for dates older than a year.
/**
 * Minute-granular relative time, for surfaces where "Bugün" is not an answer.
 *
 * A notification that arrived four minutes ago and one that arrived nine hours
 * ago both read as "Bugün" through `formatRelativeDate`, which is the right
 * grain for a review and the wrong one for a feed you check to see what just
 * happened. Past a day it hands back to `formatRelativeDate` rather than
 * counting hours forever.
 */
export function formatRelativeTime(dateString: string): string {
  const parsed = new Date(dateString).getTime();
  if (Number.isNaN(parsed)) return "";

  const minutes = Math.floor((Date.now() - parsed) / 60_000);
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk önce`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;

  return formatRelativeDate(dateString);
}

export function formatRelativeDate(dateString: string): string {
  const days = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 86_400_000
  );
  if (days === 0) return "Bugün";
  if (days === 1) return "Dün";
  if (days < 7) return `${days} gün önce`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 hafta önce";
  if (weeks < 5) return `${weeks} hafta önce`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 ay önce";
  if (months < 12) return `${months} ay önce`;
  return formatDate(dateString);
}
