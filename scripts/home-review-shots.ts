/**
 * Captures authenticated `/home` screenshots for design review.
 *
 * Logs in through the real login form — no auth bypass and no mocked state —
 * for two throwaway student accounts (one populated, one brand new) and
 * captures each at desktop and mobile.
 *
 * Credentials come from a JSON file written by the seeding script and are
 * never logged. Run with the dev server up:
 *
 *   HOME_REVIEW_CREDENTIALS=/path/to/review_credentials.json \
 *   npx tsx scripts/home-review-shots.ts
 */
import { chromium, type Browser } from "playwright";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.HOME_REVIEW_BASE_URL ?? "http://localhost:3100";
const CREDENTIALS_PATH = process.env.HOME_REVIEW_CREDENTIALS;
const OUT_DIR = process.env.HOME_REVIEW_OUT_DIR ?? path.join(process.cwd(), "screenshots", "home-v2");

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile", width: 375, height: 812 },
];

interface Account {
  email: string;
  password: string;
}

async function capture(browser: Browser, label: string, account: Account, viewport: (typeof VIEWPORTS)[number]) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
  });
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.fill('input[name="email"]', account.email);
    await page.fill('input[name="password"]', account.password);
    await page.click('button[type="submit"]');

    // The post-login redirect is a client-side router push, not a document
    // navigation, so wait on the auth cookie the login flow sets instead.
    await page.waitForFunction(() => document.cookie.includes("auth_token="), undefined, {
      timeout: 30_000,
    });

    await page.goto(`${BASE_URL}/home`, { waitUntil: "networkidle", timeout: 30_000 });
    // Let the hero settle on its first slide rather than mid-transition.
    await page.waitForTimeout(1200);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    if (overflow.scrollWidth > overflow.innerWidth) {
      console.log(
        `FAIL: horizontal overflow on /home (${label} @ ${viewport.name}): ` +
          `scrollWidth=${overflow.scrollWidth} > innerWidth=${overflow.innerWidth}`
      );
    } else {
      console.log(`ok: no horizontal overflow (${label} @ ${viewport.name})`);
    }

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

async function main() {
  if (!CREDENTIALS_PATH) {
    throw new Error("HOME_REVIEW_CREDENTIALS must point at the seeded credentials file");
  }
  const accounts = JSON.parse(await readFile(CREDENTIALS_PATH, "utf8")) as Record<string, Account>;

  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  for (const [label, account] of Object.entries(accounts)) {
    for (const viewport of VIEWPORTS) {
      await capture(browser, label, account, viewport);
    }
  }

  await browser.close();
}

main();
