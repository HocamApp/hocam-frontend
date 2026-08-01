/**
 * Permanent QA harness for the /hoca-bul feature.
 *
 *   npm run hoca-bul:qa
 *
 * One run boots two dev servers of its own — one with
 * NEXT_PUBLIC_HOCA_BUL_ENABLED=true and one without — and drives the real
 * routes through the real components:
 *
 *   /home  (HocaBulEntryCard)   /hoca-bul  (wizard)   /hoca-bul/sonuclar
 *
 * Captures land in `screenshots/hoca-bul-qa/` (gitignored).
 *
 * What it asserts, and fails loudly on, includes the complete goal matrix,
 * entry/restoration/auth/error/result/navigation/analytics contracts, keyboard
 * focus, 375x667 / 375 / 768 / 1280 responsive states, light/dark/reduced
 * motion, overflow, console/hydration/resource failures, and browser performance
 * observers. Named screenshots, video, trace and JSON evidence are written below.
 *
 * Scope boundary. This harness covers layout, theming, reduced motion and
 * deterministic failure states, so its API responses are fixtures. That is the
 * only thing fixtures are for here. They are deliberately labelled as fixtures
 * ("QA Fixture A"), never plausible tutors, and nothing in the app is stubbed or
 * bypassed — every pixel is produced by the production components. Matching
 * correctness, ranking, real supply and real prices are covered by the separate
 * real-API pass against the local Django backend, not by this file.
 */
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Locator,
  type Page,
  type Request,
} from "playwright";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { lstat, mkdir, mkdtemp, readdir, rename, rm, writeFile } from "node:fs/promises";
import { strict as assert } from "node:assert";
import path from "node:path";

import {
  canonicalizeAnswers,
  hashAnswers,
  HOCA_BUL_PREVIEW_KEY_PREFIX,
  HOCA_BUL_PREVIEW_TTL_MS,
} from "../src/lib/hocaBulPreviewCache";
import { HOCA_BUL_DRAFT_KEY_PREFIX, HOCA_BUL_DRAFT_TTL_MS } from "../src/lib/hocaBulDraft";
import { safeReturnUrl } from "../src/lib/utils";
import type { MatchingAnswers } from "../src/types";

const ROOT = process.cwd();
const SCREENSHOTS_DIR = path.join(ROOT, "screenshots");
const FINAL_OUT_DIR = path.join(SCREENSHOTS_DIR, "hoca-bul-qa");
const RUNS_DIR = path.join(SCREENSHOTS_DIR, ".hoca-bul-qa-runs");
let OUT_DIR = FINAL_OUT_DIR;
const FLAG_ON_PORT = Number(process.env.HOCA_BUL_QA_PORT ?? 3142);
const FLAG_OFF_PORT = FLAG_ON_PORT + 1;
const SETTLE_MS = 900;

const USER_ID = "qa-student-1";
const SWITCHED_USER_ID = "qa-student-2";
const CARD = 'section[aria-labelledby="hoca-bul-entry-title"]';

const failures: string[] = [];
const notes: string[] = [];
const performanceEvidence: Array<Record<string, unknown>> = [];
const networkEvidence: Array<Record<string, unknown>> = [];
const analyticsEvidence: Array<Record<string, unknown>> = [];

const ANALYTICS_ALLOWED_PROPERTIES: Record<string, readonly string[]> = {
  hoca_bul_started: ["goal", "entry"],
  hoca_bul_step_completed: ["step_id", "index", "total"],
  hoca_bul_step_back: ["step_id"],
  hoca_bul_abandoned: ["step_id", "reason"],
  hoca_bul_submitted: ["goal", "subject_count", "served_from_cache"],
  hoca_bul_results_viewed: ["match_count", "candidate_count", "has_relaxed"],
  hoca_bul_result_opened: ["tutor_id", "position", "match_level"],
  hoca_bul_all_tutors_clicked: ["candidate_count"],
  hoca_bul_no_results: ["goal"],
  home_matching_started: ["goal", "state"],
};
const KNOWN_NON_HOCA_ANALYTICS_EVENTS = new Set(["authenticated_home_viewed"]);

type AnalyticsEventClassification =
  | "hoca"
  | "known-non-hoca"
  | "unknown-hoca"
  | "unknown-non-hoca";

function classifyAnalyticsEvent(event: string): AnalyticsEventClassification {
  if (event in ANALYTICS_ALLOWED_PROPERTIES) return "hoca";
  if (KNOWN_NON_HOCA_ANALYTICS_EVENTS.has(event)) return "known-non-hoca";
  if (event.startsWith("hoca_bul_") || event.startsWith("home_matching_")) return "unknown-hoca";
  return "unknown-non-hoca";
}

function fail(message: string) {
  failures.push(message);
  console.log(`FAIL  ${message}`);
}

function ok(message: string) {
  console.log(`ok    ${message}`);
}

async function runHarnessInvariantChecks(): Promise<void> {
  assert.equal(classifyAnalyticsEvent("hoca_bul_future_event"), "unknown-hoca");
  assert.equal(classifyAnalyticsEvent("home_matching_future_event"), "unknown-hoca");
  assert.equal(classifyAnalyticsEvent("authenticated_home_viewed"), "known-non-hoca");
  assert.equal(classifyAnalyticsEvent("unregistered_site_event"), "unknown-non-hoca");
  assert.equal(safeReturnUrl("/hoca-bul/sonuclar"), "/hoca-bul/sonuclar");
  assert.equal(safeReturnUrl("https://example.invalid/hoca-bul"), null);
  assert.equal(safeReturnUrl("//example.invalid/hoca-bul"), null);
  assert.equal(safeReturnUrl("/\\example.invalid/hoca-bul"), null);

  const calls: string[] = [];
  const evidenceError = new Error("synthetic evidence failure");
  const finalFatalError = await finalizeEvidence(null, {
    writeEvidence: async () => {
      calls.push("evidence");
      throw evidenceError;
    },
    recordEvidenceFailure: (error) => {
      assert.equal(error, evidenceError);
      calls.push("failure");
    },
    writeManifest: async (fatalError) => {
      assert.equal(fatalError, evidenceError);
      calls.push("manifest");
    },
  });
  assert.equal(finalFatalError, evidenceError);
  assert.deepEqual(calls, ["evidence", "failure", "manifest"]);

  if (process.env.HOCA_BUL_QA_FORCE_INVARIANT_FAILURE === "1") {
    throw new Error("forced startup invariant failure");
  }
}

/**
 * Known-benign console noise. The theme boot script stamps `class` on <html>
 * before React hydrates, which Next reports as an extra server attribute; it is
 * a pre-existing app-wide behaviour, not a /hoca-bul defect.
 */
const BENIGN_CONSOLE = [/Extra attributes from the server/i, /Download the React DevTools/i];
// Next App Router deliberately aborts obsolete RSC prefetches when the wizard
// replaces/pushes the canonical step URL. These are navigation cancellations,
// not failed application resources.
const BENIGN_RESOURCE_FAILURE = /[?&]_rsc=.*net::ERR_ABORTED/i;

const HYDRATION_PATTERN = /hydrat|did not match|Text content does not match/i;

// --- Fixtures -----------------------------------------------------------------

type QaRole = "student" | "tutor";

interface QaUser {
  id: string;
  email: string;
  role: QaRole;
  tutor_profile_id: string | null;
  is_email_verified: boolean;
  is_admin: boolean;
  is_test_account: boolean;
  jitsi_tutorial_completed: boolean;
  jitsi_tutorial_grandfathered: boolean;
  impersonation: null;
}

function qaUser(id = USER_ID, role: QaRole = "student"): QaUser {
  return {
    id,
    email: `${id}@example.invalid`,
    role,
    tutor_profile_id: role === "tutor" ? `profile-${id}` : null,
    is_email_verified: true,
    is_admin: false,
    is_test_account: true,
    jitsi_tutorial_completed: true,
    jitsi_tutorial_grandfathered: false,
    impersonation: null,
  };
}

const user = qaUser();

const tutorProfile = {
  id: "fixture-tutor-a",
  user: "fixture-tutor-user-a",
  name: "QA Fixture",
  surname: "A",
  profile_picture: "",
  intro_video_url: "",
  bio: "Deterministic browser QA fixture.",
  university: "Örnek Üniversite",
  department: "Matematik",
  yks_rank: 100,
  hourly_price: 550,
  rating: 4.8,
  total_reviews: 12,
  completed_lessons_count: 20,
  is_verified: true,
  is_public: true,
  teaching_styles: ["foundations_patient"],
  is_online: false,
  last_seen_at: null,
  trial_lesson_eligible: false,
  trial_lessons_remaining: 0,
  subjects: [],
  created_at: "2026-07-01T00:00:00Z",
};

const matchingOptions = {
  goals: [
    { value: "YKS", label: "YKS" },
    { value: "DGS", label: "DGS" },
    { value: "KPSS", label: "KPSS" },
    { value: "UNDECIDED", label: "Henüz karar vermedim" },
  ],
  stages: {
    YKS: [
      { value: "grade_11", label: "11. sınıf" },
      { value: "grade_12", label: "12. sınıf" },
      { value: "graduate", label: "Mezun" },
    ],
    DGS: [{ value: "ongoing", label: "Bir süredir hazırlanıyorum" }],
    KPSS: [{ value: "ongoing", label: "Düzenli hazırlanıyorum" }],
    UNDECIDED: [{ value: "exploring", label: "Hedefimi belirlemeye çalışıyorum" }],
  },
  subjects: [
    { key: "matematik", label: "Matematik", subject_ids: ["1"], exam_types: ["TYT", "AYT"], tutor_count: 4 },
    { key: "fizik", label: "Fizik", subject_ids: ["2"], exam_types: ["TYT"], tutor_count: 2 },
  ],
  budget_ranges: [
    { id: "economical", label: "Ekonomik", min: null, max: 300 },
    { id: "balanced", label: "Dengeli", min: 400, max: 700 },
    { id: "flexible", label: "Fiyat konusunda esneğim", min: null, max: null },
  ],
};

/** Deliberately named as a fixture so no screenshot can be mistaken for real supply. */
type MatchLevel = "strong" | "budget_relaxed" | "schedule_relaxed";

