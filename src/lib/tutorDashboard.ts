import type { Booking } from "@/types";
import { bookingInstant } from "@/lib/tutorClassroom";

export type TutorDashboardRoute =
  | { mode: "overview" }
  | { mode: "bookings" }
  | { mode: "redirect"; href: string };

const LEGACY_TAB_DESTINATIONS: Record<string, string> = {
  students: "/dashboard/tutor/classroom",
  availability: "/dashboard/tutor/calendar",
  earnings: "/dashboard/tutor/statistics?tab=income&period=30",
  reviews: "/dashboard/tutor/statistics?tab=reviews&period=90",
  packages: "/dashboard/tutor/packages",
};

export function resolveTutorDashboardRoute(params: URLSearchParams): TutorDashboardRoute {
  const tab = params.get("tab");
  const highlight = params.get("highlightBooking");
  if (!tab && highlight) {
    const canonical = new URLSearchParams({ tab: "bookings", highlightBooking: highlight });
    return { mode: "redirect", href: `/dashboard/tutor?${canonical.toString()}` };
  }
  if (!tab) return { mode: "overview" };
  if (tab === "bookings") return { mode: "bookings" };
  return {
    mode: "redirect",
    href: LEGACY_TAB_DESTINATIONS[tab] ?? "/dashboard/tutor",
  };
}

function istanbulDay(instant: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const value = (type: string) => parts.find(part => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function dashboardGreeting(now = Date.now()): string {
  const hour = Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(now));
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

function byStart(first: Booking, second: Booking): number {
  return bookingInstant(first.start_time) - bookingInstant(second.start_time);
}

export function dashboardBookingGroups(bookings: Booking[], now = Date.now()) {
  const active = bookings.filter(booking => {
    const future = bookingInstant(booking.start_time) > now;
    return (booking.status === "pending" && future)
      || booking.status === "confirmed"
      || booking.status === "in_progress"
      || booking.status === "awaiting_confirmation";
  }).sort(byStart);
  const past = bookings.filter(booking => {
    const pastPending = booking.status === "pending" && bookingInstant(booking.start_time) <= now;
    return pastPending || ["completed", "cancelled", "disputed", "expired"].includes(booking.status);
  }).sort((first, second) => byStart(second, first));
  const upcoming = bookings.filter(booking =>
    booking.status === "in_progress"
    || (booking.status === "confirmed" && bookingInstant(booking.start_time) > now)
  ).sort(byStart);
  const todayKey = istanbulDay(now);
  const today = upcoming.filter(booking => istanbulDay(bookingInstant(booking.start_time)) === todayKey);
  const pendingActions = bookings.filter(booking => {
    if (booking.status === "pending" && bookingInstant(booking.start_time) > now) return true;
    if (booking.status === "disputed" || booking.status === "awaiting_confirmation") return true;
    return booking.status === "completed"
      && Boolean(booking.learning_context?.activity_id)
      && booking.learning_context?.status === "pending_confirmation";
  });
  return { active, past, upcoming, today, next: upcoming[0] ?? null, pendingActions };
}

export function dashboardCountdown(startTime: string, now = Date.now()): string {
  const startDay = istanbulDay(bookingInstant(startTime));
  const currentDay = istanbulDay(now);
  const start = Date.parse(`${startDay}T00:00:00Z`);
  const current = Date.parse(`${currentDay}T00:00:00Z`);
  const difference = Math.round((start - current) / 86_400_000);
  if (difference < 0) return "";
  if (difference === 0) return "Bugün";
  if (difference === 1) return "Yarın";
  return `Derse ${difference} gün kaldı`;
}
