import { readJson, removeKey, writeJson, type StorageLike } from "@/lib/safeStorage";
import type { MatchingPreview } from "@/types";
import type {
  HocaBulApiAnswers,
  HocaBulPreviewCacheEntry,
} from "@/types/hocaBul";

/**
 * A short-lived, tab-scoped cache for POST /matching/preview/ responses.
 *
 * React Query alone cannot satisfy "reloading the results must not re-submit":
 * its cache dies with the page. sessionStorage survives the reload, keeps the
 * data out of other tabs, and disappears when the tab closes. The endpoint is
 * also throttled at 60/hour server-side, so avoiding pointless repeats matters.
 */

export const HOCA_BUL_PREVIEW_KEY_PREFIX = "hocam:hoca-bul-preview:v1";
export const HOCA_BUL_PREVIEW_TTL_MS = 15 * 60 * 1000;

/**
 * Exactly the fields that identify a request. yks_alan, the current step,
 * timestamps, UI state, tokens and analytics are all excluded by construction —
 * they are not read here at all.
 */
const HASHED_FIELDS = [
  "goal",
  "stage",
  "subject_keys",
  "challenges",
  "teaching_styles",
  "availability_windows",
  "budget_segment",
  "schema_version",
] as const;

/** Code-point order, never locale-aware: the server treats these arrays as sets. */
function sortValues(values: string[]): string[] {
  return [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function canonicalizeAnswers(answers: HocaBulApiAnswers): string {
  const canonical: Record<string, unknown> = {};
  for (const field of HASHED_FIELDS) {
    const value = answers[field];
    canonical[field] = Array.isArray(value) ? sortValues(value) : value;
  }
  return JSON.stringify(canonical);
}

/**
 * FNV-1a, hex, suffixed with the canonical length. Synchronous and
 * dependency-free; a collision cannot serve wrong data because the canonical
 * string is stored in the entry and re-compared on read.
 */
export function hashCanonical(canonical: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `${hash.toString(16).padStart(8, "0")}-${canonical.length}`;
}

export function hashAnswers(answers: HocaBulApiAnswers): string {
  return hashCanonical(canonicalizeAnswers(answers));
}

export function previewCacheKey(userId: string, answerHash: string): string {
  return `${HOCA_BUL_PREVIEW_KEY_PREFIX}:${userId}:${answerHash}`;
}

function isPreviewResponse(value: unknown): value is MatchingPreview {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MatchingPreview>;
  return (
    Array.isArray(candidate.matches) &&
    typeof candidate.candidate_count === "number"
  );
}

export function parsePreviewEntry(
  raw: unknown,
  userId: string,
  canonical: string,
  now: number
): HocaBulPreviewCacheEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Partial<HocaBulPreviewCacheEntry>;
  if (entry.schemaVersion !== 1) return null;
  if (entry.userId !== userId) return null;
  if (entry.canonical !== canonical) return null;
  if (typeof entry.createdAt !== "number") return null;
  if (now - entry.createdAt > HOCA_BUL_PREVIEW_TTL_MS) return null;
  if (!isPreviewResponse(entry.response)) return null;
  return entry as HocaBulPreviewCacheEntry;
}

export function readPreview(
  storage: StorageLike | null,
  userId: string | undefined | null,
  answers: HocaBulApiAnswers,
  now = Date.now()
): MatchingPreview | null {
  if (!userId) return null;
  const canonical = canonicalizeAnswers(answers);
  const key = previewCacheKey(userId, hashCanonical(canonical));
  const entry = parsePreviewEntry(readJson(storage, key), userId, canonical, now);
  if (!entry) {
    removeKey(storage, key);
    return null;
  }
  return entry.response;
}

export function writePreview(
  storage: StorageLike | null,
  userId: string | undefined | null,
  answers: HocaBulApiAnswers,
  response: MatchingPreview,
  now = Date.now()
): boolean {
  if (!userId) return false;
  const canonical = canonicalizeAnswers(answers);
  const answerHash = hashCanonical(canonical);
  const entry: HocaBulPreviewCacheEntry = {
    schemaVersion: 1,
    userId,
    answerHash,
    canonical,
    createdAt: now,
    response,
  };
  return writeJson(storage, previewCacheKey(userId, answerHash), entry);
}

export function invalidatePreview(
  storage: StorageLike | null,
  userId: string | undefined | null,
  answers: HocaBulApiAnswers
): void {
  if (!userId) return;
  removeKey(storage, previewCacheKey(userId, hashAnswers(answers)));
}

/** Shared by the review step and the results route so both behave identically. */
const inFlight = new Map<string, Promise<MatchingPreview>>();

export interface GetOrFetchPreviewArgs {
  storage: StorageLike | null;
  userId: string | undefined | null;
  answers: HocaBulApiAnswers;
  fetcher: (answers: HocaBulApiAnswers) => Promise<MatchingPreview>;
  now?: number;
  /** Retry always goes to the network and overwrites the entry, whatever the TTL says. */
  bypassCache?: boolean;
}

export async function getOrFetchPreview({
  storage,
  userId,
  answers,
  fetcher,
  now = Date.now(),
  bypassCache = false,
}: GetOrFetchPreviewArgs): Promise<{
  preview: MatchingPreview;
  servedFromCache: boolean;
}> {
  if (!bypassCache) {
    const cached = readPreview(storage, userId, answers, now);
    if (cached) return { preview: cached, servedFromCache: true };
  }

  const dedupeKey = `${userId ?? "anon"}:${hashAnswers(answers)}`;
  const pending = !bypassCache ? inFlight.get(dedupeKey) : undefined;
  if (pending) return { preview: await pending, servedFromCache: false };

  const request = fetcher(answers).finally(() => {
    inFlight.delete(dedupeKey);
  });
  inFlight.set(dedupeKey, request);

  const preview = await request;
  writePreview(storage, userId, answers, preview, Date.now());
  return { preview, servedFromCache: false };
}

/** Test seam: the in-flight map is module state and must not leak between cases. */
export function resetInFlightPreviews(): void {
  inFlight.clear();
}
