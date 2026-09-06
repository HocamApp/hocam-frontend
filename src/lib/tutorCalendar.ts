import api from "@/lib/api";
import { addDays, monthGridDays, parseLocalDate, rangeForView, shiftAnchor, toDateKey, weekDays, timeToMinutes } from "@/components/schedule/scheduleDates";

export type TutorCalendarView = "day" | "week" | "month";
export interface TutorCalendarEvent {
  source: "booking" | "coaching";
  id: string;
  student: { id: string; display_name: string; avatar_url: string | null };
  local_date: string;
  local_time: string;
  duration_minutes: number;
  status: string;
  subject: { id: string; name: string; exam_type: string } | null;
  service_period_id?: string | null;
  classroom_available: boolean;
}
export interface TutorCalendarAvailability { local_date: string; start_time: string; end_time: string }
export interface TutorTimeOff {
  id: string; local_date: string; all_day: boolean; start_time: string | null; end_time: string | null;
  description: string; created_at: string; updated_at: string;
}
export interface TutorCalendarResponse {
  from: string; to: string; timezone: "Europe/Istanbul"; events: TutorCalendarEvent[];
  availability: TutorCalendarAvailability[]; time_off: TutorTimeOff[];
}
export async function fetchTutorCalendar(from: string, to: string): Promise<TutorCalendarResponse> {
  return (await api.get<TutorCalendarResponse>("/schedule/tutor/calendar/", { params: { from, to } })).data;
}
export const calendarViewMap = { day: "daily", week: "weekly", month: "monthly" } as const;
export function istanbulToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function validCalendarDate(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number(value.slice(0, 4)) >= 1900 && Number(value.slice(0, 4)) <= 2100 && toDateKey(parseLocalDate(value)) === value);
}
export function calendarRange(date: string, view: TutorCalendarView) { return rangeForView(calendarViewMap[view], parseLocalDate(date)); }
export function calendarDates(date: string, view: TutorCalendarView): string[] {
  const anchor = parseLocalDate(date);
  return (view === "month" ? monthGridDays(anchor) : view === "week" ? weekDays(anchor) : [anchor]).map(toDateKey);
}
export function shiftCalendarDate(date: string, view: TutorCalendarView, direction: 1 | -1): string {
  return toDateKey(shiftAnchor(calendarViewMap[view], parseLocalDate(date), direction));
}
export function calendarEventHref(event: TutorCalendarEvent): string {
  return event.source === "booking" ? `/dashboard/tutor?tab=bookings&highlightBooking=${encodeURIComponent(event.id)}` : event.service_period_id ? `/dashboard/tutor/coaching/service-periods/${encodeURIComponent(event.service_period_id)}/program` : "/dashboard/tutor/coaching/students";
}
export const calendarEventKey = (event: TutorCalendarEvent) => `${event.source}:${event.id}`;
export function calendarStatus(event: TutorCalendarEvent): string {
  return ({ pending: "Hoca onayı bekleniyor", confirmed: "Kesinleşti", in_progress: "Devam ediyor", awaiting_confirmation: "Öğrenci onayı bekleniyor", completed: "Tamamlandı", disputed: "İnceleniyor", cancelled: "İptal edildi", expired: "Otomatik iptal edildi", scheduled: "Planlandı", reschedule_requested: "Saat değişikliği bekleniyor", awaiting_report: "Rapor bekleniyor", technical_failure: "Teknik sorun", no_show: "Katılım olmadı", tutor_no_show: "Hoca katılmadı", student_no_show: "Öğrenci katılmadı" } as Record<string, string>)[event.status] ?? event.status;
}
export type PositionedCalendarEvent = { event: TutorCalendarEvent; start: number; end: number; column: number; columns: number };
/** Interval components share column widths; touching endpoints never collide. */
export function layoutCalendarEvents(events: TutorCalendarEvent[]): PositionedCalendarEvent[] {
  const ordered = events.map(event => ({ event, start: timeToMinutes(event.local_time), end: Math.min(1440, timeToMinutes(event.local_time) + event.duration_minutes), column: 0, columns: 1 })).sort((a,b) => a.start-b.start || b.end-a.end || calendarEventKey(a.event).localeCompare(calendarEventKey(b.event)));
  let group: PositionedCalendarEvent[] = [], groupEnd = -1;
  const flush = () => { const columns = Math.max(1, ...group.map(item => item.column + 1)); group.forEach(item => { item.columns = columns; }); group = []; };
  for (const item of ordered) {
    if (item.start >= groupEnd) { flush(); groupEnd = -1; }
    const occupied = new Set(group.filter(previous => previous.end > item.start).map(previous => previous.column));
    while (occupied.has(item.column)) item.column += 1;
    group.push(item); groupEnd = Math.max(groupEnd, item.end);
  }
  flush(); return ordered;
}
/** Split a session crossing midnight into calendar portions without changing its identity. */
export function eventsForCalendarDay(events: TutorCalendarEvent[], date: string): TutorCalendarEvent[] {
  const previousDate = toDateKey(addDays(parseLocalDate(date), -1));
  return events.flatMap(event => {
    if (event.local_date === date) return [{ ...event, duration_minutes: Math.min(event.duration_minutes, 1440 - timeToMinutes(event.local_time)) }];
    const remainder = timeToMinutes(event.local_time) + event.duration_minutes - 1440;
    return event.local_date === previousDate && remainder > 0 ? [{ ...event, local_date: date, local_time: "00:00", duration_minutes: remainder }] : [];
  });
}