function fixtureMatch(id: string, level: MatchLevel) {
  return {
    tutor: {
      id,
      name: "QA Fixture",
      surname: id.toUpperCase(),
      profile_picture: "",
      university: "Örnek Üniversite",
      department: "Matematik",
      hourly_price: level === "budget_relaxed" ? 900 : 550,
      rating: 4.8,
      total_reviews: 12,
      completed_lessons_count: 20,
      is_verified: true,
      subjects: [],
    },
    score: 90,
    match_level: level,
    reason_codes: [
      "subject_match",
      ...(level === "schedule_relaxed" ? [] : ["availability_match"]),
      "teaching_style_match",
      ...(level === "budget_relaxed" ? [] : ["budget_match"]),
    ],
    caveat_codes: level === "strong" ? [] : [level],
    matched_subjects: ["Matematik"],
    matched_styles: ["foundations_patient"],
    nearest_available_at: level === "schedule_relaxed" ? null : "2026-08-03T17:00:00Z",
  };
}

type PreviewMode = "matches" | "empty" | "429" | "500" | "offline" | "timeout" | "delay";
type OptionsMode = "success" | "empty" | "500" | "offline" | "delay";
type PreferenceMode = "missing" | "valid" | "invalid";
type DraftSeed = "none" | "partial" | "complete" | "corrupt" | "expired" | "cross-user";
type CacheSeed = "none" | "valid" | "corrupt" | "expired" | "cross-user";

function previewBody(mode: PreviewMode) {
  if (mode === "empty") return { matches: [], candidate_count: 0 };
  return {
    matches: [
      fixtureMatch("exact", "strong"),
      fixtureMatch("budget", "budget_relaxed"),
      fixtureMatch("schedule", "schedule_relaxed"),
    ],
    candidate_count: 6,
  };
}

const completeAnswers: MatchingAnswers = {
  goal: "YKS",
  stage: "grade_12",
  subject_keys: ["matematik"],
  challenges: ["foundations"],
  teaching_styles: ["foundations_patient"],
  availability_windows: ["weekday_evening"],
  budget_segment: "balanced",
  schema_version: 1,
};

function savedPreference(mode: PreferenceMode) {
  if (mode === "missing") return null;
  return {
    ...completeAnswers,
    ...(mode === "invalid" ? { subject_keys: ["removed-subject"] } : {}),
    updated_at: "2026-07-29T09:00:00Z",
  };
}

interface ApiFixture {
  status?: number;
  body?: unknown;
}

function generalApiFixture(method: string, pathname: string, activeUser: QaUser): ApiFixture | null {
  const key = `${method} ${pathname}`;
  const fixed: Record<string, ApiFixture> = {
    "GET /api/profile/me/": {
      body: {
        user: activeUser,
        profile: { id: "p-1", name: "QA", surname: "Öğrenci", target_exam_type: "YKS", profile_picture: null },
        preferences: { language: "tr", email_notifications: true, sms_notifications: false },
      },
    },
    "POST /api/auth/presence/": { status: 204 },
    "GET /api/notifications/summary/": { body: { has_unread: false, unread_count: 0 } },
    "GET /api/notifications/": { body: [] },
    "GET /api/tutors/": { body: { count: 0, next: null, previous: null, results: [] } },
    "GET /api/subjects/": { body: [{ id: "1", name: "Matematik", exam_type: "TYT" }] },
    "GET /api/learning/dashboard/": { body: { goals: [] } },
    "GET /api/learning/goal-templates/": { body: [] },
    "GET /api/bookings/": { body: [] },
    "GET /api/payments/package-purchases/": { body: [] },
    "GET /api/payments/package-plans/": { body: [] },
    "GET /api/questions/meta/": { body: { enabled: true, exams: [], subjects: [], years: [] } },
    "GET /api/questions/": { body: { count: 0, next: null, previous: null, results: [] } },
    "GET /api/tutors/me/": { body: fixtureTutor("profile-qa-tutor-1") },
    "GET /api/availability/": { body: [] },
    "GET /api/payments/tutor/earnings/": {
      body: {
        last_7_days: { total: 0, lesson_count: 0 },
        last_30_days: { total: 0, lesson_count: 0 },
        lifetime: { total: 0, lesson_count: 0 },
      },
    },
    "GET /api/payments/tutor/package-offers/": { body: [] },
    "GET /api/payments/tutor/package-purchases/": { body: [] },
    "GET /api/tutors/me/price-insight/": {
      body: {
        recommended_price: null,
        market_range: { low: null, high: null },
        sample_size: 0,
        basis: "insufficient_data",
        commission_rate_bps: 0,
      },
    },
  };
  if (fixed[key]) return fixed[key];

  if (method === "GET" && /^\/api\/tutors\/[^/]+\/reviews\/$/.test(pathname)) {
    return { body: { count: 0, next: null, previous: null, results: [] } };
  }
  if (method === "GET" && /^\/api\/tutors\/[^/]+\/review-summary\/$/.test(pathname)) {
    return { body: { overall_rating: 0, review_count: 0, criteria_ratings: {}, subject_ratings: [] } };
  }
  if (method === "GET" && /^\/api\/payments\/tutors\/[^/]+\/offered-plans\/$/.test(pathname)) {
    return { body: [] };
  }
  return null;
}

// --- Server -------------------------------------------------------------------

async function assertPortAvailable(port: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const probe = createServer();
    probe.unref();
    probe.once("error", (error) => reject(new Error(`QA port ${port} is unavailable: ${error.message}`)));
    probe.listen(port, () => probe.close((error) => (error ? reject(error) : resolve())));
  });
  ok(`QA port ${port} is free`);
}

async function waitForChildExit(child: ChildProcess, timeoutMs: number): Promise<boolean> {
  if (child.exitCode !== null || child.signalCode !== null) return true;
  return Promise.race([
    once(child, "exit").then(() => true),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs)),
  ]);
}

async function stopServer(child: ChildProcess, label: string): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  if (await waitForChildExit(child, 5_000)) {
    ok(`${label} server exited after SIGTERM`);
    return;
  }
  child.kill("SIGKILL");
  if (!(await waitForChildExit(child, 5_000))) {
    throw new Error(`${label} server did not exit after SIGKILL`);
  }
  notes.push(`${label} server required SIGKILL after the shutdown timeout`);
}

