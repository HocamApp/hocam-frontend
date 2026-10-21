import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { CoachingSessionItem } from "@/lib/coachingApi";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

// Monday 19 October 2026, 12:30 in Istanbul. The page reads the clock; the tests freeze it.
const NOW = new Date("2026-10-19T09:30:00Z");

function session(overrides: Partial<CoachingSessionItem>): CoachingSessionItem {
  return {
    id: "s-1",
    service_period_id: "sp-1",
    sequence_number: 5,
    week_index: 1,
    status: "scheduled",
    scheduled_start: "2026-10-19T16:00:00Z",
    scheduled_local_date: "2026-10-19",
    scheduled_local_time: "19:00",
    duration_minutes: 30,
    reschedule_count: 0,
    student_name: "Zeynep K.",
    report_due_at: null,
    report_overdue: false,
    complaint_eligible_at: null,
    complaint_eligible: false,
    ...overrides,
  };
}

let sessions: CoachingSessionItem[] = [];
let fail = false;

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
      usePathname: () => "/dashboard/tutor/coaching/upcoming",
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
        if (url === "/coaching/tutor/sessions/") {
          if (fail) throw new Error("boom");
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
  mock.timers.enable({ apis: ["Date"], now: NOW });
  fail = false;
  sessions = [
    session({}),
    session({ id: "car", status: "reschedule_requested", scheduled_start: "2026-10-21T15:30:00Z", scheduled_local_date: "2026-10-21", scheduled_local_time: "18:30", student_name: "Mert A.", sequence_number: 4 }),
    session({
      id: "report",
      status: "awaiting_report",
      scheduled_start: "2026-10-18T16:00:00Z",
      scheduled_local_date: "2026-10-18",
      report_due_at: "2026-10-20T15:00:00Z",
    }),
  ];
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

describe("Görüşmeler page", () => {
  it("opens on the next meeting, then what follows by day, then reports owed", async () => {
    renderPage();

    const next = await screen.findByRole("region", { name: "Sıradaki görüşme" });
    assert.ok(within(next).getByText("Bugün 19:00 · Zeynep K."));
    assert.ok(within(next).getByText("Sıradaki görüşme · 6 sa 30 dk sonra"));
    assert.ok(screen.getByText("21 Ekim Çarşamba"));
    assert.ok(screen.getByText("Saat değişikliği istendi"));
    assert.ok(screen.getByRole("heading", { name: "Rapor bekleyen" }));
    assert.ok(screen.getByRole("heading", { level: 1, name: "Görüşmeler" }));
  });

  it("lists the first 14 days and reveals the next 14 when asked, until nothing is left out", async () => {
    sessions = [
      session({}),
      ...[
        ["w1", "2026-10-26"],
        ["w2", "2026-11-02"],
        ["w3", "2026-11-09"],
      ].map(([id, day]) => session({ id, scheduled_start: `${day}T16:00:00Z`, scheduled_local_date: day })),
    ];
    renderPage();

    await screen.findByRole("region", { name: "Sıradaki görüşme" });
    assert.ok(screen.getByText("26 Ekim Pazartesi"));
    assert.equal(screen.queryByText("2 Kasım Pazartesi"), null);

    fireEvent.click(screen.getByRole("button", { name: "2 görüşme daha göster" }));
    assert.ok(screen.getByText("2 Kasım Pazartesi"));
    assert.ok(screen.getByText("9 Kasım Pazartesi"));
    assert.equal(screen.queryByRole("button", { name: /daha göster/ }), null);
  });

  it("does not offer Katıl on a meeting whose room is not open yet", async () => {
    renderPage();

    await screen.findByRole("region", { name: "Sıradaki görüşme" });
    assert.equal(screen.queryByRole("link", { name: "Katıl" }), null);
    assert.ok(screen.getByText("Katıl 18:45'te açılır"));
  });

  it("offers Katıl for a meeting that is running, now that the server lists it", async () => {
    sessions = [session({ id: "live", status: "in_progress", scheduled_start: "2026-10-19T09:20:00Z", scheduled_local_time: "12:20" })];
    renderPage();

    const link = await screen.findByRole("link", { name: "Katıl" });
    assert.equal(link.getAttribute("href"), "/session/coaching/live");
  });

  it("invites rather than apologises when nothing is ahead", async () => {
    sessions = [];
    renderPage();

    assert.ok(await screen.findByText("Yaklaşan görüşme yok"));
  });

  it("says the meetings could not be loaded, and retries", async () => {
    fail = true;
    renderPage();

    assert.ok(await screen.findByText("Görüşmeler yüklenemedi."));
    assert.equal(screen.queryByText("Yaklaşan görüşme yok"), null);

    fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    await waitFor(() => assert.ok(screen.getByRole("region", { name: "Sıradaki görüşme" })));
  });
});
