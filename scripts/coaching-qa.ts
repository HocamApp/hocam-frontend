import { strict as assert } from "node:assert";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, type BrowserContext, type Locator, type Page, type Route } from "playwright";

const ROOT = process.cwd();
const PORT = Number(process.env.COACHING_QA_PORT ?? 3158);
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = process.env.COACHING_QA_OUT
  ? path.resolve(ROOT, process.env.COACHING_QA_OUT)
  : path.join(ROOT, "screenshots", "coaching-qa", "visual-polish-v2");

type Role = "tutor" | "student";
type Scenario = "empty" | "onboarding" | "draft" | "published" | "checkout-disabled" | "availability-empty" | "earnings-zero" | "earnings-populated";
type QaState = {
  role: Role;
  scenario: Scenario;
  acceptancePosts: number;
  bookingStarted: number;
  flagPending: boolean;
  releaseFlag: (() => void) | null;
  unknown: string[];
};

const examGroups = ["YKS", "DGS", "KPSS"];
const plan = {
  id: "plan-qa",
  frequency: "weekly",
  session_duration_minutes: 30,
  price_per_session_minor: 25000,
  price_per_session_display: "250,00 ₺",
  price_cap_minor: 73500,
  max_active_students: 3,
  target_exam_types: examGroups,
  description: "Haftalık program takibi ve deneme değerlendirmesi.",
  is_published: true,
  is_accepting_new_students: true,
  published_at: "2026-08-10T09:00:00Z",
  capacity: null,
  created_at: "2026-08-01T09:00:00Z",
  updated_at: "2026-08-10T09:00:00Z",
};
const capacity = {
  weekly_slot_count: 6,
  theoretical_capacity: 6,
  max_active_students: 3,
  active_students: 1,
  is_accepting_new_students: true,
  can_accept_new_student: true,
  slots: [{ day_of_week: 0, start_time: "18:00" }],
};
const sessions = [{
  id: "session-qa",
  sequence_number: 1,
  week_index: 1,
  status: "scheduled",
  scheduled_start: "2026-08-20T18:00:00+03:00",
  scheduled_local_date: "2026-08-20",
  scheduled_local_time: "18:00:00",
  duration_minutes: 30,
  reschedule_count: 0,
  student_name: "QA Öğrenci",
  report_due_at: null,
  report_overdue: false,
  complaint_eligible_at: null,
  complaint_eligible: false,
}];
const acceptanceRequests = [
  {
    id: "coaching-request",
    student: { id: "student-qa", name: "Koçluk", surname: "Öğrencisi" },
    package: { id: "package-1", plan_name: "1 Ay", lessons_per_week: 2, duration_days: 30, total_credits: 8, total_price: 9000 },
    coaching: { frequency: "weekly", total_sessions: 4, total_price_minor: 94000, service_status: "pending" },
    includes_coaching: true,
    status: "pending",
    purchase_status: "pending_tutor_acceptance",
    requested_at: "2026-08-11T09:00:00Z",
    expires_at: "2026-08-13T09:00:00Z",
    responded_at: null,
    rejection_reason: "",
    rejection_note: "",
  },
  {
    id: "lesson-request",
    student: { id: "student-lesson", name: "Ders", surname: "Öğrencisi" },
    package: { id: "package-2", plan_name: "2 Hafta", lessons_per_week: 2, duration_days: 14, total_credits: 4, total_price: 4000 },
    coaching: null,
    includes_coaching: false,
    status: "pending",
    purchase_status: "pending_tutor_acceptance",
    requested_at: "2026-08-11T09:00:00Z",
    expires_at: "2026-08-13T09:00:00Z",
    responded_at: null,
    rejection_reason: "",
    rejection_note: "",
  },
];

// The checkout consumes the tutor-scoped catalog rather than a client-side
// duration table. Keep the deterministic fixture shaped like that API so the
// rollout browser check exercises the same package-selection boundary.
const tutorOfferedPlans = [14, 30, 90, 180].map((durationDays) => {
  const weeks = durationDays === 14 ? 2 : durationDays === 30 ? 4 : durationDays === 90 ? 12 : 24;
  const discountPercent = durationDays === 14 ? 1 : durationDays === 30 ? 6 : durationDays === 90 ? 16 : 26;
  return {
    id: `package-${durationDays}`,
    name: `${weeks} Hafta`,
    code: `weekly_2_${durationDays}d`,
    lesson_count: weeks * 2,
    lesson_duration_minutes: 40,
    lessons_per_week: 2,
    duration_days: durationDays,
    discount_percent: discountPercent,
    is_active: true,
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
  };
});

const avatarPath = "/images/home-v3/hero-v2/yks-students.jpg";
const tutorProfile = {
  id: "profile-tutor-qa", user: "tutor-qa", name: "QA", surname: "Tutor",
  profile_picture: avatarPath, intro_video_url: "", bio: "Yerel QA profili.", university: "Örnek Üniversite",
  department: "Matematik", yks_rank: 100, hourly_price: 980, rating: 4.8, total_reviews: 4,
  completed_lessons_count: 12, is_verified: true, is_public: true, accepting_new_students: true,
  teaching_styles: [], teaching_attributes: [], is_online: false, last_seen_at: null,
  trial_lesson_eligible: false, trial_lessons_remaining: 0, subjects: [], created_at: "2026-08-01T09:00:00Z",
  offers_coaching: true,
  coaching: {
    frequency: "weekly", session_duration_minutes: 30, price_per_session_minor: 25000,
    price_per_session_display: "250,00 ₺", is_free: false, target_exam_types: examGroups,
    description: plan.description, is_accepting_new_students: true,
  },
};
const booking = {
  id: "booking-qa",
  student: { id: "student-qa", email: "ogrenci@example.invalid", display_name: "QA Öğrenci", avatar_url: avatarPath },
  tutor: { id: tutorProfile.id, name: "QA", surname: "Tutor", profile_picture: avatarPath },
  subject: { id: "subject-qa", name: "Matematik", exam_type: "YKS" },
  start_time: "2026-08-20T16:00:00+03:00", duration_minutes: 40, price: 980,
  status: "confirmed", lesson_request: null, package_purchase: "purchase-qa", package_credit_units_used: 1,
  created_at: "2026-08-01T09:00:00Z", conversation_id: "conversation-qa",
};

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    headers: { "Access-Control-Allow-Origin": BASE, "Access-Control-Allow-Credentials": "true" },
    body: JSON.stringify(body),
  });
}

