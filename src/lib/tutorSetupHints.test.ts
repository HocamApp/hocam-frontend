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
  tutor_setup_tour: {
    shown_count: shown,
    last_shown_at: new Date(lastShownAt).toISOString(),
    ...(acknowledged ? { acknowledged_at: new Date(lastShownAt).toISOString() } : {}),
  },
});

test("steps follow the tutor's data, packages first", () => {
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

test("nothing to do means no tour", () => {
  assert.deepEqual(decideTour({ hints: {}, steps: [], now: T0 }), { show: false });
});

test("first sight is mandatory", () => {
  assert.deepEqual(decideTour({ hints: {}, steps: ["packages", "availability"], now: T0 }), {
    show: true, forced: true, steps: ["packages", "availability"],
  });
});

test("a tour closed without pressing the button stays mandatory and does not advance the schedule", () => {
  const hints = afterFirstShow(1, T0 - 10 * DAY, false);
  const decision = decideTour({ hints, steps: ["availability"], now: T0 });
  assert.deepEqual(decision, { show: true, forced: true, steps: ["availability"] });
});

test("after acknowledgement it waits 1, 3, 7 then 14 days", () => {
  TOUR_GAPS_DAYS.forEach((days, index) => {
    const shown = index + 1;
    const last = T0 - days * DAY;
    assert.equal(decideTour({ hints: afterFirstShow(shown, last + 1000), steps: ["availability"], now: T0 }).show, false, `show ${shown} one second early`);
    const ready = decideTour({ hints: afterFirstShow(shown, last), steps: ["availability"], now: T0 });
    assert.deepEqual(ready, { show: true, forced: false, steps: ["availability"] }, `show ${shown} on the day`);
  });
});

test("it stops after the last allowed showing", () => {
  const hints = afterFirstShow(TOUR_MAX_SHOWS, T0 - 365 * DAY);
  assert.deepEqual(decideTour({ hints, steps: ["availability"], now: T0 }), { show: false });
});

test("a timestamp from the future waits instead of showing", () => {
  assert.equal(decideTour({ hints: afterFirstShow(2, T0 + DAY), steps: ["availability"], now: T0 }).show, false);
});

test("a missing last_shown_at after acknowledgement does not lock the tour forever", () => {
  const hints: UiHints = { tutor_setup_tour: { shown_count: 2, acknowledged_at: new Date(T0).toISOString() } };
  assert.equal(decideTour({ hints, steps: ["availability"], now: T0 }).show, true);
});

test("patches count the showing and stamp the acknowledgement", () => {
  const first = shownPatch({}, T0);
  assert.equal(first.shown_count, 1);
  assert.equal(first.last_shown_at, new Date(T0).toISOString());
  assert.equal(shownPatch({ tutor_setup_tour: first }, T0 + DAY).shown_count, 2);
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
