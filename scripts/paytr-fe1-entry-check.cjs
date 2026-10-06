// FE-1 evidence: the package card on /profile/payments in each payment-entry
// state, at 375px and 1440px. Local synthetic fixtures only — run against a
// server built with NEXT_PUBLIC_API_URL=http://127.0.0.1:3999/api; every API
// call is answered here, nothing reaches PayTR or a backend.
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
const out = path.resolve(process.env.PAYTR_QA_OUTPUT || "docs/payments/evidence/fe1");
fs.mkdirSync(out, { recursive: true });

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
  total_price: 4320, created_at: "2026-10-06T09:00:00Z", paid_at: null,
  promotion_code: null,
};

// Neutral answers for what the signed-in layout reads around the page.
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

function acceptance(includesCoaching) {
  return {
    requires_tutor_acceptance: true,
    acceptance: { id: "acceptance-1", status: "accepted", expires_at: "2099-10-08T09:00:00Z",
      responded_at: "2026-10-06T10:00:00Z", includes_coaching: includesCoaching },
    purchase_status: "pending", coaching_service_status: null,
    can_withdraw: false, can_cancel_unpaid: true,
  };
}

function paymentStatus(overrides = {}) {
  return {
    purchase_id: "purchase-1", purchase_status: "pending", paid_at: null,
    provider: "", provider_reference: "", amount_minor: 432000,
    lesson_amount_minor: 432000, coaching_amount_minor: 0, coaching_subtotal_minor: 0,
    coaching_discount_minor: 0, currency: "TL", checkout_enabled: true,
    has_active_attempt: false, manual_review: false, requires_reconciliation: false,
    can_start_checkout: true, can_resume_checkout: false, can_retry_checkout: false,
    can_cancel_unpaid: true, checkout_blocked_reason: "", latest_attempt: null,
    ...overrides,
  };
}