function onboardingState(scenario: Scenario) {
  if (scenario === "onboarding") {
    return {
      current_step: 0, current_step_key: "carousel", steps: ["carousel", "control_questions", "contract", "plan"],
      is_completed: false, completed_at: null, control_question_answers: {}, all_control_questions_correct: false,
      has_accepted_current_contract: false,
      carousel_slides: [{ id: "scope", title: "Koçluğun kapsamı", body: "Çalışma düzeni, program ve gelişim takibi." }],
      control_questions: [],
    };
  }
  return { current_step: 4, current_step_key: null, steps: ["carousel", "control_questions", "contract", "plan"], is_completed: true, completed_at: "2026-08-01T09:00:00Z", control_question_answers: {}, all_control_questions_correct: true, has_accepted_current_contract: true, carousel_slides: [], control_questions: [] };
}

async function installApi(context: BrowserContext, state: QaState) {
  await context.addCookies([{ name: "auth_token", value: "coaching-qa-token", url: BASE }]);
  await context.addInitScript((role: Role) => {
    localStorage.setItem("auth_user", JSON.stringify({
      id: `${role}-qa`, email: `${role}@example.invalid`, role,
      tutor_profile_id: role === "tutor" ? "profile-tutor-qa" : null,
      is_email_verified: true, is_admin: false, is_test_account: true,
      jitsi_tutorial_completed: true, jitsi_tutorial_grandfathered: true, impersonation: null,
    }));
  }, state.role);

  await context.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    const method = request.method();
    if (process.env.COACHING_QA_DEBUG === "1") console.error(`API ${method} ${pathname}`);
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": BASE, "Access-Control-Allow-Credentials": "true", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS" } });
    const user = { id: `${state.role}-qa`, email: `${state.role}@example.invalid`, role: state.role, tutor_profile_id: state.role === "tutor" ? tutorProfile.id : null, is_email_verified: true, is_admin: false, is_test_account: true, jitsi_tutorial_completed: true, jitsi_tutorial_grandfathered: true, impersonation: null };
    if (pathname === "/api/auth/me/") return json(route, user);
    if (pathname === "/api/discovery/consent/") return json(route, { consented: false, updated_at: null });
    if (pathname === "/api/auth/presence/") return route.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": BASE, "Access-Control-Allow-Credentials": "true" }, body: "" });
    if (pathname === "/api/profile/me/") return json(route, {
      user: { id: user.id, role: state.role },
      profile: state.role === "tutor" ? tutorProfile : { id: "student-profile-qa", name: "QA", surname: "Öğrenci", grade: "12", school: "", target_exam_type: "YKS", target_rank: null, bio: "", avatar_url: avatarPath },
      preferences: { dark_mode: false, notify_messages: true, notify_lesson_requests: true, notify_booking_reminders: true, notify_email: true, notify_coaching_updates: true, language: "tr" },
      stats: { upcoming_lessons_count: 0, pending_bookings_count: 0, pending_reviews_count: 0 },
    });
    if (pathname === "/api/auth/account/deletion/status/") return json(route, { active: false, status: "none", scheduled_deletion_at: null });
    if (pathname === "/api/notifications/summary/") return json(route, { unread_count: 0 });
    if (pathname === "/api/coaching/flag/") {
      if (state.flagPending) {
        return new Promise<void>((resolve) => {
          state.releaseFlag = () => {
            state.flagPending = false;
            json(route, { enabled: true, checkout_enabled: state.scenario !== "checkout-disabled" });
            resolve();
          };
        });
      }
      return json(route, { enabled: true, checkout_enabled: state.scenario !== "checkout-disabled" });
    }
    if (pathname === "/api/discovery/interactions/") {
      const body = request.postDataJSON() as { kind?: string } | null;
      if (body?.kind === "booking_started") state.bookingStarted += 1;
      return json(route, {});
    }
    if (pathname === "/api/coaching/onboarding/") return json(route, onboardingState(state.scenario));
    if (pathname === "/api/coaching/tutor/setup-config/") return json(route, {
      exam_groups: examGroups, session_duration_minutes: 30, lesson_price_minor: 98000, lesson_price_display: "980,00 ₺",
      max_price_ratio_percent: 75, price_cap_minor: 73500, price_cap_display: "735,00 ₺", commission_bps: 1500,
      frequency_options: [
        { value: "biweekly", label: "İki haftada 1", packages: [{ duration_days: 14, weeks: 2, total_sessions: 1 }, { duration_days: 30, weeks: 4, total_sessions: 2 }, { duration_days: 90, weeks: 12, total_sessions: 6 }, { duration_days: 180, weeks: 24, total_sessions: 12 }] },
        { value: "weekly", label: "Haftada 1", packages: [{ duration_days: 14, weeks: 2, total_sessions: 2 }, { duration_days: 30, weeks: 4, total_sessions: 4 }, { duration_days: 90, weeks: 12, total_sessions: 12 }, { duration_days: 180, weeks: 24, total_sessions: 24 }] },
        { value: "twice_weekly", label: "Haftada 2", packages: [{ duration_days: 14, weeks: 2, total_sessions: 4 }, { duration_days: 30, weeks: 4, total_sessions: 8 }, { duration_days: 90, weeks: 12, total_sessions: 24 }, { duration_days: 180, weeks: 24, total_sessions: 48 }] },
      ],
    });
    if (pathname === "/api/coaching/plan/") {
      if (state.scenario === "empty") return json(route, null);
      const isPublished = ["published", "checkout-disabled", "earnings-zero", "earnings-populated"].includes(state.scenario);
      return json(route, { ...plan, is_published: isPublished, published_at: isPublished ? plan.published_at : null });
    }
    if (pathname === "/api/coaching/capacity/") return json(route, capacity);
    if (pathname === "/api/coaching/availability/") return json(route, state.scenario === "availability-empty" ? [] : [{ id: "window-qa", day_of_week: 0, start_time: "18:00", end_time: "21:00", created_at: "2026-08-01T09:00:00Z" }]);
    if (pathname === "/api/coaching/plan/preview/") return json(route, { tutor_name: "QA Tutor", frequency: "weekly", frequency_display: "Haftada 1 görüşme", session_duration_minutes: 30, price_per_session_minor: 25000, price_per_session_display: "250,00 ₺", is_free: false, target_exam_types: examGroups, description: plan.description, capacity_available: true });
    if (pathname === "/api/coaching/plan/revenue-preview/") return json(route, { commission_bps: 1500, unit_price_minor: 25000, unit_price_display: "250,00 ₺", rows: [2, 4, 12, 24].map((weeks) => ({ duration_days: weeks === 2 ? 14 : weeks === 4 ? 30 : weeks === 12 ? 90 : 180, weeks, total_sessions: weeks, discount_percent: weeks === 2 ? 1 : weeks === 4 ? 6 : weeks === 12 ? 16 : 26, subtotal_price_minor: weeks * 25000, subtotal_price_display: `${weeks * 250},00 ₺`, discount_amount_minor: 0, discount_amount_display: "0,00 ₺", total_price_minor: weeks * 25000, total_price_display: `${weeks * 250},00 ₺`, platform_fee_minor: 3750 * weeks, platform_fee_display: `${37.5 * weeks} ₺`, tutor_net_minor: 21250 * weeks, tutor_net_display: `${212.5 * weeks} ₺` })) });
    if (pathname === "/api/payments/tutor-acceptance/requests/") return json(route, acceptanceRequests);
    if (pathname === "/api/payments/tutor-acceptance/config/") return json(route, { enabled: true, has_open_requests: true, acceptance_expiry_hours: 48 });
    if (/^\/api\/payments\/tutor-acceptance\/requests\/[^/]+\/respond\/$/.test(pathname)) { state.acceptancePosts += 1; return json(route, { ...acceptanceRequests[0], status: "accepted" }); }
    if (pathname === "/api/coaching/students/") return json(route, []);
    if (pathname === "/api/coaching/tutor/sessions/" || pathname === "/api/coaching/sessions/") return json(route, state.scenario === "availability-empty" ? [] : sessions);
    if (pathname === "/api/coaching/tutor/time-requests/" || pathname === "/api/coaching/tutor/reschedule-requests/") return json(route, []);
    if (pathname === "/api/coaching/tutor/earnings/") {
      if (state.scenario === "earnings-zero") {
        return json(route, { eligible_unfunded_minor: 0, pending_minor: 0, on_hold_minor: 0, reversed_minor: 0, payout_batches: [] });
      }
      return json(route, {
        eligible_unfunded_minor: 123456,
        pending_minor: 50000,
        on_hold_minor: 10000,
        reversed_minor: 2500,
        payout_batches: [
          { local_month: "2026-03", status: "ready", total_amount_minor: 52000, paid_at: null },
          { local_month: "2026-04", status: "ready", total_amount_minor: 78000, paid_at: null },
          { local_month: "2026-05", status: "ready", total_amount_minor: 67000, paid_at: null },
          { local_month: "2026-06", status: "ready", total_amount_minor: 98000, paid_at: null },
          { local_month: "2026-07", status: "ready", total_amount_minor: 112000, paid_at: null },
          { local_month: "2026-08", status: "ready", total_amount_minor: 123456, paid_at: null },
        ],
      });
    }
    if (pathname === "/api/coaching/tutor/disputes/" || pathname === "/api/coaching/disputes/") return json(route, []);
    if (pathname === "/api/coaching/purchases/purchase-qa/dispute-eligibility/") return json(route, { categories: [], submission_key: "qa-submission", evidence_ids: [] });
    if (pathname === "/api/coaching/purchases/purchase-qa/financial-summary/") return json(route, { service_status: "active", financial_status: "unfunded", collected_amount_minor: 0, refund_liability_minor: 0, refund_processing_count: 0, refund_settled_minor: 0, cancellation_pending: false, refund_state: "nothing_to_settle" });
    if (pathname === "/api/coaching/reports/") return json(route, []);
    if (pathname === "/api/coaching/scheduling/") return state.role === "student" && state.scenario !== "empty" ? json(route, { id: "purchase-qa", service_period_id: "period-qa", service_status: "active", frequency: "weekly", weeks: 4, total_sessions: 4, slot_selection_deadline_at: "2026-08-15T09:00:00Z", required_slot_count: 1 }) : json(route, null);
    if (pathname === "/api/coaching/scheduling/slots/") return json(route, { availability_slots: [{ day_of_week: 0, start_time: "18:00" }], accepted_proposals: {} });
    if (pathname === "/api/coaching/my-recurring-slots/") return json(route, { purchase_id: "purchase-qa", slots: [{ id: "slot-qa", slot_index: 0, day_of_week: 0, start_time: "18:00", source: "availability" }] });
    if (pathname === "/api/coaching/service-periods/period-qa/program/") return json(route, { id: "program-qa", service_period_id: "period-qa", title: "Ağustos çalışma programı", objective: "Düzenli deneme takibi", start_date: "2026-08-01", end_date: "2026-08-31", tasks: [] });
    if (pathname === "/api/tutors/me/" || pathname === `/api/tutors/${tutorProfile.id}/`) return json(route, tutorProfile);
    if (pathname === `/api/payments/tutors/${tutorProfile.id}/offered-plans/`) return json(route, tutorOfferedPlans);
    if (pathname === "/api/coaching/eligibility/" || pathname === `/api/coaching/tutors/${tutorProfile.id}/eligibility/`) return json(route, { eligible: true, reason: "ok", message: "Koçluk bu ders paketiyle seçilebilir.", plan: tutorProfile.coaching });
    if (pathname === `/api/tutors/${tutorProfile.id}/availability/`) return json(route, []);
    if (pathname === "/api/bookings/") return json(route, [booking]);
    if (pathname === "/api/conversations/" || pathname === "/api/availability/" || pathname === "/api/payments/tutor/package-offers/" || pathname === "/api/payments/tutor/package-purchases/") return json(route, []);
    if (pathname === "/api/payments/tutor/earnings/") return json(route, { last_7_days: { total: 0, lesson_count: 0 }, last_30_days: { total: 0, lesson_count: 1 }, lifetime: { total: 0, lesson_count: 12 } });
    if (pathname.startsWith("/api/tutors/me/price-insight/")) return json(route, { recommended_price: null, market_range: { low: null, high: null }, sample_size: 0, basis: "insufficient_data", commission_rate_bps: 1500 });
    if (pathname.includes("/reviews/") || pathname.endsWith("/review-summary/")) return json(route, pathname.endsWith("/review-summary/") ? { overall_rating: 0, review_count: 0, criteria_ratings: {}, subject_ratings: [] } : { count: 0, next: null, previous: null, results: [] });
    if (pathname === "/api/tutors/tutorial-progress/") return json(route, { required_version: 1, completed_at: "2026-08-01T09:00:00Z", current_version: 1 });
    if (pathname.startsWith("/api/notifications/") || pathname.startsWith("/api/learning/") || pathname.startsWith("/api/tutor-student/")) return json(route, []);
    state.unknown.push(`${method} ${pathname}`);
    return json(route, method === "GET" ? [] : {}, method === "GET" ? 200 : 204);
  });
}

