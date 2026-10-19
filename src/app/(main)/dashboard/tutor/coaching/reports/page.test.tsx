import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

// Monday 19 October 2026, 12:30 in Istanbul. The page reads the clock; the tests freeze it.
const NOW = new Date("2026-10-19T09:30:00Z");

const sessions = [
  {
    id: "s-1",
    service_period_id: "sp-1",
    sequence_number: 5,
    week_index: 1,
    status: "awaiting_report",
    scheduled_start: "2026-10-18T16:00:00Z",
    scheduled_local_date: "2026-10-18",
    scheduled_local_time: "19:00",
    duration_minutes: 30,
    reschedule_count: 0,
    student_name: "Zeynep K.",
    report_due_at: "2026-10-20T15:00:00Z",
    report_overdue: false,
    complaint_eligible_at: null,
    complaint_eligible: false,
  },
];
const reports = [
  { report_id: "r-1", session_id: "s-d", draft_version: 2, latest_revision: null, student_name: "Mert A.", scheduled_start: "2026-10-14T15:30:00Z" },
];
const disputes = [
  { id: "d-1", category: "technical", status: "under_review", description: "", submitted_at: "2026-10-15T10:00:00Z" },
];

let data = { sessions, reports, disputes };
let sessionsFail = false;
let disputesFail = false;

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
      usePathname: () => "/dashboard/tutor/coaching/reports",
      useSearchParams: () => new URLSearchParams(),
    },
  });
  mock.module("@/components/coaching/CoachingGuard", {
    namedExports: {
      CoachingRecordGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    },
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
        if (url === "/coaching/reports/") return { data: data.reports };
        if (url === "/coaching/tutor/sessions/") {
          if (sessionsFail) throw new Error("boom");
          return { data: data.sessions };
        }
        if (url === "/coaching/tutor/disputes/") {
          if (disputesFail) throw new Error("boom");
          return { data: data.disputes };
        }
        throw new Error(`unexpected GET ${url}`);
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  mock.timers.enable({ apis: ["Date"], now: NOW });
  data = { sessions, reports, disputes };
  sessionsFail = false;
  disputesFail = false;
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
    </QueryClientProvider>
  );
}

describe("Kayıtlar page", () => {
  it("lists what is owed with its deadline, then the calendar, then complaints", async () => {
    renderPage();

    const owed = (await screen.findByRole("heading", { name: "Yazılacak raporlar" })).closest("div.overflow-hidden") as HTMLElement;
    assert.ok(within(owed).getByText("Zeynep K."));
    assert.ok(within(owed).getByText("Yarın 18:00"));
    assert.ok(screen.getByRole("heading", { name: "Ekim 2026" }));
    assert.ok(screen.getByRole("heading", { name: "Sorun bildirimleri" }));
    assert.ok(screen.getByText("Teknik sorun"));
    assert.ok(screen.getByText("İnceleniyor"));
    assert.ok(screen.getByRole("heading", { level: 1, name: "Kayıtlar" }));
  });

  it("puts a draft on its meeting's day, named, once the report list carries the name and date", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "Ekim 2026" });

    fireEvent.click(screen.getByRole("button", { name: "14 Ekim, 1 taslak" }));

    const day = screen.getByRole("region", { name: "14 Ekim Çarşamba" });
    assert.ok(within(day).getByText("Mert A."));
    assert.equal(
      within(day).getByRole("link", { name: "Devam et" }).getAttribute("href"),
      "/dashboard/tutor/coaching/sessions/s-d/report"
    );
  });

  it("still lists a report the server does not date, rather than losing it", async () => {
    data = { ...data, reports: [{ report_id: "r-x", session_id: "s-x", draft_version: 1, latest_revision: null } as (typeof reports)[number]], sessions: [] };
    renderPage();

    const undated = (await screen.findByRole("heading", { name: "Tarihi görünmeyen raporlar" })).closest("div.overflow-hidden") as HTMLElement;
    assert.ok(within(undated).getByText("Taslak 1 · henüz yayınlanmadı"));
  });

  it("does not show a calendar that looks empty when the meetings could not load, and retries", async () => {
    sessionsFail = true;
    renderPage();

    assert.ok(await screen.findByText("Raporlar yüklenemedi."));
    assert.equal(screen.queryByRole("heading", { name: "Ekim 2026" }), null);

    sessionsFail = false;
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    await waitFor(() => assert.ok(screen.getByRole("heading", { name: "Ekim 2026" })));
  });

  it("says complaints could not load without hiding the reports", async () => {
    disputesFail = true;
    renderPage();

    assert.ok(await screen.findByText("Sorun bildirimleri yüklenemedi."));
    assert.ok(screen.getByRole("heading", { name: "Yazılacak raporlar" }));
  });

  it("invites rather than apologises when there is nothing at all", async () => {
    data = { sessions: [], reports: [], disputes: [] };
    renderPage();

    assert.ok(await screen.findByText("Henüz rapor yok"));
  });
});
