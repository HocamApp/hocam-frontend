import type { CoachingSessionAttendanceSummary, CoachingSessionItem } from "./coachingApi";
import { coachingRemainingLabel, numberStudentSessions } from "./coachingStudentOverview";
import { coachingDateTimeLabel, coachingTimeLabel } from "./coachingTime";

/**
 * What the screen after a coaching meeting says, and when each thing on it is
 * offered. Pure: `now` is passed in and nothing here reads the clock.
 */

/** Mirrors TUTOR_NO_SHOW_REPORTABLE_AFTER_MINUTES in the backend's session_views.py. */
export const TUTOR_NO_SHOW_WAIT_MINUTES = 10;
/** Connected this long inside the meeting's own window, a side was there. */
export const PARTY_PRESENT_SECONDS = 300;
/** The same threshold, under the name the student's rule was first written with. */
export const TUTOR_PRESENT_SECONDS = PARTY_PRESENT_SECONDS;

const MINUTE_MS = 60_000;
const HELD = new Set(["completed", "awaiting_report"]);
/** The statuses in which the server still takes a technical or no-show report. */
const REPORTABLE = new Set(["in_progress", "awaiting_report"]);
const UPCOMING = new Set(["scheduled", "reschedule_requested", "in_progress"]);

export type PostSessionRole = "student" | "tutor";

export interface PostSessionBand {
  title: string;
  message: string;
  /** "22 Ekim Perşembe 19:30": the server's own report deadline, when it sent one. */
  deadline: string | null;
}

function firstName(name: string | null | undefined): string | null {
  const first = name?.trim().split(/\s+/)[0];
  return first ? first : null;
}