async function waitForServer(process: ChildProcess) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (process.exitCode !== null) throw new Error(`Next dev exited with ${process.exitCode}`);
    try { const response = await fetch(BASE); if (response.ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error("Next dev did not become ready");
}

async function assertPage(page: Page, route: string, heading: RegExp | string, label: string) {
  const errors: string[] = [];
  const onError = (error: Error) => errors.push(error.message);
  page.on("pageerror", onError);
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
  try {
    await page.getByRole("heading", { level: 1, name: heading }).waitFor({ timeout: 10_000 });
  } catch (error) {
    console.error(JSON.stringify({ label, url: page.url(), body: (await page.locator("body").innerText()).slice(0, 2_000), errors, auth: await page.evaluate(() => ({ cookie: document.cookie, user: localStorage.getItem("auth_user") })) }, null, 2));
    throw error;
  }
  const geometry = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth, overlay: Boolean(document.querySelector("[data-nextjs-dialog]")) }));
  assert.ok(geometry.scroll <= geometry.client, `${label}: horizontal overflow ${geometry.scroll} > ${geometry.client}`);
  assert.equal(geometry.overlay, false, `${label}: Next error overlay`);
  assert.deepEqual(errors, [], `${label}: page errors`);
  const visibleText = await page.locator("body").innerText();
  assert.doesNotMatch(visibleText, /\b(?:AM|PM)\b/, `${label}: locale time marker leaked`);
  assert.doesNotMatch(visibleText, /\bbundle\b/i, `${label}: internal bundle terminology leaked`);
  page.off("pageerror", onError);
}

