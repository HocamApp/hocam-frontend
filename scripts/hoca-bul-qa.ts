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
 * What it asserts, and fails loudly on:
 *   - horizontal overflow at 375 / 768 / 1280
 *   - console errors
 *   - hydration warnings
 *   - the flag-off contract: /hoca-bul 404s and the home keeps HomeSubjectSearch
 *
 * Scope boundary. This harness covers layout, theming, reduced motion and
 * deterministic failure states, so its API responses are fixtures. That is the
 * only thing fixtures are for here. They are deliberately labelled as fixtures
 * ("QA Fixture A"), never plausible tutors, and nothing in the app is stubbed or
 * bypassed — every pixel is produced by the production components. Matching
 * correctness, ranking, real supply and real prices are covered by the separate
 * real-API pass against the local Django backend, not by this file.
 */
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "screenshots", "hoca-bul-qa");
const FLAG_ON_PORT = Number(process.env.HOCA_BUL_QA_PORT ?? 3142);
const FLAG_OFF_PORT = FLAG_ON_PORT + 1;
const SETTLE_MS = 900;

const USER_ID = "qa-student-1";
const CARD = 'section[aria-labelledby="hoca-bul-entry-title"]';

const failures: string[] = [];
const notes: string[] = [];

function fail(message: string) {
  failures.push(message);
  console.log(`FAIL  ${message}`);
}

function ok(message: string) {
  console.log(`ok    ${message}`);
}

/**
 * Known-benign console noise. The theme boot script stamps `class` on <html>
 * before React hydrates, which Next reports as an extra server attribute; it is
 * a pre-existing app-wide behaviour, not a /hoca-bul defect.
 */
const BENIGN_CONSOLE = [/Extra attributes from the server/i, /Download the React DevTools/i];

const HYDRATION_PATTERN = /hydrat|did not match|Text content does not match/i;

// --- Fixtures -----------------------------------------------------------------

