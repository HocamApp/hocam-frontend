// Local synthetic fixtures only. Run against a dev server built with PayTR enabled
// and NEXT_PUBLIC_API_URL=http://127.0.0.1:3999/api. Never contacts PayTR/backend.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const baseUrl = new URL(process.env.PAYTR_QA_URL || "http://127.0.0.1:3299");
assert.equal(baseUrl.hostname, "127.0.0.1", "QA accepts loopback only");
const out = path.resolve(process.env.PAYTR_QA_OUTPUT || "/tmp/paytr-s8r-evidence");
fs.mkdirSync(out, { recursive: true });

const purchase = {
  id: "purchase-1", student: { id: "student-1", name: "Test", surname: "Öğrenci" },
  tutor: { id: "tutor-1", name: "Uzun İsimli Test", surname: "Öğretmeni" },
  plan: { id: "plan-1", name: "Haftada 3 ders · 30 gün", code: "w3-d30",
    lesson_count: 12, lesson_duration_minutes: 40, lessons_per_week: 3,
    duration_days: 30, discount_percent: 10 },
  status: "pending", total_credits: 12, remaining_credits: 0, unit_price: 400,
  subtotal_price: 4800, discount_amount: 480, promo_discount_amount: 0,
  total_price: 4320, created_at: "2026-09-19T09:00:00Z", paid_at: null,
  promotion_code: null,
};
const user = { id: "student-1", role: "student", name: "Test", surname: "Öğrenci",
  email: "fixture@example.invalid" };