async function bootServer(port: number, flagOn: boolean): Promise<ChildProcess> {
  await assertPortAvailable(port);
  const child = spawn("npx", ["next", "dev", "--port", String(port)], {
    cwd: ROOT,
    env: {
      ...process.env,
      // Passed in-process rather than through a .env.local file, so the harness
      // never leaves a flag override behind on disk.
      ...(flagOn ? { NEXT_PUBLIC_HOCA_BUL_ENABLED: "true" } : { NEXT_PUBLIC_HOCA_BUL_ENABLED: "false" }),
    },
    stdio: "ignore",
  });

  const base = `http://localhost:${port}`;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${base}/home`);
      if (response.ok) return child;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  await stopServer(child, `port ${port}`);
  throw new Error(`dev server on ${port} did not become ready`);
}

// --- Context ------------------------------------------------------------------

interface ContextOptions {
  port: number;
  width: number;
  height: number;
  dark?: boolean;
  reducedMotion?: boolean;
  previewMode?: PreviewMode;
  previewSequence?: PreviewMode[];
  optionsMode?: OptionsMode;
  optionsSequence?: OptionsMode[];
  preferenceMode?: PreferenceMode;
  seedDraft?: DraftSeed;
  seedCache?: CacheSeed;
  authenticated?: boolean;
  cachedUser?: QaUser;
  apiUser?: QaUser;
  authDelayMs?: number;
  evidenceName?: string;
}

interface Harness {
  context: BrowserContext;
  page: Page;
  consoleErrors: string[];
  hydrationWarnings: string[];
  previewRequests: number;
  optionsRequests: number;
  preferenceRequests: number;
  favoriteMutations: number;
  resourceFailures: ResourceFailure[];
  externalRequests: string[];
  unknownApiRequests: string[];
  evidenceName?: string;
}

interface BrowserPerformanceMetrics {
  layoutShifts: number[];
  longTasks: number[];
  supportsLayoutShift: boolean;
  supportsLongTask: boolean;
}

type ResourceFailure =
  | { kind: "request"; method: string; url: string; error: string }
  | { kind: "response"; method: string; url: string; status: number };

interface ExpectedResourceFailure {
  method: string;
  pathname: string;
  count: number;
  status?: number;
  error?: RegExp;
}

function sequenceValue<T>(values: readonly T[], index: number): T {
  return values[Math.min(index, values.length - 1)] as T;
}

function fixtureTutor(id: string) {
  return { ...tutorProfile, id, user: `fixture-user-${id}`, surname: id.toUpperCase() };
}

function storageSeed(options: ContextOptions, activeUserId: string) {
  const now = Date.now();
  const draftMode = options.seedDraft ?? "none";
  const cacheMode = options.seedCache ?? "none";
  let draftRaw: string | null = null;
  let cacheRaw: string | null = null;

  if (draftMode === "corrupt") {
    draftRaw = "{not-json";
  } else if (draftMode !== "none") {
    const draftUserId = draftMode === "cross-user" ? SWITCHED_USER_ID : activeUserId;
    const complete = draftMode === "complete";
    const expired = draftMode === "expired";
    draftRaw = JSON.stringify({
      meta: { schemaVersion: 1, userId: draftUserId, createdAt: now, updatedAt: now },
      answers: complete ? completeAnswers : { goal: "YKS", stage: "grade_12" },
      client: { yks_alan: ["TYT"] },
      stepId: complete ? "kontrol" : "dersler",
      expiresAt: expired ? now - 1 : now + HOCA_BUL_DRAFT_TTL_MS,
    });
  }

  if (cacheMode === "corrupt") {
    cacheRaw = "{not-json";
  } else if (cacheMode !== "none") {
    const canonical = canonicalizeAnswers(completeAnswers);
    cacheRaw = JSON.stringify({
      schemaVersion: 1,
      userId: cacheMode === "cross-user" ? SWITCHED_USER_ID : activeUserId,
      answerHash: hashAnswers(completeAnswers),
      canonical,
      createdAt:
        cacheMode === "expired" ? now - HOCA_BUL_PREVIEW_TTL_MS - 1 : now,
      response: previewBody("matches"),
    });
  }

  return {
    draftKey: `${HOCA_BUL_DRAFT_KEY_PREFIX}:${activeUserId}`,
    draftRaw,
    cacheKey: `${HOCA_BUL_PREVIEW_KEY_PREFIX}:${activeUserId}:${hashAnswers(completeAnswers)}`,
    cacheRaw,
  };
}

async function newHarness(browser: Browser, options: ContextOptions): Promise<Harness> {
  const base = `http://localhost:${options.port}`;
  const cachedUser = options.cachedUser ?? user;
  const apiUser = options.apiUser ?? cachedUser;
  const previewSequence = options.previewSequence ?? [options.previewMode ?? "matches"];
  const optionsSequence = options.optionsSequence ?? [options.optionsMode ?? "success"];
  const context = await browser.newContext({
    viewport: { width: options.width, height: options.height },
    reducedMotion: options.reducedMotion ? "reduce" : "no-preference",
    baseURL: base,
    ...(options.evidenceName
      ? { recordVideo: { dir: OUT_DIR, size: { width: options.width, height: options.height } } }
      : {}),
  });

  if (options.evidenceName) {
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  }

  const harness: Harness = {
    context,
    page: null as unknown as Page,
    consoleErrors: [],
    hydrationWarnings: [],
    previewRequests: 0,
    optionsRequests: 0,
    preferenceRequests: 0,
    favoriteMutations: 0,
    resourceFailures: [],
    externalRequests: [],
    unknownApiRequests: [],
    evidenceName: options.evidenceName,
  };

  if (options.authenticated !== false) {
    await context.addCookies([{ name: "auth_token", value: "qa-token", url: base }]);
  }

  const favorites = new Set<string>();

  await context.route("**/api/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    const pathname = new URL(url).pathname;
    const headers = {
      "Access-Control-Allow-Origin": base,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    };

    if (options.authenticated === false && method === "GET" && pathname === "/api/auth/me/") {
      await route.fulfill({ status: 401, headers, contentType: "application/json", body: "{}" });
      return;
    }

    if (method === "GET" && pathname === "/api/auth/me/") {
      if (options.authDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, options.authDelayMs));
      }
      await route.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify(apiUser) });
      return;
    }

    if (method === "GET" && pathname === "/api/matching/options/") {
      const mode = sequenceValue(optionsSequence, harness.optionsRequests);
      harness.optionsRequests += 1;
      if (mode === "offline") {
        await route.abort("internetdisconnected");
        return;
      }
      if (mode === "500") {
        await route.fulfill({ status: 500, headers, contentType: "application/json", body: "{}" });
        return;
      }
      if (mode === "delay") {
        await new Promise((resolve) => setTimeout(resolve, 1_600));
      }
      const body = mode === "empty" ? { ...matchingOptions, subjects: [] } : matchingOptions;
      await route.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify(body) });
      return;
    }

    if (method === "POST" && pathname === "/api/matching/preview/") {
      const mode = sequenceValue(previewSequence, harness.previewRequests);
      harness.previewRequests += 1;
      if (mode === "offline") {
        await route.abort("internetdisconnected");
        return;
      }
      if (mode === "timeout") {
        await new Promise((resolve) => setTimeout(resolve, 17_000));
        try {
          await route.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify(previewBody("matches")) });
        } catch {
          // The browser-side 15 second timeout intentionally wins this race.
        }
        return;
      }
      if (mode === "delay") {
        await new Promise((resolve) => setTimeout(resolve, 4_000));
      }
      if (mode === "429") {
        await route.fulfill({
          status: 429,
          headers,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Request was throttled." }),
        });
        return;
      }
      if (mode === "500") {
        await route.fulfill({ status: 500, headers, contentType: "application/json", body: "{}" });
        return;
      }
      await route.fulfill({
        status: 200,
        headers,
        contentType: "application/json",
        body: JSON.stringify(previewBody(mode)),
      });
      return;
    }

    if ((method === "GET" || method === "PUT") && pathname === "/api/matching/preferences/me/") {
      harness.preferenceRequests += 1;
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          headers,
          contentType: "application/json",
          body: JSON.stringify({ preference: savedPreference(options.preferenceMode ?? "missing") }),
        });
        return;
      }
      const payload = route.request().postDataJSON() as MatchingAnswers;
      await route.fulfill({
        status: 200,
        headers,
        contentType: "application/json",
        body: JSON.stringify({ preference: { ...payload, updated_at: "2026-07-29T09:00:00Z" } }),
      });
      return;
    }

    if (pathname === "/api/favorites/tutors/" && (method === "GET" || method === "POST")) {
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          headers,
          contentType: "application/json",
          body: JSON.stringify(
            Array.from(favorites, (id) => ({ id: `favorite-${id}`, tutor: fixtureTutor(id), created_at: "2026-07-29T09:00:00Z" }))
          ),
        });
        return;
      }
      harness.favoriteMutations += 1;
      if (method === "POST") {
        const id = String((route.request().postDataJSON() as { tutor: string }).tutor);
        favorites.add(id);
        await route.fulfill({
          status: 201,
          headers,
          contentType: "application/json",
          body: JSON.stringify({ id: `favorite-${id}`, tutor: fixtureTutor(id), created_at: "2026-07-29T09:00:00Z" }),
        });
        return;
      }
    }

    const favoriteDelete = pathname.match(/^\/api\/favorites\/tutors\/([^/]+)\/$/);
    if (method === "DELETE" && favoriteDelete) {
      harness.favoriteMutations += 1;
      const id = favoriteDelete[1];
      favorites.delete(id);
      await route.fulfill({ status: 204, headers, body: "" });
      return;
    }

    const tutorMatch = pathname.match(/^\/api\/tutors\/([^/]+)\/$/);
    if (method === "GET" && tutorMatch && tutorMatch[1] !== "me") {
      await route.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify(fixtureTutor(tutorMatch[1])) });
      return;
    }

    const fixture = generalApiFixture(method, pathname, apiUser);
    if (fixture) {
      await route.fulfill({
        status: fixture.status ?? 200,
        headers,
        ...(fixture.status === 204
          ? { body: "" }
          : { contentType: "application/json", body: JSON.stringify(fixture.body) }),
      });
      return;
    }

    harness.unknownApiRequests.push(`${method} ${pathname}`);
    await route.abort("blockedbyclient");
  });

  context.on("request", (request: Request) => {
    const parsed = new URL(request.url());
    if (!["localhost", "127.0.0.1"].includes(parsed.hostname) && !["data:", "blob:"].includes(parsed.protocol)) {
      harness.externalRequests.push(`${request.method()} ${request.url()}`);
    }
  });

  const page = await context.newPage();
  harness.page = page;

  page.on("console", (message) => {
    const text = message.text();
    if (HYDRATION_PATTERN.test(text)) harness.hydrationWarnings.push(text);
    if (message.type() !== "error") return;
    if (BENIGN_CONSOLE.some((pattern) => pattern.test(text))) return;
    harness.consoleErrors.push(text);
  });
  page.on("pageerror", (error) => harness.consoleErrors.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    harness.resourceFailures.push({
      kind: "request",
      method: request.method(),
      url: request.url(),
      error: request.failure()?.errorText ?? "failed",
    });
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      harness.resourceFailures.push({
        kind: "response",
        method: response.request().method(),
        url: response.url(),
        status: response.status(),
      });
    }
  });

  await page.addInitScript(
    ({ cachedUser, dark, seed, authenticated }) => {
      const qaWindow = window as unknown as {
        __hocaBulQaAnalytics: Array<Record<string, unknown>>;
        __hocaBulQaPerformance: BrowserPerformanceMetrics;
      };
      qaWindow.__hocaBulQaAnalytics = [];
      window.addEventListener("hocam:analytics", ((event: CustomEvent) => {
        qaWindow.__hocaBulQaAnalytics.push(event.detail as Record<string, unknown>);
      }) as EventListener);
      qaWindow.__hocaBulQaPerformance = {
        layoutShifts: [],
        longTasks: [],
        supportsLayoutShift: false,
        supportsLongTask: false,
      };
      try {
        new PerformanceObserver((list) => {
          qaWindow.__hocaBulQaPerformance.supportsLayoutShift = true;
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
            if (!shift.hadRecentInput && typeof shift.value === "number") {
              qaWindow.__hocaBulQaPerformance.layoutShifts.push(shift.value);
            }
          }
        }).observe({ type: "layout-shift", buffered: true });
      } catch {}
      try {
        new PerformanceObserver((list) => {
          qaWindow.__hocaBulQaPerformance.supportsLongTask = true;
          for (const entry of list.getEntries()) qaWindow.__hocaBulQaPerformance.longTasks.push(entry.duration);
        }).observe({ type: "longtask", buffered: true });
      } catch {}

      if (authenticated !== false) {
        localStorage.setItem("auth_user", JSON.stringify(cachedUser));
      }
      localStorage.setItem("hocam-theme", dark ? "dark" : "light");
      if (seed.draftRaw !== null) localStorage.setItem(seed.draftKey, seed.draftRaw);
      if (seed.cacheRaw !== null) sessionStorage.setItem(seed.cacheKey, seed.cacheRaw);
    },
    {
      cachedUser,
      dark: Boolean(options.dark),
      seed: storageSeed(options, cachedUser.id),
      authenticated: options.authenticated,
    }
  );

  return harness;
}

// --- Checks -------------------------------------------------------------------

async function checkOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (overflow.scrollWidth > overflow.clientWidth) {
    fail(`horizontal overflow @ ${label}: ${overflow.scrollWidth} > ${overflow.clientWidth}`);
  } else {
    ok(`no horizontal overflow @ ${label}`);
  }
}