async function capture(page: Page, state: QaState, options: {
  file: string;
  route: string;
  heading: RegExp | string;
  scenario: Scenario;
  role?: Role;
  fullPage?: boolean;
  scrollToHeading?: RegExp | string;
  waitForText?: RegExp | string;
  assertTryPrecision?: boolean;
  scrollSubnavBy?: number;
}) {
  state.role = options.role ?? "tutor";
  state.scenario = options.scenario;
  if (page.url() === "about:blank") {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  }
  await page.evaluate((role: Role) => {
    const current = JSON.parse(localStorage.getItem("auth_user") ?? "{}");
    localStorage.setItem("auth_user", JSON.stringify({
      ...current,
      id: `${role}-qa`,
      email: `${role}@example.invalid`,
      role,
      tutor_profile_id: role === "tutor" ? "profile-tutor-qa" : null,
    }));
  }, state.role);
  await page.goto("about:blank");
  await assertPage(page, options.route, options.heading, options.file);
  if (options.waitForText) {
    await page.getByText(options.waitForText).waitFor({ timeout: 10_000 });
  }
  if (options.scrollToHeading) {
    await page.getByRole("heading", { name: options.scrollToHeading }).scrollIntoViewIfNeeded();
  }
  if (options.scrollSubnavBy) {
    await page.getByRole("navigation", { name: "Koçluk bölümleri" }).evaluate((element, left) => {
      element.scrollLeft = left;
    }, options.scrollSubnavBy);
  }
  if (options.assertTryPrecision) {
    const tryValues = (await page.locator("body").innerText()).match(/₺[0-9][0-9.,]*/g) ?? [];
    const inconsistent = tryValues.filter((value) => !/,\d{2}$/.test(value));
    assert.deepEqual(inconsistent, [], `${options.file}: inconsistent TRY values: ${inconsistent.join(", ")}`);
  }
  await page.screenshot({ path: path.join(OUT, options.file), fullPage: options.fullPage ?? false });
}

