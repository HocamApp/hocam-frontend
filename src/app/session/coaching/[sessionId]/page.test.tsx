import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

// Wednesday 21 Ekim 2026: the meeting is 19:00-19:30 in Istanbul (16:00Z-16:30Z).
const START = Date.parse("2026-10-21T16:00:00Z");
const MINUTE = 60_000;
const at = (minutesFromStart: number) => new Date(START + minutesFromStart * MINUTE);

type TokenAnswer = "ok" | { status: number; data: Record<string, unknown> } | "network";

let role: "student" | "tutor" = "student";
let detail: Record<string, unknown> = {};
let tokenPlan: TokenAnswer[] = ["ok"];
let tokenCalls = 0;
let attendance: { tutor: number; student: number } | "fails" = { tutor: 1800, student: 1800 };
let studentSessions: Record<string, unknown>[] = [];
let tutorSessions: Record<string, unknown>[] = [];
let jitsiProps: Record<string, unknown> | null = null;
let jitsiHandlers: Record<string, () => void> = {};
const pushed: string[] = [];
let Page: React.ComponentType;
let jaasEmbed: typeof import("@/lib/jaasEmbed");

function item(overrides: Record<string, unknown> = {}) {
  return {
    id: "s1",
    service_period_id: "sp-1",
    sequence_number: 3,
    week_index: 2,
    status: "in_progress",
    scheduled_start: "2026-10-21T16:00:00Z",
    scheduled_local_date: "2026-10-21",
    scheduled_local_time: "19:00:00",
    duration_minutes: 30,
    reschedule_count: 0,
    report_due_at: null,
    report_overdue: false,
    complaint_eligible_at: null,
    complaint_eligible: false,
    ...overrides,
  };
}

function httpError(status: number, data: Record<string, unknown> = {}) {
  return Object.assign(new Error(`http ${status}`), { response: { status, data } });
}