async function checkMobileDraftActionsClearNavigation(page: Page, label: string) {
  const cta = page.getByRole("link", { name: /^Devam et/ });
  const navigation = page.getByRole("navigation", { name: "Mobil ana menü" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  const [ctaBox, navigationBox] = await Promise.all([
    cta.boundingBox(),
    navigation.boundingBox(),
  ]);
  if (!ctaBox || !navigationBox) {
    fail(`mobile draft action geometry unavailable @ ${label}`);
    return;
  }
  const initialIntersection =
    ctaBox.y < navigationBox.y + navigationBox.height &&
    ctaBox.y + ctaBox.height > navigationBox.y;
  if (initialIntersection) {
    fail(`mobile draft action intersects navigation at scrollY=0 @ ${label}`);
    return;
  }
  ok(`mobile draft action does not intersect navigation at scrollY=0 @ ${label}`);

  await cta.evaluate((element) => element.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(100);
  const [revealedCtaBox, revealedNavigationBox] = await Promise.all([
    cta.boundingBox(),
    navigation.boundingBox(),
  ]);
  if (!revealedCtaBox || !revealedNavigationBox) {
    fail(`revealed mobile draft action geometry unavailable @ ${label}`);
    return;
  }
  const clearance =
    revealedNavigationBox.y - (revealedCtaBox.y + revealedCtaBox.height);
  if (clearance < 12) {
    fail(`mobile draft action is only ${clearance.toFixed(1)}px above navigation @ ${label}`);
  } else {
    ok(`mobile draft action clears navigation by ${clearance.toFixed(1)}px @ ${label}`);
  }
}

async function checkWizardControlsClearFooter(
  page: Page,
  controls: Locator,
  label: string
) {
  const footer = page.getByTestId("wizard-footer");
  const count = await controls.count();
  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    await control.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(50);
    const [controlBox, footerBox] = await Promise.all([
      control.boundingBox(),
      footer.boundingBox(),
    ]);
    if (!controlBox || !footerBox) {
      fail(`wizard control geometry unavailable @ ${label} #${index + 1}`);
      continue;
    }
    const intersects =
      controlBox.y < footerBox.y + footerBox.height &&
      controlBox.y + controlBox.height > footerBox.y;
    if (intersects) fail(`wizard footer covers control @ ${label} #${index + 1}`);
  }
  ok(`wizard controls can be positioned clear of the sticky footer @ ${label}`);
}

function drainDiagnostics(
  harness: Harness,
  label: string,
  allowed: { console?: RegExp[]; resources?: ExpectedResourceFailure[] } = {}
) {
  networkEvidence.push({
    label,
    consoleErrors: [...harness.consoleErrors],
    hydrationWarnings: [...harness.hydrationWarnings],
    resourceFailures: [...harness.resourceFailures],
    externalRequests: [...harness.externalRequests],
    unknownApiRequests: [...harness.unknownApiRequests],
  });
  const consoleErrors = harness.consoleErrors.filter(
    (message) => !allowed.console?.some((pattern) => pattern.test(message))
  );
  if (consoleErrors.length) {
    const unique = Array.from(new Set(consoleErrors));
    fail(`console errors @ ${label}: ${unique.join(" | ").slice(0, 400)}`);
  }
  harness.consoleErrors.length = 0;
  if (harness.hydrationWarnings.length) {
    const unique = Array.from(new Set(harness.hydrationWarnings));
    fail(`hydration warnings @ ${label}: ${unique.join(" | ").slice(0, 400)}`);
    harness.hydrationWarnings.length = 0;
  }
  const expectedMatches = new Set<ResourceFailure>();
  for (const expected of allowed.resources ?? []) {
    const matching = harness.resourceFailures.filter((failure) => {
      const pathname = new URL(failure.url).pathname;
      if (failure.method !== expected.method || pathname !== expected.pathname) return false;
      if (expected.status !== undefined) {
        return failure.kind === "response" && failure.status === expected.status;
      }
      return failure.kind === "request" && Boolean(expected.error?.test(failure.error));
    });
    if (matching.length !== expected.count) {
      fail(
        `expected resource failure count @ ${label}: ${expected.method} ${expected.pathname} ` +
          `matched ${matching.length}, expected ${expected.count}`
      );
    }
    for (const failure of matching) expectedMatches.add(failure);
  }
  const resourceFailures = harness.resourceFailures.filter((failure) => {
    if (expectedMatches.has(failure)) return false;
    return !(
      failure.kind === "request" &&
      new URL(failure.url).searchParams.has("_rsc") &&
      BENIGN_RESOURCE_FAILURE.test(`${failure.url} ${failure.error}`)
    );
  });
  if (resourceFailures.length) {
    fail(`resource failures @ ${label}: ${JSON.stringify(resourceFailures).slice(0, 800)}`);
  }
  harness.resourceFailures.length = 0;
  if (harness.externalRequests.length) {
    fail(`external requests @ ${label}: ${Array.from(new Set(harness.externalRequests)).join(" | ").slice(0, 400)}`);
    harness.externalRequests.length = 0;
  }
  if (harness.unknownApiRequests.length) {
    fail(`unknown fixture API requests @ ${label}: ${Array.from(new Set(harness.unknownApiRequests)).join(" | ").slice(0, 800)}`);
    harness.unknownApiRequests.length = 0;
  }
}

async function shoot(page: Page, name: string) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
}

async function shootViewport(page: Page, name: string) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
}

async function readAnalytics(page: Page): Promise<Array<Record<string, unknown>>> {
  return page.evaluate(() => {
    const qaWindow = window as unknown as { __hocaBulQaAnalytics?: Array<Record<string, unknown>> };
    return qaWindow.__hocaBulQaAnalytics ?? [];
  });
}

async function checkPerformance(page: Page, label: string) {
  await page.waitForTimeout(300);
  const metrics = await page.evaluate(() => {
    const qaWindow = window as unknown as { __hocaBulQaPerformance?: BrowserPerformanceMetrics };
    return qaWindow.__hocaBulQaPerformance ?? {
      layoutShifts: [],
      longTasks: [],
      supportsLayoutShift: false,
      supportsLongTask: false,
    };
  });
  const cls = metrics.layoutShifts.reduce((sum, value) => sum + value, 0);
  const maxLongTask = Math.max(0, ...metrics.longTasks);
  performanceEvidence.push({ label, cls, maxLongTask, ...metrics });
  if (!metrics.supportsLayoutShift || !metrics.supportsLongTask) {
    fail(`performance observers unavailable @ ${label}`);
  } else {
    ok(`performance observers active @ ${label} (CLS ${cls.toFixed(4)}, max long task ${maxLongTask.toFixed(1)}ms)`);
  }
  if (cls > 0.1) fail(`layout shift budget exceeded @ ${label}: ${cls.toFixed(4)} > 0.1`);
}

async function closeHarness(harness: Harness) {
  const video = harness.page.video();
  if (harness.evidenceName) {
    await harness.context.tracing.stop({
      path: path.join(OUT_DIR, `${harness.evidenceName}.trace.zip`),
    });
  }
  await harness.context.close();
  if (video && harness.evidenceName) {
    const temporaryPath = await video.path();
    await rename(temporaryPath, path.join(OUT_DIR, `${harness.evidenceName}.webm`));
  }
}

async function openHome(page: Page) {
  await page.goto("/home", { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(SETTLE_MS);
}

/**
 * The card only exists after the client effect resolves the authenticated user,
 * so a cold dev compile can push it well past a default timeout.
 */
async function waitForCard(page: Page) {
  await page.waitForSelector(CARD, { timeout: 45_000 });
}

/**
 * The results route resolves storage, options and the preview before it renders
 * anything but a status. Waiting on its h1 rather than a fixed sleep keeps the
 * assertions honest on a cold dev compile.
 */
async function waitForResults(page: Page) {
  await page.getByRole("heading", { level: 1, name: "Sana uygun hocalar" }).waitFor({ timeout: 45_000 });
}

/** Walks the wizard using only real controls, exactly as a student would. */
async function answerStep(
  page: Page,
  name: string | RegExp,
  kind: "radio" | "button" = "radio",
  pauseMs = 180
) {
  await page.getByRole(kind, { name, exact: typeof name === "string" }).first().click();
  if (pauseMs > 180) await page.waitForTimeout(pauseMs);
  const cont = page.getByRole("button", { name: /Devam et/ });
  await cont.waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const button = Array.from(document.querySelectorAll("button")).find((candidate) =>
      /Devam et/.test(candidate.textContent ?? "")
    ) as HTMLButtonElement | undefined;
    return Boolean(button && !button.disabled);
  });
  await cont.click();
  await page.waitForTimeout(pauseMs);
}

async function completeWizard(
  page: Page,
  goal: "YKS" | "DGS" | "KPSS" | "UNDECIDED",
  pauseMs = 180
) {
  await answerStep(page, goal === "UNDECIDED" ? "Henüz karar vermedim" : goal, "radio", pauseMs);
  const stage =
    goal === "YKS"
      ? "12. sınıf"
      : goal === "UNDECIDED"
        ? "Hedefimi belirlemeye çalışıyorum"
        : "Bir süredir hazırlanıyorum";
  await answerStep(page, stage, "radio", pauseMs);
  if (goal === "YKS") await answerStep(page, /TYT/, "button", pauseMs);
  await answerStep(page, /Matematik/, "button", pauseMs);
  await answerStep(page, /Konu temellerim eksik/, "button", pauseMs);
  await answerStep(page, /Sabırla temelden anlatan/, "button", pauseMs);
  await answerStep(page, /Hafta içi akşam/, "button", pauseMs);
  await answerStep(page, /Dengeli/, "radio", pauseMs);
}

async function assertFocusedHeading(page: Page, name: string | RegExp, label: string) {
  const heading = page.getByRole("heading", { level: 1, name });
  await heading.waitFor({ state: "visible" });
  const focused = await heading.evaluate((element) => element === document.activeElement);
  if (!focused) fail(`keyboard focus did not move to ${label}`);
  else ok(`keyboard focus moves to ${label}`);
}

function checkAnalytics(
  events: Array<Record<string, unknown>>,
  label: string,
  expectedCounts: Record<string, number>
) {
  const matchingEvents: Array<Record<string, unknown>> = [];
  const ignoredEvents: string[] = [];
  for (const item of events) {
    const event = String(item.event ?? "");
    const classification = classifyAnalyticsEvent(event);
    if (classification === "hoca") matchingEvents.push(item);
    else if (classification === "known-non-hoca") ignoredEvents.push(event);
    else fail(`analytics emitted unknown ${classification === "unknown-hoca" ? "Hoca" : "non-Hoca"} event @ ${label}: ${event}`);
  }
  for (const item of matchingEvents) {
    const event = String(item.event ?? "");
    const properties = (item.properties ?? {}) as Record<string, unknown>;
    const unexpected = Object.keys(properties).filter(
      (key) => !ANALYTICS_ALLOWED_PROPERTIES[event]?.includes(key)
    );
    if (unexpected.length) {
      fail(`analytics payload is not privacy-closed @ ${label}: ${event} (${unexpected.join(", ")})`);
    }
  }
  const serialized = JSON.stringify(matchingEvents);
  for (const privateValue of [USER_ID, "@example.invalid", "grade_12", "matematik", "foundations", "weekday_evening", "balanced"]) {
    if (serialized.includes(privateValue)) fail(`analytics leaked private answer/account data @ ${label}: ${privateValue}`);
  }
  for (const [eventName, expectedCount] of Object.entries(expectedCounts)) {
    const count = matchingEvents.filter((item) => item.event === eventName).length;
    if (count !== expectedCount) {
      fail(`analytics count @ ${label}: ${eventName} emitted ${count}, expected ${expectedCount}`);
    }
  }
  analyticsEvidence.push({
    label,
    expectedCounts,
    events: matchingEvents,
    ignoredUnrelatedEvents: ignoredEvents,
  });
  ok(`analytics payloads are private with exact counts @ ${label}`);
}

// --- Scenarios ----------------------------------------------------------------

