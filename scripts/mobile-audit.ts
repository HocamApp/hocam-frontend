import { chromium, type BrowserContext, type Page } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.MOBILE_AUDIT_BASE_URL ?? "http://localhost:3000";
const QA_EMAIL = process.env.MOBILE_AUDIT_EMAIL;
const QA_PASSWORD = process.env.MOBILE_AUDIT_PASSWORD;
const TUTOR_ID =
  process.env.MOBILE_AUDIT_TUTOR_ID ?? "562e0619-db7e-44f2-b1d6-579d4fbd1bb4";
const OUTPUT_DIR = path.join(process.cwd(), "screenshots", "mobile-audit");

const VIEWPORTS = [
  { name: "phone-320", width: 320, height: 568 },
  { name: "phone-landscape", width: 812, height: 375 },
] as const;

const PUBLIC_ROUTES = ["/", "/home", "/tutors", `/tutors/${TUTOR_ID}`];
const AUTH_ROUTES = ["/dashboard/student", "/profile", "/messages"];

type AuditResult = {
  scrollW: number;
  width: number;
  over: string[];
  small: string[];
  zoom: string[];
  overlay: boolean;
  hasContent: boolean;
};

async function login(page: Page) {
  if (!QA_EMAIL || !QA_PASSWORD) return false;

  await page.goto(`${BASE_URL}/login`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.locator('input[name="email"]').fill(QA_EMAIL);
  await page.locator('input[name="password"]').fill(QA_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(
    () => document.cookie.includes("auth_token="),
    undefined,
    { timeout: 30_000 },
  );
  return true;
}

async function measure(page: Page): Promise<AuditResult> {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const over: string[] = [];
    if (document.documentElement.scrollWidth > width + 1) {
      document.querySelectorAll("*").forEach((element) => {
        const box = element.getBoundingClientRect();
        if (!box.width || !box.height) return;
        if (box.right <= width + 1 && box.left >= -1) return;
        let parent = element.parentElement;
        let isClipped = false;
        while (parent) {
          const style = getComputedStyle(parent);
          if (style.overflowX !== "visible" || style.overflow !== "visible") {
            isClipped = true;
            break;
          }
          parent = parent.parentElement;
        }
        if (isClipped) return;
        over.push(
          `${element.tagName}.${String((element as HTMLElement).className).slice(0, 70)}`,
        );
      });
    }

    const small: string[] = [];
    const zoom: string[] = [];
    document
      .querySelectorAll(
        'a[href],button,[role="button"],[role="tab"],input,select,summary',
      )
      .forEach((element) => {
        const style = getComputedStyle(element);
        if (style.display === "none" || style.display === "inline") return;
        const wrapper =
          element.tagName === "INPUT" ? element.closest("label") : null;
        const box = (wrapper ?? element).getBoundingClientRect();
        if (box.width && box.height && (box.width < 24 || box.height < 24)) {
          small.push(
            ((element.textContent || element.tagName).trim() || element.tagName).slice(
              0,
              32,
            ),
          );
        }
      });

    document.querySelectorAll("input,textarea,select").forEach((element) => {
      const control = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (
        control.matches(":disabled") ||
        ("readOnly" in control && control.readOnly)
      ) {
        return;
      }
      const type = (control.getAttribute("type") || "").toLowerCase();
      if (
        control.tagName === "INPUT" &&
        !["text", "email", "password", "search", "tel", "url", "number", ""].includes(
          type,
        )
      ) {
        return;
      }
      if (Number.parseFloat(getComputedStyle(control).fontSize) < 16) {
        zoom.push(control.getAttribute("name") || control.tagName);
      }
    });

    return {
      scrollW: document.documentElement.scrollWidth,
      width,
      over,
      small,
      zoom,
      overlay: Boolean(document.querySelector("[data-nextjs-dialog]")),
      hasContent: document.body.innerText.trim().length > 0,
    };
  });
}

