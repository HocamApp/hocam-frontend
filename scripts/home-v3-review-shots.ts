/**
 * Captures authenticated `/home` screenshots for the V3 visual-polish review.
 *
 * Logs in through the real login form — no auth bypass and no mocked state —
 * for two throwaway student accounts (one populated, one brand new), then
 * captures:
 *   - populated at 390 / 768 / 1024 / 1440 px (full page)
 *   - empty at desktop (1440) and mobile (390)
 *   - detail crops: explore rail, goals rail, first teacher card
 *
 * Credentials come from a JSON file written by the seeding step and are never
 * logged. Run with the dev server up:
 *
 *   HOME_REVIEW_CREDENTIALS=/tmp/home-v3-review-credentials.json \
 *   npx tsx scripts/home-v3-review-shots.ts
 */
import { chromium, type Browser, type Page } from "playwright";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.HOME_REVIEW_BASE_URL ?? "http://localhost:3000";
const CREDENTIALS_PATH = process.env.HOME_REVIEW_CREDENTIALS;
const OUT_DIR =
  process.env.HOME_REVIEW_OUT_DIR ?? path.join(process.cwd(), "screenshots", "home-v3-review");

const POPULATED_VIEWPORTS = [
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 820 },
  { name: "1440", width: 1440, height: 960 },
];

const EMPTY_VIEWPORTS = [
  { name: "desktop", width: 1440, height: 960 },
  { name: "mobile", width: 390, height: 844 },
];

const DETAIL_CROPS: Array<{ name: string; selector: string }> = [
  { name: "explore", selector: 'section[aria-labelledby="home-explore-title"]' },
  { name: "goals", selector: 'section[aria-labelledby="home-goals-title"]' },
  { name: "teacher-card", selector: 'section[aria-labelledby="home-teachers-title"]' },
];

interface Account {
  email: string;
  password: string;
}

async function login(page: Page, account: Account) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.fill('input[name="email"]', account.email);
  await page.fill('input[name="password"]', account.password);
  await page.click('button[type="submit"]');

  // The post-login redirect is a client-side router push, not a document
  // navigation, so wait on the auth cookie the login flow sets instead.
  await page.waitForFunction(() => document.cookie.includes("auth_token="), undefined, {
    timeout: 30_000,
  });
}

async function openHome(page: Page) {
  await page.goto(`${BASE_URL}/home`, { waitUntil: "networkidle", timeout: 30_000 });
  // Let the hero settle on its first slide rather than mid-transition.
  await page.waitForTimeout(1200);
}

async function reportOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  if (overflow.scrollWidth > overflow.innerWidth) {
    console.log(
      `FAIL: horizontal overflow on /home (${label}): ` +
        `scrollWidth=${overflow.scrollWidth} > innerWidth=${overflow.innerWidth}`
    );
  } else {
    console.log(`ok: no horizontal overflow (${label})`);
  }
}

async function captureFullPage(
  browser: Browser,
  label: string,
  account: Account,
  viewport: { name: string; width: number; height: number }
) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
  });
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  try {
    await login(page, account);
    await openHome(page);
    await reportOverflow(page, `${label} @ ${viewport.name}`);
    if (consoleErrors.length > 0) {
      console.log(`FAIL: console errors (${label} @ ${viewport.name}): ${consoleErrors.join(" | ")}`);
    }
    const file = path.join(OUT_DIR, `home_${label}__${viewport.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`saved ${file}`);
  } catch (error) {
    console.log(`FAIL: ${label} @ ${viewport.name}: ${(error as Error).message}`);
  } finally {
    await context.close();
  }
}

async function captureDetailCrops(browser: Browser, account: Account) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();
  try {
    await login(page, account);
    await openHome(page);
    for (const crop of DETAIL_CROPS) {
      const locator = page.locator(crop.selector).first();
      const file = path.join(OUT_DIR, `detail_${crop.name}__1440.png`);
      try {
        await locator.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        await locator.screenshot({ path: file });
        console.log(`saved ${file}`);
      } catch (error) {
        console.log(`FAIL: crop ${crop.name}: ${(error as Error).message}`);
      }
    }
  } finally {
    await context.close();
  }
}

async function main() {
  if (!CREDENTIALS_PATH) {
    throw new Error("HOME_REVIEW_CREDENTIALS must point at the seeded credentials file");
  }
  const accounts = JSON.parse(await readFile(CREDENTIALS_PATH, "utf8")) as Record<string, Account>;

  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  for (const viewport of POPULATED_VIEWPORTS) {
    await captureFullPage(browser, "populated", accounts.populated, viewport);
  }
  for (const viewport of EMPTY_VIEWPORTS) {
    await captureFullPage(browser, "empty", accounts.empty, viewport);
  }
  await captureDetailCrops(browser, accounts.populated);

  await browser.close();
}

main();