async function captureMicroPolishSet(page: Page, state: QaState, width: number) {
  const desktop = [
    ["desktop-coaching-requests.png", "/dashboard/tutor/coaching/requests", "Yeni öğrenci talepleri", "published", 0],
    ["desktop-coaching-earnings.png", "/dashboard/tutor/coaching/earnings", "Koçluk kazançları", "published", 0],
    ["desktop-setup-price.png", "/dashboard/tutor/coaching/plan?step=price", "Koçluk teklifini hazırla", "draft", 0],
    ["desktop-coaching-home.png", "/dashboard/tutor/coaching", /Çalışma koçluğu/i, "published", 0],
  ] as const;
  const mobile = [
    ["mobile-coaching-home.png", "/dashboard/tutor/coaching", /Çalışma koçluğu/i, "published", 0],
    ["mobile-setup-price.png", "/dashboard/tutor/coaching/plan?step=price", "Koçluk teklifini hazırla", "draft", 0],
    ["mobile-subnav-continuation.png", "/dashboard/tutor/coaching/reports", "Görüşme raporları", "published", 120],
  ] as const;
  const captures = width === 1440 ? desktop : width === 375 ? mobile : [];
  for (const [file, route, heading, scenario, scrollSubnavBy] of captures) {
    await capture(page, state, {
      file,
      route,
      heading,
      scenario,
      role: "tutor",
      assertTryPrecision: true,
      scrollSubnavBy,
    });
  }
}

async function captureWalletSet(page: Page, state: QaState, width: number) {
  const route = "/dashboard/tutor/coaching/earnings";
  const heading = "Koçluk kazançları";
  const populatedFile = width === 1440
    ? "desktop-earnings-populated.png"
    : width === 768
      ? "tablet-earnings-populated.png"
      : "mobile-earnings-populated.png";

  await capture(page, state, {
    file: populatedFile,
    route,
    heading,
    scenario: "earnings-populated",
    role: "tutor",
    assertTryPrecision: true,
  });
  if (width === 375) {
    await page.screenshot({ path: path.join(OUT, "mobile-earnings-populated-full.png"), fullPage: true });
  }
  const populatedWithdrawal = page.getByRole("button", { name: "Parayı çek" });
  await populatedWithdrawal.waitFor();
  assert.equal(await populatedWithdrawal.getAttribute("aria-disabled"), "true", `${width}: eligible-unfunded incorrectly enabled withdrawal`);
  await page.getByText("Ödeme aktarımı, gerçek ödeme altyapısı etkinleştirildiğinde kullanılabilir.").waitFor();
  await page.getByTestId("coaching-earnings-chart").waitFor();

  if (width === 1440) {
    await page.getByTestId("coaching-earnings-chart").locator("xpath=..").screenshot({ path: path.join(OUT, "desktop-earnings-graph-close-up.png") });
  }
  await capture(page, state, {
    file: `earnings-zero-${width}.png`,
    route,
    heading,
    scenario: "earnings-zero",
    role: "tutor",
    assertTryPrecision: true,
  });
  assert.equal(await page.getByTestId("coaching-earnings-chart").locator("[data-chart-month]").count(), 0, "zero fixture rendered fabricated chart points");
  await page.getByText("Henüz grafik oluşturacak aylık kazanç kaydı yok.").waitFor();
  assert.equal(await page.getByRole("button", { name: "Parayı çek" }).getAttribute("aria-disabled"), "true", "zero fixture enabled withdrawal");
}

async function captureCheckoutRolloutSet(page: Page, state: QaState, width: number) {
  state.role = "student";
  state.scenario = "published";
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.setItem("auth_user", JSON.stringify({ id: "student-qa", email: "student@example.invalid", role: "student", tutor_profile_id: null, is_email_verified: true, is_admin: false, is_test_account: true, jitsi_tutorial_completed: true, jitsi_tutorial_grandfathered: true, impersonation: null }));
  });

  await capture(page, state, {
    file: `checkout-unselected-${width}.png`,
    route: `/tutors/${tutorProfile.id}/checkout/coaching`,
    heading: "Çalışma Koçluğu",
    scenario: "published",
    role: "student",
    assertTryPrecision: true,
  });
  const optOut = page.getByRole("button", { name: /Koçluk olmadan devam et/ });
  assert.equal(await optOut.getAttribute("aria-pressed"), "true", `${width}: Coaching default was not unselected`);
  assert.equal(await page.getByRole("link", { name: "Paket seçeneklerine devam et" }).getAttribute("href"), `/tutors/${tutorProfile.id}/checkout`);

  await page.getByRole("button", { name: /^Çalışma Koçluğu/ }).click();
  await page.getByText("Dahil olanlar").waitFor();
  const selectedHref = await page.getByRole("link", { name: "Paket seçeneklerine devam et" }).getAttribute("href");
  assert.equal(selectedHref, `/tutors/${tutorProfile.id}/checkout?coaching=1`, `${width}: Coaching selection did not survive navigation`);
  await page.screenshot({ path: path.join(OUT, `checkout-selected-${width}.png`) });

  await optOut.click();
  assert.equal(await optOut.getAttribute("aria-pressed"), "true", `${width}: exact opt-out CTA did not clear Coaching`);
  assert.equal(await page.getByRole("link", { name: "Paket seçeneklerine devam et" }).getAttribute("href"), `/tutors/${tutorProfile.id}/checkout`);

  state.scenario = "checkout-disabled";
  await page.goto(`${BASE}/tutors/${tutorProfile.id}/checkout/coaching`, { waitUntil: "domcontentloaded" });
  await page.waitForURL(new RegExp(`/tutors/${tutorProfile.id}/checkout(?:\\?|$)`));
  assert.equal(await page.getByRole("heading", { name: "Çalışma Koçluğu" }).count(), 0, `${width}: disabled checkout still exposed Coaching choice`);

  await capture(page, state, {
    file: `public-profile-coaching-${width}.png`,
    route: `/tutors/${tutorProfile.id}`,
    heading: /QA Tutor/i,
    scenario: "published",
    role: "student",
    scrollToHeading: "Çalışma Koçluğu",
  });
  await page.getByRole("link", { name: "Ders paketiyle koçluk al" }).waitFor();
}

