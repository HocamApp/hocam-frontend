import assert from "node:assert/strict";
import { test } from "node:test";

import { createMemoryStorage } from "@/lib/safeStorage";
import {
  TOUR_GAPS_DAYS,
  TOUR_MAX_SHOWS,
  acknowledgedPatch,
  decideTour,
  mergeHints,
  parseUiHints,
  pendingTourSteps,
  readLocalHints,
  shownPatch,
  uiHintsStorageKey,
  writeLocalHints,
  type UiHintKey,
  type UiHints,
} from "@/lib/tutorSetupHints";
import type { AvailabilityRule, TutorPackageOffer } from "@/types";

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.parse("2026-10-17T10:00:00Z");

const rule = (overrides: Partial<AvailabilityRule> = {}): AvailabilityRule => ({
  id: "r", tutor: "t", day_of_week: 0, start_time: "09:00:00", end_time: "10:00:00", created_at: "", ...overrides,
});
const offer = (overrides: Partial<TutorPackageOffer> = {}): TutorPackageOffer => ({
  plan_id: "p", plan_name: "P", plan_code: null, lesson_count: 4, lesson_duration_minutes: 40,
  lessons_per_week: 1, duration_days: 28, catalog_discount_percent: 0, is_offered: true,
  discount_percent: null, effective_discount_percent: 0, max_discount_percent: 40, ...overrides,
});

const afterFirstShow = (shown: number, lastShownAt: number, acknowledged = true): UiHints => ({
  tutor_dashboard_tour: {
    shown_count: shown,
    last_shown_at: new Date(lastShownAt).toISOString(),
    ...(acknowledged ? { acknowledged_at: new Date(lastShownAt).toISOString() } : {}),
  },
});

test("pending steps follow the tutor's data, packages first, and never include bookings", () => {
  assert.deepEqual(pendingTourSteps({ rules: [], offers: [offer()], hints: {} }), ["packages", "availability"]);
  assert.deepEqual(pendingTourSteps({ rules: [rule()], offers: [offer()], hints: {} }), ["packages"]);
  assert.deepEqual(pendingTourSteps({ rules: [], offers: [offer({ discount_percent: 10 })], hints: {} }), ["availability"]);
  assert.deepEqual(pendingTourSteps({ rules: [rule()], offers: [offer({ is_offered: false })], hints: {} }), []);
});

test("a closed day is not availability", () => {
  assert.deepEqual(
    pendingTourSteps({ rules: [rule({ is_unavailable: true })], offers: [offer({ discount_percent: 5 })], hints: {} }),
    ["availability"],
  );
});

test("reviewing the packages page counts as configured even when nothing changed", () => {
  const hints: UiHints = { tutor_packages_reviewed: { completed_at: new Date(T0).toISOString() } };
  assert.deepEqual(pendingTourSteps({ rules: [], offers: [offer()], hints }), ["availability"]);
});

test("the first tour is the same three stops for everyone, even before the data has loaded", () => {
  const all = { show: true, forced: true, steps: ["bookings", "packages", "availability"] };
  assert.deepEqual(decideTour({ hints: {}, pending: null, now: T0 }), all);
  assert.deepEqual(decideTour({ hints: {}, pending: [], now: T0 }), all, "a tutor with nothing left to do still gets the orientation");
  assert.deepEqual(decideTour({ hints: {}, pending: ["packages"], now: T0 }), all);
});

test("the superseded v1 record is ignored: its owners get the new tour once", () => {
  const hints: UiHints = {
    tutor_setup_tour: { shown_count: 3, last_shown_at: new Date(T0).toISOString(), acknowledged_at: new Date(T0).toISOString() },
  };
  assert.equal(decideTour({ hints, pending: [], now: T0 }).show, true);
});

test("a tour closed without pressing the button stays the full mandatory tour and does not advance the schedule", () => {
  const hints = afterFirstShow(1, T0 - 10 * DAY, false);
  assert.deepEqual(decideTour({ hints, pending: ["availability"], now: T0 }), {
    show: true, forced: true, steps: ["bookings", "packages", "availability"],
  });
});

test("a reminder contains only the work that is still open", () => {
  const hints = afterFirstShow(1, T0 - DAY);
  assert.deepEqual(decideTour({ hints, pending: ["availability"], now: T0 }), { show: true, forced: false, steps: ["availability"] });
  assert.deepEqual(decideTour({ hints, pending: ["packages", "availability"], now: T0 }), { show: true, forced: false, steps: ["packages", "availability"] });
});