const user = {
  id: USER_ID,
  email: "qa-student@example.invalid",
  role: "student",
  tutor_profile_id: null,
  is_email_verified: true,
  is_admin: false,
  is_test_account: true,
  jitsi_tutorial_completed: true,
  jitsi_tutorial_grandfathered: false,
  impersonation: null,
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
function fixtureMatch(id: string, level: "strong" | "budget_relaxed") {
  return {
    tutor: {
      id,
      name: "QA Fixture",
      surname: id.toUpperCase(),
      profile_picture: "",
      university: "Örnek Üniversite",
      department: "Matematik",
      hourly_price: level === "strong" ? 550 : 900,
      rating: 4.8,
      total_reviews: 12,
      completed_lessons_count: 20,
      is_verified: true,
      subjects: [],
    },
    score: 90,
    match_level: level,
    reason_codes: ["subject_match", "availability_match", "teaching_style_match", "budget_match"],
    caveat_codes: level === "strong" ? [] : ["budget_relaxed"],
    matched_subjects: ["Matematik"],
    matched_styles: ["foundations_patient"],
    nearest_available_at: level === "strong" ? "2026-08-03T17:00:00Z" : null,
  };
}

type PreviewMode = "matches" | "empty" | "429" | "500";

function previewBody(mode: PreviewMode) {
  if (mode === "empty") return { matches: [], candidate_count: 0 };
  return {
    matches: [fixtureMatch("a", "strong"), fixtureMatch("b", "budget_relaxed")],
    candidate_count: 6,
  };
}

function homeStub(url: string): unknown {
  if (url.includes("/auth/me")) return user;
  if (url.includes("/profile/me")) {
    return {
      user,
      profile: { id: "p-1", name: "QA", surname: "Öğrenci", target_exam_type: "YKS", profile_picture: null },
      preferences: { language: "tr", email_notifications: true, sms_notifications: false },
    };
  }
  // Order matters: /favorites/tutors/ and /tutors/me/ both contain "/tutors",
  // and the favorites endpoint returns a bare array, not a paginated object.
  if (url.includes("/favorites")) return [];
  if (url.includes("/tutors/me")) return {};
  if (url.includes("/subjects")) return [{ id: "1", name: "Matematik", exam_type: "TYT" }];
  if (url.includes("/tutors")) return { count: 0, next: null, previous: null, results: [] };
  if (url.includes("/learning/dashboard")) return { goals: [] };
  if (url.includes("/learning/goal-templates")) return [];
  if (url.includes("/bookings")) return [];
  if (url.includes("/payments/package-purchases")) return [];
  if (url.includes("/payments/package-plans")) return [];
  if (url.includes("/questions/meta")) return { enabled: true, exams: [], subjects: [], years: [] };
  if (url.includes("/questions")) return { count: 0, next: null, previous: null, results: [] };
  if (url.includes("/notifications")) return [];
  if (url.includes("/matching/options")) return matchingOptions;
  if (url.includes("/matching/preferences")) return { preference: null };
  return {};
}

// --- Server -------------------------------------------------------------------

async function bootServer(port: number, flagOn: boolean): Promise<ChildProcess> {
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
  child.kill();
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
  seedDraft?: "none" | "partial" | "complete";
  authenticated?: boolean;
}

interface Harness {
  context: BrowserContext;
  page: Page;
  consoleErrors: string[];
  hydrationWarnings: string[];
  previewRequests: number;
}

async function newHarness(browser: Browser, options: ContextOptions): Promise<Harness> {
  const base = `http://localhost:${options.port}`;
  const context = await browser.newContext({
    viewport: { width: options.width, height: options.height },
    reducedMotion: options.reducedMotion ? "reduce" : "no-preference",
    baseURL: base,
  });

  const harness: Harness = {
    context,
    page: null as unknown as Page,
    consoleErrors: [],
    hydrationWarnings: [],
    previewRequests: 0,
  };

  if (options.authenticated !== false) {
    await context.addCookies([{ name: "auth_token", value: "qa-token", url: base }]);
  }

  await context.route("**/api/**", async (route) => {
    const url = route.request().url();
    const headers = {
      "Access-Control-Allow-Origin": base,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    };

    if (options.authenticated === false && url.includes("/auth/me")) {
      await route.fulfill({ status: 401, headers, contentType: "application/json", body: "{}" });
      return;
    }

    if (url.includes("/matching/preview")) {
      harness.previewRequests += 1;
      const mode = options.previewMode ?? "matches";
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

    await route.fulfill({
      status: 200,
      headers,
      contentType: "application/json",
      body: JSON.stringify(homeStub(url)),
    });
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

  await page.addInitScript(
    ({ cachedUser, dark, seedDraft, userId, authenticated }) => {
      if (authenticated !== false) {
        localStorage.setItem("auth_user", JSON.stringify(cachedUser));
      }
      localStorage.setItem("hocam-theme", dark ? "dark" : "light");

      if (seedDraft === "none") return;
      const now = Date.now();
      const base = {
        meta: { schemaVersion: 1, userId, createdAt: now, updatedAt: now },
        client: { yks_alan: ["TYT"] },
        expiresAt: now + 7 * 24 * 60 * 60 * 1000,
      };
      const draft =
        seedDraft === "partial"
          ? { ...base, answers: { goal: "YKS", stage: "grade_12" }, stepId: "dersler" }
          : {
              ...base,
              answers: {
                goal: "YKS",
                stage: "grade_12",
                subject_keys: ["matematik"],
                challenges: ["foundations"],
                teaching_styles: ["foundations_patient"],
                availability_windows: ["weekday_evening"],
                budget_segment: "balanced",
                schema_version: 1,
              },
              stepId: "kontrol",
            };
      localStorage.setItem(`hocam:hoca-bul-draft:v1:${userId}`, JSON.stringify(draft));
    },
    {
      cachedUser: user,
      dark: Boolean(options.dark),
      seedDraft: options.seedDraft ?? "none",
      userId: USER_ID,
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

function drainDiagnostics(harness: Harness, label: string) {
  if (harness.consoleErrors.length) {
    const unique = Array.from(new Set(harness.consoleErrors));
    fail(`console errors @ ${label}: ${unique.join(" | ").slice(0, 400)}`);
    harness.consoleErrors.length = 0;
  }
  if (harness.hydrationWarnings.length) {
    const unique = Array.from(new Set(harness.hydrationWarnings));
    fail(`hydration warnings @ ${label}: ${unique.join(" | ").slice(0, 400)}`);
    harness.hydrationWarnings.length = 0;
  }
}

async function shoot(page: Page, name: string) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
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
async function answerStep(page: Page, name: string | RegExp, kind: "radio" | "button" = "radio") {
  await page.getByRole(kind, { name, exact: typeof name === "string" }).first().click();
  const cont = page.getByRole("button", { name: /Devam et/ });
  await cont.waitFor({ state: "visible" });
  await page.waitForTimeout(120);
  await cont.click();
  await page.waitForTimeout(220);
}

async function completeYksWizard(page: Page) {
  await answerStep(page, "YKS");
  await answerStep(page, "12. sınıf");
  await answerStep(page, /TYT/, "button");
  await answerStep(page, /Matematik/, "button");
  await answerStep(page, /Konu temellerim eksik/, "button");
  await answerStep(page, /Sabırla temelden anlatan/, "button");
  await answerStep(page, /Hafta içi akşam/, "button");
  await answerStep(page, /Dengeli/);
}

// --- Scenarios ----------------------------------------------------------------

async function runFlagOn(browser: Browser) {
  const port = FLAG_ON_PORT;

  // 1. Home fresh — desktop light. Also the responsive/theme sweep anchor.
  for (const [label, width, height, dark] of [
    ["1280-light", 1280, 900, false],
    ["768-light", 768, 1024, false],
    ["375-light", 375, 812, false],
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

  // 3. Home draft continuation — mobile.
  {
    const h = await newHarness(browser, { port, width: 375, height: 812, seedDraft: "partial" });
    await openHome(h.page);
    await waitForCard(h.page);
    const heading = await h.page.getByRole("heading", { name: "Kaldığın yerden devam et" }).count();
    if (heading < 1) fail("draft continuation state did not render on the home card");
    else ok("draft continuation state renders");
    await checkOverflow(h.page, "home draft mobile");
    await shoot(h.page, "03-home-draft-continuation-mobile");
    drainDiagnostics(h, "home draft mobile");
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

  // 6 + 7. Submission loading and the distinct 429 state.
  {
    const h = await newHarness(browser, { port, width: 1280, height: 900, seedDraft: "complete" });
    await h.page.route("**/matching/preview/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 4000));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(previewBody("matches")) });
    });
    await h.page.goto("/hoca-bul?adim=kontrol&kaynak=sonuclar", { waitUntil: "networkidle" });
    await h.page.waitForTimeout(SETTLE_MS);
    await h.page.getByRole("button", { name: "Eşleşmelerimi gör" }).click();
    await h.page.waitForTimeout(700);
    await shoot(h.page, "06-submission-loading");
    ok("submission loading captured");
    await h.context.close();
  }
  {
    const h = await newHarness(browser, { port, width: 1280, height: 900, seedDraft: "complete", previewMode: "429" });
    await h.page.goto("/hoca-bul?adim=kontrol&kaynak=sonuclar", { waitUntil: "networkidle" });
    await h.page.waitForTimeout(SETTLE_MS);
    await h.page.getByRole("button", { name: "Eşleşmelerimi gör" }).click();
    await h.page.waitForTimeout(1200);
    const throttled = await h.page.getByText(/Çok fazla deneme yaptın/).count();
    if (throttled < 1) fail("429 did not produce its own distinct message");
    else ok("429 shows its distinct message");
    await shoot(h.page, "07-submission-429");
    await h.context.close();
  }

  // 8 + 9 + 10. Results: strong + relaxed, dark, and the zero state.
  {
    const h = await newHarness(browser, { port, width: 1280, height: 900, seedDraft: "complete" });
    await h.page.goto("/hoca-bul/sonuclar", { waitUntil: "networkidle" });
    await waitForResults(h.page);
    const relaxed = await h.page.getByText("Tercihlerine tam uymayan ama yakın öneriler").count();
    if (relaxed < 1) fail("relaxed divider missing from results");
    else ok("relaxed divider renders");
    await checkOverflow(h.page, "results desktop light");
    await shoot(h.page, "08-results-strong-and-relaxed-desktop-light");
    drainDiagnostics(h, "results desktop light");
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
    await shoot(h.page, "10-results-zero-mobile");
    drainDiagnostics(h, "results zero mobile");
    await h.context.close();
  }

  // 11. The P7 blocker in the browser: edit preferences, resubmit, new results.
  {
    const h = await newHarness(browser, { port, width: 1280, height: 900, seedDraft: "complete", previewMode: "empty" });
    await h.page.goto("/hoca-bul/sonuclar", { waitUntil: "networkidle" });
    await waitForResults(h.page);
    await h.page.getByRole("heading", { name: "Şu an tam uyan bir hoca bulamadık" }).waitFor({ timeout: 20_000 });

    // Widen the budget through the real edit link, then resubmit.
    await h.page.getByRole("link", { name: "Bütçemi genişlet" }).click();
    await h.page.waitForURL(/adim=butce/, { timeout: 20_000 });
    await h.page.waitForTimeout(SETTLE_MS);
    await h.page.unroute("**/api/**");
    await h.context.route("**/api/**", async (route) => {
      const url = route.request().url();
      const headers = { "Access-Control-Allow-Origin": `http://localhost:${port}` };
      if (url.includes("/favorites")) {
        await route.fulfill({ status: 200, headers, contentType: "application/json", body: "[]" });
        return;
      }
      if (url.includes("/matching/preview")) {
        await route.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify(previewBody("matches")) });
        return;
      }
      await route.fulfill({ status: 200, headers, contentType: "application/json", body: JSON.stringify(homeStub(url)) });
    });
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
    await shoot(h.page, "11-preference-edit-new-results");
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
    await h.context.close();
  }
}

// --- Main ---------------------------------------------------------------------

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const servers: ChildProcess[] = [];
  let browser: Browser | null = null;

  try {
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
      onServer.kill("SIGTERM");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log("\n--- flag off ---");
    const offServer = await bootServer(FLAG_OFF_PORT, false);
    servers.push(offServer);
    try {
      await runFlagOff(browser);
    } finally {
      offServer.kill("SIGTERM");
    }
  } finally {
    await browser?.close();
    for (const server of servers) server.kill("SIGTERM");
  }

  console.log(`\nscreenshots: ${OUT_DIR}`);
  for (const note of notes) console.log(`note  ${note}`);
  if (failures.length) {
    console.log(`\nFAILURES (${failures.length}):`);
    for (const failure of failures) console.log(`  - ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log("\nall hoca-bul QA checks passed");
}

void main();
