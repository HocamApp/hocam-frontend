import { CalendarCheck } from "lucide-react";

export const GOOGLE_CALENDAR_ASSURANCE_TEXT =
  "Rezervasyonun hocanın Google Calendar'ına otomatik aktarılır.";

/**
 * The student/visitor side of the calendar integration: a single reassuring
 * line, shown only when the tutor really has an active connection.
 *
 * Deliberately exposes nothing else — not the Google account e-mail, the
 * calendar, the permissions, nor any sync/technical detail.
 */
export function GoogleCalendarAssurance({ connected }: { connected?: boolean }) {
  if (!connected) {
    return null;
  }

  return (
    <p
      className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"
      data-testid="google-calendar-assurance"
    >
      <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{GOOGLE_CALENDAR_ASSURANCE_TEXT}</span>
    </p>
  );
}
