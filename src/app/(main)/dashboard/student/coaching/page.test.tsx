import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

// Tuesday 20 October 2026, 15:20 in Istanbul. The page reads the clock; the tests freeze it.
const NOW = new Date("2026-10-20T12:20:00Z");

function sessionRow(id: string, status: string, start: string, localDate: string, localTime: string) {
  return {
    id,
    service_period_id: "p-1",
    sequence_number: 1,
    week_index: 1,
    status,
    scheduled_start: start,
    scheduled_local_date: localDate,
    scheduled_local_time: localTime,
    duration_minutes: 30,
    reschedule_count: 0,
    report_due_at: null,
    report_overdue: false,
    complaint_eligible_at: null,
    complaint_eligible: false,
  };
}

const activeState = {
  id: "cp-1",
  service_period_id: "p-1",
  service_status: "active",
  frequency: "twice_weekly",
  weeks: 4,
  total_sessions: 8,
  slot_selection_deadline_at: null,
  required_slot_count: 2,
};

const sessions = [
  sessionRow("s-1", "completed", "2026-10-12T15:30:00Z", "2026-10-12", "18:30"),
  sessionRow("s-2", "awaiting_report", "2026-10-15T15:30:00Z", "2026-10-15", "18:30"),
  sessionRow("s-3", "scheduled", "2026-10-21T15:30:00Z", "2026-10-21", "18:30"),
  sessionRow("s-4", "scheduled", "2026-10-23T15:30:00Z", "2026-10-23", "18:30"),
];

function taskRow(id: string, title: string, subject: string, due: string | null) {
  return { id, title, description: "", subject, due_date: due, priority: null, sort_order: 1, is_completed: false, completed_at: null };
}

const reportRows = [
  {
    report_id: "r-2",
    session_id: "s-2",
    latest_revision: {
      id: "rev-1",
      revision_number: 1,
      source_draft_version: 1,
      content: {},
      published_at: "2026-10-15T10:00:00Z",
      change_note: null,
    },
  },
];

const disputeRows = [
  {
    id: "d-1",
    category: "report_absent",
    status: "under_review",
    description: "Rapor gelmedi",
    submitted_at: "2026-10-16T08:00:00Z",
    service_period_id: "p-1",
    session_id: null,
    determination: null,
    selected_remedy: null,
    application: null,
    refund: { liability_minor: 0, settled_minor: 0, state: "none" },
    evidence: [],
    tutor_responses: [],
    timeline: [],
  },
];

let state: Record<string, unknown> | "missing" | "error" = activeState;
let programFails = false;
let reportsFail = false;
let reportList = reportRows;
let completed = new Set<string>();
const requested: string[] = [];
const posted: string[] = [];
const toasts: string[] = [];

function httpError(status: number) {
  return Object.assign(new Error(`http ${status}`), { response: { status } });
}

