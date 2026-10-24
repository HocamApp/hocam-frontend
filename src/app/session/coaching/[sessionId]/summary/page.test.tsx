import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

// Wednesday 21 Ekim 2026: the meeting was 19:00-19:30 Istanbul time, it is 19:40.
const AFTER_MEETING = new Date("2026-10-21T16:40:00Z");

let role: "student" | "tutor" = "student";
let detail: Record<string, unknown> = {};
let studentSessions: Record<string, unknown>[] = [];
let tutorSessions: Record<string, unknown>[] = [];
let tutorSeconds = 1800;
let attendanceFails = false;
let detailFails = false;
let experienceAsk = false;
let Page: React.ComponentType;

function item(overrides: Record<string, unknown> = {}) {
  return {
    id: "s2",
    service_period_id: "sp-1",
    sequence_number: 3,
    week_index: 2,
    status: "awaiting_report",
    scheduled_start: "2026-10-21T16:00:00Z",
    scheduled_local_date: "2026-10-21",
    scheduled_local_time: "19:00:00",
    duration_minutes: 30,
    reschedule_count: 0,
    report_due_at: "2026-10-22T16:30:00Z",
    report_overdue: false,
    complaint_eligible_at: "2026-10-23T16:30:00Z",
    complaint_eligible: false,
    ...overrides,
  };
}

const earlier = (id: string, day: string) =>
  item({ id, status: "completed", scheduled_start: `${day}T16:00:00Z`, scheduled_local_date: day, report_due_at: null });
const nextMeeting = (overrides: Record<string, unknown> = {}) =>
  item({
    id: "s4",
    status: "scheduled",
    scheduled_start: "2026-10-28T16:00:00Z",
    scheduled_local_date: "2026-10-28",
    report_due_at: null,
    ...overrides,
  });

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("next/navigation", {
    namedExports: {
      useParams: () => ({ sessionId: "s2" }),
      useRouter: () => ({ push() {}, replace() {}, back() {} }),
    },
  });
  mock.module("@/hooks/useAuth", {
    namedExports: { useAuth: () => ({ user: { role } }) },
  });
  mock.module("@/components/shared/RouteGuard", {
    namedExports: { RouteGuard: ({ children }: { children: React.ReactNode }) => <>{children}</> },
  });
  mock.module("sonner", { namedExports: { toast: { success() {}, error() {}, info() {} } } });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/coaching/sessions/s2/") {
          if (detailFails) throw Object.assign(new Error("http 500"), { response: { status: 500, data: {} } });
          return { data: detail };
        }
        if (url === "/coaching/sessions/s2/attendance-summary/") {
          if (attendanceFails) throw Object.assign(new Error("http 500"), { response: { status: 500, data: {} } });
          const entry = (seconds: number) => ({
            first_joined_at: seconds > 0 ? "2026-10-21T16:00:00Z" : null,
            last_left_at: seconds > 0 ? "2026-10-21T16:30:00Z" : null,
            join_count: seconds > 0 ? 1 : 0,
            total_connected_seconds: seconds,
          });
          return { data: { student: entry(1800), tutor: entry(tutorSeconds) } };
        }
        if (url === "/coaching/sessions/s2/experience-feedback/") {
          return {
            data: {
              ask: experienceAsk,
              answered: false,
              reasons:
                role === "tutor"
                  ? ["video_audio", "connection", "files", "report_form", "other"]
                  : ["video_audio", "connection", "files", "report_program", "other"],
            },
          };
        }
        if (url === "/coaching/sessions/") return { data: studentSessions };
        if (url === "/coaching/tutor/sessions/") return { data: tutorSessions };
        throw new Error(`unexpected GET ${url}`);
      },
      post: async () => ({ data: {} }),
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  mock.timers.enable({ apis: ["Date"], now: AFTER_MEETING });
  role = "student";
  tutorSeconds = 1800;
  attendanceFails = false;
  detailFails = false;
  experienceAsk = false;
  // `sequence_number` counts inside one service period (this is the first of a second one);
  // the student's plan counts in time order: this is the third meeting.
  detail = { ...item({ sequence_number: 1 }), tutor_name: "Elif Kaya", student_name: "Deniz Yıldız", viewer_role: "student", rating_submitted: false };
  studentSessions = [earlier("s0a", "2026-10-07"), earlier("s0b", "2026-10-14"), item({ sequence_number: 1 }), nextMeeting()];
  tutorSessions = [item({ student_name: "Deniz Yıldız" }), nextMeeting({ student_name: "Ali Demir" })];
});
afterEach(() => {
  cleanup();
  mock.timers.reset();
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>,
  );
}

