/** Real route + real CSS; only the backend and OS keyboard viewport are fixtures.
 * Run with: npm run test:messages-viewport (local Next server required).
 * Options: MESSAGES_TEST_BROWSER=webkit, MESSAGES_TEST_WIDTH=320,
 * MESSAGES_TEST_COUNT=0, MESSAGES_TEST_BASE_URL=http://localhost:3000.
 * Viewport model: https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport
 * This is not a replacement for a physical iPhone keyboard smoke test.
 */
import assert from "node:assert/strict";
import { chromium, webkit, type Page } from "playwright";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.MESSAGES_TEST_BASE_URL ?? "http://localhost:3000";
const phoneWidth = Number(process.env.MESSAGES_TEST_WIDTH ?? 375);
const messageCount = Number(process.env.MESSAGES_TEST_COUNT ?? 24);
const browserName = process.env.MESSAGES_TEST_BROWSER ?? "chromium";
const withDeletionBanner = process.env.MESSAGES_TEST_DELETION_BANNER === "1";
const outputDir = `screenshots/messages-viewport/${browserName}-${phoneWidth}-${messageCount}`;
const user = { id: "viewport-student", email: "viewport@example.invalid", role: "student", is_email_verified: true };
const conversation = {
  id: "viewport-conversation", student: user.id, tutor: "viewport-tutor",
  lesson_request: "", created_at: "2026-09-02T08:00:00Z", is_blocked: false,
  other_participant: { id: "viewport-tutor", email: "tutor@example.invalid", display_name: "Test Hocası" },
  unread_count: 0, tutor_profile: null,
  latest_message: { preview: "Son test mesajı", created_at: "2026-09-02T08:00:00Z", sender_id: user.id, kind: "text" },
};
const messages = Array.from({ length: messageCount }, (_, index) => ({
  id: `viewport-message-${index}`, sender: index % 2 ? user.id : "viewport-tutor",
  message_text: index === messageCount - 1 ? "Son test mesajı" : `Test mesajı ${index + 1}`,
  created_at: `2026-09-02T08:${String(index).padStart(2, "0")}:00Z`, read_at: null,
  reply_to: null, is_deleted: false, attachment: null,
}));

async function measure(page: Page) {
  return page.evaluate(() => {
    const workspace = document.querySelector(".conversation-page-viewport")!;
    const input = workspace.querySelector("textarea")!;
    const composer = input.closest(".border-t")!;
    const header = workspace.querySelector("section > header")!;
    const list = workspace.querySelector("section > .overflow-y-auto")!;
    const nav = document.querySelector('[aria-label="Mobil ana menü"]');
    const box = (element: Element) => {
      const r = element.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height };
    };
    return {
      workspace: box(workspace), composer: box(composer), input: box(input),
      header: box(header), list: box(list), nav: nav ? box(nav) : null,
      viewport: { height: visualViewport!.height, top: visualViewport!.offsetTop },
      scrollY, documentHeight: document.documentElement.scrollHeight,
      inputFont: getComputedStyle(input).fontSize,
    };
  });
}

