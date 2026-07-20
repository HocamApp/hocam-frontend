import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";

const BASE_URL = process.env.MATCHING_CHECK_BASE_URL ?? "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), "screenshots", "matching-motion");

const student = {
  id: "student-motion-qa",
  email: "motion@example.com",
  role: "student",
  tutor_profile_id: null,
  is_email_verified: true,
  is_admin: false,
  is_test_account: true,
  impersonation: null,
};

const options = {
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
    DGS: [{ value: "continuing", label: "Çalışmaya devam ediyorum" }],
    KPSS: [{ value: "intensive", label: "Yoğun dönemdeyim" }],
    UNDECIDED: [{ value: "exploring", label: "Seçenekleri keşfediyorum" }],
  },
  subjects: [
    { key: "matematik", label: "Matematik", subject_ids: ["subject-1"], exam_types: ["TYT"], tutor_count: 14 },
    { key: "fizik", label: "Fizik", subject_ids: ["subject-2"], exam_types: ["TYT"], tutor_count: 8 },
    { key: "turkce", label: "Türkçe", subject_ids: ["subject-3"], exam_types: ["TYT"], tutor_count: 11 },
  ],
  budget_ranges: [
    { id: "economical", label: "Ekonomik", min: 300, max: 500 },
    { id: "balanced", label: "Dengeli", min: 500, max: 750 },
    { id: "premium", label: "Premium", min: 750, max: 1100 },
    { id: "flexible", label: "Esneğim", min: null, max: null },
  ],
};

const preview = {
  candidate_count: 3,
  matches: [0, 1, 2].map((index) => ({
    tutor: {
      id: `tutor-${index + 1}`,
      name: ["Deniz", "Ece", "Mert"][index],
      surname: ["Yılmaz", "Kaya", "Demir"][index],
      profile_picture: null,
      university: ["Boğaziçi Üniversitesi", "ODTÜ", "İTÜ"][index],
      department: "Matematik",
      hourly_price: 520 + index * 90,
      rating: 4.8,
      total_reviews: 12 + index,
      completed_lessons_count: 40 + index * 5,
      is_verified: true,
      subjects: [{ id: "subject-1", name: "Matematik", exam_type: "TYT" }],
    },
    score: 0.92 - index * 0.04,
    match_level: "strong",
    reason_codes: ["subject_match", "availability_match", "teaching_style_match", "budget_match"],
    caveat_codes: [],
    matched_subjects: ["Matematik"],
    matched_styles: ["foundations_patient"],
    nearest_available_at: "2026-07-23T19:00:00+03:00",
  })),
};

type Scenario = {
  name: string;
  viewport: { width: number; height: number };
  reducedMotion?: "reduce";
  language?: "tr" | "en";
  backtrack?: boolean;
  failFirstPreview?: boolean;
};

const scenarios: Scenario[] = [
  { name: "01-desktop-forward", viewport: { width: 1440, height: 900 } },
  { name: "02-desktop-back", viewport: { width: 1280, height: 800 }, backtrack: true },
  { name: "03-mobile", viewport: { width: 375, height: 812 } },
  { name: "04-reduced-motion", viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" },
  { name: "05-english-counter", viewport: { width: 1280, height: 800 }, language: "en" },
  { name: "06-error-retry", viewport: { width: 1280, height: 800 }, failFirstPreview: true },
];

async function installApiMocks(context: BrowserContext, scenario: Scenario) {
  let previewRequests = 0;

  await context.route("**/*", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (pathname.endsWith("/api/auth/me/")) {
      await route.fulfill({ json: student });
      return;
    }
    if (pathname.endsWith("/api/matching/options/")) {
      await route.fulfill({ json: options });
      return;
    }
    if (pathname.endsWith("/api/matching/preview/")) {
      previewRequests += 1;
      if (scenario.failFirstPreview && previewRequests === 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        await route.fulfill({ status: 500, json: { detail: "QA preview failure" } });
        return;
      }
      if (scenario.failFirstPreview) await new Promise((resolve) => setTimeout(resolve, 700));
      await route.fulfill({ json: preview });
      return;
    }
    if (pathname.endsWith("/api/matching/preferences/me/")) {
      const payload = request.postDataJSON();
      await route.fulfill({ json: { preference: { ...payload, updated_at: "2026-07-20T12:00:00Z" } } });
      return;
    }

    await route.continue();
  });

  return () => previewRequests;
}

async function selectAndContinue(page: Page, option: string, nextHeading: string) {
  await page.getByRole("button", { name: option, exact: false }).click();
  const continueButton = page.getByRole("button", { name: "Devam et", exact: true });
  await continueButton.click();

  for (let sample = 0; sample < 9; sample += 1) {
    const visibleHeadingCount = await page
      .locator('[data-testid="matching-question-panel"] h1:visible')
      .count();
    assert.ok(visibleHeadingCount > 0, `blank question frame detected before ${nextHeading}`);
    await page.waitForTimeout(25);
  }

  await page.getByRole("heading", { name: nextHeading, exact: true }).waitFor();
}