let Page: React.ComponentType;

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
      useRouter: () => ({ push() {}, replace() {}, back() {} }),
      usePathname: () => "/dashboard/student/coaching",
      useSearchParams: () => new URLSearchParams(),
    },
  });
  mock.module("@/components/shared/RouteGuard", {
    namedExports: { RouteGuard: ({ children }: { children: React.ReactNode }) => <>{children}</> },
  });
  mock.module("@/components/coaching/CoachingPageShell", {
    namedExports: {
      CoachingPageShell: ({ title, children }: { title: string; children: React.ReactNode }) => (
        <main>
          <h1>{title}</h1>
          {children}
        </main>
      ),
    },
  });
  mock.module("sonner", {
    namedExports: {
      toast: {
        success: (message: string) => toasts.push(`success: ${message}`),
        error: (message: string) => toasts.push(`error: ${message}`),
      },
    },
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        requested.push(url);
        if (url === "/coaching/scheduling/") {
          if (state === "missing") throw httpError(404);
          if (state === "error") throw httpError(500);
          return { data: state };
        }
        if (url === "/coaching/sessions/") return { data: sessions };
        if (url === "/coaching/purchases/cp-1/conversation/") {
          return { data: { id: "c-1", other_participant: { id: "u-9", email: "", display_name: "Elif Kaya", avatar_url: null }, unread_count: 2 } };
        }
        if (url === "/coaching/service-periods/p-1/program/") {
          if (programFails) throw httpError(500);
          const tasks = [
            taskRow("t-1", "Problemler: 40 soru", "Matematik", "2026-10-21"),
            taskRow("t-2", "Paragraf: 2 deneme", "Türkçe", "2026-10-22"),
            taskRow("t-3", "Türev çıkmış soru analizi", "Matematik", "2026-10-23"),
          ].map((task) => ({ ...task, is_completed: completed.has(task.id) }));
          return { data: { id: "pr-1", service_period_id: "p-1", title: "Ekim programı", objective: "", start_date: null, end_date: null, tasks } };
        }
        if (url === "/coaching/reports/") {
          if (reportsFail) throw httpError(500);
          return { data: reportList };
        }
        if (url === "/coaching/disputes/") return { data: disputeRows };
        throw new Error(`unexpected GET ${url}`);
      },
      post: async (url: string) => {
        posted.push(url);
        const match = /program-tasks\/(.+)\/toggle-completion/.exec(url);
        if (match) {
          completed.add(match[1]);
          return { data: { id: match[1], is_completed: true } };
        }
        throw new Error(`unexpected POST ${url}`);
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  mock.timers.enable({ apis: ["Date"], now: NOW });
  state = activeState;
  programFails = false;
  reportsFail = false;
  reportList = reportRows;
  completed = new Set();
  requested.length = 0;
  posted.length = 0;
  toasts.length = 0;
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

describe("student Genel bakış: the coach card", () => {
  it("is titled like its tab and names the coach, with the unread count linking to the thread", async () => {
    renderPage();

    assert.ok(screen.getByRole("heading", { level: 1, name: "Genel bakış" }));
    assert.ok(await screen.findByRole("heading", { name: "Elif Kaya" }));
    const link = await screen.findByRole("link", { name: "Hocana yaz · 2 yeni" });
    assert.equal(link.getAttribute("href"), "/messages/c-1");
    assert.ok(screen.getByText("Aktif"));
    assert.ok(screen.getByText("Haftada 2 görüşme · 4 hafta · 12 Eki – 23 Eki"));
    const progress = await screen.findByRole("img", { name: "2 görüşme tamamlandı · 3. görüşme sırada" });
    assert.equal(progress.children.length, 8);
  });

  it("no longer repeats the tabs as a grid of links", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "Elif Kaya" });

    assert.equal(screen.queryByText("Bildirdiğim koçluk sorunları"), null);
    assert.equal(screen.queryByText("Raporlarım"), null);
    assert.equal(screen.queryByText("Yaklaşan görüşmeler"), null);
    assert.equal(screen.getByRole("link", { name: "Hocam destek" }).getAttribute("href"), "/support");
  });
});

describe("student Genel bakış: Sırada", () => {
  it("lists meetings and tasks by date and says when the room opens instead of offering Katıl", async () => {
    renderPage();

    const region = await screen.findByRole("region", { name: "Sırada" });
    await within(region).findByText("Problemler: 40 soru");
    const rows = within(region).getAllByRole("listitem");
    assert.deepEqual(
      rows.map((row) => within(row).getByText(/görüşme · 18:30|Problemler|Paragraf|Türev/).textContent),
      ["3. görüşme · 18:30", "Problemler: 40 soru", "Paragraf: 2 deneme", "4. görüşme · 18:30", "Türev çıkmış soru analizi"],
    );
    assert.ok(within(rows[0]).getByText("Katıl 18:20'de açılır"));
    assert.ok(within(rows[0]).getByText("1 gün 3 sa"));
    assert.equal(within(region).queryByRole("link", { name: "Katıl" }), null);
  });

  it("offers Katıl from ten minutes before the start", async () => {
    mock.timers.reset();
    mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-21T15:21:00Z") });
    renderPage();

    const region = await screen.findByRole("region", { name: "Sırada" });
    const join = await within(region).findByRole("link", { name: "Katıl" });
    assert.equal(join.getAttribute("href"), "/session/coaching/s-3");
  });

  it("completes a task from the list and the row leaves", async () => {
    renderPage();

    const button = await screen.findByRole("button", { name: "Problemler: 40 soru görevini tamamla" });
    fireEvent.click(button);

    await waitFor(() => assert.deepEqual(posted, ["/coaching/program-tasks/t-1/toggle-completion/"]));
    await waitFor(() => assert.equal(screen.queryByText("Problemler: 40 soru"), null));
    assert.ok(toasts.includes("success: Görev tamamlandı."));
    // The other tasks stay.
    assert.ok(screen.getByText("Paragraf: 2 deneme"));
  });

  it("keeps the meetings when the program cannot be read, and retries just that read", async () => {
    programFails = true;
    renderPage();

    const region = await screen.findByRole("region", { name: "Sırada" });
    assert.ok(await within(region).findByText("Görevlerin yüklenemedi."));
    assert.ok(within(region).getByText("3. görüşme · 18:30"));

    programFails = false;
    fireEvent.click(within(region).getByRole("button", { name: "Tekrar dene" }));
    await within(region).findByText("Problemler: 40 soru");
    assert.equal(within(region).queryByText("Görevlerin yüklenemedi."), null);
  });
});

