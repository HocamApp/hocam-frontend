import {
  readJson,
  removeKey,
  writeJson,
  type StorageLike,
} from "@/lib/safeStorage";

/**
 * The breadcrumb a PayTR attempt leaves behind, so the browser can find its way
 * back after the provider redirects to /odeme/basarili or /odeme/basarisiz —
 * neither of which carries a purchase id.
 *
 * It holds four non-personal fields and nothing else. The customer's name,
 * phone and address, the iframe URL and its short-lived token never reach
 * storage, logs or analytics; the record only says *which* purchase to ask the
 * server about. Ownership is re-verified against the backend every time, so a
 * forged or stale record cannot show one student another's package, and it is
 * never evidence that a payment succeeded or failed.
 *
 * sessionStorage, not localStorage: the attempt belongs to this tab and should
 * disappear with it.
 */
export interface PayTRRecoveryRecord {
  schemaVersion: 1;
  purchaseId: string;
  /** Null between opening the record and the token response naming the OID. */
  merchantOid: string | null;
  tutorId: string;
  /** Epoch ms. Age is context for support, never proof of an outcome. */
  startedAt: number;
}

export const PAYTR_RECOVERY_KEY_PREFIX = "hocam:paytr-attempt:v1";

/** One active attempt per account: a second login in the same tab reads its
 * own key and finds nothing, rather than inheriting the previous student's. */
export function payTRRecoveryKey(userId: string): string {
  return `${PAYTR_RECOVERY_KEY_PREFIX}:${userId}`;
}

export interface BeginPayTRRecoveryArgs {
  purchaseId: string;
  tutorId: string;
  startedAt: number;
}

function parseRecord(raw: unknown): PayTRRecoveryRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<PayTRRecoveryRecord>;
  if (candidate.schemaVersion !== 1) return null;
  if (typeof candidate.purchaseId !== "string" || !candidate.purchaseId) return null;
  if (typeof candidate.tutorId !== "string" || !candidate.tutorId) return null;
  if (typeof candidate.startedAt !== "number" || !Number.isFinite(candidate.startedAt) || candidate.startedAt < 0) return null;
  if (candidate.merchantOid != null && typeof candidate.merchantOid !== "string") {
    return null;
  }
  return {
    schemaVersion: 1,
    purchaseId: candidate.purchaseId,
    merchantOid: candidate.merchantOid ?? null,
    tutorId: candidate.tutorId,
    startedAt: candidate.startedAt,
  };
}

/**
 * Opens the record *before* the token POST. A response that never arrives is
 * the case this exists for: without the breadcrumb, a lost reply would leave
 * an attempt nobody can trace.
 */
export function beginPayTRRecovery(
  storage: StorageLike | null,
  userId: string | undefined | null,
  attempt: BeginPayTRRecoveryArgs
): boolean {
  if (!userId) return false;
  // Field by field, so a caller passing a whole form object cannot widen what
  // gets persisted.
  const record: PayTRRecoveryRecord = {
    schemaVersion: 1,
    purchaseId: attempt.purchaseId,
    merchantOid: null,
    tutorId: attempt.tutorId,
    startedAt: attempt.startedAt,
  };
  return writeJson(storage, payTRRecoveryKey(userId), record);
}

/** Adds the OID the token response named, and only to the record that is
 * still about that same purchase. */
export function attachMerchantOid(
  storage: StorageLike | null,
  userId: string | undefined | null,
  purchaseId: string,
  merchantOid: string
): boolean {
  if (!userId) return false;
  const existing = readPayTRRecovery(storage, userId);
  if (!existing || existing.purchaseId !== purchaseId) return false;
  return writeJson(storage, payTRRecoveryKey(userId), {
    ...existing,
    merchantOid,
  });
}

/** Returns the record, or null for a missing, unreadable, corrupt or
 * foreign-shaped one — and clears what it refused to trust. */
export function readPayTRRecovery(
  storage: StorageLike | null,
  userId: string | undefined | null
): PayTRRecoveryRecord | null {
  if (!userId) return null;
  const key = payTRRecoveryKey(userId);
  const record = parseRecord(readJson(storage, key));
  if (!record) {
    removeKey(storage, key);
    return null;
  }
  return record;
}

/**
 * Only for a final server-confirmed result or a deliberate "close this" from
 * the student. Landing on Paketlerim is not, by itself, abandoning recovery.
 */
export function clearPayTRRecovery(
  storage: StorageLike | null,
  userId: string | undefined | null,
  purchaseId?: string
): void {
  if (!userId) return;
  if (purchaseId && readPayTRRecovery(storage, userId)?.purchaseId !== purchaseId) return;
  removeKey(storage, payTRRecoveryKey(userId));
}
