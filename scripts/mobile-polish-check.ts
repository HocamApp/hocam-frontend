/** Real pages/CSS with a local-only backend fixture. Never sends API writes. */
import { chromium, webkit } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
const phase = process.env.POLISH_PHASE ?? "before";
const width = Number(process.env.POLISH_WIDTH ?? 1440);
const engine = process.env.POLISH_BROWSER ?? "chromium";
const dir = `screenshots/mobile-polish/${phase}-${engine}-${width}`;
const user = { id: "local-student", email: "student@example.invalid", role: "student", is_email_verified: false };
const subject = { id: "local-subject", name: "Matematik", exam_type: "AYT", completed_lessons: 3 };
const events = Array.from({ length: 4 }, (_, i) => ({ source: "study_block", id: `local-${i}`, local_date: i === 0 ? "2026-09-01" : "2026-09-02", local_time: i === 3 ? "21:00" : "19:30", duration_minutes: 60, status: "planned", subject, title: "Soru çözümü", block_type: "soru_cozumu", completed: false, editable: true, room_url: "", occurrence_date: "2026-09-02", recurrence: "none", block_title: "Soru çözümü" }));
async function main() {
 const browser = await (engine === "webkit" ? webkit : chromium).launch();
 try {
 const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce", timezoneId: "Europe/Istanbul" });
 await context.addCookies([{ name: "auth_token", value: "local-only", url: "http://localhost:3000" }]);
 await context.addInitScript((value) => { localStorage.setItem("auth_user", JSON.stringify(value)); }, user);
 await context.route("**/*", async route => {
  const request = route.request();
  if (!["xhr", "fetch"].includes(request.resourceType()) || request.url().includes("_rsc=")) return route.continue();
  const path = new URL(request.url()).pathname;
  if (!path.startsWith("/api/")) return route.continue();
  let data: unknown = [];
  if (path.endsWith("/auth/me/")) data = user;
  else if (path.endsWith("/profile/me/")) data = { user, profile: { name: "Test", surname: "Öğrenci", bio: "", target_rank: null, avatar_url: null }, preferences: {}, stats: {} };
  else if (path.endsWith("/auth/security/")) data = { email: user.email, is_email_verified: false, email_verification_enabled: true, has_usable_password: true, last_seen_at: null };
  else if (path.endsWith("/learning-summary/")) data = { completed_lessons: 3, active_packages: 1, most_studied_tutor: { id: "local-tutor", name: "Ahmet", surname: "Yılmaz", profile_picture: "", completed_lessons: 3, last_lesson_at: "2026-07-30T10:00:00Z", primary_subject: subject, is_bookable: true }, top_subjects: [subject] };
  else if (path.endsWith("/schedule/calendar/")) data = { events };
  else if (path.endsWith("/schedule/progress/")) data = { week_start: "2026-08-31", week_end: "2026-09-06", weekly_completion: { completed: 0, total: 4, percentage: 0 }, subject_stats: [] };
  else if (path.endsWith("/summary/")) data = { unread_count: 0, has_unread: false };
  else if (path.endsWith("/deletion/status/")) data = { active: false };
  else if (path.endsWith("/coaching/flag/")) data = { enabled: true };
  else if (!path.endsWith("/notifications/")) return route.fulfill({ status: 404, json: { detail: "Local fixture only" } });
  await route.fulfill({ json: data });
 });
 const page = await context.newPage();
 await page.clock.setFixedTime(new Date("2026-09-02T12:00:00Z"));
 await mkdir(dir, { recursive: true });
 const measurements: Record<string, unknown> = {};
 const capture = async (name: string) => {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true, animations: "disabled" });
  measurements[name] = await page.locator("main").evaluateAll(nodes => nodes.flatMap(main => Array.from(main.querySelectorAll("h1,h2,button,a,[role=grid]"))).filter(el => el.getBoundingClientRect().height > 0).map(el => {
   const r = el.getBoundingClientRect(); const css = getComputedStyle(el);
   return { text: el.textContent, x: r.x, y: r.y, width: r.width, height: r.height, color: css.color, bg: css.backgroundColor };
  }));
 };
 for (const [name, path, ready] of [["home", "/", "Dünün öğrencisi"], ["security", "/profile/security", "E-posta doğrulaması"], ["profile", "/profile", "En çok çalıştığın hoca"], ["weekly", "/schedule", "Çalışma Programım"]]) {
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "domcontentloaded" });
  // Scoped to main and to visible nodes: "Çalışma Programım" is also the
  // name of a nav tab that the phone layout keeps in the DOM but hides.
  await page.locator("main").getByText(ready, { exact: false }).first().waitFor({ state: "visible", timeout: 45000 });
  await capture(name);
 }
 for (const [name, label] of [["monthly", "Aylık"], ["daily", "Günlük"]]) {
  await page.getByRole("button", { name: label, exact: true }).click(); await capture(name);
 }
 await writeFile(`${dir}/geometry.json`, JSON.stringify(measurements, null, 2));
 console.log(`Captured ${dir}`);
 } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