describe("student Genel bakış: Geçmiş", () => {
  it("shows the latest report and the open complaint", async () => {
    renderPage();

    const region = await screen.findByRole("region", { name: "Geçmiş" });
    assert.ok(await within(region).findByText("2. görüşme raporu yayınlandı"));
    assert.ok(within(region).getByText("Sürüm 1"));
    assert.equal(
      within(region).getByRole("link", { name: "2. görüşme raporu yayınlandı: Raporu aç" }).getAttribute("href"),
      "/dashboard/student/coaching/reports/r-2",
    );
    assert.ok(within(region).getByText("Sorun bildirimin"));
    assert.ok(within(region).getByText("Rapor hazırlanmadı · İnceleniyor"));
    assert.equal(
      within(region).getByRole("link", { name: "Sorun bildirimin: Durumu gör" }).getAttribute("href"),
      "/dashboard/student/coaching/complaints/d-1",
    );
  });

  it("says the reports could not be read instead of leaving the section empty", async () => {
    reportsFail = true;
    renderPage();

    const region = await screen.findByRole("region", { name: "Geçmiş" });
    assert.ok(await within(region).findByText("Raporların yüklenemedi."));
    assert.ok(within(region).getByRole("button", { name: "Tekrar dene" }));
    // The meetings above are not affected.
    assert.ok(await screen.findByText("3. görüşme · 18:30"));
  });
});

describe("student Genel bakış: other states", () => {
  it("asks for the time to be picked, with the deadline, while scheduling is waiting", async () => {
    state = {
      ...activeState,
      service_period_id: null,
      service_status: "accepted_awaiting_schedule",
      slot_selection_deadline_at: "2026-10-22T20:59:00Z",
    };
    renderPage();

    const region = await screen.findByRole("region", { name: "Sıradaki adım" });
    assert.equal(
      within(region).getByRole("link", { name: "Koçluk saatini seç" }).getAttribute("href"),
      "/dashboard/student/coaching/schedule",
    );
    assert.ok(within(region).getByText("Son seçim zamanı"));
    assert.ok(within(region).getByText("22 Ekim Perşembe 23:59"));
    assert.equal(screen.queryByRole("region", { name: "Sırada" }), null);
    assert.equal(requested.includes("/coaching/sessions/"), false);
  });

  it("says a coaching that was cancelled has ended and keeps its reports in reach", async () => {
    state = { ...activeState, service_period_id: null, service_status: "cancelled" };
    renderPage();

    assert.ok(await screen.findByText("Bu koçluk sona erdi. Geçmiş raporların Raporlar sekmesinde kalır."));
    assert.ok(screen.getByText("İptal edildi"));
    const region = await screen.findByRole("region", { name: "Geçmiş koçluğun" });
    assert.ok(within(region).getByText("Görüşme raporu yayınlandı"));
    assert.equal(screen.queryByRole("region", { name: "Sırada" }), null);
    assert.equal(screen.queryByRole("region", { name: "Sıradaki adım" }), null);
    assert.equal(requested.includes("/coaching/sessions/"), false);
  });

  it("shows past reports, not an empty state, when the coaching has ended", async () => {
    state = "missing";
    renderPage();

    const region = await screen.findByRole("region", { name: "Geçmiş koçluğun" });
    assert.ok(await within(region).findByText("Görüşme raporu yayınlandı"));
    assert.equal(
      within(region).getByRole("link", { name: "Görüşme raporu yayınlandı: Raporu aç" }).getAttribute("href"),
      "/dashboard/student/coaching/reports/r-2",
    );
    assert.equal(screen.queryByText("Henüz bir çalışma koçluğun yok"), null);
  });

  it("keeps the empty state when there is no coaching and nothing to look back on", async () => {
    state = "missing";
    reportList = [];
    renderPage();

    assert.ok(await screen.findByText("Henüz bir çalışma koçluğun yok"));
    assert.equal(screen.queryByRole("region", { name: "Geçmiş koçluğun" }), null);
  });

  it("says the coaching could not be read, rather than that there is none", async () => {
    state = "error";
    renderPage();

    assert.ok(await screen.findByText("Koçluk bilgilerin yüklenemedi. Bağlantını kontrol edip tekrar dene."));
    assert.equal(screen.queryByText("Henüz bir çalışma koçluğun yok"), null);
  });
});