async function runQuestionFlow(page: Page, scenario: Scenario) {
  await page.goto(`${BASE_URL}/match`, { waitUntil: "domcontentloaded" });
  try {
    await page.getByRole("button", { name: "Başlayalım", exact: true }).waitFor({ timeout: 10_000 });
  } catch (error) {
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${scenario.name}-startup-failure.png`), fullPage: true });
    console.error("STARTUP DEBUG", scenario.name, page.url(), (await page.locator("body").innerText()).slice(0, 800));
    throw error;
  }
  await page.getByRole("button", { name: "Başlayalım", exact: true }).click();
  await page.getByRole("heading", { name: "Hangi hedef için destek arıyorsun?", exact: true }).waitFor();

  const firstCounter = page.locator('span[translate="no"]', { hasText: "1 / 7" });
  assert.ok((await firstCounter.count()) > 0, "protected 1 / 7 counter is missing");

  await selectAndContinue(page, "YKS", "Şu an hangi aşamadasın?");
  await selectAndContinue(page, "12. sınıf", "Hangi derslerde destek istiyorsun?");

  await page.getByRole("button", { name: /Matematik/ }).click();
  if (scenario.backtrack) {
    await page.getByRole("button", { name: "Geri", exact: true }).click();
    await page.getByRole("heading", { name: "Şu an hangi aşamadasın?", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "12. sınıf", exact: true }).getAttribute("aria-pressed"), "true");
    await page.getByRole("button", { name: "Devam et", exact: true }).click();
    await page.getByRole("heading", { name: "Hangi derslerde destek istiyorsun?", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: /Matematik/ }).getAttribute("aria-pressed"), "true");
  }
  await page.getByRole("button", { name: "Devam et", exact: true }).click();
  await page.getByRole("heading", { name: "Şu an seni en çok zorlayan ne?", exact: true }).waitFor();

  await selectAndContinue(page, "Konu temellerimde eksikler var", "Nasıl bir hoca sana daha iyi gelir?");
  await selectAndContinue(page, "Sabırla temelden anlatan", "Dersleri genellikle ne zaman yapabilirsin?");
  if (scenario.name === "01-desktop-forward" || scenario.name === "03-mobile") {
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${scenario.name}-journey.png`), fullPage: true });
  }
  await selectAndContinue(page, "Hafta içi akşam", "Ders başına hangi bütçe aralığı sana uygun?");

  const lastCounter = page.locator('span[translate="no"]', { hasText: "7 / 7" });
  assert.ok((await lastCounter.count()) > 0, "protected 7 / 7 counter is missing");
  await page.getByRole("button", { name: "Dengeli", exact: false }).click();
  await page.getByRole("button", { name: "Eşleşmelerimi gör", exact: true }).click();

  if (scenario.failFirstPreview) {
    await page.getByRole("heading", { name: "Ders başına hangi bütçe aralığı sana uygun?", exact: true }).waitFor();
    await page.getByRole("button", { name: "Eşleşmelerimi gör", exact: true }).click();
  }

  await page.getByRole("heading", { name: "Sana uygun hocalar", exact: true }).waitFor({ timeout: 10_000 });
  assert.equal(await page.locator('[data-testid="matching-result-card"]').count(), 3);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert.equal(overflow, false, "horizontal overflow detected");
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  try {
    for (const scenario of scenarios) {
      const context = await browser.newContext({
        viewport: scenario.viewport,
        reducedMotion: scenario.reducedMotion ?? "no-preference",
        recordVideo: { dir: OUTPUT_DIR, size: scenario.viewport },
      });
      const getPreviewRequests = await installApiMocks(context, scenario);
      await context.addCookies([{ name: "auth_token", value: "motion-qa-token", url: BASE_URL }]);
      await context.addInitScript(
        ({ user, language }) => {
          localStorage.setItem("auth_user", JSON.stringify(user));
          localStorage.removeItem("hocam:matching-draft:v1:student-motion-qa");
          localStorage.setItem("hocam-interface-language", language);
        },
        { user: student, language: scenario.language ?? "tr" }
      );

      if (scenario.language === "en") {
        await context.route("https://translate.google.com/translate_a/element.js**", async (route) => {
          await route.fulfill({
            contentType: "application/javascript",
            body: `window.google={translate:{TranslateElement:function(_options,id){var root=document.getElementById(id);var select=document.createElement('select');select.className='goog-te-combo';select.appendChild(document.createElement('option'));root.appendChild(select);}}};window.hocamGoogleTranslateInit&&window.hocamGoogleTranslateInit();`,
          });
        });
      }

      const page = await context.newPage();
      const consoleErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });

      await runQuestionFlow(page, scenario);
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(OUTPUT_DIR, `${scenario.name}.png`), fullPage: true });
      const video = page.video();
      await page.close();
      if (video) await video.saveAs(path.join(OUTPUT_DIR, `${scenario.name}.webm`));

      assert.equal(
        getPreviewRequests(),
        scenario.failFirstPreview ? 2 : 1,
        "preview request count does not match the scenario"
      );
      const unexpectedConsoleErrors = scenario.failFirstPreview
        ? consoleErrors.filter((message) => !message.includes("status of 500"))
        : consoleErrors;
      assert.deepEqual(unexpectedConsoleErrors, [], `console errors in ${scenario.name}`);
      await context.close();
      console.log(`PASS ${scenario.name}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