function JitsiStub(props: Record<string, unknown>) {
  jitsiProps = props;
  React.useEffect(() => {
    (props.onApiReady as ((api: unknown) => void) | undefined)?.({
      addEventListener(event: string, handler: () => void) {
        jitsiHandlers[event] = handler;
      },
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <div data-testid="jitsi" />;
}

before(async () => {
  mock.module("next/dynamic", { defaultExport: () => JitsiStub });
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("next/navigation", {
    namedExports: {
      useParams: () => ({ sessionId: "s1" }),
      useRouter: () => ({ push: (url: string) => pushed.push(url), replace() {}, back() {} }),
    },
  });
  mock.module("@/hooks/useAuth", { namedExports: { useAuth: () => ({ user: { role } }) } });
  mock.module("@/components/shared/RouteGuard", {
    namedExports: { RouteGuard: ({ children }: { children: React.ReactNode }) => <>{children}</> },
  });
  mock.module("sonner", { namedExports: { toast: { success() {}, error() {}, info() {} } } });
  mock.module("@/components/coaching/CoachingAttachmentPanel", {
    namedExports: {
      CoachingAttachmentPanel: ({ heading, viewerRole }: { heading?: string | null; viewerRole?: string }) => (
        <p>{`Dosya paneli: ${heading} (${viewerRole})`}</p>
      ),
    },
  });
  mock.module("@/components/coaching/CoachingReportQuickDraft", {
    namedExports: { CoachingReportQuickDraft: () => <p>Rapor taslağı alanı</p> },
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/coaching/sessions/s1/") return { data: detail };
        if (url === "/coaching/sessions/s1/session-token/") {
          const answer = tokenPlan[Math.min(tokenCalls, tokenPlan.length - 1)];
          tokenCalls += 1;
          if (answer === "ok") {
            return { data: { token: "jwt-1", room: "room-1", domain: "8x8.vc", server_time: "2026-10-21T16:12:00Z", session_status: "in_progress" } };
          }
          if (answer === "network") throw new Error("Network Error");
          throw httpError(answer.status, answer.data);
        }
        if (url === "/coaching/sessions/s1/attendance-summary/") {
          if (attendance === "fails") throw httpError(500);
          const entry = (seconds: number) => ({
            first_joined_at: seconds > 0 ? "2026-10-21T16:00:00Z" : null,
            last_left_at: null,
            join_count: seconds > 0 ? 1 : 0,
            total_connected_seconds: seconds,
          });
          return { data: { student: entry(attendance.student), tutor: entry(attendance.tutor) } };
        }
        if (url === "/coaching/sessions/") return { data: studentSessions };
        if (url === "/coaching/tutor/sessions/") return { data: tutorSessions };
        throw new Error(`unexpected GET ${url}`);
      },
      post: async () => ({ data: {} }),
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  jaasEmbed = await import("@/lib/jaasEmbed");
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  mock.timers.enable({ apis: ["Date"], now: at(12) });
  role = "student";
  tokenPlan = ["ok"];
  tokenCalls = 0;
  attendance = { tutor: 1800, student: 1800 };
  jitsiProps = null;
  jitsiHandlers = {};
  pushed.length = 0;
  detail = { ...item(), tutor_name: "Elif Kaya", student_name: "Deniz Yıldız", student_id: "u-1", viewer_role: "student" };
  const earlier = (id: string, day: string) =>
    item({ id, status: "completed", scheduled_start: `${day}T16:00:00Z`, scheduled_local_date: day, sequence_number: 1 });
  studentSessions = [earlier("a", "2026-10-07"), earlier("b", "2026-10-14"), item({ sequence_number: 1 })];
  tutorSessions = [item({ student_name: "Deniz Yıldız" })];
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

const setClock = (minutesFromStart: number) => {
  mock.timers.reset();
  mock.timers.enable({ apis: ["Date"], now: at(minutesFromStart) });
};
const openProblems = async () => fireEvent.click(await screen.findByRole("button", { name: /Bir sorun mu var\?/ }));

describe("the coaching room frame while the meeting runs", () => {
  it("mounts the call with the server's token and leaves Jitsi's own settings exactly as they were", async () => {
    renderPage();

    await screen.findByTestId("jitsi");
    const props = jitsiProps as Record<string, unknown>;
    assert.equal(props.domain, "8x8.vc");
    assert.equal(props.roomName, "room-1");
    assert.equal(props.jwt, "jwt-1");
    assert.equal(props.lang, "tr");
    assert.deepEqual(props.userInfo, { displayName: "Deniz Yıldız", email: "" });
    assert.deepEqual(props.configOverwrite, jaasEmbed.getCoachingJitsiConfigOverwrite());
    assert.deepEqual(props.interfaceConfigOverwrite, jaasEmbed.COACHING_JITSI_INTERFACE_CONFIG_OVERWRITE);
  });

  it("says whose meeting it is, which one, when, and how much of it is left", async () => {
    renderPage();

    const title = await screen.findByRole("heading", { level: 1, name: "Elif Kaya" });
    assert.ok(title.closest(".bg-ink"));
    assert.ok(await screen.findByText("3. görüşme · 19:00–19:30"), "numbered across the student's plan");
    assert.ok(screen.getByText("Kalan 18 dk"));
  });

  it("names the student on the tutor's bar", async () => {
    role = "tutor";
    detail = { ...detail, viewer_role: "tutor" };
    renderPage();

    assert.ok(await screen.findByRole("heading", { level: 1, name: "Deniz Yıldız" }));
    assert.ok(screen.getByText("3. görüşme · 19:00–19:30"), "the tutor's own numbering");
  });

  it("marks the last five minutes", async () => {
    setClock(26);
    renderPage();

    const chip = await screen.findByText("Kalan 4 dk");
    assert.match(chip.className, /bg-pink-deep/);
  });

  it("says the time is up and offers the screen after the meeting, while the call goes on", async () => {
    setClock(31);
    renderPage();

    await screen.findByTestId("jitsi");
    assert.ok(screen.getByText("Süre doldu"));
    const link = screen.getByRole("link", { name: "Görüşme özeti" });
    assert.equal(link.getAttribute("href"), "/session/coaching/s1/summary");
  });

  it("offers no way to leave: that is a decision about what an early exit means, not a button", async () => {
    renderPage();

    await screen.findByTestId("jitsi");
    assert.equal(screen.queryByRole("button", { name: /ayrıl|çık|bitir/i }), null);
    assert.equal(screen.queryByRole("link", { name: /ayrıl|çık|bitir/i }), null);
  });

  it("sends both sides to the screen after the meeting when the call closes", async () => {
    renderPage();
    await screen.findByTestId("jitsi");

    (jitsiProps as { onReadyToClose: () => void }).onReadyToClose();
    assert.deepEqual(pushed, ["/session/coaching/s1/summary"]);
  });

  it("shows the connection strip while the connection is down, and takes it away when it is back", async () => {
    renderPage();
    await screen.findByTestId("jitsi");
    assert.equal(screen.queryByRole("status"), null);

    act(() => jitsiHandlers.connectionInterrupted());
    assert.match(screen.getByRole("status").textContent ?? "", /Bağlantı koptu/);
    act(() => jitsiHandlers.connectionRestored());
    assert.equal(screen.queryByRole("status"), null);
  });
});

describe("the coaching room's panel", () => {
  it("gives a tutor the files, the report draft and the problem row", async () => {
    role = "tutor";
    detail = { ...detail, viewer_role: "tutor" };
    renderPage();

    assert.ok(await screen.findByText("Dosya paneli: Dosyalar (tutor)"));
    assert.ok(await screen.findByRole("heading", { name: "Rapor taslağı" }));
    assert.ok(screen.getByText("Rapor taslağı alanı"));
    assert.ok(await screen.findByRole("button", { name: /Bir sorun mu var\?/ }));
  });

  it("gives a student the files and the problem row, and no report draft", async () => {
    renderPage();

    assert.ok(await screen.findByText("Dosya paneli: Dosyalar (student)"));
    assert.ok(await screen.findByRole("button", { name: /Bir sorun mu var\?/ }));
    assert.equal(screen.queryByText("Rapor taslağı alanı"), null);
  });

  it("takes the problem row and the draft away from a meeting the server no longer takes a report for", async () => {
    role = "tutor";
    detail = { ...detail, viewer_role: "tutor", status: "completed" };
    renderPage();

    // The meeting has to be read before there is anything to leave out.
    await screen.findByRole("heading", { level: 1, name: "Deniz Yıldız" });
    assert.ok(screen.getByText("Dosya paneli: Dosyalar (tutor)"));
    assert.equal(screen.queryByRole("button", { name: /Bir sorun mu var\?/ }), null);
    assert.equal(screen.queryByText("Rapor taslağı alanı"), null);
  });

  it("offers Öğretmen katılmadı bildir only when the tutor is not there, and says when it opens before the tenth minute", async () => {
    attendance = { tutor: 0, student: 720 };
    renderPage();

    await openProblems();
    assert.ok(await screen.findByRole("button", { name: "Öğretmen katılmadı bildir" }));
    cleanup();

    attendance = { tutor: 1800, student: 720 };
    renderPage();
    await openProblems();
    assert.ok(await screen.findByRole("button", { name: "Teknik sorun bildir" }));
    assert.equal(screen.queryByRole("button", { name: "Öğretmen katılmadı bildir" }), null);
    cleanup();

    setClock(6);
    attendance = { tutor: 0, student: 360 };
    renderPage();
    await openProblems();
    assert.ok(await screen.findByText("Öğretmen katılmadı bildirimi görüşmenin 10. dakikasından sonra yapılabilir (19:10)."));
  });

  it("gives a tutor the same rule for the student", async () => {
    role = "tutor";
    detail = { ...detail, viewer_role: "tutor" };
    attendance = { tutor: 720, student: 0 };
    renderPage();

    await openProblems();
    assert.ok(await screen.findByRole("button", { name: "Öğrenci katılmadı bildir" }));
    cleanup();

    attendance = { tutor: 720, student: 1800 };
    renderPage();
    await openProblems();
    assert.ok(await screen.findByRole("button", { name: "Teknik sorun bildir" }));
    assert.equal(screen.queryByRole("button", { name: "Öğrenci katılmadı bildir" }), null);
  });

  it("does not take a failed attendance read for granted: it must not hide a report that is real", async () => {
    attendance = "fails";
    renderPage();

    await openProblems();
    assert.ok(await screen.findByRole("button", { name: "Öğretmen katılmadı bildir" }));
  });

  it("opens and closes on a desktop from the Panel button", async () => {
    renderPage();
    await screen.findByTestId("jitsi");

    const panel = screen.getByRole("complementary", { name: "Görüşme paneli" });
    const button = screen.getByRole("button", { name: "Panel" });
    assert.equal(button.getAttribute("aria-expanded"), "true");
    assert.match(panel.className, /md:flex/);
    fireEvent.click(button);
    assert.equal(button.getAttribute("aria-expanded"), "false");
    assert.match(panel.className, /md:hidden/);
  });

  it("opens one part at a time on a phone from the bottom bar", async () => {
    role = "tutor";
    detail = { ...detail, viewer_role: "tutor" };
    renderPage();
    await screen.findByTestId("jitsi");

    const nav = screen.getByRole("navigation", { name: "Görüşme paneli" });
    assert.deepEqual(
      within(nav).getAllByRole("button").map((button) => button.textContent),
      ["Dosyalar", "Rapor", "Sorun"],
    );
    const panel = screen.getByRole("complementary", { name: "Görüşme paneli" });
    assert.match(panel.className, /\bhidden\b/, "shut until a part is chosen");

    fireEvent.click(within(nav).getByRole("button", { name: "Rapor" }));
    assert.match(panel.className, /\bflex\b/);
    assert.equal(within(nav).getByRole("button", { name: "Rapor" }).getAttribute("aria-pressed"), "true");
    assert.doesNotMatch((document.getElementById("oda-rapor") as HTMLElement).className, /\bhidden\b/);
    assert.match((document.getElementById("oda-dosyalar") as HTMLElement).className, /hidden md:block/);

    fireEvent.click(within(nav).getByRole("button", { name: "Rapor" }));
    assert.match(panel.className, /\bhidden\b/);
  });

  it("has no Rapor on a student's bottom bar", async () => {
    renderPage();
    await screen.findByTestId("jitsi");

    const nav = screen.getByRole("navigation", { name: "Görüşme paneli" });
    assert.deepEqual(
      within(nav).getAllByRole("button").map((button) => button.textContent),
      ["Dosyalar", "Sorun"],
    );
  });
});

describe("the coaching room frame when the room cannot be entered", () => {
  const tooEarly: TokenAnswer = { status: 403, data: { code: "too_early", detail: "Coaching room is not open yet." } };

  beforeEach(() => {
    detail = { ...detail, status: "scheduled" };
  });

  it("makes the closed room a waiting screen that says when it opens, with the panel still beside it", async () => {
    setClock(-30);
    tokenPlan = [tooEarly];
    renderPage();

    assert.ok(await screen.findByRole("heading", { level: 2, name: "Oda 18:50'de açılır" }));
    assert.ok(screen.getByText("Görüşme 19:00'da başlıyor. Oda açılınca bu sayfa kendiliğinden girer."));
    assert.ok(screen.getByText("20 dk kaldı"));
    assert.ok(screen.getByText("Başlamasına 30 dk"));
    assert.equal(screen.queryByTestId("jitsi"), null);
    assert.ok(screen.getByText("Dosya paneli: Dosyalar (student)"));
    assert.equal(screen.queryByText(/Coaching room is not open/), null);
    assert.equal(screen.queryByRole("link", { name: "Görüşmeye hazırlan" }), null);
  });

  it("sends a tutor from the waiting screen to the preparation page", async () => {
    role = "tutor";
    detail = { ...detail, viewer_role: "tutor" };
    setClock(-30);
    tokenPlan = [tooEarly];
    renderPage();

    assert.ok(await screen.findByRole("heading", { level: 2, name: "Oda 18:45'te açılır" }));
    const link = screen.getByRole("link", { name: "Görüşmeye hazırlan" });
    assert.equal(link.getAttribute("href"), "/dashboard/tutor/coaching/sessions/s1/prepare");
    assert.match(link.className, /bg-gold/);
  });

  it("goes in by itself the moment the room opens", async () => {
    mock.timers.reset();
    mock.timers.enable({ apis: ["Date"], now: new Date(START - 10 * MINUTE - 100) });
    tokenPlan = [tooEarly, "ok"];
    renderPage();

    assert.ok(await screen.findByRole("heading", { level: 2, name: "Oda 18:50'de açılır" }));
    assert.equal(tokenCalls, 1);
    await waitFor(() => assert.ok(screen.getByTestId("jitsi")), { timeout: 4000 });
    assert.equal(tokenCalls, 2);
  });

  it("sends a meeting that has ended to the screen where it can be rated or reported", async () => {
    detail = { ...detail, status: "awaiting_report" };
    setClock(40);
    tokenPlan = [{ status: 403, data: { code: "session_ended", detail: "This coaching session has ended." } }];
    renderPage();

    assert.ok(await screen.findByRole("heading", { level: 2, name: "Bu görüşme sona erdi" }));
    assert.ok(screen.getByText("Görüşmeyi değerlendirmek ya da bir sorun bildirmek için görüşme özetine git."));
    const link = screen.getByRole("link", { name: "Görüşme özetine git" });
    assert.equal(link.getAttribute("href"), "/session/coaching/s1/summary");
    assert.match(link.className, /bg-gold/);
    assert.equal(screen.queryByRole("link", { name: "Görüşme özeti" }), null, "one way on, not two");
    assert.ok(screen.getByRole("button", { name: /Bir sorun mu var\?/ }), "a meeting waiting for its report can still be reported");
    assert.equal(screen.queryByText(/has ended/), null);
  });

  it("says what became of a meeting that is not active, in the words of the screen after the meeting", async () => {
    detail = { ...detail, status: "technical_failure" };
    setClock(5);
    tokenPlan = [{ status: 409, data: { code: "session_not_active", detail: "Session is technical_failure." } }];
    renderPage();

    assert.ok(await screen.findByRole("heading", { level: 2, name: "Teknik sorun bildirildi" }));
    assert.ok(screen.getByText("Destek ekibi bildirimi inceliyor."));
    assert.ok(screen.getByRole("link", { name: "Görüşme özetine git" }));
    assert.equal(screen.queryByRole("button", { name: /Bir sorun mu var\?/ }), null);
    assert.equal(screen.queryByText(/Session is/), null);
  });

  it("calls a video service that is not set up unavailable, and tries again on a press", async () => {
    tokenPlan = [{ status: 503, data: { detail: "Video session is not configured. Please try again later." } }, "ok"];
    renderPage();

    assert.ok(await screen.findByRole("heading", { level: 2, name: "Görüntülü görüşme şu an açılamıyor" }));
    assert.equal(screen.queryByText(/not configured/), null);
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    await screen.findByTestId("jitsi");
    assert.equal(tokenCalls, 2);
  });

  it("names a lost connection by its name", async () => {
    tokenPlan = ["network"];
    renderPage();

    assert.ok(await screen.findByRole("heading", { level: 2, name: "Bağlantı kurulamadı" }));
    assert.ok(screen.getByRole("button", { name: "Tekrar dene" }));
  });
});