async function captureCheckoutFlagRace(page: Page, state: QaState, width: number) {
  state.role = "student";
  state.scenario = "published";
  state.flagPending = true;
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.setItem("auth_user", JSON.stringify({
      id: "student-qa", email: "student@example.invalid", role: "student",
      tutor_profile_id: null, is_email_verified: true, is_admin: false,
      is_test_account: true, jitsi_tutorial_completed: true,
      jitsi_tutorial_grandfathered: true, impersonation: null,
    }));
  });
  await page.goto(`${BASE}/tutors/${tutorProfile.id}?discovery_impression_id=race-impression`, { waitUntil: "domcontentloaded" });
  const loadingCta = page.getByRole("button", { name: "Hazırlanıyor…" });
  await loadingCta.waitFor();
  assert.equal(await loadingCta.isDisabled(), true, `${width}: pending flag left reservation CTA enabled`);
  const loadingBox = await loadingCta.boundingBox();
  assert.ok(loadingBox, `${width}: pending flag CTA was not visible`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${width}: pending flag caused horizontal document overflow`);
  await loadingCta.click({ force: true });
  assert.match(page.url(), new RegExp(`/tutors/${tutorProfile.id}(?:\\?|$)`), `${width}: pending flag entered checkout`);
  assert.equal(state.bookingStarted, 0, `${width}: pending flag emitted booking_started`);
  await page.screenshot({ path: path.join(OUT, `checkout-flag-race-loading-${width}.png`) });

  assert.ok(state.releaseFlag, `${width}: flag request did not become pending`);
  state.releaseFlag();
  const readyCta = page.getByRole("button", { name: "Ders Rezervasyonu Yap" });
  await readyCta.waitFor();
  const readyBox = await readyCta.boundingBox();
  assert.ok(readyBox, `${width}: ready reservation CTA was not visible`);
  assert.equal(readyBox.height, loadingBox.height, `${width}: flag resolution changed CTA height`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${width}: resolved flag caused horizontal document overflow`);
  await readyCta.focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(new RegExp(`/tutors/${tutorProfile.id}/checkout/coaching(?:\\?|$)`));
  assert.equal(state.bookingStarted, 1, `${width}: ready navigation did not emit booking_started exactly once`);
  await page.screenshot({ path: path.join(OUT, `checkout-flag-race-enabled-${width}.png`) });

  state.scenario = "checkout-disabled";
  state.flagPending = false;
  state.releaseFlag = null;
  state.bookingStarted = 0;
  await page.goto(`${BASE}/tutors/${tutorProfile.id}?discovery_impression_id=race-impression`, { waitUntil: "domcontentloaded" });
  const disabledCta = page.getByRole("button", { name: "Ders Rezervasyonu Yap" });
  await disabledCta.waitFor();
  await disabledCta.click();
  await page.waitForURL(new RegExp(`/tutors/${tutorProfile.id}/checkout(?:\\?|$)`));
  assert.doesNotMatch(page.url(), /\/checkout\/coaching(?:\\?|$)/, `${width}: disabled flag entered Coaching checkout`);
}

async function captureReviewSet(page: Page, state: QaState, width: number) {
  if (width === 1440) {
    const desktop = [
      ["01-tutor-home-published.png", "/dashboard/tutor/coaching", /Çalışma koçluğu/i, "published", "tutor"],
      ["02-tutor-home-draft.png", "/dashboard/tutor/coaching", /Çalışma koçluğu/i, "draft", "tutor"],
      ["03-setup-frequency.png", "/dashboard/tutor/coaching/plan?step=frequency", "Koçluk teklifini hazırla", "draft", "tutor"],
      ["04-setup-price.png", "/dashboard/tutor/coaching/plan?step=price", "Koçluk teklifini hazırla", "draft", "tutor"],
      ["05-setup-exams.png", "/dashboard/tutor/coaching/plan?step=exams", "Koçluk teklifini hazırla", "draft", "tutor"],
      ["06-setup-description.png", "/dashboard/tutor/coaching/plan?step=description", "Koçluk teklifini hazırla", "draft", "tutor"],
      ["07-setup-availability.png", "/dashboard/tutor/coaching/plan?step=availability", "Koçluk teklifini hazırla", "draft", "tutor"],
      ["08-setup-capacity.png", "/dashboard/tutor/coaching/plan?step=capacity", "Koçluk teklifini hazırla", "draft", "tutor"],
      ["09-student-preview-offer.png", "/dashboard/tutor/coaching/preview", "Öğrenci görünümü", "published", "tutor"],
      ["10-setup-publish.png", "/dashboard/tutor/coaching/plan?step=publish", "Koçluk teklifini hazırla", "published", "tutor"],
      ["11-upcoming-empty.png", "/dashboard/tutor/coaching/upcoming", "Yaklaşan görüşmeler", "availability-empty", "tutor"],
      ["12-reports-empty.png", "/dashboard/tutor/coaching/reports", "Görüşme raporları", "published", "tutor"],
      ["13-coaching-requests.png", "/dashboard/tutor/coaching/requests", "Yeni öğrenci talepleri", "published", "tutor"],
      ["14-coaching-earnings.png", "/dashboard/tutor/coaching/earnings", "Koçluk kazançları", "published", "tutor"],
      ["15-student-no-active.png", "/dashboard/student/coaching", "Çalışma koçluğum", "empty", "student"],
      ["16-public-profile-offer.png", `/tutors/${tutorProfile.id}`, /QA Tutor/i, "published", "student"],
    ] as const;
    for (const [file, route, heading, scenario, role] of desktop) {
      await capture(page, state, {
        file,
        route,
        heading,
        scenario,
        role,
        scrollToHeading: file === "16-public-profile-offer.png" ? "Çalışma koçluğu" : undefined,
        waitForText: file === "15-student-no-active.png" ? "Henüz bir çalışma koçluğun yok" : undefined,
      });
    }
  }

  if (width === 375) {
    const mobile = [
      ["mobile-home.png", "/dashboard/tutor/coaching", /Çalışma koçluğu/i, "published", "tutor"],
      ["mobile-setup.png", "/dashboard/tutor/coaching/plan?step=exams", "Koçluk teklifini hazırla", "draft", "tutor"],
      ["mobile-empty.png", "/dashboard/tutor/coaching/reports", "Görüşme raporları", "published", "tutor"],
      ["mobile-offer.png", "/dashboard/tutor/coaching/preview", "Öğrenci görünümü", "published", "tutor"],
    ] as const;
    for (const [file, route, heading, scenario, role] of mobile) {
      await capture(page, state, { file, route, heading, scenario, role });
    }
  }
}

