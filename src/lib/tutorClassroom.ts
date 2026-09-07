import type { Booking, Conversation, PackagePurchase } from "@/types";
import type { CoachingStudentRow } from "@/lib/coachingApi";
import { bookingInstant } from "@/lib/bookingTime";
import { serverNow } from "@/lib/serverClock";

export const CLASSROOM_STATUSES: ReadonlySet<Booking["status"]> = new Set<Booking["status"]>([
  "confirmed", "in_progress", "awaiting_confirmation", "completed", "disputed",
]);

export interface StudentRosterEntry {
  student: Booking["student"];
  /** Completed bookings only; kept as totalLessons for the existing Panom card. */
  totalLessons: number;
  upcomingLessons: number;
  nextLesson: Booking | null;
  currentLesson: Booking | null;
  lastCompletedAt: string | null;
  remainingCredits: number;
  totalCredits: number;
}

/** Booking wall-clock helpers now live in `@/lib/bookingTime`, the single
 * place that decodes the mislabeled-UTC storage convention. Re-exported here
 * so existing classroom call sites keep working. */
export { bookingInstant, bookingDateLabel, bookingTimeLabel } from "@/lib/bookingTime";

export function getStudentRoster(bookings: Booking[], purchases: PackagePurchase[], tutorId: string, now = serverNow()): StudentRosterEntry[] {
  const roster = new Map<string, StudentRosterEntry>();
  for (const booking of bookings) {
    if (booking.tutor.id !== tutorId || !CLASSROOM_STATUSES.has(booking.status)) continue;
    const entry = roster.get(booking.student.id) ?? {
      student: booking.student, totalLessons: 0, upcomingLessons: 0,
      nextLesson: null, currentLesson: null, lastCompletedAt: null,
      remainingCredits: 0, totalCredits: 0,
    };
    const instant = bookingInstant(booking.start_time);
    if (booking.status === "completed") {
      entry.totalLessons += 1;
      if (!entry.lastCompletedAt || instant > bookingInstant(entry.lastCompletedAt)) entry.lastCompletedAt = booking.start_time;
    }
    if (booking.status === "confirmed" && instant > now) {
      entry.upcomingLessons += 1;
      if (!entry.nextLesson || instant < bookingInstant(entry.nextLesson.start_time)) entry.nextLesson = booking;
    }
    if (booking.status === "in_progress" && (!entry.currentLesson || instant > bookingInstant(entry.currentLesson.start_time))) entry.currentLesson = booking;
    roster.set(booking.student.id, entry);
  }
  for (const purchase of purchases) {
    if (purchase.status !== "paid" || purchase.tutor.id !== tutorId) continue;
    const entry = roster.get(purchase.student.id);
    if (!entry) continue;
    entry.remainingCredits += purchase.remaining_credits;
    entry.totalCredits += purchase.total_credits;
  }
  return Array.from(roster.values()).sort((a, b) => {
    const nextA = a.nextLesson ? bookingInstant(a.nextLesson.start_time) : Infinity;
    const nextB = b.nextLesson ? bookingInstant(b.nextLesson.start_time) : Infinity;
    if (nextA !== nextB) return nextA - nextB;
    const lastA = a.lastCompletedAt ? bookingInstant(a.lastCompletedAt) : 0;
    const lastB = b.lastCompletedAt ? bookingInstant(b.lastCompletedAt) : 0;
    return lastB - lastA || studentName(a.student).localeCompare(studentName(b.student), "tr") || a.student.id.localeCompare(b.student.id);
  });
}

export function studentName(student: Booking["student"]): string { return student.display_name || student.email; }
export type ClassroomFilter = "all" | "upcoming" | "unscheduled";
const searchable = (value: string) => value.toLocaleLowerCase("tr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i");
export function filterStudentRoster(roster: StudentRosterEntry[], search: string, filter: ClassroomFilter): StudentRosterEntry[] {
  const term = searchable(search.trim());
  return roster.filter((entry) =>
    (filter === "all" || (filter === "upcoming" ? entry.upcomingLessons > 0 : entry.upcomingLessons === 0)) &&
    searchable(studentName(entry.student)).includes(term));
}

export function studentConversation(conversations: Conversation[], studentId: string, tutorUserId: string): Conversation | undefined {
  return conversations.filter((item) => item.student === studentId && item.tutor === tutorUserId)
    .sort((a, b) => Date.parse(b.latest_message?.created_at ?? b.created_at) - Date.parse(a.latest_message?.created_at ?? a.created_at) || a.id.localeCompare(b.id))[0];
}

export function studentCoaching(rows: CoachingStudentRow[], studentId: string): CoachingStudentRow[] {
  return rows.filter((row) => row.student_id === studentId);
}
