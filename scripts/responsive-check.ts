import { chromium, type Browser } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.RESPONSIVE_CHECK_BASE_URL ?? "http://localhost:3000";

const PAGES = ["/", "/match", "/tutors", "/home", "/dashboard/student", "/profile"];

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

const SCREENSHOT_DIR = path.join(process.cwd(), "screenshots");

async function checkPage(browser: Browser, pagePath: string, viewport: (typeof VIEWPORTS)[number]) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
  });
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  const url = `${BASE_URL}${pagePath}`;
  const label = `${pagePath === "/" ? "root" : pagePath.replace(/\//g, "_")}__${viewport.name}`;

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));

    if (overflow.scrollWidth > overflow.innerWidth) {
      console.log(
        `FAIL: horizontal overflow on ${pagePath} @ ${viewport.name} (scrollWidth=${overflow.scrollWidth} > innerWidth=${overflow.innerWidth})`,
      );
    }

    if (consoleErrors.length > 0) {
      console.log(`FAIL: console errors on ${pagePath} @ ${viewport.name}: ${consoleErrors.join(" | ")}`);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${label}.png`),
      fullPage: true,
    });
  } catch (error) {
    console.log(`FAIL: could not load ${pagePath} @ ${viewport.name}: ${(error as Error).message}`);
  } finally {
    await context.close();
  }
}

async function main() {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  const browser = await chromium.launch();

  for (const pagePath of PAGES) {
    for (const viewport of VIEWPORTS) {
      await checkPage(browser, pagePath, viewport);
    }
  }

  await browser.close();
}

main();