// What each state answers for payment status, and what the card must show.
const states = flag === "on" ? {
  payable: { status: paymentStatus(), expect: { link: "Ödemeye devam et", cancel: true } },
  "open-attempt": {
    status: paymentStatus({ has_active_attempt: true, can_start_checkout: false,
      checkout_blocked_reason: "checkout_in_progress",
      latest_attempt: { merchant_oid: "HOCAM-FIXTURE", status: "token_issued",
        created_at: "2026-10-06T11:00:00Z", completed_at: null } }),
    expect: { link: "Ödeme durumunu kontrol et", cancel: false },
  },
  "status-error": { fail: true, expect: { text: "Ödeme durumu alınamadı.", cancel: false } },
  loading: { hold: true, expect: { loading: true, cancel: false } },
  "coaching-bundle": {
    coaching: true,
    status: paymentStatus({ amount_minor: 582000, coaching_amount_minor: 150000,
      coaching_subtotal_minor: 150000 }),
    expect: { link: "Ödemeye devam et", text: "Çalışma koçluğu dahil", cancel: true },
  },
} : {
  "flag-off": {
    expect: { text: "Öğretmenin kabul etti. Paket henüz ödeme aktivasyonu bekliyor — hiçbir tahsilat yapılmadı.",
      cancel: true, noLinks: true },
  },
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  async function check(width, height, name, spec) {
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
    const errors = [];
    const writes = [];
    const unexpectedRequests = [];
    let paymentStatusReads = 0;
    const held = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.hostname === "127.0.0.1" && url.port === "3999") {
        const pathname = url.pathname;
        // The layout's presence heartbeat is the only write it makes; it is
        // not a payment and stays out of the POST check below.
        if (request.method() === "POST" && pathname.endsWith("/auth/presence/")) {
          return route.fulfill({ json: {} });
        }
        if (request.method() !== "GET") {
          writes.push(request.method() + " " + pathname);
          return route.fulfill({ status: 405, json: {} });
        }
        if (layoutFixtures[pathname]) return route.fulfill({ json: layoutFixtures[pathname] });
        if (pathname.endsWith("/auth/me/")) return route.fulfill({ json: user });
        if (pathname.endsWith("/payments/package-purchases/")) return route.fulfill({ json: [purchase] });
        if (pathname.includes("acceptance-status")) {
          return route.fulfill({ json: acceptance(Boolean(spec.coaching)) });
        }
        if (pathname.includes("payment-status")) {
          paymentStatusReads += 1;
          if (spec.fail) return route.fulfill({ status: 500, json: { detail: "fixture" } });
          if (spec.hold) { held.push(route); return; }
          return route.fulfill({ json: spec.status });
        }
        return route.fulfill({ json: [] });
      }
      if (url.origin === baseUrl.origin) return route.continue();
      unexpectedRequests.push(url.origin); // No tokens, URLs or request bodies in output.
      return route.abort();
    });
    try {
      await page.goto(new URL("/profile/payments", baseUrl).href, { waitUntil: "domcontentloaded" });
      const card = page.locator("div.rounded-md.border", { hasText: "Öğretmen kabul etti" }).first();
      await card.waitFor();
      const { expect } = spec;
      if (expect.link) await card.getByRole("link", { name: expect.link }).waitFor();
      if (expect.text) await card.getByText(expect.text, { exact: true }).waitFor();
      if (expect.loading) {
        await card.getByText("Ödeme durumu kontrol ediliyor").waitFor({ state: "attached" });
        await card.locator(".animate-skeleton-pulse").waitFor();
      }
      await page.waitForTimeout(300);
      const file = "fe1-" + name + "-" + width + ".png";
      // Viewport shot with the card centred: a full-page capture paints the
      // fixed mobile tab bar across the middle of the card.
      await card.evaluate(el => el.scrollIntoView({ block: "center" }));
      await page.waitForTimeout(100);
      await page.screenshot({ path: path.join(out, file) });

      const metrics = await card.evaluate(el => ({
        links: [...el.querySelectorAll("a")].map(a => a.textContent.trim()),
        buttons: [...el.querySelectorAll("button")].map(b => ({
          label: b.textContent.trim(), height: b.getBoundingClientRect().height })),
      }));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, file + ": horizontal overflow");
      assert.equal(metrics.buttons.some(b => b.label === "Paketi iptal et"), expect.cancel,
        file + ": unpaid cancel visibility");
      if (expect.loading) {
        assert.deepEqual(metrics.links, [], file + ": no link while loading");
        assert.deepEqual(metrics.buttons, [], file + ": no button while loading");
      }
      if (expect.noLinks) assert.deepEqual(metrics.links, [], file + ": no payment link");
      if (name === "open-attempt" || name === "status-error") {
        assert.ok(!metrics.links.includes("Ödemeye devam et"), file + ": no second 'pay'");
      }
      const refresh = metrics.buttons.find(b => b.label === "Yenile");
      if (name === "status-error") assert.ok(refresh && refresh.height >= 44, file + ": Yenile >= 44px");
      if (flag === "off") assert.equal(paymentStatusReads, 0, file + ": flag-off must not read payment status");
      else assert.ok(paymentStatusReads >= 1, file + ": payment status was read");
      assert.deepEqual(writes, [], file + ": no POST of any kind");
      assert.deepEqual(unexpectedRequests, [], file + ": no external traffic");
      results.push({ state: name, flag, width, height, screenshot: file, paymentStatusReads,
        writes, errors, unexpectedRequests, card: metrics });
    } finally {
      for (const route of held) await route.fulfill({ json: paymentStatus() }).catch(() => {});
      await context.close();
    }
  }
  try {
    for (const [name, spec] of Object.entries(states)) {
      for (const [width, height] of [[375, 812], [1440, 900]]) await check(width, height, name, spec);
    }
    fs.writeFileSync(path.join(out, "results-flag-" + flag + ".json"), JSON.stringify({
      capturedAt: new Date().toISOString(), browser: browser.version(), flag,
      scope: "local mocked Chromium against a production build; not real PayTR or a real backend",
      results,
    }, null, 2) + "\n");
    console.log(JSON.stringify({ flag, cases: results.length, output: out }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