const headings = {
  pending: "Hoca onayı bekleniyor", coaching: "Bu paket için ödeme henüz kullanılamıyor",
  paid: "Ödemen onaylandı", cancelled: "Paket iptal edildi", refunded: "Paket iade durumunda",
  missing: "Paket görüntülenemiyor", error: "Paket bilgileri alınamadı",
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  async function check(width, height, state = "ready", theme = "light") {
    const context = await browser.newContext({
      viewport: { width, height }, reducedMotion: "reduce", colorScheme: theme,
      serviceWorkers: "block",
    });
    await context.addCookies([{ name: "auth_token", value: "local-fixture",
      domain: "127.0.0.1", path: "/" }]);
    await context.addInitScript(({ user, theme }) => {
      localStorage.setItem("auth_user", JSON.stringify(user));
      localStorage.setItem("hocam-theme", theme);
    }, { user, theme });
    const page = await context.newPage();
    const errors = [];
    const unexpectedRequests = [];
    const writes = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.hostname === "127.0.0.1" && url.port === "3999") {
        if (request.method() !== "GET") {
          writes.push(request.method() + " " + url.pathname);
          return route.fulfill({ status: 405, json: {} });
        }
        const pathname = url.pathname;
        let data = [];
        if (pathname.endsWith("/auth/me/")) data = user;
        else if (pathname.includes("acceptance-status")) {
          const requires = state === "pending" || state === "coaching";
          data = { requires_tutor_acceptance: requires, acceptance: requires ? {
            id: "a", status: state === "pending" ? "pending" : "accepted",
            expires_at: "2099-09-20T12:00:00Z", responded_at: null,
            includes_coaching: state === "coaching",
          } : null };
        } else if (pathname.endsWith("/package-purchases/")) {
          if (state === "error") return route.fulfill({ status: 500, json: { detail: "fixture" } });
          data = state === "missing" ? [] : [{ ...purchase,
            status: ["paid", "cancelled", "refunded"].includes(state) ? state : "pending" }];
        }
        return route.fulfill({ json: data });
      }
      if (url.origin === baseUrl.origin) return route.continue();
      unexpectedRequests.push(url.origin); // No tokens, URLs or request bodies in output.
      return route.abort();
    });
    try {
      await page.goto(new URL("/package-purchases/purchase-1/pay", baseUrl).href,
        { waitUntil: "networkidle" });
      if (state === "ready") await page.getByLabel("Ad soyad").waitFor();
      else await page.getByText(headings[state], { exact: true }).waitFor();
      const name = state + "-" + width + "-" + theme;
      await page.screenshot({ path: path.join(out, name + ".png"), fullPage: true });
      const metrics = await page.evaluate(() => ({
        width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
        dark: document.documentElement.classList.contains("dark"),
        controls: [...document.querySelectorAll("input, button, header a[aria-label], main a[target]")].map(el => ({
          label: el.getAttribute("aria-label") || el.getAttribute("name") || el.textContent.trim(),
          height: el.getBoundingClientRect().height, font: getComputedStyle(el).fontSize,
        })),
        positiveTabindex: [...document.querySelectorAll("[tabindex]")].some(el => +el.getAttribute("tabindex") > 0),
      }));
      assert.ok(metrics.scrollWidth <= width, name + ": horizontal overflow");
      assert.equal(metrics.dark, theme === "dark");
      assert.equal(metrics.reducedMotion, true);
      assert.equal(metrics.positiveTabindex, false);
      for (const control of metrics.controls.filter(control => control.height > 0)) {
        assert.ok(control.height >= 44, name + ": target below 44px: " + control.label);
      }
      const result = { state, theme, width, height, screenshot: name + ".png", metrics };
      if (state === "ready") {
        // Follow real Tab order through skip link/header/summary/form; do not click to focus.
        const keyboard = [];
        for (let i = 0; i < 16; i++) {
          await page.keyboard.press("Tab");
          const focus = await page.evaluate(() => {
            const el = document.activeElement;
            const style = getComputedStyle(el);
            return { label: el.getAttribute("aria-label") || el.getAttribute("name") || el.textContent.trim(),
              name: el.getAttribute("name"), outline: style.outlineStyle, shadow: style.boxShadow };
          });
          keyboard.push(focus);
          if (focus.name === "user_name") break;
        }
        assert.equal(keyboard.at(-1).name, "user_name", "Keyboard must reach first field");
        assert.ok(keyboard.at(-1).outline !== "none" || keyboard.at(-1).shadow !== "none",
          "First field needs a visible focus indicator");
        result.keyboard = keyboard;
        if (width < 1024) {
          const disclosure = page.getByRole("button", { name: "Fiyat ayrıntıları" });
          await disclosure.focus();
          await page.keyboard.press("Enter");
          assert.equal(await disclosure.getAttribute("aria-expanded"), "true");
          await page.getByText("Ara toplam", { exact: true }).waitFor();
        }
        await page.getByRole("button", { name: "Güvenli ödemeye geç" }).click();
        await page.waitForFunction(() => document.activeElement?.getAttribute("name") === "user_name"
          && document.querySelectorAll('[aria-invalid="true"]').length === 3);
        result.validation = { invalid: 3, focus: "user_name" };
        await page.screenshot({ path: path.join(out, "validation-" + width + "-" + theme + ".png"), fullPage: true });
        fs.writeFileSync(path.join(out, "accessibility-" + width + "-" + theme + ".txt"),
          await page.locator("main").ariaSnapshot());
        // CSS text scaling exercises reflow, not physical mobile keyboard or browser zoom.
        await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        assert.equal(overflow, false, name + ": 200% text overflow");
        result.textScale200Percent = "no horizontal overflow";
      }
      assert.deepEqual(writes, [], "No automatic init or invalid-form POST");
      assert.deepEqual(errors, [], "No browser page errors");
      assert.deepEqual(unexpectedRequests, [], "No unexpected external network traffic");
      results.push({ ...result, errors, writes, unexpectedRequests });
    } finally { await context.close(); }
  }
  try {
    for (const [width, height] of [[320, 568], [375, 812], [768, 1024], [1440, 900]]) {
      await check(width, height);
    }
    for (const state of Object.keys(headings)) await check(375, 812, state);
    await check(375, 812, "ready", "dark");
    fs.writeFileSync(path.join(out, "results.json"), JSON.stringify({
      capturedAt: new Date().toISOString(), browser: browser.version(),
      scope: "local mocked Chromium; not real PayTR, screen reader, or physical mobile keyboard",
      results,
    }, null, 2));
    console.log(JSON.stringify({ cases: results.length, output: out }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
