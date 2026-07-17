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

// Format a price number as Turkish Lira
export function formatPrice(price: number | string): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(price));
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

// Booking.start_time (and related lesson-scheduling timestamps) follow this
// project's naive wall-clock convention: the YYYY-MM-DDTHH:mm:ss digits ARE
// Turkey local time, sent to the backend with no offset and stored/returned
// tagged as UTC with no real timezone conversion applied (see the longer
// explanation in BookingModal.tsx, which established this pattern first).
//
// Passing these strings through `new Date(iso)` parses the UTC tag literally
// and then any `.toLocaleTimeString()`/`.toLocaleString()` call converts
// UTC -> the viewer's local zone again, double-shifting the displayed time by
// +3h for Turkey users (e.g. a 06:30 booking renders as 09:30). It also
// silently corrupts is-future/is-past comparisons within a ~3h window around
// each lesson's start.
//
// Use this instead of `new Date(startTimeIso)` for any Booking start_time (or
// its derived end_time) — it reads the wall-clock digits directly and builds
// a Date in the *browser's own* local time, which is correct for this
// product's Turkey-only audience and keeps `Date.now()`/`new Date()`
// comparisons meaningful.
export function parseBookingDate(iso: string): Date {
  const match = iso.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/
  );
  if (!match) return new Date(iso);
  const [, y, mo, d, h, mi, s] = match;
  return new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(s)
  );
}

// Calendar-date display for a Booking start_time — like formatDate(), but
// routed through parseBookingDate() so it doesn't double-shift. Use this
// instead of formatDate() for booking/lesson timestamps specifically.
export function formatBookingDate(iso: string): string {
  return parseBookingDate(iso).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Clock-time display ("18:30") for a Booking start_time.
export function formatBookingTime(iso: string): string {
  return parseBookingDate(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