async function main() {
const browser = await (browserName === "webkit" ? webkit : chromium).launch();
try {
  const context = await browser.newContext({ viewport: { width: phoneWidth, height: 650 }, isMobile: true, hasTouch: true });
  await context.addInitScript("window.__name = (fn) => fn;");
  await context.addCookies([{ name: "auth_token", value: "local-test-only", url: baseURL }]);
  await context.addInitScript((testUser) => {
    localStorage.setItem("auth_user", JSON.stringify(testUser));
    // Layout viewport deliberately DOES NOT shrink when the keyboard opens.
    const viewport = new EventTarget();
    Object.assign(viewport, { height: 650, width: innerWidth, offsetTop: 0, offsetLeft: 0, scale: 1 });
    Object.defineProperty(window, "visualViewport", { configurable: true, value: viewport });
  }, user);
  await context.route("**/*", async (route) => {
    if (!["xhr", "fetch"].includes(route.request().resourceType()) || route.request().url().includes("_rsc=")) return route.continue();
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    let data: unknown = [];
    if (path.endsWith("/auth/me/")) data = user;
    else if (path.endsWith("/profile/me/")) data = { user, first_name: "Test", last_name: "Öğrenci", avatar_url: null };
    else if (path.endsWith("/conversations/")) data = [conversation];
    else if (path.endsWith(`/conversations/${conversation.id}/`)) data = conversation;
    else if (path.endsWith("/messages/")) data = messages;
    else if (path.endsWith("/typing/")) data = { is_typing: false };
    else if (path.endsWith("/summary/")) data = { unread_count: 0, has_unread: false };
    else if (path.endsWith("/deletion/status/")) data = withDeletionBanner
      ? { active: true, status: "scheduled", scheduled_deletion_at: "2026-09-20T08:00:00Z" }
      : { active: false, status: "inactive" };
    else if (!path.endsWith("/notifications/")) return route.fulfill({ status: 404, json: { detail: "Unavailable in local viewport fixture" } });
    await route.fulfill({ json: data });
  });
  const page = await context.newPage();
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${baseURL}/messages`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.getByRole("button", { name: "Test Hocası ile sohbeti aç" }).click();
  await page.locator("textarea").waitFor();
  await page.waitForTimeout(500);
  await mkdir(outputDir, { recursive: true });
  const closed = await measure(page);
  console.log("Keyboard closed", closed);
  await page.screenshot({ path: `${outputDir}/closed.png` });
  assert.ok(closed.nav);
  assert.ok(Math.abs(closed.composer.bottom - closed.nav.top) < 2, "Composer must meet the tab bar with no empty gap");
  assert.ok(closed.header.top >= 56, "Conversation header must not be hidden under the app header");
  const closedHeaderTop = withDeletionBanner
    ? await page.getByRole("link", { name: "Güvenlik ayarlarından yönetin" }).evaluate((link) => link.parentElement!.parentElement!.getBoundingClientRect().bottom)
    : 56;
  assert.equal(closed.header.top, closedHeaderTop, "The conversation must not cover the account deletion warning");
  // Safari can retain a layout viewport taller than the visible area. Emulate
  // that outer page overflow without changing the real chat's CSS or geometry.
  await page.addStyleTag({ content: "body > div { min-height: 900px; }" });
  await page.evaluate(() => window.scrollTo(0, 80));
  const attemptedScroll = await measure(page);
  assert.equal(attemptedScroll.scrollY, 0, "The outer page must not pan the composer away from the tab bar");
  assert.equal(attemptedScroll.header.top, closedHeaderTop);

  await page.locator("textarea").focus();
  await page.evaluate(() => {
    Object.assign(visualViewport!, { height: 350, offsetTop: 120 });
    visualViewport!.dispatchEvent(new Event("resize"));
    visualViewport!.dispatchEvent(new Event("scroll"));
  });
  await page.waitForTimeout(350);
  const open = await measure(page);
  console.log("Keyboard open + Safari pan", open);
  await page.screenshot({ path: `${outputDir}/keyboard.png` });
  assert.equal(open.nav, null, "Tab bar must leave the keyboard workspace");
  assert.ok(Math.abs(open.composer.bottom - 470) < 2, "Composer must meet the visible keyboard edge, including Safari offsetTop");
  assert.ok(open.header.top >= 120, "Conversation header must remain visible after Safari pans");
  assert.ok(open.list.height >= 100, "Messages must retain a usable scroll region");
  assert.ok(Number.parseFloat(open.inputFont) >= 16, "Input must not trigger iOS focus zoom");

  // Typing and an offset-only pan must not move the composer off the keyboard.
  await page.locator("textarea").fill("Birinci satır\nİkinci satır\nÜçüncü satır");
  await page.evaluate(() => {
    Object.assign(visualViewport!, { offsetTop: 40 });
    visualViewport!.dispatchEvent(new Event("scroll"));
    window.scrollTo(0, 100);
  });
  await page.waitForTimeout(100);
  const panned = await measure(page);
  assert.ok(Math.abs(panned.composer.bottom - 390) < 2, "Offset-only Safari pan must track the keyboard");
  assert.equal(panned.scrollY, 0, "Typing must not scroll the outer document");
  assert.ok(panned.input.height > 42, "Multiline input must grow within the composer");

  for (let cycle = 0; cycle < 3; cycle++) {
    await page.locator("textarea").blur();
    await page.evaluate(() => {
      Object.assign(visualViewport!, { height: 650, offsetTop: 0 });
      visualViewport!.dispatchEvent(new Event("resize"));
    });
    await page.waitForTimeout(100);
    const restored = await measure(page);
    assert.ok(restored.nav);
    assert.ok(Math.abs(restored.composer.bottom - restored.nav.top) < 2, "Keyboard dismissal must not leave an empty gap");
    assert.equal(restored.header.top, closedHeaderTop);
    await page.locator("textarea").focus();
    await page.evaluate(() => {
      Object.assign(visualViewport!, { height: 350, offsetTop: 0 });
      visualViewport!.dispatchEvent(new Event("resize"));
    });
    await page.waitForTimeout(100);
    assert.ok(Math.abs((await measure(page)).composer.bottom - 350) < 2);
  }
  await page.getByRole("button", { name: "Geri", exact: true }).click();
  await page.getByRole("button", { name: "Test Hocası ile sohbeti aç" }).waitFor();
  await page.evaluate(() => {
    Object.assign(visualViewport!, { height: 650, offsetTop: 0 });
    visualViewport!.dispatchEvent(new Event("resize"));
  });
  await page.getByRole("button", { name: "Test Hocası ile sohbeti aç" }).click();
  await page.locator("textarea").waitFor();
  await page.waitForTimeout(100);
  const reopened = await measure(page);
  assert.ok(Math.abs(reopened.composer.bottom - reopened.nav!.top) < 2, "Opening a conversation again must start flush with the tab bar");

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(100);
  const desktop = await measure(page);
  assert.ok(desktop.workspace.top >= 120, "Desktop retains the two-row app header and optional warning");
  assert.equal(desktop.workspace.height, 680, "Desktop retains its existing workspace height");
  assert.equal(await page.locator("body").evaluate((el) => getComputedStyle(el).position), "static", "Desktop must not be scroll-locked");
  await page.screenshot({ path: `${outputDir}/desktop.png` });
  console.log("PASS: keyboard resize/pan, multiline draft, 3 reopen cycles, inbox navigation, desktop geometry");
  await page.setViewportSize({ width: phoneWidth, height: 650 });
  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
  await page.locator(".mobile-messages-shell").waitFor({ state: "detached" });
  assert.equal(await page.locator("body").evaluate((el) => getComputedStyle(el).position), "static", "Leaving messages must release the mobile scroll lock");
  console.log("PASS: scroll lock released on route exit");
  assert.deepEqual(pageErrors, [], "Viewport changes must not cause application errors");
} finally {
  await browser.close();
}
}
void main().catch((error) => { console.error(error); process.exitCode = 1; });
