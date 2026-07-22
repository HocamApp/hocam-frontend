/**
 * Pure helpers for in-lesson join/leave toasts. No React, no I/O — the parsing,
 * self-exclusion, duplicate/reconnect suppression and Turkish message building
 * are unit-tested directly; the page only wires these to sonner.
 *
 * Official Jitsi iframe events used by the caller:
 *   participantJoined → { id, displayName }
 *   participantLeft   → { id }
 *   videoConferenceJoined → { id } (the local participant)
 */

export function parseParticipantJoined(
  event: unknown
): { id: string; displayName?: string } | null {
  if (!event || typeof event !== "object") return null;
  const id = (event as { id?: unknown }).id;
  if (typeof id !== "string" || !id) return null;
  const displayName = (event as { displayName?: unknown }).displayName;
  return {
    id,
    displayName: typeof displayName === "string" ? displayName : undefined,
  };
}

export function parseParticipantLeft(event: unknown): { id: string } | null {
  if (!event || typeof event !== "object") return null;
  const id = (event as { id?: unknown }).id;
  if (typeof id !== "string" || !id) return null;
  return { id };
}

export function joinMessage(displayName?: string | null): string {
  const name = displayName?.trim();
  return name ? `${name} derse katıldı.` : "Bir katılımcı derse katıldı.";
}

export function leaveMessage(displayName?: string | null): string {
  const name = displayName?.trim();
  return name ? `${name} dersten ayrıldı.` : "Bir katılımcı dersten ayrıldı.";
}

/**
 * Tracks who is present so join/leave toasts fire exactly once per real
 * transition. `seen` maps a remote participant id to its last known name; the
 * local id is excluded so a user never sees a toast for themselves. Kept outside
 * the Jitsi api instance so an iframe remount / reconnect (which re-fires
 * participantJoined for already-present peers) does not re-toast.
 */
export interface PresenceTracker {
  localId: string | null;
  seen: Map<string, string | undefined>;
}

export function createPresenceTracker(): PresenceTracker {
  return { localId: null, seen: new Map() };
}

export function setLocalParticipant(tracker: PresenceTracker, id: string | null): void {
  tracker.localId = id;
}

/** Records a join; returns the toast message, or null (self / already present). */
export function handleJoin(
  tracker: PresenceTracker,
  id: string,
  displayName?: string
): string | null {
  if (id === tracker.localId) return null;
  if (tracker.seen.has(id)) {
    // Reconnect / duplicate: refresh the name but don't re-toast.
    tracker.seen.set(id, displayName ?? tracker.seen.get(id));
    return null;
  }
  tracker.seen.set(id, displayName);
  return joinMessage(displayName);
}

/** Records a leave; returns the toast message, or null (self / never seen). */
export function handleLeave(tracker: PresenceTracker, id: string): string | null {
  if (id === tracker.localId) return null;
  if (!tracker.seen.has(id)) return null;
  const displayName = tracker.seen.get(id);
  tracker.seen.delete(id);
  return leaveMessage(displayName);
}