async function runFlagOn(browser: Browser) {
  const port = FLAG_ON_PORT;

  // 1. Home fresh — desktop light. Also the responsive/theme sweep anchor.
  for (const [label, width, height, dark] of [
    ["1280-light", 1280, 900, false],
    ["768-light", 768, 1024, false],
    ["375-light", 375, 812, false],
    ["375x667-light", 375, 667, false],
    ["1280-dark", 1280, 900, true],
    ["375-dark", 375, 812, true],
  ] as const) {
    const h = await newHarness(browser, { port, width, height, dark });
    await openHome(h.page);
    await waitForCard(h.page);
    await checkOverflow(h.page, `home ${label}`);
    drainDiagnostics(h, `home ${label}`);
    if (label === "1280-light") await shoot(h.page, "01-home-fresh-desktop-light");
    await h.context.close();
  }

  // Every home chip must prefill the goal and skip re-asking the first question.
  for (const [goal, chip, expectedStage] of [
    ["YKS", "YKS", "Şu an hangi aşamadasın?"],
    ["DGS", "DGS", "Şu an hangi aşamadasın?"],
    ["KPSS", "KPSS", "Şu an hangi aşamadasın?"],
    ["UNDECIDED", "Henüz karar vermedim", "Şu an hangi aşamadasın?"],
  ] as const) {
    const h = await newHarness(browser, { port, width: 375, height: 667 });
    await openHome(h.page);
    await waitForCard(h.page);
    await h.page.getByRole("button", { name: chip, exact: true }).click();
    const cta = h.page.getByRole("link", {
      name: goal === "UNDECIDED" ? /Karar vermeden devam et/ : new RegExp(`${goal} için hocamı bul`),
    });
    await cta.click();
    await h.page.waitForURL(new RegExp("adim=asama"), { timeout: 20_000 });
    await h.page.getByRole("heading", { level: 1, name: expectedStage }).waitFor();
    const storedGoal = await h.page.evaluate((id) => {
      const raw = localStorage.getItem(`hocam:hoca-bul-draft:v1:${id}`);
      return raw ? JSON.parse(raw).answers.goal : null;
    }, USER_ID);
    if (storedGoal !== goal) fail(`home prefill ${goal} did not persist before the stage step`);
    else ok(`home prefill ${goal} reaches the stage step`);
    checkAnalytics(await readAnalytics(h.page), `home prefill ${goal}`, {
      home_matching_started: 1,
      hoca_bul_started: 1,
    });
    drainDiagnostics(h, `home prefill ${goal}`);
    await h.context.close();
  }

  // 2. Home with a goal chip selected — desktop dark.
  {
    const h = await newHarness(browser, { port, width: 1280, height: 900, dark: true });
    await openHome(h.page);
    await waitForCard(h.page);
    await h.page.getByRole("button", { name: "YKS", exact: true }).click();
    await h.page.waitForTimeout(300);
    const cta = await h.page.getByRole("link", { name: /YKS için hocamı bul/ }).count();
    if (cta !== 1) fail("selected-goal CTA did not update on the home card");
    else ok("selected-goal CTA updates");
    await shoot(h.page, "02-home-goal-selected-desktop-dark");
    drainDiagnostics(h, "home goal selected");
    await h.context.close();
  }

  // 3. Home draft continuation — both target mobile heights. The fixed tab bar
  // must never cover the returning student's primary action.
  for (const height of [812, 667] as const) {
    const h = await newHarness(browser, { port, width: 375, height, seedDraft: "partial" });
    await openHome(h.page);
    await waitForCard(h.page);
    const heading = await h.page.getByRole("heading", { name: "Kaldığın yerden devam et" }).count();
    if (heading < 1) fail("draft continuation state did not render on the home card");
    else ok("draft continuation state renders");
    await checkOverflow(h.page, `home draft mobile 375x${height}`);
    await checkMobileDraftActionsClearNavigation(h.page, `375x${height}`);
    await h.page.evaluate(() => window.scrollTo(0, 0));
    await shoot(h.page, `03-home-draft-continuation-375x${height}`);
    drainDiagnostics(h, `home draft mobile 375x${height}`);
    await h.context.close();
  }

  // Direct entry, refresh-resume, and invalid query params all canonicalize safely.
  {
    const h = await newHarness(browser, { port, width: 768, height: 1024 });
    await h.page.goto("/hoca-bul", { waitUntil: "networkidle" });
    await h.page.getByRole("heading", { level: 1, name: "Hangi sınava hazırlanıyorsun?" }).waitFor();
    if (!/adim=hedef/.test(h.page.url())) fail("direct route did not canonicalize to the goal step");
    else ok("direct route opens the goal step");
    await h.page.keyboard.press("Tab");
    const activeLabel = await h.page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent?.trim());
    if (!activeLabel) fail("keyboard traversal did not expose a focused control");
    else ok("keyboard traversal reaches a visible control");
    drainDiagnostics(h, "direct route");
    await h.context.close();
  }
  {
    const h = await newHarness(browser, { port, width: 375, height: 667, seedDraft: "partial" });
    await h.page.goto("/hoca-bul?adim=dersler&kaynak=home", { waitUntil: "networkidle" });
    await h.page.waitForURL(/adim=dersler/);
    await h.page.reload({ waitUntil: "networkidle" });
    await h.page.getByRole("heading", { name: "Yarım kalmış bir eşleşmen var" }).waitFor();
    await h.page.getByRole("button", { name: "Kaldığın yerden devam et" }).click();
    await assertFocusedHeading(h.page, "Hangi derslerde desteğe ihtiyacın var?", "the refreshed draft step");
    ok("refresh resumes at the exact first unanswered step");
    checkAnalytics(await readAnalytics(h.page), "refresh resume", {
      hoca_bul_started: 1,
    });
    drainDiagnostics(h, "refresh resume");
    await h.context.close();
  }
  {
    const h = await newHarness(browser, { port, width: 768, height: 1024 });
    await h.page.goto("/hoca-bul?adim=not-a-step&hedef=INVALID&kaynak=unknown", { waitUntil: "networkidle" });
    await h.page.getByRole("heading", { level: 1, name: "Hangi sınava hazırlanıyorsun?" }).waitFor();
    const canonicalUrl = new URL(h.page.url());
    const canonicalParams = Array.from(canonicalUrl.searchParams.entries());
    if (JSON.stringify(canonicalParams) !== JSON.stringify([["adim", "hedef"]])) {
      fail(`invalid route params were not removed: ${canonicalUrl.search}`);
    } else ok("invalid route params are removed at the goal step");
    drainDiagnostics(h, "invalid route");
    await h.context.close();
  }

  // 4 + 5. Wizard middle step (mobile) and review (desktop), driven for real.
  {
    const h = await newHarness(browser, { port, width: 375, height: 812 });
    await h.page.goto("/hoca-bul?kaynak=home", { waitUntil: "networkidle" });
    await answerStep(h.page, "YKS");
    await answerStep(h.page, "12. sınıf");
    await h.page.waitForTimeout(300);
    await checkOverflow(h.page, "wizard mid-step mobile");
    await shoot(h.page, "04-wizard-yks-middle-step-mobile");
    drainDiagnostics(h, "wizard mid-step mobile");
    await h.context.close();
  }
  {
    const h = await newHarness(browser, { port, width: 375, height: 667 });
    await h.page.goto("/hoca-bul?kaynak=home", { waitUntil: "networkidle" });
    await h.page.getByRole("radio", { name: "YKS" }).click();
    await h.page.getByRole("button", { name: /Devam et/ }).waitFor();
    await checkOverflow(h.page, "selected wizard mobile 375x667");
    await h.page.evaluate(() => window.scrollTo(0, 0));
    await checkWizardControlsClearFooter(
      h.page,
      h.page.getByRole("radio"),
      "selected wizard 375x667"
    );
    await h.page.evaluate(() => window.scrollTo(0, 0));
    await shootViewport(h.page, "04-wizard-selected-enabled-375x667-light");
    drainDiagnostics(h, "selected wizard mobile 375x667");
    await h.context.close();
  }
  {
    const h = await newHarness(browser, { port, width: 1280, height: 900, seedDraft: "complete" });
    await h.page.goto("/hoca-bul?adim=kontrol&kaynak=sonuclar", { waitUntil: "networkidle" });
    await h.page.waitForTimeout(SETTLE_MS);
    const review = await h.page.getByRole("heading", { name: "Yanıtlarını kontrol et" }).count();
    if (review < 1) fail("review step did not render from a complete draft");
    else ok("review step renders");
    await checkOverflow(h.page, "wizard review desktop");
    await shoot(h.page, "05-wizard-review-desktop");
    drainDiagnostics(h, "wizard review desktop");
    await h.context.close();
  }
  for (const height of [667, 812] as const) {
    const h = await newHarness(browser, { port, width: 375, height, seedDraft: "complete" });
    await h.page.goto("/hoca-bul?adim=kontrol&kaynak=sonuclar", { waitUntil: "networkidle" });
    await h.page.getByRole("heading", { name: "Yanıtlarını kontrol et" }).waitFor();
    await checkOverflow(h.page, `wizard review mobile 375x${height}`);
    await shootViewport(h.page, `05-wizard-review-375x${height}-top-light`);
    await checkWizardControlsClearFooter(
      h.page,
      h.page.getByRole("button", { name: "Düzenle" }),
      `wizard review 375x${height}`
    );
    await shootViewport(h.page, `05-wizard-review-375x${height}-last-control-light`);
    drainDiagnostics(h, `wizard review mobile 375x${height}`);
    await h.context.close();
  }

  // Closed-payload exact-count checks for Back and confirmed abandonment.
  {
    const h = await newHarness(browser, { port, width: 375, height: 667 });
    await h.page.goto("/hoca-bul?kaynak=home", { waitUntil: "networkidle" });
    await answerStep(h.page, "YKS");
    await h.page.getByRole("button", { name: "Geri" }).click();
    await h.page.getByRole("heading", { name: "Hangi sınava hazırlanıyorsun?" }).waitFor();
    await h.page.getByRole("button", { name: "Eşleşmeden çık" }).click();
    await h.page.getByRole("dialog").waitFor();
    await h.page.getByRole("button", { name: "Devam et" }).click();
    if ((await readAnalytics(h.page)).some((event) => event.event === "hoca_bul_abandoned")) {
      fail("cancelled exit emitted hoca_bul_abandoned");
    } else ok("cancelled exit stays silent");
    await h.page.getByRole("button", { name: "Eşleşmeden çık" }).click();
    await h.page.getByRole("button", { name: "Çık", exact: true }).click();
    await h.page.waitForURL(/\/home$/, { timeout: 20_000 });
    checkAnalytics(await readAnalytics(h.page), "back and confirmed exit", {
      hoca_bul_step_back: 1,
      hoca_bul_abandoned: 1,
    });
    drainDiagnostics(h, "back and confirmed exit");
    await h.context.close();
  }

  // Complete every goal branch with real controls. YKS also records the named
  // video/trace and pressure-tests duplicate submission plus analytics privacy.
  for (const goal of ["YKS", "DGS", "KPSS", "UNDECIDED"] as const) {
    const evidenceName = goal === "YKS" ? "14-complete-yks-flow" : undefined;
    const h = await newHarness(browser, {
      port,
      width: goal === "YKS" ? 1280 : 768,
      height: goal === "YKS" ? 900 : 1024,
      evidenceName,
    });
    await h.page.goto("/hoca-bul", { waitUntil: "networkidle" });
    await completeWizard(h.page, goal);
    await assertFocusedHeading(h.page, "Yanıtlarını kontrol et", `${goal} review`);
    const submit = h.page.getByRole("button", { name: "Eşleşmelerimi gör" });
    if (goal === "YKS") {
      await submit.evaluate((button: HTMLButtonElement) => {
        button.click();
        button.click();
      });
    } else {
      await submit.click();
    }
    await h.page.waitForURL(/\/hoca-bul\/sonuclar/, { timeout: 30_000 });
    await waitForResults(h.page);
    await assertFocusedHeading(h.page, "Sana uygun hocalar", `${goal} results`);
    if (h.previewRequests !== 1) fail(`${goal} completion sent ${h.previewRequests} preview requests`);
    else ok(`${goal} completes with one preview request`);
    if (goal === "YKS") {
      await checkOverflow(h.page, "complete YKS results");
      await checkPerformance(h.page, "complete YKS flow");
      await shoot(h.page, "14-complete-yks-flow-results");
      checkAnalytics(await readAnalytics(h.page), "complete YKS flow", {
        hoca_bul_submitted: 1,
        hoca_bul_results_viewed: 1,
      });
    }
    drainDiagnostics(h, `complete ${goal} flow`);
    await closeHarness(h);
  }

  // 6 + 7. Submission loading and the distinct 429 state.
  {
    const h = await newHarness(browser, {
      port,
      width: 1280,
      height: 900,
      seedDraft: "complete",
      previewMode: "delay",
    });
    await h.page.goto("/hoca-bul?adim=kontrol&kaynak=sonuclar", { waitUntil: "networkidle" });
    await h.page.waitForTimeout(SETTLE_MS);
    await h.page.getByRole("button", { name: "Eşleşmelerimi gör" }).click();
    await h.page.waitForTimeout(700);
    await shoot(h.page, "06-submission-loading");
    ok("submission loading captured");
    await h.page.waitForURL(/\/hoca-bul\/sonuclar/, { timeout: 20_000 });
    await waitForResults(h.page);
    if (h.previewRequests !== 1) fail(`submission loading made ${h.previewRequests} preview requests`);
    drainDiagnostics(h, "submission loading");
    await h.context.close();
  }
  {
    const h = await newHarness(browser, {
      port,
      width: 1280,
      height: 900,
      seedDraft: "complete",
      previewSequence: ["429", "matches"],
    });
    await h.page.goto("/hoca-bul?adim=kontrol&kaynak=sonuclar", { waitUntil: "networkidle" });
    await h.page.waitForTimeout(SETTLE_MS);
    await h.page.getByRole("button", { name: "Eşleşmelerimi gör" }).click();
    await h.page.waitForTimeout(1200);
    const throttled = await h.page.getByText(/Çok fazla deneme yaptın/).count();
    if (throttled < 1) fail("429 did not produce its own distinct message");
    else ok("429 shows its distinct message");
    await shoot(h.page, "07-submission-429");
    await assertFocusedHeading(h.page, "Eşleşmeler hazırlanamadı", "the 429 error");
    await h.page.getByRole("button", { name: "Tekrar dene" }).click();
    await h.page.waitForURL(/\/hoca-bul\/sonuclar/, { timeout: 30_000 });
    await waitForResults(h.page);
    if (h.previewRequests !== 2) fail("429 recovery did not bypass the failed preview exactly once");
    else ok("429 recovers through an explicit uncached retry");
    drainDiagnostics(h, "preview 429 recovery", {
      console: [/status of 429/i],
      resources: [
        { method: "POST", pathname: "/api/matching/preview/", status: 429, count: 1 },
      ],
    });
    await h.context.close();
  }

  for (const previewMode of ["offline", "500", "timeout"] as const) {
    const h = await newHarness(browser, {
      port,
      width: 375,
      height: 667,
      seedDraft: "complete",
      previewMode,
    });
    await h.page.goto("/hoca-bul?adim=kontrol&kaynak=sonuclar", { waitUntil: "networkidle" });
    await h.page.getByRole("button", { name: "Eşleşmelerimi gör" }).click();
    await h.page.getByRole("heading", { name: "Eşleşmeler hazırlanamadı" }).waitFor({ timeout: 25_000 });
    await assertFocusedHeading(h.page, "Eşleşmeler hazırlanamadı", `the ${previewMode} preview error`);
    const generic = await h.page.getByText("Eşleşmeler hazırlanamadı. Yanıtların korundu, tekrar deneyebilirsin.").count();
    if (generic !== 1) fail(`${previewMode} preview did not preserve answers behind the generic recovery state`);
    else ok(`${previewMode} preview has a recoverable error state`);
    if (h.previewRequests !== 1) {
      fail(`${previewMode} preview error made ${h.previewRequests} requests instead of exactly one`);
    } else ok(`${previewMode} preview error sends exactly one request`);
    const expectedResource: ExpectedResourceFailure =
      previewMode === "500"
        ? { method: "POST", pathname: "/api/matching/preview/", status: 500, count: 1 }
        : {
            method: "POST",
            pathname: "/api/matching/preview/",
            error:
              previewMode === "offline"
                ? /ERR_INTERNET_DISCONNECTED/i
                : /ERR_ABORTED|ERR_FAILED/i,
            count: 1,
          };
    drainDiagnostics(h, `preview ${previewMode}`, {
      console:
        previewMode === "500"
          ? [/status of 500/i]
          : previewMode === "offline"
            ? [/ERR_INTERNET_DISCONNECTED/i]
            : [/ERR_ABORTED|ERR_FAILED/i],
      resources: [expectedResource],
    });
    await h.context.close();
  }

  // 8 + 9 + 10. Results: strong + relaxed, dark, and the zero state.
  {
    const h = await newHarness(browser, { port, width: 1280, height: 900, seedDraft: "complete" });
    await h.page.goto("/hoca-bul/sonuclar", { waitUntil: "networkidle" });
    await waitForResults(h.page);
    const resultArticles = h.page.getByRole("article");
    const articleCount = await resultArticles.count();
    if (articleCount !== 3) fail(`result matrix rendered ${articleCount} cards instead of 3`);
    const exactArticle = h.page.getByRole("article", { name: "QA Fixture EXACT" });
    const budgetArticle = h.page.getByRole("article", { name: "QA Fixture BUDGET" });
    if ((await resultArticles.first().getAttribute("aria-label")) !== "QA Fixture EXACT") {
      fail("exact/strong match is not the first result");
    } else ok("exact/strong match renders first");
    await budgetArticle
      .getByText("Bu hoca seçtiğin bütçe aralığının üzerinde.")
      .waitFor();
    if ((await budgetArticle.getByText("bütçene uygun").count()) !== 0) {
      fail("budget-relaxed fixture contradicts its caveat with a budget-match reason");
    } else ok("budget-relaxed result has only its truthful budget caveat");
    await exactArticle.waitFor();
    const relaxed = await h.page.getByText("Tercihlerine tam uymayan ama yakın öneriler").count();
    if (relaxed < 1) fail("relaxed divider missing from results");
    else ok("relaxed divider renders");
    const scheduleRelaxed = await h.page
      .getByText("Seçtiğin saatlerde yakın bir boşluk bulunamadı; diğer uyumlara göre önerildi.")
      .count();
    if (scheduleRelaxed < 1) fail("schedule-relaxed caveat missing from results");
    else ok("schedule-relaxed caveat renders");
    await checkOverflow(h.page, "results desktop light");
    await shoot(h.page, "08-results-strong-and-relaxed-desktop-light");
    drainDiagnostics(h, "results desktop light");
    await h.context.close();
  }
  for (const height of [667, 812] as const) {
    const h = await newHarness(browser, { port, width: 375, height, seedDraft: "complete" });
    await h.page.goto("/hoca-bul/sonuclar", { waitUntil: "networkidle" });
    await waitForResults(h.page);
    await checkOverflow(h.page, `results exact and relaxed mobile 375x${height}`);
    await shoot(h.page, `08-results-exact-relaxed-375x${height}-light`);
    drainDiagnostics(h, `results exact and relaxed mobile 375x${height}`);
    await h.context.close();
  }
  {
    const h = await newHarness(browser, { port, width: 1280, height: 900, dark: true, seedDraft: "complete" });
    await h.page.goto("/hoca-bul/sonuclar", { waitUntil: "networkidle" });
    await waitForResults(h.page);
    await checkOverflow(h.page, "results desktop dark");
    await shoot(h.page, "09-results-desktop-dark");
    drainDiagnostics(h, "results desktop dark");
    await h.context.close();
  }
  {
    const h = await newHarness(browser, { port, width: 375, height: 812, seedDraft: "complete", previewMode: "empty" });
    await h.page.goto("/hoca-bul/sonuclar", { waitUntil: "networkidle" });
    await waitForResults(h.page);
    const zero = await h.page.getByRole("heading", { name: "Şu an tam uyan bir hoca bulamadık" }).count();
    if (zero < 1) fail("zero-result state did not render");
    else ok("zero-result state renders");
    await checkOverflow(h.page, "results zero mobile");
    const zeroActions = [
      ["Bütçemi genişlet", "/hoca-bul?adim=butce&kaynak=sonuclar"],
      ["Farklı saatler seçeyim", "/hoca-bul?adim=uygun_zamanlar&kaynak=sonuclar"],
      ["Ders seçimimi değiştir", "/hoca-bul?adim=dersler&kaynak=sonuclar"],
      ["Tüm hocaları gör", "/tutors"],
    ] as const;
    for (const [name, href] of zeroActions) {
      const actual = await h.page.getByRole("link", { name }).getAttribute("href");
      if (actual !== href) fail(`zero-result action ${name} points to ${actual}, expected ${href}`);
    }
    ok("all four zero-result recovery actions are correct");
    await shoot(h.page, "10-results-zero-mobile");
    await h.page.getByRole("link", { name: "Tüm hocaları gör" }).click();
    await h.page.waitForURL(/\/tutors$/, { timeout: 20_000 });
    await h.page.waitForLoadState("networkidle");
    checkAnalytics(await readAnalytics(h.page), "zero results and all tutors", {
      hoca_bul_results_viewed: 1,
      hoca_bul_no_results: 1,
      hoca_bul_all_tutors_clicked: 1,
    });
    drainDiagnostics(h, "results zero mobile");
    await h.context.close();
  }

  // Drafts and tab caches reject corrupt, expired, and cross-account records.
  for (const seedDraft of ["corrupt", "expired", "cross-user"] as const) {
    const h = await newHarness(browser, { port, width: 375, height: 667, seedDraft });
    await openHome(h.page);
    await waitForCard(h.page);
    const fresh = await h.page.getByRole("heading", { name: "Sana uygun hocayı 2 dakikada bulalım" }).count();
    if (fresh !== 1) fail(`${seedDraft} draft did not fall back to a fresh home card`);
    else ok(`${seedDraft} draft is rejected`);
    drainDiagnostics(h, `${seedDraft} draft`);
    await h.context.close();
  }
  for (const seedCache of ["corrupt", "expired", "cross-user"] as const) {
    const h = await newHarness(browser, {
      port,
      width: 768,
      height: 1024,
      seedDraft: "complete",
      seedCache,
    });
    await h.page.goto("/hoca-bul/sonuclar", { waitUntil: "networkidle" });
    await waitForResults(h.page);
    if (h.previewRequests !== 1) fail(`${seedCache} cache was trusted or caused duplicate preview calls`);
    else ok(`${seedCache} cache is rejected and replaced once`);
    drainDiagnostics(h, `${seedCache} cache`);
    await h.context.close();
  }
  {
    const h = await newHarness(browser, {
      port,
      width: 768,
      height: 1024,
      seedDraft: "complete",
      seedCache: "valid",
    });
    await h.page.goto("/hoca-bul/sonuclar", { waitUntil: "networkidle" });
    await waitForResults(h.page);
    await h.page.reload({ waitUntil: "networkidle" });
    await waitForResults(h.page);
    if (h.previewRequests !== 0) fail("valid tab cache was not reused across a refresh");
    else ok("valid user-scoped cache survives refresh without resubmission");
    drainDiagnostics(h, "valid cache refresh");
    await h.context.close();
  }

  // Direct results can recover from a valid preference, but missing and stale
  // preferences route to the exact question the student must answer.
  {
    const h = await newHarness(browser, { port, width: 768, height: 1024, preferenceMode: "valid" });
    await h.page.goto("/hoca-bul/sonuclar", { waitUntil: "networkidle" });
    await waitForResults(h.page);
    if (h.previewRequests !== 1) fail("valid saved preference did not produce one fresh preview");
    else ok("valid saved preference restores direct results");
    drainDiagnostics(h, "valid saved preference");
    await h.context.close();
  }
  {
    const h = await newHarness(browser, { port, width: 768, height: 1024, preferenceMode: "missing" });
    await h.page.goto("/hoca-bul/sonuclar", { waitUntil: "networkidle" });
    await h.page.waitForURL(/\/hoca-bul\?adim=hedef$/, { timeout: 20_000 });
    ok("missing saved preference redirects to the goal step");
    drainDiagnostics(h, "missing saved preference");
    await h.context.close();
  }
  {
    const h = await newHarness(browser, { port, width: 768, height: 1024, preferenceMode: "invalid" });
    await h.page.goto("/hoca-bul/sonuclar", { waitUntil: "networkidle" });
    await h.page.waitForURL(/adim=dersler/, { timeout: 20_000 });
    ok("invalid saved preference redirects to its first invalid answer");
    drainDiagnostics(h, "invalid saved preference");
    await h.context.close();
  }

  // The options query distinguishes loading, terminal failures, manual retry,
  // and a successful-but-empty subject catalog.
  {
    const h = await newHarness(browser, { port, width: 768, height: 1024, optionsMode: "delay" });
    await h.page.goto("/hoca-bul", { waitUntil: "domcontentloaded" });
    await h.page.getByRole("heading", { name: "Hangi sınava hazırlanıyorsun?" }).waitFor();
    await h.page.getByText("Seçenekler yükleniyor", { exact: true }).waitFor();
    const earlyOptions = await h.page.getByRole("radio", { name: "YKS" }).count();
    if (earlyOptions !== 0) fail("delayed options skipped the loading state");
    await h.page.getByRole("radio", { name: "YKS" }).waitFor({ timeout: 20_000 });
    ok("delayed options resolve from the loading state");
    drainDiagnostics(h, "delayed options");
    await h.context.close();
  }
  for (const optionsMode of ["offline", "500"] as const) {
    const h = await newHarness(browser, {
      port,
      width: 768,
      height: 1024,
      optionsSequence: [optionsMode, optionsMode, "success"],
    });
    await h.page.goto("/hoca-bul", { waitUntil: "domcontentloaded" });
    await h.page.getByRole("alert").filter({ hasText: "Seçenekler şu anda yüklenemedi." }).waitFor({ timeout: 30_000 });
    await h.page.getByRole("button", { name: "Tekrar dene" }).click();
    await h.page.getByRole("radio", { name: "YKS" }).waitFor({ timeout: 20_000 });
    if (h.optionsRequests !== 3) fail(`${optionsMode} options retry made ${h.optionsRequests} requests instead of 3`);
    else ok(`${optionsMode} options failure recovers on explicit retry`);
    drainDiagnostics(h, `${optionsMode} options`, {
      console:
        optionsMode === "500"
          ? [/status of 500/i]
          : [/ERR_INTERNET_DISCONNECTED/i],
      resources: [
        optionsMode === "500"
          ? { method: "GET", pathname: "/api/matching/options/", status: 500, count: 2 }
          : {
              method: "GET",
              pathname: "/api/matching/options/",
              error: /ERR_INTERNET_DISCONNECTED/i,
              count: 2,
            },
      ],
    });
    await h.context.close();
  }
  {
    const h = await newHarness(browser, {
      port,
      width: 768,
      height: 1024,
      optionsMode: "empty",
    });
    await h.page.goto("/hoca-bul?hedef=DGS&kaynak=home", { waitUntil: "networkidle" });
    await answerStep(h.page, "Bir süredir hazırlanıyorum");
    await h.page.getByText("Bu hedef için şu anda uygun ders bulunamadı.").waitFor();
    if (await h.page.getByRole("button", { name: /Devam et/ }).isEnabled()) fail("empty subject options left Continue enabled");
    else ok("empty options render a safe dead-end with Continue disabled");
    drainDiagnostics(h, "empty options");
    await h.context.close();
  }

  // Favorite mutation and the profile link both use the real results controls.
  {
    const h = await newHarness(browser, {
      port,
      width: 1280,
      height: 900,
      seedDraft: "complete",
      seedCache: "valid",
    });
    await h.page.goto("/hoca-bul/sonuclar", { waitUntil: "networkidle" });
    await waitForResults(h.page);
    await h.page.getByRole("button", { name: "Listeme kaydet" }).first().click();
    await h.page.getByRole("button", { name: "Listemden çıkar" }).first().waitFor();
    if (h.favoriteMutations !== 1) fail("favorite control did not make exactly one fixture mutation");
    else ok("favorite control updates through the fixture API");
    drainDiagnostics(h, "favorite navigation");
    await Promise.all([
      h.page.waitForURL(/\/tutors\/exact$/, { timeout: 20_000 }),
      h.page.getByRole("link", { name: /QA Fixture EXACT profilini gör/ }).click(),
    ]);
    await h.page.waitForLoadState("networkidle");
    ok("result profile control navigates to the selected tutor");
    await h.page.getByRole("button", { name: "Ders Rezervasyonu Yap" }).click();
    await h.page.waitForURL(/\/tutors\/exact\/checkout/, { timeout: 20_000 });
    ok("profile keeps the existing paid-booking checkout entry point");
    checkAnalytics(await readAnalytics(h.page), "result opened", {
      hoca_bul_results_viewed: 1,
      hoca_bul_result_opened: 1,
    });
    drainDiagnostics(h, "profile navigation destination");
    await h.context.close();
  }

  // 11. The P7 blocker in the browser: edit preferences, resubmit, new results.
  {
    const h = await newHarness(browser, {
      port,
      width: 1280,
      height: 900,
      seedDraft: "complete",
      previewSequence: ["empty", "matches"],
    });
    await h.page.goto("/hoca-bul/sonuclar", { waitUntil: "networkidle" });
    await waitForResults(h.page);
    await h.page.getByRole("heading", { name: "Şu an tam uyan bir hoca bulamadık" }).waitFor({ timeout: 20_000 });

    // Widen the budget through the real edit link, then resubmit.
    await h.page.getByRole("link", { name: "Bütçemi genişlet" }).click();
    await h.page.waitForURL(/adim=butce/, { timeout: 20_000 });
    await h.page.waitForTimeout(SETTLE_MS);
    await h.page.getByRole("radio", { name: /esneğim/i }).first().click();
    await h.page.waitForTimeout(200);
    await h.page.getByRole("button", { name: /Devam et/ }).click();
    await h.page.waitForTimeout(400);
    await h.page.getByRole("button", { name: "Eşleşmelerimi gör" }).click();
    await h.page.waitForURL(/sonuclar/, { timeout: 20_000 });
    await waitForResults(h.page);
    await h.page.waitForTimeout(600);

    const stillZero = await h.page.getByRole("heading", { name: "Şu an tam uyan bir hoca bulamadık" }).count();
    if (stillZero > 0) fail("BLOCKER-1: edited preferences still show the previous empty result");
    else ok("edited preferences resolve to the new preview");
    if (h.previewRequests !== 2) fail(`edited-result recovery made ${h.previewRequests} preview requests instead of 2`);
    await shoot(h.page, "11-preference-edit-new-results");
    drainDiagnostics(h, "edited-result recovery");
    await h.context.close();
  }

  // Reduced motion sweep across all three surfaces.
  for (const [label, route] of [
    ["home", "/home"],
    ["wizard", "/hoca-bul?kaynak=home"],
    ["results", "/hoca-bul/sonuclar"],
  ] as const) {
    const h = await newHarness(browser, {
      port,
      width: 1280,
      height: 900,
      reducedMotion: true,
      seedDraft: label === "results" ? "complete" : "none",
    });
    await h.page.goto(route, { waitUntil: "networkidle" });
    if (label === "results") await waitForResults(h.page);
    else await h.page.waitForTimeout(SETTLE_MS);
    await checkOverflow(h.page, `reduced-motion ${label}`);
    drainDiagnostics(h, `reduced-motion ${label}`);
    await h.context.close();
  }
  ok("reduced-motion sweep complete");

  // Reviewable motion evidence uses deliberate pauses long enough for the
  // production transition and review-assembly ceilings to settle.
  for (const [label, width, height, reducedMotion] of [
    ["desktop-normal", 1280, 900, false],
    ["mobile-normal", 375, 812, false],
    ["desktop-reduced", 1280, 900, true],
    ["mobile-reduced", 375, 812, true],
  ] as const) {
    const h = await newHarness(browser, {
      port,
      width,
      height,
      reducedMotion,
      evidenceName: `15-human-paced-yks-review-${label}`,
    });
    await h.page.goto("/hoca-bul", { waitUntil: "networkidle" });
    await completeWizard(h.page, "YKS", 700);
    await h.page.getByRole("heading", { name: "Yanıtlarını kontrol et" }).waitFor();
    await h.page.waitForTimeout(1_100);
    await checkOverflow(h.page, `human-paced review ${label}`);
    drainDiagnostics(h, `human-paced review ${label}`);
    await closeHarness(h);
  }
  ok("human-paced normal and reduced-motion review evidence captured");

  // Route guard and account changes never expose the flow to the wrong identity.
  {
    const h = await newHarness(browser, {
      port,
      width: 375,
      height: 667,
      authenticated: false,
    });
    await h.page.goto("/hoca-bul", { waitUntil: "domcontentloaded" });
    await h.page.waitForURL(/\/login\?role=student&returnUrl=%2Fhoca-bul/, { timeout: 20_000 });
    ok("anonymous entry redirects to the student login return URL");
    drainDiagnostics(h, "anonymous route guard");
    await h.context.close();
  }
  {
    const tutor = qaUser("qa-tutor-1", "tutor");
    const h = await newHarness(browser, {
      port,
      width: 768,
      height: 1024,
      cachedUser: tutor,
      apiUser: tutor,
    });
    await h.page.goto("/hoca-bul", { waitUntil: "domcontentloaded" });
    await h.page.waitForURL(/\/dashboard\/tutor/, { timeout: 20_000 });
    await h.page.waitForLoadState("networkidle");
    ok("wrong-role entry redirects to the tutor dashboard");
    drainDiagnostics(h, "wrong-role destination");
    await h.context.close();
  }
  {
    const h = await newHarness(browser, {
      port,
      width: 768,
      height: 1024,
      seedDraft: "partial",
      cachedUser: qaUser(USER_ID),
      apiUser: qaUser(SWITCHED_USER_ID),
      authDelayMs: 700,
    });
    await h.page.goto("/hoca-bul", { waitUntil: "domcontentloaded" });
    await h.page.waitForFunction(
      (id) => JSON.parse(localStorage.getItem("auth_user") ?? "null")?.id === id,
      SWITCHED_USER_ID,
      { timeout: 20_000 }
    );
    await h.page.getByRole("heading", { name: "Hangi sınava hazırlanıyorsun?" }).waitFor();
    const resumeDialog = await h.page.getByRole("heading", { name: "Yarım kalmış bir eşleşmen var" }).count();
    if (resumeDialog) fail("account switch exposed the previous student's draft");
    else ok("account switch resolves fresh state for the new user");
    drainDiagnostics(h, "account switch");
    await h.context.close();
  }
}