async function auditRoute(
  page: Page,
  route: string,
  label: string,
  failures: string[],
) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const onConsole = (message: { type(): string; text(): string }) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  };
  page.on("console", onConsole);
  const onPageError = (error: Error) => pageErrors.push(error.message);
  page.on("pageerror", onPageError);

  await page.goto(`${BASE_URL}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForTimeout(500);

  const result = await measure(page);
  const actionableConsoleErrors = consoleErrors.filter(
    (message) => !message.startsWith("Failed to load resource:"),
  );
  const problem =
    result.scrollW > result.width + 1 ||
    result.over.length > 0 ||
    result.small.length > 0 ||
    result.zoom.length > 0 ||
    result.overlay ||
    !result.hasContent ||
    actionableConsoleErrors.length > 0 ||
    pageErrors.length > 0;

  console.log(`${problem ? "FAIL" : "PASS"} ${label} ${route}`, {
    ...result,
    consoleErrors,
    pageErrors,
  });
  if (problem) failures.push(`${label} ${route}`);

  const routeLabel = route === "/" ? "root" : route.replaceAll("/", "_");
  await page.screenshot({
    path: path.join(OUTPUT_DIR, `${label}${routeLabel}.png`),
    fullPage: true,
  });
  page.off("console", onConsole);
  page.off("pageerror", onPageError);
}

async function auditDialogKeyboard(
  context: BrowserContext,
  failures: string[],
) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${BASE_URL}/tutors/${TUTOR_ID}`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.getByRole("button", { name: "Hocaya Mesaj Gönder" }).click();
  await page.getByRole("textbox", { name: "İlk mesajın" }).focus();
  await page.setViewportSize({ width: 320, height: 320 });
  await page.waitForTimeout(350);

  const dialog = page.getByRole("dialog");
  const box = await dialog.boundingBox();
  const viewport = await page.evaluate(() => ({
    innerHeight: window.innerHeight,
    clientHeight: document.documentElement.clientHeight,
    visualHeight: window.visualViewport?.height ?? window.innerHeight,
    visualOffsetTop: window.visualViewport?.offsetTop ?? 0,
  }));
  const scrollable = await dialog.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      overflowY: style.overflowY,
      boxSizing: style.boxSizing,
      maxHeight: style.maxHeight,
      paddingTop: style.paddingTop,
      paddingBottom: style.paddingBottom,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
    };
  });
  const visible = Boolean(
    box && box.y >= -1 && box.y + box.height <= 321 && box.width <= 321,
  );
  const submitButton = page.getByRole("button", { name: "Mesaj Gönder" });
  await submitButton.scrollIntoViewIfNeeded();
  const submitBox = await submitButton.boundingBox();
  const submitVisible = Boolean(
    submitBox &&
      submitBox.y >= viewport.visualOffsetTop - 1 &&
      submitBox.y + submitBox.height <=
        viewport.visualOffsetTop + viewport.visualHeight + 1,
  );
  const usable =
    visible &&
    ["auto", "scroll"].includes(scrollable.overflowY) &&
    scrollable.scrollHeight > scrollable.clientHeight &&
    submitVisible;

  console.log(`${usable ? "PASS" : "FAIL"} dialog keyboard`, {
    box,
    scrollable,
    viewport,
    submitBox,
  });
  if (!usable) failures.push("dialog keyboard");
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "dialog-keyboard.png"),
  });
  await page.close();
}

async function auditMobileControls(
  context: BrowserContext,
  failures: string[],
) {
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/home`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForTimeout(300);

  const nav = page.getByRole("navigation", { name: "Mobil ana menü" });
  const navBox = await nav.boundingBox();
  const navPaddingRight = await nav.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).paddingRight),
  );
  const items = nav.locator(":scope > *");
  const lastBox = await items.last().boundingBox();
  const fillsWidth = Boolean(
    navBox &&
      lastBox &&
      Math.abs(
        lastBox.x + lastBox.width -
          (navBox.x + navBox.width - navPaddingRight),
      ) <= 2,
  );
  console.log(`${fillsWidth ? "PASS" : "FAIL"} mobile tab bar width`, {
    navBox,
    lastBox,
    navPaddingRight,
    itemCount: await items.count(),
  });
  if (!fillsWidth) failures.push("mobile tab bar width");

  await page.goto(`${BASE_URL}/tutors/${TUTOR_ID}`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  const saveButton = page.getByRole("button", {
    name: /Listeme (kaydet|çıkar)/,
  });
  await saveButton.focus();
  await page.waitForTimeout(250);
  const visibleTooltips = await page.locator('[role="tooltip"]:visible').count();
  const tooltipHidden = visibleTooltips === 0;
  console.log(`${tooltipHidden ? "PASS" : "FAIL"} coarse pointer tooltip`, {
    visibleTooltips,
  });
  if (!tooltipHidden) failures.push("coarse pointer tooltip");
  await page.close();
}

async function main() {
  if (!QA_EMAIL || !QA_PASSWORD) {
    throw new Error(
      "MOBILE_AUDIT_EMAIL and MOBILE_AUDIT_PASSWORD are required for authenticated mobile checks.",
    );
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const failures: string[] = [];

  for (const viewport of VIEWPORTS) {
    for (const theme of ["light", "dark"] as const) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript((selectedTheme) => {
        localStorage.setItem("hocam-theme", selectedTheme);
      }, theme);
      const page = await context.newPage();
      const label = `${viewport.name}-${theme}`;

      for (const route of PUBLIC_ROUTES) {
        await auditRoute(page, route, label, failures);
      }

      await login(page);
      for (const route of AUTH_ROUTES) {
        await auditRoute(page, route, label, failures);
      }

      await page.close();
      await context.close();
    }
  }

  const context = await browser.newContext({
    viewport: { width: 320, height: 568 },
    hasTouch: true,
    isMobile: true,
  });
  await login(await context.newPage());
  await auditDialogKeyboard(context, failures);
  await auditMobileControls(context, failures);
  await context.close();

  await browser.close();
  if (failures.length > 0) {
    console.error(`Mobile audit failed: ${failures.join(", ")}`);
    process.exitCode = 1;
  }
}

void main();
