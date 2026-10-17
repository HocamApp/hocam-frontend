import { readJson, writeJson, type StorageLike } from "@/lib/safeStorage";
import type { AvailabilityRule, TutorPackageOffer } from "@/types";

/**
 * Policy for the "set up your tutor account" hints: when the Panom tour opens,
 * which steps it contains and when it has said enough.
 *
 * Pure functions over plain data and an injected clock, the same shape as
 * `homeEntryPromo.ts`, so the schedule is tested without a browser or timers.
 *
 * The schedule is the conventional one for a product tour:
 *
 * - **First sight is mandatory.** Until the tutor presses the button once, the
 *   tour comes back on every visit and cannot be dismissed any other way.
 * - **Then it backs off.** Each further showing waits longer than the last
 *   (1, 3, 7, 14 days) and the tour stops after five in total. A reminder that
 *   never ends is how people learn to ignore a surface.
 * - **It stops when the work is done.** The steps are derived from the tutor's
 *   own data, so a tutor who adds availability loses that step without
 *   anything having to be "completed" explicitly.
 */

export type UiHintKey =
  | "tutor_setup_tour"
  | "tutor_packages_hint"
  | "tutor_availability_hint"
  | "tutor_packages_reviewed";

/** A type alias, not an interface, so it stays assignable to the API's plain-object preference value. */
export type UiHintRecord = {
  shown_count?: number;
  /** ISO timestamp. */
  last_shown_at?: string;
  acknowledged_at?: string;
  completed_at?: string;
};

export type UiHints = Partial<Record<UiHintKey, UiHintRecord>>;

export type TourStep = "packages" | "availability";

/** Days to wait after showing number n (1-based) before showing again. */
export const TOUR_GAPS_DAYS = [1, 3, 7, 14] as const;
/** First showing plus one per gap. */
export const TOUR_MAX_SHOWS = TOUR_GAPS_DAYS.length + 1;

const DAY_MS = 24 * 60 * 60 * 1000;
const HINT_KEYS: readonly UiHintKey[] = [
  "tutor_setup_tour",
  "tutor_packages_hint",
  "tutor_availability_hint",
  "tutor_packages_reviewed",
];

export function hasAvailability(rules: readonly AvailabilityRule[]): boolean {
  return rules.some((rule) => !rule.is_unavailable);
}

/**
 * Package offers are stored sparsely and default to "offered", so an untouched
 * tutor already sells every plan. The server can only tell that someone changed
 * something; "looked and kept the defaults" is recorded by the packages page
 * as `tutor_packages_reviewed`.
 */
export function packagesConfigured(
  offers: readonly TutorPackageOffer[],
  hints: UiHints,
): boolean {
  if (hints.tutor_packages_reviewed?.completed_at) return true;
  return offers.some((offer) => offer.discount_percent !== null || !offer.is_offered);
}

export function pendingTourSteps(input: {
  rules: readonly AvailabilityRule[];
  offers: readonly TutorPackageOffer[];
  hints: UiHints;
}): TourStep[] {
  const steps: TourStep[] = [];
  if (!packagesConfigured(input.offers, input.hints)) steps.push("packages");
  if (!hasAvailability(input.rules)) steps.push("availability");
  return steps;
}

export type TourDecision =
  | { show: false }
  | { show: true; forced: boolean; steps: TourStep[] };

export function decideTour(input: {
  hints: UiHints;
  steps: readonly TourStep[];
  now?: number;
}): TourDecision {
  const { hints, steps, now = Date.now() } = input;
  if (steps.length === 0) return { show: false };

  const record = hints.tutor_setup_tour;
  const shown = record?.shown_count ?? 0;

  if (shown === 0 || !record?.acknowledged_at) {
    return { show: true, forced: true, steps: [...steps] };
  }
  if (shown >= TOUR_MAX_SHOWS) return { show: false };

  const last = Date.parse(record.last_shown_at ?? "");
  if (!Number.isFinite(last)) return { show: true, forced: false, steps: [...steps] };

  const gapDays = TOUR_GAPS_DAYS[Math.min(shown, TOUR_GAPS_DAYS.length) - 1];
  const age = now - last;
  // A clock that moved backwards leaves a future timestamp: wait, do not nag.
  if (age < gapDays * DAY_MS) return { show: false };

  return { show: true, forced: false, steps: [...steps] };
}

/** The record that results from showing the tour once more. */
export function shownPatch(hints: UiHints, now: number = Date.now()): UiHintRecord {
  return {
    shown_count: (hints.tutor_setup_tour?.shown_count ?? 0) + 1,
    last_shown_at: new Date(now).toISOString(),
  };
}

export function acknowledgedPatch(now: number = Date.now()): UiHintRecord {
  return { acknowledged_at: new Date(now).toISOString() };
}

export function completedPatch(now: number = Date.now()): UiHintRecord {
  return { completed_at: new Date(now).toISOString() };
}

/* ---------- parsing and merging (server value and local mirror) ---------- */

function parseRecord(raw: unknown): UiHintRecord | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  const record: UiHintRecord = {};
  if (typeof source.shown_count === "number" && Number.isFinite(source.shown_count)) {
    record.shown_count = Math.max(0, Math.floor(source.shown_count));
  }
  for (const field of ["last_shown_at", "acknowledged_at", "completed_at"] as const) {
    const value = source[field];
    if (typeof value === "string" && Number.isFinite(Date.parse(value))) record[field] = value;
  }
  return record;
}

/** Returns null when the value is not a hints object at all (field missing, wrong shape). */
export function parseUiHints(raw: unknown): UiHints | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  const hints: UiHints = {};
  for (const key of HINT_KEYS) {
    const record = parseRecord(source[key]);
    if (record) hints[key] = record;
  }
  return hints;
}

function later(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

/** Field-wise union: counts take the larger value, timestamps the later one. */
export function mergeRecords(a: UiHintRecord = {}, b: UiHintRecord = {}): UiHintRecord {
  const merged: UiHintRecord = {};
  const count = Math.max(a.shown_count ?? 0, b.shown_count ?? 0);
  if (a.shown_count !== undefined || b.shown_count !== undefined) merged.shown_count = count;
  for (const field of ["last_shown_at", "acknowledged_at", "completed_at"] as const) {
    const value = later(a[field], b[field]);
    if (value) merged[field] = value;
  }
  return merged;
}

export function mergeHints(a: UiHints, b: UiHints): UiHints {
  const merged: UiHints = {};
  for (const key of HINT_KEYS) {
    if (a[key] || b[key]) merged[key] = mergeRecords(a[key], b[key]);
  }
  return merged;
}

/* ---------- local mirror ---------- */

/** Per-user so two tutors sharing a browser do not share a tour. Listed in browserStorageInventory. */
export const UI_HINTS_STORAGE_PREFIX = "hocam:ui-hints:v1:";

export function uiHintsStorageKey(userId: string): string {
  return `${UI_HINTS_STORAGE_PREFIX}${userId}`;
}

export function readLocalHints(storage: StorageLike | null, userId: string): UiHints {
  return parseUiHints(readJson(storage, uiHintsStorageKey(userId))) ?? {};
}

export function writeLocalHints(storage: StorageLike | null, userId: string, hints: UiHints): void {
  writeJson(storage, uiHintsStorageKey(userId), hints);
}