/** "3. görüşme · 30 dk · 21 Ekim Çarşamba 19:00": a visit from the list has no other context. */
export function postSessionMeta(session: CoachingSessionItem, number: number | null): string {
  return [
    number === null ? null : `${number}. görüşme`,
    `${session.duration_minutes} dk`,
    coachingDateTimeLabel(session.scheduled_start),
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * The pink band: a title that is true of this meeting's status (not always
 * "tamamlandı"), one sentence, and the report deadline the server gave. For a
 * meeting waiting for its report the sentence is Master Spec §24's promise.
 * Never a word about money: a closed meeting is spoken of as a right to a
 * meeting, as everywhere else in coaching.
 */
export function postSessionBand({
  session,
  role,
  otherName,
}: {
  session: CoachingSessionItem;
  role: PostSessionRole;
  /** The tutor for a student, the student for a tutor. */
  otherName: string | null | undefined;
}): PostSessionBand {
  const first = firstName(otherName);
  const due = session.report_due_at ? coachingDateTimeLabel(session.report_due_at) : null;
  const planned = `Bu görüşme ${coachingDateTimeLabel(session.scheduled_start)} için planlandı.`;

  if (role === "student") {
    const hoca = first ? `${first} hocan` : "Hocan";
    switch (session.status) {
      case "awaiting_report":
        return {
          title: "Koçluk görüşmen tamamlandı",
          message: session.report_overdue
            ? `${first ? `${first} hocanın` : "Hocanın"} raporu için verilen süre geçti.`
            : `${hoca} çalışma programını ve ilerleme raporunu en geç 24 saat içinde paylaşacak.`,
          deadline: due,
        };
      case "completed":
        return { title: "Koçluk görüşmen tamamlandı", message: `${hoca} raporunu paylaştı.`, deadline: null };
      case "in_progress":
        return { title: "Görüşme sürüyor", message: "Görüşme devam ediyor, odaya geri dönebilirsin.", deadline: null };
      case "scheduled":
      case "reschedule_requested":
        return { title: "Görüşme henüz başlamadı", message: planned, deadline: null };
      case "student_no_show":
        return {
          title: "Bu görüşme kapandı",
          message: "Görüşmeye katılmadığın için bu görüşme hakkın kullanılmış sayıldı.",
          deadline: null,
        };
      case "tutor_no_show":
        return {
          title: "Bildirimin alındı",
          message: "Öğretmen katılmadı bildirimini kaydettik. Bu görüşme hakkın korunur.",
          deadline: null,
        };
      case "technical_failure":
        return { title: "Teknik sorun bildirildi", message: "Destek ekibi bildirimi inceliyor.", deadline: null };
      case "cancelled":
        return { title: "Bu görüşme iptal edildi", message: "", deadline: null };
      default:
        return { title: "Görüşme", message: "", deadline: null };
    }
  }

  switch (session.status) {
    case "awaiting_report":
      return {
        title: "Görüşme bitti",
        message: session.report_overdue
          ? "Rapor için verilen süre geçti; en kısa sürede paylaş."
          : `${first ?? "Öğrenci"} için çalışma programını ve ilerleme raporunu en geç 24 saat içinde paylaşmalısın.`,
        deadline: due,
      };
    case "completed":
      return { title: "Görüşme bitti", message: "Raporu paylaştın.", deadline: null };
    case "in_progress":
      return { title: "Görüşme sürüyor", message: "Görüşme devam ediyor, odaya geri dönebilirsin.", deadline: null };
    case "scheduled":
    case "reschedule_requested":
      return { title: "Görüşme henüz başlamadı", message: planned, deadline: null };
    case "student_no_show":
      return {
        title: "Görüşme kapandı",
        message: "Öğrenci katılmadı bildirimi kaydedildi. Bu görüşme hakkı kullanılmış sayıldı.",
        deadline: null,
      };
    case "tutor_no_show":
      return { title: "Görüşme kapandı", message: "Öğrenci senin katılmadığını bildirdi.", deadline: null };
    case "technical_failure":
      return { title: "Teknik sorun bildirildi", message: "Destek ekibi bildirimi inceliyor.", deadline: null };
    case "cancelled":
      return { title: "Bu görüşme iptal edildi", message: "", deadline: null };
    default:
      return { title: "Görüşme", message: "", deadline: null };
  }
}

export type Presence = "present" | "absent" | "unknown";
export type TutorPresence = Presence;

/**
 * Whether the other side was in the meeting, from the server's attendance: the
 * tutor's for a student, the student's for a tutor. Unknown until it has been read.
 */
export function counterpartPresence(
  attendance: CoachingSessionAttendanceSummary | null | undefined,
  role: PostSessionRole,
): Presence {
  if (!attendance) return "unknown";
  const other = role === "student" ? attendance.tutor : attendance.student;
  return other.total_connected_seconds >= PARTY_PRESENT_SECONDS ? "present" : "absent";
}

/** Whether the tutor was in the meeting: the student's way of asking `counterpartPresence`. */
export function tutorPresence(attendance: CoachingSessionAttendanceSummary | null | undefined): TutorPresence {
  return counterpartPresence(attendance, "student");
}

export type TutorNoShowOption = { kind: "hidden" } | { kind: "later"; opensAt: string } | { kind: "available" };
export type NoShowOption = TutorNoShowOption;

/**
 * "Öğretmen katılmadı bildir" for a student, "Öğrenci katılmadı bildir" for a
 * tutor. Master Spec §24: only when there is no record of the other side, or the
 * wait the server asks for has run out. The server checks the wait (for a
 * student's report only) but not the attendance, so without this a side could
 * report someone who was in the room the whole meeting. While the attendance is
 * not known the option stays hidden rather than flash and vanish.
 */
export function noShowOption({
  session,
  presence,
  now,
}: {
  session: CoachingSessionItem;
  presence: Presence;
  now: Date;
}): NoShowOption {
  if (!REPORTABLE.has(session.status) || presence !== "absent") return { kind: "hidden" };
  const opens = Date.parse(session.scheduled_start) + TUTOR_NO_SHOW_WAIT_MINUTES * MINUTE_MS;
  if (now.getTime() < opens) return { kind: "later", opensAt: coachingTimeLabel(opens) };
  return { kind: "available" };
}

/** The student's way of asking `noShowOption`: "Öğretmen katılmadı bildir". */
export const tutorNoShowOption = noShowOption;

/**
 * Which meeting this is, for the line under a title: a tutor's counts inside the
 * period, a student's across the whole plan as on the Görüşmeler page, and until
 * that list is read a student's is left out rather than guessed.
 */
export function postSessionNumber({
  session,
  role,
  sessions,
}: {
  session: CoachingSessionItem;
  role: PostSessionRole;
  sessions: readonly CoachingSessionItem[];
}): number | null {
  if (role === "tutor") return session.sequence_number;
  return numberStudentSessions(sessions).find((entry) => entry.session.id === session.id)?.number ?? null;
}

/** A technical or no-show report can only be made while the meeting is running or waiting for its report. */
export function postSessionCanReport(session: CoachingSessionItem): boolean {
  return REPORTABLE.has(session.status);
}

/**
 * The rating: asked of a student for a meeting that took place, and not asked
 * again once given (the server keeps the first answer, so a form would say
 * "kaydedildi" and change nothing).
 */
export function postSessionRating(session: CoachingSessionItem, role: PostSessionRole): "open" | "done" | "hidden" {
  if (role !== "student" || !HELD.has(session.status)) return "hidden";
  return session.rating_submitted === true ? "done" : "open";
}

/**
 * "Sonraki görüşmeyi görüntüle" says which meeting that is. The one just left
 * is never it, a cancelled one is not, and neither is a planned one whose time
 * has passed without the server moving it on.
 */
export function postSessionNext({
  sessions,
  currentId,
  role,
  now,
}: {
  sessions: readonly CoachingSessionItem[];
  currentId: string;
  role: PostSessionRole;
  now: Date;
}): { caption: string; empty: boolean } {
  const t = now.getTime();
  const next = sessions
    .filter(
      (item) =>
        item.id !== currentId &&
        UPCOMING.has(item.status) &&
        Date.parse(item.scheduled_start) + item.duration_minutes * MINUTE_MS > t,
    )
    .sort((a, b) => Date.parse(a.scheduled_start) - Date.parse(b.scheduled_start))[0];
  if (!next) return { caption: "Henüz planlanmış görüşme yok.", empty: true };
  const when = coachingDateTimeLabel(next.scheduled_start);
  const remaining = coachingRemainingLabel(Date.parse(next.scheduled_start), now);
  const line = remaining ? `${when} · ${remaining} sonra` : when;
  return { caption: role === "tutor" && next.student_name ? `${next.student_name} · ${line}` : line, empty: false };
}
