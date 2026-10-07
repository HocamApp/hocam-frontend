/**
 * Puts the homepage next to its mockup, for review.
 *
 * Screenshots `docs/design/product-home/homepage-rebuild/homepage-mockup.html`
 * (with its review notes and bottom bar removed) and the running site's `/`
 * at 1440×960 and 390×844, full page, and writes one side-by-side PNG per
 * viewport and theme to `screenshots/home-mockup/`:
 *
 *   compare__1440__light.png   mockup | site (light)
 *   compare__1440__dark.png    mockup | site (dark)
 *   ...and the same at 390, plus the raw shots each one was built from.
 *
 * The mockup has a single light theme on purpose, so both comparisons use the
 * same mockup shot; the dark pair is there to check the site, not to match it.
 *
 * `/` is public, so no login is involved. The entry promo is marked as seen
 * and the privacy card is hidden so neither covers the page. Run with the dev
 * server up:
 *
 *   npm run home:compare
 */
import { chromium, type Browser, type Page } from "playwright";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const BASE_URL = process.env.HOME_COMPARE_BASE_URL ?? "http://localhost:3000";
const OUT_DIR =
  process.env.HOME_COMPARE_OUT_DIR ?? path.join(process.cwd(), "screenshots", "home-mockup");
const MOCKUP_PATH = path.join(
  process.cwd(),
  "docs/design/product-home/homepage-rebuild/homepage-mockup.html",
);

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 960 },
  { name: "390", width: 390, height: 844 },
] as const;

const THEMES = ["light", "dark"] as const;
type Theme = (typeof THEMES)[number];

/* src/lib/theme.ts THEME_STORAGE_KEY and src/lib/homeEntryPromo.ts
   HOME_ENTRY_PROMO_KEY. Copied rather than imported so the script does not
   pull app modules into a Node process. */
const THEME_STORAGE_KEY = "hocam-theme";
const ENTRY_PROMO_KEY = "hocam:home-entry-promo:v2";

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  // Let lazy images load: scroll through once, then return to the top.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
}

async function shootMockup(browser: Browser, viewport: (typeof VIEWPORTS)[number]) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  try {
    await page.goto(pathToFileURL(MOCKUP_PATH).href, { waitUntil: "load" });
    // The blue tags, dashed boxes and the bottom bar are review notes, not design.
    await page.evaluate(() => {
      document.getElementById("page")?.classList.remove("review");
      document.querySelector(".rv-bar")?.remove();
    });
    await settle(page);
    const file = path.join(OUT_DIR, `mockup__${viewport.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`saved ${file}`);
    return file;
  } finally {
    await context.close();
  }
}

async function shootSite(browser: Browser, viewport: (typeof VIEWPORTS)[number], theme: Theme) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  await context.addInitScript(
    ({ themeKey, theme, promoKey }) => {
      try {
        localStorage.setItem(themeKey, theme);
        localStorage.setItem(promoKey, JSON.stringify({ dismissedAt: Date.now() }));
      } catch {
        /* storage blocked: the shot just keeps the defaults */
      }
    },
    { themeKey: THEME_STORAGE_KEY, theme, promoKey: ENTRY_PROMO_KEY },
  );
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().split("\n")[0]);
  });

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 60_000 });
    await page.addStyleTag({ content: '[aria-label="Gizlilik tercihi"]{display:none!important}' });
    await settle(page);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    if (overflow.scrollWidth > overflow.innerWidth) {
      console.log(
        `FAIL: horizontal overflow on / (${viewport.name}, ${theme}): ` +
          `scrollWidth=${overflow.scrollWidth} > innerWidth=${overflow.innerWidth}`,
      );
    }
    if (consoleErrors.length > 0) {
      console.log(`note: console errors (${viewport.name}, ${theme}): ${consoleErrors.join(" | ")}`);
    }

    const file = path.join(OUT_DIR, `site__${viewport.name}__${theme}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`saved ${file}`);
    return file;
  } finally {
    await context.close();
  }
}

/* Composes the pair in a blank page so the script needs no image library.
   Wide shots are halved so the composite stays a reasonable size. */
async function composeSideBySide(
  browser: Browser,
  viewport: (typeof VIEWPORTS)[number],
  theme: Theme,
  mockupFile: string,
  siteFile: string,
) {
  const scale = viewport.width > 800 ? 0.5 : 1;
  const columnWidth = Math.round(viewport.width * scale);
  const gap = 24;
  const [mockup, site] = await Promise.all(
    [mockupFile, siteFile].map(async (file) => `data:image/png;base64,${(await readFile(file)).toString("base64")}`),
  );

  const context = await browser.newContext({ viewport: { width: columnWidth * 2 + gap * 3, height: 600 } });
  const page = await context.newPage();
  try {
    await page.setContent(`<!doctype html><html><body style="margin:0;background:#888;font:600 14px system-ui;color:#fff">
      <div style="display:flex;gap:${gap}px;padding:${gap}px;align-items:flex-start">
        <figure style="margin:0;width:${columnWidth}px"><figcaption style="padding-bottom:8px">Mockup (${viewport.name})</figcaption><img style="display:block;width:100%" src="${mockup}"></figure>
        <figure style="margin:0;width:${columnWidth}px"><figcaption style="padding-bottom:8px">Site / (${viewport.name}, ${theme})</figcaption><img style="display:block;width:100%" src="${site}"></figure>
      </div></body></html>`);
    await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete));
    const file = path.join(OUT_DIR, `compare__${viewport.name}__${theme}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`saved ${file}`);
  } finally {
    await context.close();
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const viewport of VIEWPORTS) {
      const mockupFile = await shootMockup(browser, viewport);
      for (const theme of THEMES) {
        const siteFile = await shootSite(browser, viewport, theme);
        await composeSideBySide(browser, viewport, theme, mockupFile, siteFile);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