async function runRouteMatrix(page: Page, state: QaState, width: number) {
  const cacheRole = (role: Role) => page.evaluate((nextRole: Role) => {
    localStorage.setItem("auth_user", JSON.stringify({ id: `${nextRole}-qa`, email: `${nextRole}@example.invalid`, role: nextRole, tutor_profile_id: nextRole === "tutor" ? "profile-tutor-qa" : null, is_email_verified: true, is_admin: false, is_test_account: true, jitsi_tutorial_completed: true, jitsi_tutorial_grandfathered: true, impersonation: null }));
  }, role);
  state.role = "tutor";
  state.scenario = "empty";
  await assertPage(page, "/dashboard/tutor/coaching", /Çalışma koçluğu/i, `tutor empty ${width}`);
  state.scenario = "onboarding";
  await assertPage(page, "/dashboard/tutor/coaching/onboarding", "Koçluk vermeye başla", `onboarding ${width}`);
  state.scenario = "draft";
  for (const step of ["frequency", "price", "exams", "description", "availability", "capacity", "preview"]) {
    await assertPage(page, `/dashboard/tutor/coaching/plan?step=${step}`, "Koçluk teklifini hazırla", `setup ${step} ${width}`);
  }
  state.scenario = "checkout-disabled";
  await assertPage(page, "/dashboard/tutor/coaching/plan?step=publish", "Koçluk teklifini hazırla", `published checkout-paused ${width}`);
  await page.getByText("Teklifin yayında. Yeni koçluk satışları platform genelinde şu anda kapalı.").waitFor();
  state.scenario = "published";
  for (const [route, heading] of [
    ["/dashboard/tutor/coaching/students", "Koçluk öğrencilerim"],
    ["/dashboard/tutor/coaching/upcoming", "Yaklaşan görüşmeler"],
    ["/dashboard/tutor/coaching/reports", "Görüşme raporları"],
    ["/dashboard/tutor/coaching/time-requests", "Koçluk saat talepleri"],
    ["/dashboard/tutor/coaching/reschedule-requests", "Görüşme değişiklik talepleri"],
    ["/dashboard/tutor/coaching/earnings", "Koçluk kazançları"],
    ["/dashboard/tutor/coaching/preview", "Öğrenci görünümü"],
  ] as const) await assertPage(page, route, heading, `${heading} ${width}`);
  await assertPage(page, "/dashboard/tutor/coaching/requests", "Yeni öğrenci talepleri", `coaching requests ${width}`);
  await page.getByText("Koçluk Öğrencisi").waitFor();
  assert.equal(await page.getByText("Ders Öğrencisi").count(), 0, "lesson-only request leaked into Coaching");
  await assertPage(page, "/dashboard/tutor/requests", "Paket Talepleri", `lesson requests ${width}`);
  await page.getByText("Ders Öğrencisi").waitFor();
  assert.equal(await page.getByText("Koçluk Öğrencisi").count(), 0, "Coaching request duplicated into general requests");

  state.role = "student";
  await cacheRole("student");
  state.scenario = "empty";
  await assertPage(page, "/dashboard/student/coaching", "Çalışma koçluğum", `student empty ${width}`);
  state.scenario = "published";
  for (const [route, heading] of [
    ["/dashboard/student/coaching/upcoming", "Yaklaşan görüşmeler"],
    ["/dashboard/student/coaching/program", "Çalışma programım"],
    ["/dashboard/student/coaching/reports", "Görüşme raporlarım"],
    ["/dashboard/student/coaching/schedule", "Koçluk saatlerim"],
    ["/dashboard/student/coaching/complaints", "Koçluk başvurularım"],
  ] as const) await assertPage(page, route, heading, `${heading} ${width}`);
}