async function runFlagOff(browser: Browser) {
  const port = FLAG_OFF_PORT;

  // 12. Home keeps the original subject search.
  {
    const h = await newHarness(browser, { port, width: 1280, height: 900 });
    await openHome(h.page);
    const card = await h.page.locator(CARD).count();
    if (card > 0) fail("flag off: the matching entry card is still rendered");
    else ok("flag off: no matching entry card");
    const search = await h.page.getByText("Hangi ders için destek arıyorsun?").count();
    if (search < 1) fail("flag off: HomeSubjectSearch is missing");
    else ok("flag off: HomeSubjectSearch preserved");
    await checkOverflow(h.page, "flag-off home");
    await shoot(h.page, "12-flag-off-home-subject-search");
    drainDiagnostics(h, "flag-off home");
    await h.context.close();
  }

  // 13. The route itself is gone.
  {
    const h = await newHarness(browser, { port, width: 1280, height: 900 });
    const response = await h.page.goto("/hoca-bul", { waitUntil: "networkidle" });
    const status = response?.status() ?? 0;
    if (status !== 404) fail(`flag off: /hoca-bul returned ${status}, expected 404`);
    else ok("flag off: /hoca-bul 404s");
    await shoot(h.page, "13-flag-off-hoca-bul-404");
    drainDiagnostics(h, "flag-off route", {
      console: [/status of 404/i],
      resources: [{ method: "GET", pathname: "/hoca-bul", status: 404, count: 1 }],
    });
    await h.context.close();
  }
}