const openProblems = async () => fireEvent.click(await screen.findByRole("button", { name: /Bir sorun mu oldu\?/ }));

describe("the screen after a coaching meeting: the student", () => {
  it("says the meeting is done, promises the report by the server's deadline, and says which meeting it was", async () => {
    renderPage();

    assert.ok(await screen.findByRole("heading", { level: 1, name: "Koçluk görüşmen tamamlandı" }));
    assert.ok(screen.getByText("Elif hocan çalışma programını ve ilerleme raporunu en geç 24 saat içinde paylaşacak."));
    assert.ok(screen.getByText("22 Ekim Perşembe 19:30"));
    assert.ok(await screen.findByText("3. görüşme · 30 dk · 21 Ekim Çarşamba 19:00"));
  });

  it("lays the five options of Master Spec §24 out as rows of one card, the problems closed", async () => {
    tutorSeconds = 0;
    renderPage();

    await screen.findByRole("heading", { level: 1, name: "Koçluk görüşmen tamamlandı" });
    const card = screen.getByRole("region", { name: "Görüşme sonrası" });
    const titles = within(card).getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    assert.ok(titles.some((title) => title?.startsWith("Görüşmeyi değerlendir")));
    assert.ok(titles.some((title) => title?.startsWith("Sonraki görüşmeyi görüntüle")));
    assert.ok(titles.some((title) => title?.startsWith("Bir sorun mu oldu?")));
    assert.ok(titles.some((title) => title?.startsWith("Koçluk desteğine git")));
    assert.equal(titles.length, 4, "no sixth option");

    assert.equal(screen.queryByRole("button", { name: "Teknik sorun bildir" }), null);
    await openProblems();
    assert.ok(await screen.findByRole("button", { name: "Öğretmen katılmadı bildir" }));
    assert.ok(screen.getByRole("button", { name: "Teknik sorun bildir" }));
  });

  it("shows the Sistem nasıldı? strip between the band and the card when the server asks, and keeps the card at its four rows", async () => {
    experienceAsk = true;
    tutorSeconds = 0;
    renderPage();

    const strip = await screen.findByRole("region", { name: "Sistem geri bildirimi" });
    const band = screen.getByRole("region", { name: "Görüşme" });
    const card = screen.getByRole("region", { name: "Görüşme sonrası" });
    assert.ok(band.compareDocumentPosition(strip) & Node.DOCUMENT_POSITION_FOLLOWING, "after the band");
    assert.ok(strip.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING, "before the card");
    assert.equal(within(card).getAllByRole("heading", { level: 2 }).length, 4, "the strip is not a sixth option");
    assert.equal(within(card).queryByText("Bu görüşmede sistem nasıldı?"), null);
  });

  it("does not show the strip while the server does not ask (flag off, or not every third meeting)", async () => {
    renderPage();

    await screen.findByRole("heading", { level: 1, name: "Koçluk görüşmen tamamlandı" });
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(screen.queryByRole("region", { name: "Sistem geri bildirimi" }), null);
  });

  it("opens the rating for a student who has not rated, with the seven criteria", async () => {
    renderPage();

    assert.ok(await screen.findByRole("button", { name: "Değerlendirmeyi gönder" }));
    assert.equal(screen.getAllByRole("group").length, 7);
    assert.equal(screen.queryByText(/değerlendirmen alındı/), null);
  });

  it("says the rating was received instead of offering a form that would silently keep the first answer", async () => {
    detail = { ...detail, rating_submitted: true };
    renderPage();

    assert.ok(await screen.findByText("Değerlendirmen alındı, teşekkürler."));
    assert.equal(screen.queryByRole("button", { name: "Değerlendirmeyi gönder" }), null);
  });

  it("keeps the form when an older server does not say", async () => {
    detail = { ...item(), tutor_name: "Elif Kaya", student_name: "Deniz Yıldız", viewer_role: "student" };
    renderPage();

    assert.ok(await screen.findByRole("button", { name: "Değerlendirmeyi gönder" }));
  });

  it("names the next meeting, never the one just left", async () => {
    renderPage();

    const heading = await screen.findByRole("heading", { level: 2, name: /Sonraki görüşmeyi görüntüle/ });
    const row = heading.parentElement?.parentElement as HTMLElement;
    await waitFor(() => assert.ok(within(row).getByText(/^28 Ekim Çarşamba 19:00 · /)));
    const link = within(row).getByRole("link", { name: "Görüntüle" });
    assert.equal(link.getAttribute("href"), "/dashboard/student/coaching/upcoming");
    assert.match(link.className, /bg-gold/);
  });

  it("sends Koçluk desteğine git to the complaints page", async () => {
    renderPage();

    const row = (await screen.findByRole("heading", { level: 2, name: "Koçluk desteğine git" })).parentElement?.parentElement as HTMLElement;
    assert.equal(within(row).getByRole("link", { name: "Git" }).getAttribute("href"), "/dashboard/student/coaching/complaints");
  });

  it("never offers Öğretmen katılmadı bildir for a tutor who was in the meeting", async () => {
    tutorSeconds = 1800;
    renderPage();

    await screen.findByRole("heading", { level: 1, name: "Koçluk görüşmen tamamlandı" });
    await openProblems();
    assert.ok(await screen.findByRole("button", { name: "Teknik sorun bildir" }));
    assert.equal(screen.queryByRole("button", { name: "Öğretmen katılmadı bildir" }), null);
  });

  it("offers it once the tutor's absence is on record and the tenth minute has passed", async () => {
    tutorSeconds = 0;
    renderPage();

    await openProblems();
    assert.ok(await screen.findByRole("button", { name: "Öğretmen katılmadı bildir" }));
  });

  it("says when it opens while the wait is still running", async () => {
    mock.timers.reset();
    mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-21T16:06:00Z") });
    tutorSeconds = 0;
    detail = { ...detail, status: "in_progress" };
    renderPage();

    await openProblems();
    assert.ok(await screen.findByText("Öğretmen katılmadı bildirimi görüşmenin 10. dakikasından sonra yapılabilir (19:10)."));
    assert.equal(screen.queryByRole("button", { name: "Öğretmen katılmadı bildir" }), null);
  });

  it("does not take the attendance for granted: a failed read must not hide a real report", async () => {
    attendanceFails = true;
    renderPage();

    await openProblems();
    assert.ok(await screen.findByRole("button", { name: "Öğretmen katılmadı bildir" }));
  });

  it("does not claim a running meeting is over, and brings the student back to the room", async () => {
    mock.timers.reset();
    mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-21T16:20:00Z") });
    detail = { ...detail, status: "in_progress", report_due_at: null };
    renderPage();

    assert.ok(await screen.findByRole("heading", { level: 1, name: "Görüşme sürüyor" }));
    assert.equal(screen.getByRole("link", { name: "Odaya geri dön" }).getAttribute("href"), "/session/coaching/s2");
    assert.equal(screen.queryByText("Değerlendirmeyi gönder"), null);
  });

  it("tells a meeting closed by a no-show report what happened, without a rating or a problem form", async () => {
    detail = { ...detail, status: "tutor_no_show", report_due_at: null };
    renderPage();

    assert.ok(await screen.findByRole("heading", { level: 1, name: "Bildirimin alındı" }));
    assert.ok(screen.getByText("Öğretmen katılmadı bildirimini kaydettik. Bu görüşme hakkın korunur."));
    assert.equal(screen.queryByRole("button", { name: /Görüşmeyi değerlendir/ }), null);
    assert.equal(screen.queryByRole("heading", { level: 2, name: /Bir sorun mu oldu\?/ }), null);
    assert.ok(screen.getByRole("heading", { level: 2, name: "Koçluk desteğine git" }));
  });

  it("says the report is out once the meeting is completed", async () => {
    detail = { ...detail, status: "completed", rating_submitted: true, report_due_at: null };
    renderPage();

    assert.ok(await screen.findByText("Elif hocan raporunu paylaştı."));
    assert.equal(screen.queryByRole("heading", { level: 2, name: /Bir sorun mu oldu\?/ }), null);
  });

  it("says so, with a way to try again, when the meeting cannot be read", async () => {
    detailFails = true;
    renderPage();

    assert.ok(await screen.findByRole("button", { name: "Tekrar dene" }));
    assert.equal(screen.queryByRole("heading", { level: 1 }), null);
  });
});

