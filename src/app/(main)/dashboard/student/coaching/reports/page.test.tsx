import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

function sessionRow(id: string, status: string, start: string, localDate: string) {
  return {
    id,
    service_period_id: "p-1",
    sequence_number: 1,
    week_index: 1,
    status,
    scheduled_start: start,
    scheduled_local_date: localDate,
    scheduled_local_time: "18:30",
    duration_minutes: 30,
    reschedule_count: 0,
    report_due_at: null,
    report_overdue: false,
    complaint_eligible_at: null,
    complaint_eligible: false,
  };
}

function reportRow(id: string, sessionId: string, start: string | undefined, publishedAt: string, extra: Record<string, unknown> = {}) {
  return {
    report_id: id,
    session_id: sessionId,
    ...(start ? { scheduled_start: start } : {}),
    latest_revision: {
      id: `rev-${id}`,
      revision_number: 1,
      source_draft_version: 1,
      content: {
        short_summary: `Özet ${id}`,
        focus_until_next_meeting: `Odak ${id}`,
      },
      published_at: publishedAt,
      change_note: null,
      ...extra,
    },
  };
}

const sessions = [
  sessionRow("s1", "completed", "2026-10-05T15:30:00Z", "2026-10-05"),
  sessionRow("s2", "completed", "2026-10-08T15:30:00Z", "2026-10-08"),
  sessionRow("s3", "completed", "2026-10-12T15:30:00Z", "2026-10-12"),
  sessionRow("s4", "awaiting_report", "2026-10-15T15:30:00Z", "2026-10-15"),
];

// In the order a server with no order of its own might send them.
const reports = [
  reportRow("r2", "s2", "2026-10-08T15:30:00Z", "2026-10-09T07:00:00Z"),
  reportRow("r4", "s4", "2026-10-15T15:30:00Z", "2026-10-16T07:00:00Z"),
  reportRow("r1", "s1", "2026-10-05T15:30:00Z", "2026-10-06T07:00:00Z"),
  reportRow("r3", "s3", "2026-10-12T15:30:00Z", "2026-10-13T07:00:00Z", { revision_number: 2 }),
];

let reportList: unknown[] = reports;
let reportsFail = false;
let sessionsFail = false;

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
      usePathname: () => "/dashboard/student/coaching/reports",
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
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/coaching/reports/") {
          if (reportsFail) throw Object.assign(new Error("boom"), { response: { status: 500 } });
          return { data: reportList };
        }
        if (url === "/coaching/sessions/") {
          if (sessionsFail) throw Object.assign(new Error("boom"), { response: { status: 500 } });
          return { data: sessions };
        }
        throw new Error(`unexpected GET ${url}`);
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  reportList = reports;
  reportsFail = false;
  sessionsFail = false;
});
afterEach(cleanup);

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>,
  );
}

describe("student Raporlar: the list", () => {
  it("is titled like its tab and lists the reports newest meeting first, by meeting number and day", async () => {
    renderPage();

    assert.ok(screen.getByRole("heading", { level: 1, name: "Raporlar" }));
    const list = await screen.findByRole("list", { name: "Raporlar" });
    const cards = within(list).getAllByRole("listitem");
    assert.deepEqual(
      cards.map((card) => within(card).getByRole("heading", { level: 3 }).textContent),
      ["4. görüşme", "3. görüşme", "2. görüşme", "1. görüşme"],
    );
    assert.ok(within(cards[0]).getByText("Per 15 Eki"));
  });

  it("shows the focus, when it was published and which version, and opens the report", async () => {
    renderPage();

    const list = await screen.findByRole("list", { name: "Raporlar" });
    const [latest, updated] = within(list).getAllByRole("listitem");
    assert.ok(within(latest).getByText("Odak"));
    assert.ok(within(latest).getByText("Odak r4"));
    assert.ok(within(latest).getByText("Yayınlandı Cum 16 Eki · Sürüm 1"));
    assert.equal(
      within(latest).getByRole("link", { name: "4. görüşme: Raporu aç" }).getAttribute("href"),
      "/dashboard/student/coaching/reports/r4",
    );
    assert.ok(within(updated).getByText("Yayınlandı Sal 13 Eki · Sürüm 2, güncellendi"));
  });

  it("names the day instead of a number when the meetings cannot be read, and still lists the reports", async () => {
    sessionsFail = true;
    renderPage();

    const list = await screen.findByRole("list", { name: "Raporlar" });
    assert.deepEqual(
      within(list).getAllByRole("listitem").map((card) => within(card).getByRole("heading", { level: 3 }).textContent),
      ["15 Ekim Perşembe", "12 Ekim Pazartesi", "8 Ekim Perşembe", "5 Ekim Pazartesi"],
    );
  });

  it("orders by publishing day when the server does not say which meeting a report is for", async () => {
    reportList = [
      reportRow("a", "s1", undefined, "2026-10-06T07:00:00Z"),
      reportRow("b", "s2", undefined, "2026-10-09T07:00:00Z"),
    ];
    renderPage();

    const list = await screen.findByRole("list", { name: "Raporlar" });
    assert.deepEqual(
      within(list).getAllByRole("listitem").map((card) => within(card).getByRole("link").getAttribute("href")),
      ["/dashboard/student/coaching/reports/b", "/dashboard/student/coaching/reports/a"],
    );
  });
});

describe("student Raporlar: states", () => {
  it("says the reports could not be read and retries, instead of looking empty", async () => {
    reportsFail = true;
    renderPage();

    assert.ok(await screen.findByText("Raporların yüklenemedi."));
    assert.equal(screen.queryByText("Henüz yayınlanmış raporun yok"), null);

    reportsFail = false;
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    await screen.findByRole("list", { name: "Raporlar" });
    await waitFor(() => assert.equal(screen.queryByText("Raporların yüklenemedi."), null));
  });

  it("keeps the empty state when no report is published yet", async () => {
    reportList = [];
    renderPage();

    assert.ok(await screen.findByText("Henüz yayınlanmış raporun yok"));
  });
});
