// FE-2 evidence, MOCK ONLY. Chromium against a local production build whose
// API calls are answered here; www.paytr.com is replaced by a local stand-in
// page. Nothing reaches PayTR, a bank or a backend. This proves our side of
// the chain (headers, frame escape, session note, focus, copy) — not how the
// real PayTR iframe or 3D Secure behaves.
//
//   PAYTR_QA_FLAG=on  (build with NEXT_PUBLIC_PAYTR_ENABLED=true)
//   PAYTR_QA_FLAG=off (build without it — the production setting)
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const baseUrl = new URL(process.env.PAYTR_QA_URL || "http://127.0.0.1:3299");
assert.equal(baseUrl.hostname, "127.0.0.1", "QA accepts loopback only");
const flag = process.env.PAYTR_QA_FLAG === "off" ? "off" : "on";
const out = path.resolve(process.env.PAYTR_QA_OUTPUT || "docs/payments/evidence/fe2");
fs.mkdirSync(out, { recursive: true });

const RECOVERY_KEY = "hocam:paytr-attempt:v1:student-1";
const user = { id: "student-1", role: "student", name: "Test", surname: "Öğrenci",
  email: "fixture@example.invalid" };
const purchase = {
  id: "purchase-1", student: { id: "student-1", name: "Test", surname: "Öğrenci" },
  tutor: { id: "tutor-1", name: "Deniz", surname: "Kaya" },
  plan: { id: "plan-1", name: "Haftada 3 ders · 30 gün", code: "w3-d30",
    lesson_count: 12, lesson_duration_minutes: 40, lessons_per_week: 3,
    duration_days: 30, discount_percent: 10 },
  status: "pending", total_credits: 12, remaining_credits: 0, unit_price: 400,
  subtotal_price: 4800, discount_amount: 480, promo_discount_amount: 0,
  total_price: 4320, created_at: "2026-10-07T09:00:00Z", paid_at: null,
  promotion_code: null,
};
const layoutFixtures = {
  "/api/profile/me/": { user: { id: "student-1", role: "student" }, profile: null,
    preferences: {}, stats: {} },
  "/api/profile/streak/": { length: 0, longest: 0, active_today: false, freezes_left: 0,
    frozen_dates: [], last_active_date: null },
  "/api/notifications/summary/": { has_unread: false, unread_count: 0 },
  "/api/auth/account/deletion/status/": { active: false },
  "/api/discovery/consent/": { status: "denied", policy_version: "fixture",
    collection_enabled: false },
};

function paymentStatus({ attempt = false } = {}) {
  return {
    purchase_id: "purchase-1", purchase_status: "pending", paid_at: null,
    provider: "", provider_reference: "", amount_minor: 432000,
    lesson_amount_minor: 432000, coaching_amount_minor: 0, currency: "TL",
    checkout_enabled: flag === "on", has_active_attempt: attempt,
    manual_review: false, requires_reconciliation: false,
    can_start_checkout: flag === "on" && !attempt, can_resume_checkout: false,
    can_retry_checkout: false, can_cancel_unpaid: !attempt,
    checkout_blocked_reason: flag === "on" ? (attempt ? "checkout_in_progress" : "") : "checkout_disabled",
    latest_attempt: attempt ? { merchant_oid: "HOCAM-FIXTURE", status: "token_issued",
      created_at: "2026-10-07T09:00:00Z", completed_at: null } : null,
  };
}

// The stand-in for PayTR's hosted page. Labelled MOCK on screen. With
// ?return=1 it sends its own frame to our success URL, as PayTR might.
function standInPage(returnToUs) {
  return `<!doctype html><meta charset="utf-8"><body style="margin:0;font:16px system-ui;background:#f4f6f8">
<div style="padding:24px;border:2px dashed #888;min-height:520px;box-sizing:border-box">
<p style="margin:0 0 8px;font-weight:600">MOCK — PayTR iframe yerine yerel test sayfası</p>
<p style="margin:0">Gerçek kart alanları burada PayTR tarafından gösterilir.</p></div>
${returnToUs ? `<script>setTimeout(function(){location.href=${JSON.stringify(new URL("/odeme/basarili", baseUrl).href)}},600)</script>` : ""}
</body>`;
}