describe("the screen after a coaching meeting: the tutor", () => {
  beforeEach(() => {
    role = "tutor";
    detail = { ...item(), tutor_name: "Elif Kaya", student_name: "Deniz Yıldız", viewer_role: "tutor", student_id: "u-1" };
  });

  it("says the meeting is over and the report is owed by when, with the report one press away", async () => {
    renderPage();

    assert.ok(await screen.findByRole("heading", { level: 1, name: "Görüşme bitti" }));
    assert.ok(screen.getByText("Deniz için çalışma programını ve ilerleme raporunu en geç 24 saat içinde paylaşmalısın."));
    assert.ok(screen.getByText("22 Ekim Perşembe 19:30"));
    assert.ok(screen.getByText("3. görüşme · 30 dk · 21 Ekim Çarşamba 19:00"), "the tutor's own numbering");
    const link = screen.getByRole("link", { name: "Raporu hazırla" });
    assert.equal(link.getAttribute("href"), "/dashboard/tutor/coaching/sessions/s2/report");
    assert.match(link.className, /bg-gold/);
  });

  it("asks the tutor too, with the tutor's own reasons", async () => {
    experienceAsk = true;
    renderPage();

    await screen.findByRole("region", { name: "Sistem geri bildirimi" });
    fireEvent.click(await screen.findByRole("button", { name: "Kötü" }));
    assert.ok(screen.getByRole("button", { name: "Rapor formu" }));
    assert.equal(screen.queryByRole("button", { name: "Rapor / program" }), null);
  });

  it("names the tutor's next meeting with its student, and offers neither a rating nor a problem report", async () => {
    renderPage();

    await screen.findByRole("heading", { level: 1, name: "Görüşme bitti" });
    assert.ok(await screen.findByText(/^Ali Demir · 28 Ekim Çarşamba 19:00 · /));
    assert.equal(screen.getByRole("link", { name: "Görüşmeler" }).getAttribute("href"), "/dashboard/tutor/coaching/upcoming");
    assert.equal(screen.queryByRole("heading", { level: 2, name: /Görüşmeyi değerlendir/ }), null);
    assert.equal(screen.queryByRole("heading", { level: 2, name: /Bir sorun mu oldu\?/ }), null);
    assert.equal(screen.queryByRole("heading", { level: 2, name: "Koçluk desteğine git" }), null);
  });

  it("brings the tutor back to a room that is still running, and has no report to prepare yet", async () => {
    mock.timers.reset();
    mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-21T16:20:00Z") });
    detail = { ...detail, status: "in_progress", report_due_at: null };
    renderPage();

    assert.ok(await screen.findByRole("heading", { level: 1, name: "Görüşme sürüyor" }));
    assert.equal(screen.getByRole("link", { name: "Odaya geri dön" }).getAttribute("href"), "/session/coaching/s2");
    assert.equal(screen.queryByRole("link", { name: "Raporu hazırla" }), null);
  });
});