test("a reminder says nothing when there is no open work or the data has not loaded", () => {
  const hints = afterFirstShow(1, T0 - 30 * DAY);
  assert.deepEqual(decideTour({ hints, pending: [], now: T0 }), { show: false });
  assert.deepEqual(decideTour({ hints, pending: null, now: T0 }), { show: false });
});

test("after acknowledgement it waits 1, 3, 7 then 14 days", () => {
  TOUR_GAPS_DAYS.forEach((days, index) => {
    const shown = index + 1;
    const last = T0 - days * DAY;
    assert.equal(decideTour({ hints: afterFirstShow(shown, last + 1000), pending: ["availability"], now: T0 }).show, false, `show ${shown} one second early`);
    const ready = decideTour({ hints: afterFirstShow(shown, last), pending: ["availability"], now: T0 });
    assert.deepEqual(ready, { show: true, forced: false, steps: ["availability"] }, `show ${shown} on the day`);
  });
});

test("it stops after the last allowed showing", () => {
  const hints = afterFirstShow(TOUR_MAX_SHOWS, T0 - 365 * DAY);
  assert.deepEqual(decideTour({ hints, pending: ["availability"], now: T0 }), { show: false });
});

test("a timestamp from the future waits instead of showing", () => {
  assert.equal(decideTour({ hints: afterFirstShow(2, T0 + DAY), pending: ["availability"], now: T0 }).show, false);
});

test("a missing last_shown_at after acknowledgement does not lock the tour forever", () => {
  const hints: UiHints = { tutor_dashboard_tour: { shown_count: 2, acknowledged_at: new Date(T0).toISOString() } };
  assert.equal(decideTour({ hints, pending: ["availability"], now: T0 }).show, true);
});

test("every hint key the app writes survives parsing, or its bubble would come back on every visit", () => {
  const keys: UiHintKey[] = [
    "tutor_dashboard_tour", "tutor_chat_hint", "tutor_intro_classroom", "tutor_intro_calendar",
    "tutor_intro_coaching", "tutor_packages_hint", "tutor_availability_hint", "tutor_packages_reviewed",
  ];
  const raw = Object.fromEntries(keys.map((key) => [key, { acknowledged_at: "2026-10-17T10:00:00Z" }]));
  const parsed = parseUiHints(raw) ?? {};
  for (const key of keys) assert.equal(parsed[key]?.acknowledged_at, "2026-10-17T10:00:00Z", key);
  assert.deepEqual(Object.keys(mergeHints(parsed, {})).sort(), [...keys].sort());
});

test("patches count the showing and stamp the acknowledgement", () => {
  const first = shownPatch({}, T0);
  assert.equal(first.shown_count, 1);
  assert.equal(first.last_shown_at, new Date(T0).toISOString());
  assert.equal(shownPatch({ tutor_dashboard_tour: first }, T0 + DAY).shown_count, 2);
  assert.equal(acknowledgedPatch(T0).acknowledged_at, new Date(T0).toISOString());
});

test("parsing rejects non-objects and drops malformed fields", () => {
  assert.equal(parseUiHints(undefined), null);
  assert.equal(parseUiHints([]), null);
  assert.deepEqual(parseUiHints({}), {});
  assert.deepEqual(
    parseUiHints({ tutor_setup_tour: { shown_count: 2.7, last_shown_at: "nope", acknowledged_at: "2026-10-17T10:00:00Z", extra: 1 }, other: {} }),
    { tutor_setup_tour: { shown_count: 2, acknowledged_at: "2026-10-17T10:00:00Z" } },
  );
});

test("merging keeps the larger count and the later timestamp from either side", () => {
  const server: UiHints = { tutor_setup_tour: { shown_count: 1, last_shown_at: "2026-10-10T10:00:00Z" } };
  const local: UiHints = { tutor_setup_tour: { shown_count: 2, last_shown_at: "2026-10-12T10:00:00Z", acknowledged_at: "2026-10-12T10:01:00Z" } };
  assert.deepEqual(mergeHints(server, local).tutor_setup_tour, {
    shown_count: 2, last_shown_at: "2026-10-12T10:00:00Z", acknowledged_at: "2026-10-12T10:01:00Z",
  });
});

test("the local mirror is per user and survives unreadable storage", () => {
  const storage = createMemoryStorage();
  writeLocalHints(storage, "u1", { tutor_setup_tour: { shown_count: 1 } });
  assert.deepEqual(readLocalHints(storage, "u1"), { tutor_setup_tour: { shown_count: 1 } });
  assert.deepEqual(readLocalHints(storage, "u2"), {});
  assert.equal(uiHintsStorageKey("u1"), "hocam:ui-hints:v1:u1");
  assert.deepEqual(readLocalHints(null, "u1"), {});
  writeLocalHints(null, "u1", {});
});
