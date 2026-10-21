import type { CoachingSessionAttendanceSummary, CoachingSessionItem } from "./coachingApi";
import { coachingRemainingLabel } from "./coachingStudentOverview";
import { coachingDateTimeLabel, coachingTimeLabel } from "./coachingTime";

/**
 * What the screen after a coaching meeting says, and when each thing on it is
 * offered. Pure: `now` is passed in and nothing here reads the clock.
 */

/** Mirrors TUTOR_NO_SHOW_REPORTABLE_AFTER_MINUTES in the backend's session_views.py. */
export const TUTOR_NO_SHOW_WAIT_MINUTES = 10;
/** Connected this long inside the meeting's own window, the tutor was there. */
export const TUTOR_PRESENT_SECONDS = 300;

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

export type TutorPresence = "present" | "absent" | "unknown";

/** Whether the tutor was in the meeting, from the server's attendance. Unknown until it has been read. */
export function tutorPresence(attendance: CoachingSessionAttendanceSummary | null | undefined): TutorPresence {
  if (!attendance) return "unknown";
  return attendance.tutor.total_connected_seconds >= TUTOR_PRESENT_SECONDS ? "present" : "absent";
}

export type TutorNoShowOption = { kind: "hidden" } | { kind: "later"; opensAt: string } | { kind: "available" };

/**
 * "Öğretmen katılmadı bildir". Master Spec §24: only when there is no record of the
 * tutor, or the wait the server asks for has run out. The server checks the wait but
 * not the attendance, so without this a student could report a tutor who was in the
 * room the whole time. While the attendance is not known the option stays hidden
 * rather than flash and vanish.
 */
export function tutorNoShowOption({
  session,
  presence,
  now,
}: {
  session: CoachingSessionItem;
  presence: TutorPresence;
  now: Date;
}): TutorNoShowOption {
  if (!REPORTABLE.has(session.status) || presence !== "absent") return { kind: "hidden" };
  const opens = Date.parse(session.scheduled_start) + TUTOR_NO_SHOW_WAIT_MINUTES * MINUTE_MS;
  if (now.getTime() < opens) return { kind: "later", opensAt: coachingTimeLabel(opens) };
  return { kind: "available" };
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