(async () => {
  // Chromium's Local Network Access checks block a public origin (our
  // www.paytr.com stand-in) from navigating a frame to 127.0.0.1. Real PayTR
  // and the real site are both public, so that block is an artifact of
  // testing on loopback and is switched off for this QA browser only.
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessForNavigations"],
  });
  const results = [];

  async function scenario(name, width, height, run) {
    const context = await browser.newContext({
      viewport: { width, height }, reducedMotion: "reduce", colorScheme: "light",
      serviceWorkers: "block",
    });
    await context.addCookies([{ name: "auth_token", value: "local-fixture",
      domain: "127.0.0.1", path: "/" }]);
    await context.addInitScript(({ user }) => {
      localStorage.setItem("auth_user", JSON.stringify(user));
      localStorage.setItem("hocam-theme", "light");
    }, { user });
    const page = await context.newPage();
    const net = { checkoutPosts: 0, packagePosts: 0, otherWrites: [], statusReads: 0,
      unexpected: [], frameHeaders: [] };
    const control = { statusCode: 200, attempt: false, returnToUs: false };
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    if (process.env.PAYTR_QA_DEBUG) {
      page.on("console", (m) => console.error("console", m.type(), m.text().slice(0, 200)));
      page.on("framenavigated", (f) => console.error("nav", f === page.mainFrame() ? "top" : "frame", f.url()));
      page.on("requestfailed", (r) => console.error("failed", r.url(), r.failure()?.errorText));
      page.on("response", (r) => { if (r.url().includes("/odeme/")) console.error("resp", r.status(), r.url(), JSON.stringify(r.headers()["x-frame-options"]), JSON.stringify(r.headers()["content-security-policy"])); });
    }
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (url.origin === baseUrl.origin && url.pathname.startsWith("/odeme/")) {
        net.frameHeaders.push({ path: url.pathname,
          xfo: response.headers()["x-frame-options"] || null,
          csp: response.headers()["content-security-policy"] || null });
      }
    });
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.hostname === "127.0.0.1" && url.port === "3999") {
        const p = url.pathname;
        if (request.method() === "POST") {
          if (p.endsWith("/auth/presence/")) return route.fulfill({ json: {} });
          if (p.endsWith("/paytr-checkout/")) {
            net.checkoutPosts += 1;
            control.attempt = true;
            return route.fulfill({ json: { merchant_oid: "HOCAM-FIXTURE",
              iframe_url: "https://www.paytr.com/odeme/guvenli/fixture-token" } });
          }
          if (p.endsWith("/payments/package-purchases/")) net.packagePosts += 1;
          net.otherWrites.push(request.method() + " " + p);
          return route.fulfill({ status: 405, json: {} });
        }
        if (layoutFixtures[p]) return route.fulfill({ json: layoutFixtures[p] });
        if (p.endsWith("/auth/me/")) return route.fulfill({ json: user });
        if (p.endsWith("/payments/package-purchases/")) return route.fulfill({ json: [purchase] });
        if (p.includes("acceptance-status")) {
          return route.fulfill({ json: { requires_tutor_acceptance: false, acceptance: null } });
        }
        if (p.includes("payment-status")) {
          net.statusReads += 1;
          if (control.statusCode !== 200) {
            return route.fulfill({ status: control.statusCode, json: { detail: "fixture" } });
          }
          return route.fulfill({ json: paymentStatus({ attempt: control.attempt }) });
        }
        return route.fulfill({ json: [] });
      }
      if (url.origin === "https://www.paytr.com") {
        if (url.pathname.startsWith("/odeme/guvenli/")) {
          return route.fulfill({ contentType: "text/html", body: standInPage(control.returnToUs) });
        }
        net.unexpected.push(url.origin + url.pathname); // e.g. a resizer script
        return route.abort();
      }
      if (url.origin === baseUrl.origin) return route.continue();
      net.unexpected.push(url.origin);
      return route.abort();
    });
    try {
      const extra = await run(page, control, net);
      const file = "fe2-" + name + "-" + width + ".png";
      await page.screenshot({ path: path.join(out, file) });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, file + ": horizontal overflow");
      assert.equal(net.packagePosts, 0, file + ": never a package POST");
      assert.deepEqual(net.otherWrites, [], file + ": no other writes");
      assert.deepEqual(net.unexpected, [], file + ": no external traffic");
      results.push({ scenario: name, flag, width, height, screenshot: file,
        evidence: "mock", url: new URL(page.url()).pathname, ...net, errors, ...extra });
    } finally {
      await context.close();
    }
  }

  async function openFrame(page) {
    await page.goto(new URL("/package-purchases/purchase-1/pay", baseUrl).href);
    await page.getByLabel("Ad soyad").fill("Test Öğrenci");
    await page.getByLabel("Telefon").fill("0555 000 00 00");
    await page.getByLabel("Adres").fill("Test Mahallesi 1, İstanbul");
    await page.getByRole("button", { name: "Güvenli ödemeye geç" }).click();
    await page.locator("iframe[title='PayTR güvenli ödeme']").waitFor();
  }

  const viewports = [[375, 812], [1440, 900]];
  try {
    if (flag === "on") {
      for (const [w, h] of viewports) {
        await scenario("frame-open", w, h, async (page, control, net) => {
          await openFrame(page);
          await page.frameLocator("iframe").getByText("MOCK — PayTR iframe").waitFor();
          const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
          assert.equal(focused, "Kartla ödeme", "focus on the frame heading");
          assert.equal(net.checkoutPosts, 1);
          return { focused };
        });

        await scenario("session-lost", w, h, async (page, control, net) => {
          await openFrame(page);
          control.statusCode = 401; // next 2-second poll loses the session
          await page.getByText("Oturumun kapandı.", { exact: false }).waitFor({ timeout: 10_000 });
          // The app-wide session dialog opens too (modal, so the page behind
          // it is hidden from the accessibility tree); close it first.
          const dialog = page.getByRole("dialog");
          const dialogShown = await dialog.isVisible().catch(() => false);
          if (dialogShown) {
            await page.keyboard.press("Escape");
            await dialog.waitFor({ state: "hidden" });
          }
          const link = page.getByRole("link", { name: "Yeniden giriş yap" });
          assert.equal(await link.getAttribute("href"),
            "/login?returnUrl=%2Fpackage-purchases%2Fpurchase-1%2Fpay");
          assert.ok(await page.locator("iframe[title='PayTR güvenli ödeme']").count(), "frame kept");
          assert.ok(new URL(page.url()).pathname.endsWith("/pay"), "no redirect to /login");
          await page.getByText("Oturumun kapandı.", { exact: false })
            .evaluate((el) => el.closest("[role=status]")?.scrollIntoView({ block: "start" }));
          await page.evaluate(() => window.scrollBy(0, -80));
          return { dialogShown };
        });

        await scenario("return-in-frame", w, h, async (page, control, net) => {
          control.returnToUs = true;
          await openFrame(page);
          await page.waitForURL(/\/odeme\/basarili$/, { timeout: 10_000 });
          await page.getByText("Ödeme sonucu doğrulanıyor").waitFor();
          const framedHeaders = net.frameHeaders.find((r) => r.path === "/odeme/basarili");
          assert.ok(framedHeaders, "return page was requested");
          assert.equal(framedHeaders.xfo, "SAMEORIGIN");
          assert.equal(framedHeaders.csp, "frame-ancestors 'self'");
          return { topWindowPath: new URL(page.url()).pathname };
        });
      }
    }

    for (const [w, h] of viewports) {
      await scenario(flag === "on" ? "return-long-wait" : "flag-off-return", w, h, async (page) => {
        await page.addInitScript(({ key }) => {
          sessionStorage.setItem(key, JSON.stringify({ schemaVersion: 1,
            purchaseId: "purchase-1", merchantOid: "HOCAM-FIXTURE", tutorId: "tutor-1",
            startedAt: Date.now() - 60_000 }));
        }, { key: RECOVERY_KEY });
        await page.goto(new URL("/odeme/basarisiz", baseUrl).href);
        await page.getByText("Ödeme sonucu doğrulanıyor").waitFor();
        const longWait = await page.getByText("Doğrulama beklenenden uzun sürüyor", { exact: false }).count();
        assert.equal(longWait, flag === "on" ? 1 : 0);
        return { longWaitShown: longWait === 1 };
      });
      if (flag === "off") {
        await scenario("flag-off-pay", w, h, async (page) => {
          await page.goto(new URL("/package-purchases/purchase-1/pay", baseUrl).href);
          await page.getByText("Ödeme şu anda kullanılamıyor").waitFor();
          assert.equal(await page.locator("iframe").count(), 0);
          return {};
        });
      }
    }

    fs.writeFileSync(path.join(out, "results-flag-" + flag + ".json"), JSON.stringify({
      capturedAt: new Date().toISOString(), browser: browser.version(), flag,
      evidence: "mock — local production build, local stand-in for PayTR; not real PayTR, 3D Secure, a bank or a backend",
      browserArgs: "Local Network Access checks disabled (loopback-only artifact; see script header)",
      results,
    }, null, 2) + "\n");
    console.log(JSON.stringify({ flag, cases: results.length, output: out }));
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