async function inspectHover(page: Page, width: number) {
  const imageResponses: Record<string, number> = {};
  const responseListener = (response: { url(): string; status(): number }) => {
    if (response.url().includes("/images/")) imageResponses[new URL(response.url()).pathname] = response.status();
  };
  page.on("response", responseListener);
  if (page.url() === "about:blank") await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.setItem("auth_user", JSON.stringify({ id: "tutor-qa", email: "tutor@example.invalid", role: "tutor", tutor_profile_id: "profile-tutor-qa", is_email_verified: true, is_admin: false, is_test_account: true, jitsi_tutorial_completed: true, jitsi_tutorial_grandfathered: true, impersonation: null })));
  await page.goto(`${BASE}/dashboard/tutor`, { waitUntil: "domcontentloaded" });
  const imageEvidence = async (locator: Locator) => {
    await locator.waitFor();
    return locator.evaluate((element) => {
      const image = element as HTMLImageElement;
      const rect = image.getBoundingClientRect();
      const style = getComputedStyle(image);
      return { width: rect.width, height: rect.height, complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, pointerEvents: style.pointerEvents, zIndex: style.zIndex, src: image.getAttribute("src") };
    });
  };
  const headerImage = await imageEvidence(page.getByRole("img", { name: "QA Tutor" }).first());
  const bookingImage = await imageEvidence(page.getByRole("img", { name: "QA Öğrenci" }).first());
  await page.getByRole("tab", { name: "Öğrencilerim" }).click();
  const card = page.getByRole("button", { name: /QA Öğrenci/ });
  await card.waitFor();
  await card.scrollIntoViewIfNeeded();
  const box = await card.boundingBox();
  assert.ok(box && box.width > 0 && box.height > 0, "student card has no box");
  const evidence = await card.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const point = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    const img = element.querySelector("img") as HTMLImageElement | null;
    const style = getComputedStyle(element);
    return {
      card: { width: rect.width, height: rect.height },
      topmost: point?.tagName ?? null,
      topmostInsideCard: Boolean(point && element.contains(point)),
      pointerEvents: style.pointerEvents,
      zIndex: style.zIndex,
      image: img ? { complete: img.complete, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, src: img.getAttribute("src") } : null,
    };
  });
  assert.equal(evidence.topmostInsideCard, true, "an overlay intercepts the student card");
  assert.equal(evidence.pointerEvents, "auto");
  assert.ok(evidence.image?.complete && evidence.image.naturalWidth > 0, "student image failed to decode");
  await card.hover();
  await card.click();
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Escape");
  await card.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Escape");
  await page.screenshot({ path: path.join(OUT, `tutor-dashboard-hover-${width}.png`), fullPage: true });
  page.off("response", responseListener);
  return { ...evidence, headerImage, bookingImage, imageResponses, clickOpenedDialog: true, keyboardOpenedDialog: true, reportedResultCard: "not present in the local tutor fixture" };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const externalServer = process.env.COACHING_QA_EXTERNAL_SERVER === "1";
  const server = externalServer ? null : spawn(process.execPath, [path.join(ROOT, "node_modules", "next", "dist", "bin", "next"), "dev", "-p", String(PORT)], {
      cwd: ROOT,
      env: { ...process.env, NEXT_PUBLIC_API_URL: "http://127.0.0.1:8000/api", NEXT_PUBLIC_COACHING_ENABLED: "true" },
      stdio: ["ignore", "pipe", "pipe"],
    });
  let logs = "";
  server?.stdout?.on("data", (chunk) => { logs += String(chunk); });
  server?.stderr?.on("data", (chunk) => { logs += String(chunk); });
  try {
    if (server) await waitForServer(server);
    const browser = await chromium.launch({ headless: true });
    const hoverEvidence: Record<string, unknown> = {};
    const microOnly = process.env.COACHING_QA_MICRO_ONLY === "1";
    const walletOnly = process.env.COACHING_QA_WALLET_ONLY === "1";
    const rolloutOnly = process.env.COACHING_QA_ROLLOUT_ONLY === "1";
    const checkoutOnly = process.env.COACHING_QA_CHECKOUT_ONLY === "1";
    const raceOnly = process.env.COACHING_QA_RACE_ONLY === "1";
    const viewports = microOnly
      ? [{ width: 375, height: 812 }, { width: 1440, height: 900 }]
      : [{ width: 375, height: 812 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }];
    for (const viewport of viewports) {
      const state: QaState = { role: checkoutOnly || raceOnly ? "student" : "tutor", scenario: "published", acceptancePosts: 0, bookingStarted: 0, flagPending: false, releaseFlag: null, unknown: [] };
      const context = await browser.newContext({ viewport, hasTouch: viewport.width === 375, isMobile: viewport.width === 375 });
      await installApi(context, state);
      const page = await context.newPage();
      const consoleErrors: string[] = [];
      page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
      if (raceOnly) {
        await captureCheckoutFlagRace(page, state, viewport.width);
      } else if (checkoutOnly) {
        await captureCheckoutRolloutSet(page, state, viewport.width);
      } else if (rolloutOnly) {
        await captureCheckoutRolloutSet(page, state, viewport.width);
        await captureWalletSet(page, state, viewport.width);
      } else if (walletOnly) {
        await captureWalletSet(page, state, viewport.width);
      } else if (microOnly) {
        await captureMicroPolishSet(page, state, viewport.width);
      } else {
        if (process.env.COACHING_QA_HOVER_ONLY !== "1") await runRouteMatrix(page, state, viewport.width);
        if (process.env.COACHING_QA_HOVER_ONLY !== "1") await captureReviewSet(page, state, viewport.width);
        if (process.env.COACHING_QA_HOVER_ONLY !== "1") await captureCheckoutRolloutSet(page, state, viewport.width);
        if (process.env.COACHING_QA_HOVER_ONLY !== "1") await captureWalletSet(page, state, viewport.width);
        state.role = "tutor";
        hoverEvidence[String(viewport.width)] = await inspectHover(page, viewport.width);
      }
      const actionableConsoleErrors = consoleErrors.filter(
        (message) => !(message.includes("Failed to fetch RSC payload") && message.includes("Falling back to browser navigation")),
      );
      assert.deepEqual(actionableConsoleErrors, [], `browser console errors at ${viewport.width}px`);
      assert.ok(state.unknown.length < 12, `too many unhandled APIs: ${state.unknown.join(", ")}`);
      if (!microOnly && !walletOnly) {
        await page.screenshot({ path: path.join(OUT, `coaching-final-${viewport.width}.png`), fullPage: true });
      }
      await context.close();
    }
    await browser.close();
    console.log(JSON.stringify({ result: "PASS", hoverEvidence }, null, 2));
  } catch (error) {
    console.error(logs);
    throw error;
  } finally {
    server?.kill("SIGTERM");
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
