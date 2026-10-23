import type { CoachingLiveState, CoachingSessionStatus } from "./coachingApi";

/**
 * "Birlikte bitir": what the room says about ending a running meeting by
 * agreement. Pure. `now` is passed in and nothing here reads the clock; the
 * server decides what is allowed, this only decides what to show. The words
 * speak of the meeting and the right to a meeting, never of money.
 */

/** The room reads the live state this often while the meeting runs. */
export const EARLY_END_POLL_MS = 3_000;

/** How long the asker is told how the other side answered. */
const NOTICE_MS = 20_000;
const MINUTE_MS = 60_000;

export type PostSessionRoleName = "student" | "tutor";

export type EarlyEndView =
  /** Nothing to show: the meeting is not running, or the feature is off. */
  | { kind: "hidden" }
  | { kind: "idle"; notice: string | null }
  /** The asker's last request was turned down or taken back; `label` says for how long. */
  | { kind: "cooldown"; notice: string | null; label: string }
  /** My own request is out. */
  | { kind: "waiting"; version: number }
  /** The other side is asking; `minute` is the minute of the meeting they asked in. */
  | { kind: "incoming"; version: number; minute: number };

/** The other person's name, or a plain word for them when the name is not known. */
function otherLabel(role: PostSessionRoleName | undefined, name: string | null | undefined): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  if (role === "tutor") return "Öğrencin";
  if (role === "student") return "Öğretmenin";
  return "Karşı taraf";
}

/** The minute of the meeting a moment falls in, counting from one. */
export function earlyEndMinute(scheduledStart: string, at: string): number {
  const elapsed = Date.parse(at) - Date.parse(scheduledStart);
  return Math.max(1, Math.floor(elapsed / MINUTE_MS) + 1);
}

function cooldownLabel(retryAt: number, now: Date): string {
  const minutes = Math.max(1, Math.ceil((retryAt - now.getTime()) / MINUTE_MS));
  return `Yeni bir istek için ${minutes} dk beklemelisin.`;
}

/** What became of the asker's last request, said for a short while after it happened. */
function recentNotice(live: CoachingLiveState, reference: number, otherName: string | null | undefined): string | null {
  const request = live.early_end;
  if (!request || !request.requested_by_me) return null;
  if (request.status === "declined" && request.responded_at) {
    if (reference - Date.parse(request.responded_at) < NOTICE_MS) {
      return `${otherLabel(live.viewer_role, otherName)} görüşmeye devam etmek istiyor.`;
    }
  }
  if (request.status === "expired") {
    if (reference - Date.parse(request.expires_at) < NOTICE_MS) {
      return "İsteğin yanıtlanmadı. Görüşme sürüyor.";
    }
  }
  return null;
}

export function earlyEndView({
  live,
  now,
  otherName,
}: {
  live: CoachingLiveState;
  now: Date;
  otherName: string | null | undefined;
}): EarlyEndView {
  // The later of the two clocks: the poll is up to three seconds old.
  const reference = Math.max(Date.parse(live.server_time), now.getTime());
  if (live.status !== "in_progress" || !live.early_end_enabled || reference >= Date.parse(live.session_end)) {
    return { kind: "hidden" };
  }

  const request = live.early_end;
  if (request?.status === "pending") {
    return request.requested_by_me
      ? { kind: "waiting", version: request.version }
      : { kind: "incoming", version: request.version, minute: earlyEndMinute(live.scheduled_start, request.created_at) };
  }

  const notice = recentNotice(live, reference, otherName);
  const retryAt = live.early_end_retry_available_at ? Date.parse(live.early_end_retry_available_at) : null;
  if (retryAt !== null && retryAt > reference) {
    return { kind: "cooldown", notice, label: cooldownLabel(retryAt, new Date(reference)) };
  }
  return { kind: "idle", notice };
}

/** Said to the asker before the request goes out. */
export function earlyEndConfirmText(otherName: string | null | undefined, role?: PostSessionRoleName): string {
  return `${otherLabel(role, otherName)} kabul ederse görüşme şimdi tamamlanmış sayılır. Kabul etmezse görüşme devam eder.`;
}

/** Said to the one who is asked, with the minute and what a yes means for them. */
export function earlyEndIncomingText({
  role,
  otherName,
  minute,
}: {
  role: PostSessionRoleName;
  otherName: string | null | undefined;
  minute: number;
}): string {
  const asker = `${otherLabel(role, otherName)} görüşmeyi bitirmek istiyor. Görüşme ${minute}. dakikada.`;
  return role === "student"
    ? `${asker} Kabul edersen görüşme tamamlanmış sayılır; kalan süre için ek görüşme hakkı doğmaz.`
    : `${asker} Kabul edersen görüşme biter; raporu yine sen hazırlarsın.`;
}

/** The title of the question put to the one who is asked. */
export function earlyEndIncomingTitle(role: PostSessionRoleName, otherName: string | null | undefined): string {
  return `${otherLabel(role, otherName)} görüşmeyi bitirmek istiyor`;
}

/** What the sentence "waiting" says to the asker. */
export function earlyEndWaitingText(otherName: string | null | undefined, role?: PostSessionRoleName): string {
  return `${otherLabel(role, otherName)} kabul ederse görüşme tamamlanmış sayılır. Cevap gelene kadar görüşme sürüyor.`;
}

/** What the sentence "the other side is asking" says in the panel. */
export function earlyEndIncomingLine(otherName: string | null | undefined, role: PostSessionRoleName): string {
  return `${otherLabel(role, otherName)} görüşmeyi bitirmek istiyor. Yanıtını bekliyor.`;
}

const RUNNING: ReadonlySet<CoachingSessionStatus> = new Set<CoachingSessionStatus>(["scheduled", "in_progress"]);

/**
 * How often to read the live state again, or false to stop. It stops once the
 * meeting is no longer running and for good when the server says the feature is
 * off (403) or not there (404); any other failure is a bad moment on the line,
 * and the next turn tries again.
 */
export function liveStatePollMs({
  status,
  errorStatus,
}: {
  status: CoachingSessionStatus | undefined;
  errorStatus: number | null;
}): number | false {
  if (errorStatus === 403 || errorStatus === 404) return false;
  if (status !== undefined && !RUNNING.has(status)) return false;
  return EARLY_END_POLL_MS;
}

/** An accepted end has moved the meeting on: both sides go to the screen after it. */
export function shouldLeaveForSummary(live: CoachingLiveState | undefined): boolean {
  return live?.early_end?.status === "accepted" && !RUNNING.has(live.status);
}