// --- Main ---------------------------------------------------------------------

async function prepareRunOutput(): Promise<string> {
  await mkdir(RUNS_DIR, { recursive: true });
  for (const entry of await readdir(RUNS_DIR)) {
    await rm(path.join(RUNS_DIR, entry), { recursive: true, force: true });
  }

  try {
    await lstat(FINAL_OUT_DIR);
    const retired = path.join(RUNS_DIR, `retired-${process.pid}-${Date.now()}`);
    await rename(FINAL_OUT_DIR, retired);
    await rm(retired, { recursive: true, force: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const runDirectory = await mkdtemp(path.join(RUNS_DIR, "run-"));
  ok(`fresh evidence run directory created: ${runDirectory}`);
  return runDirectory;
}

async function writeRunEvidence(
  runDirectory: string
): Promise<void> {
  networkEvidence.push({
    note: "Every /api/** request is matched by method/path fixtures; unknown API and non-local requests fail the run.",
  });
  await writeFile(
    path.join(runDirectory, "hoca-bul-performance-evidence.json"),
    `${JSON.stringify(performanceEvidence, null, 2)}\n`
  );
  await writeFile(
    path.join(runDirectory, "hoca-bul-network-evidence.json"),
    `${JSON.stringify(networkEvidence, null, 2)}\n`
  );
  await writeFile(
    path.join(runDirectory, "hoca-bul-analytics-evidence.json"),
    `${JSON.stringify(analyticsEvidence, null, 2)}\n`
  );
}

type EvidenceFinalizerActions = {
  writeEvidence: () => Promise<void>;
  recordEvidenceFailure: (error: unknown) => void;
  writeManifest: (fatalError: unknown) => Promise<void>;
};

async function finalizeEvidence(
  initialFatalError: unknown,
  actions: EvidenceFinalizerActions
): Promise<unknown> {
  let finalFatalError = initialFatalError;
  try {
    await actions.writeEvidence();
  } catch (error) {
    finalFatalError ??= error;
    actions.recordEvidenceFailure(error);
  }
  await actions.writeManifest(finalFatalError);
  return finalFatalError;
}

async function writeFailureManifest(
  runDirectory: string,
  startedAt: string,
  fatalError: unknown
): Promise<void> {
  const errorText =
    fatalError instanceof Error
      ? fatalError.stack ?? fatalError.message
      : fatalError
        ? String(fatalError)
        : null;
  await writeFile(
    path.join(runDirectory, "hoca-bul-failure-manifest.json"),
    `${JSON.stringify(
      {
        status: fatalError || failures.length ? "failed" : "passed",
        startedAt,
        finishedAt: new Date().toISOString(),
        ports: { flagOn: FLAG_ON_PORT, flagOff: FLAG_OFF_PORT },
        failures,
        fatalError: errorText,
      },
      null,
      2
    )}\n`
  );
}

async function main() {
  const startedAt = new Date().toISOString();
  const runDirectory = await prepareRunOutput();
  OUT_DIR = runDirectory;
  const servers: ChildProcess[] = [];
  let browser: Browser | null = null;
  let fatalError: unknown = null;

  try {
    await runHarnessInvariantChecks();
    ok("harness invariant self-checks pass");
    browser = await chromium.launch();

    // Strictly one dev server at a time: two `next dev` processes share this
    // project's single .next directory and corrupt each other's compile, which
    // shows up as routes that render an empty shell forever.
    console.log("\n--- flag on ---");
    const onServer = await bootServer(FLAG_ON_PORT, true);
    servers.push(onServer);
    try {
      await runFlagOn(browser);
    } finally {
      await stopServer(onServer, "flag-on");
    }

    console.log("\n--- flag off ---");
    const offServer = await bootServer(FLAG_OFF_PORT, false);
    servers.push(offServer);
    try {
      await runFlagOff(browser);
    } finally {
      await stopServer(offServer, "flag-off");
    }
  } catch (error) {
    fatalError = error;
    fail(`uncaught harness error: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    try {
      await browser?.close();
    } catch (error) {
      fatalError ??= error;
      fail(`browser shutdown failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    for (let index = 0; index < servers.length; index += 1) {
      const server = servers[index];
      try {
        await stopServer(server, `cleanup-${index + 1}`);
      } catch (error) {
        fatalError ??= error;
        fail(`server cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    try {
      fatalError = await finalizeEvidence(fatalError, {
        writeEvidence: () => writeRunEvidence(runDirectory),
        recordEvidenceFailure: (error) => {
          fail(`evidence write failed: ${error instanceof Error ? error.message : String(error)}`);
        },
        writeManifest: (finalFatalError) =>
          writeFailureManifest(runDirectory, startedAt, finalFatalError),
      });
    } catch (error) {
      fatalError ??= error;
      fail(`failure manifest write failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const completed = !fatalError && failures.length === 0;
  if (completed) {
    try {
      await rename(runDirectory, FINAL_OUT_DIR);
      OUT_DIR = FINAL_OUT_DIR;
      ok("current completed evidence run promoted atomically");
    } catch (error) {
      fatalError = error;
      fail(`evidence promotion failed: ${error instanceof Error ? error.message : String(error)}`);
      try {
        await writeFailureManifest(runDirectory, startedAt, fatalError);
      } catch (manifestError) {
        fail(
          `promotion failure manifest write failed: ${
            manifestError instanceof Error ? manifestError.message : String(manifestError)
          }`
        );
      }
    }
  }

  console.log(`\nevidence: ${completed && !fatalError ? FINAL_OUT_DIR : runDirectory}`);
  for (const note of notes) console.log(`note  ${note}`);
  if (fatalError || failures.length) {
    console.log(`\nFAILURES (${failures.length}):`);
    for (const failure of failures) console.log(`  - ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log("\nall hoca-bul QA checks passed");
}

void main();
