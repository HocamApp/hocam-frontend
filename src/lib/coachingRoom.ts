import type { CoachingSessionDetail, CoachingSessionItem } from "./coachingApi";
import { postSessionBand, type PostSessionRole } from "./coachingPostSession";
import { COACHING_TUTOR_EARLY_JOIN_MINUTES } from "./coachingSessions";
import { COACHING_STUDENT_EARLY_JOIN_MINUTES, coachingRemainingLabel } from "./coachingStudentOverview";
import { coachingTimeLabel, coachingTimeLocative } from "./coachingTime";

/**
 * What the frame around the coaching video room says: how much of the meeting is
 * left, when a room that is not open yet opens, and what became of one that
 * cannot be entered. Pure: `now` is passed in and nothing here reads the clock.
 * The video itself (Jitsi) is not touched by any of it.
 */

/** The last this-many minutes of a meeting are marked. */
export const ROOM_URGENT_MINUTES = 5;

const MINUTE_MS = 60_000;
/** A wait longer than a day is left to the slow poll instead of one long timer. */
const LONGEST_TIMER_MS = 24 * 60 * MINUTE_MS;
/** After the moment it opens, a breath before asking, so the server agrees with the clock. */
const OPEN_BREATH_MS = 1_500;

export interface RoomClock {
  phase: "before" | "live" | "over";
  label: string;
  /** The last minutes, and after the end. */
  urgent: boolean;
}

/** The meeting's clock for the bar: time to the start, time left, or "Süre doldu". */
export function roomClock(
  session: Pick<CoachingSessionItem, "scheduled_start" | "duration_minutes">,
  now: Date,
): RoomClock {
  const start = Date.parse(session.scheduled_start);
  const end = start + session.duration_minutes * MINUTE_MS;
  const t = now.getTime();
  if (t < start) return { phase: "before", label: `Başlamasına ${coachingRemainingLabel(start, now)}`, urgent: false };
  const left = end - t;
  if (left <= 0) return { phase: "over", label: "Süre doldu", urgent: true };
  return {
    phase: "live",
    label: `Kalan ${Math.ceil(left / MINUTE_MS)} dk`,
    urgent: left <= ROOM_URGENT_MINUTES * MINUTE_MS,
  };
}

/** "3. görüşme · 19:00–19:30": which meeting and from when to when (the date is left out: it is happening now). */
export function roomMeta(
  session: Pick<CoachingSessionItem, "scheduled_start" | "duration_minutes">,
  number: number | null,
): string {
  const start = Date.parse(session.scheduled_start);
  const span = `${coachingTimeLabel(start)}–${coachingTimeLabel(start + session.duration_minutes * MINUTE_MS)}`;
  return number === null ? span : `${number}. görüşme · ${span}`;
}

/** When the server starts handing out room tokens: ten minutes early for a student, fifteen for a tutor. */
export function roomOpensAt(session: Pick<CoachingSessionItem, "scheduled_start">, role: PostSessionRole): number {
  const early = role === "tutor" ? COACHING_TUTOR_EARLY_JOIN_MINUTES : COACHING_STUDENT_EARLY_JOIN_MINUTES;
  return Date.parse(session.scheduled_start) - early * MINUTE_MS;
}

/** How long to wait before asking for the room again, so it is entered the moment it opens. Null: do not set a timer. */
export function roomRefetchDelay(opensAt: number, now: Date): number | null {
  const wait = opensAt - now.getTime();
  if (wait <= 0 || wait > LONGEST_TIMER_MS) return null;
  return wait + OPEN_BREATH_MS;
}

export type RoomFailure =
  | { kind: "waiting"; title: string; message: string; countdown: string | null; opensAt: number | null }
  | { kind: "closed"; title: string; message: string; /** Whether the screen after the meeting is the way on. */ summary: boolean }
  | { kind: "unavailable"; title: string; message: string };

/**
 * What to show where the video would be, when the room's token was refused.
 * The server answers in English (and some answers have no code at all); the
 * person sees Turkish, in the words of the screen after the meeting where the
 * meeting has a status to speak of.
 */
export function roomFailure({
  code,
  status,
  session,
  role,
  otherName,
  now,
}: {
  code: string | null;
  /** The HTTP status, or null when the request got no answer at all. */
  status: number | null;
  session: CoachingSessionDetail | undefined;
  role: PostSessionRole;
  otherName: string | null | undefined;
  now: Date;
}): RoomFailure {
  if (code === "too_early") {
    if (!session) {
      return {
        kind: "waiting",
        title: "Oda henüz açılmadı",
        message: "Başlama saatine yaklaştığında bu sayfa kendiliğinden girer.",
        countdown: null,
        opensAt: null,
      };
    }
    const opensAt = roomOpensAt(session, role);
    const remaining = coachingRemainingLabel(opensAt, now);
    return {
      kind: "waiting",
      title: `Oda ${coachingTimeLocative(coachingTimeLabel(opensAt))} açılır`,
      message: `Görüşme ${coachingTimeLocative(coachingTimeLabel(session.scheduled_start))} başlıyor. Oda açılınca bu sayfa kendiliğinden girer.`,
      countdown: remaining ? `${remaining} kaldı` : "Birazdan açılır",
      opensAt,
    };
  }
  if (code === "session_ended") {
    return {
      kind: "closed",
      title: "Bu görüşme sona erdi",
      message:
        role === "tutor"
          ? "Raporunu görüşme özetinden hazırlayabilirsin."
          : "Görüşmeyi değerlendirmek ya da bir sorun bildirmek için görüşme özetine git.",
      summary: true,
    };
  }
  if (code === "session_not_active") {
    if (!session) return { kind: "closed", title: "Bu görüşmeye şu an girilemiyor", message: "", summary: true };
    const band = postSessionBand({ session, role, otherName });
    return { kind: "closed", title: band.title, message: band.message, summary: true };
  }
  if (status === 503) {
    return {
      kind: "unavailable",
      title: "Görüntülü görüşme şu an açılamıyor",
      message: "Birkaç dakika sonra tekrar dene. Sorun sürerse destek ekibine yaz.",
    };
  }
  if (status === null) {
    return { kind: "unavailable", title: "Bağlantı kurulamadı", message: "İnternet bağlantını kontrol edip tekrar dene." };
  }
  if (status === 404) {
    return { kind: "closed", title: "Görüşme bulunamadı", message: "Bu görüşme hesabında görünmüyor.", summary: false };
  }
  return { kind: "unavailable", title: "Görüşme odası açılamadı", message: "Birkaç dakika sonra tekrar dene." };
}
