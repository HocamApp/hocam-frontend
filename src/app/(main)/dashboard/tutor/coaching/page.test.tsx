import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { CoachingCapacityDetail, CoachingPlan, CoachingSessionItem } from "@/lib/coachingApi";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

// Monday 19 October 2026, 12:30 in Istanbul. The page reads the clock; the tests freeze it.
const NOW = new Date("2026-10-19T09:30:00Z");

const plan: CoachingPlan = {
  id: "plan-1",
  frequency: "weekly",
  session_duration_minutes: 30,
  price_per_session_minor: 60000,
  price_per_session_display: "600,00 ₺",
  price_cap_minor: 90000,
  max_active_students: 6,
  target_exam_types: ["YKS"],
  description: "",
  is_published: true,
  is_accepting_new_students: true,
  published_at: "2026-10-02T09:00:00Z",
  capacity: null,
  created_at: "2026-10-01T09:00:00Z",
  updated_at: "2026-10-02T09:00:00Z",
};

const capacity: CoachingCapacityDetail = {
  weekly_slot_count: 12,
  theoretical_capacity: 8,
  max_active_students: 6,
  active_students: 3,
  is_accepting_new_students: true,
  can_accept_new_student: true,
  slots: [],
};

function session(overrides: Partial<CoachingSessionItem>): CoachingSessionItem {
  return {
    id: "s-1",
    service_period_id: "p-1",
    sequence_number: 1,
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

const sessions: CoachingSessionItem[] = [
  session({}),
  session({
    id: "s-report",
    status: "awaiting_report",
    scheduled_start: "2026-10-18T16:00:00Z",
    scheduled_local_date: "2026-10-18",
    report_due_at: "2026-10-20T15:00:00Z",
  }),
  session({ id: "s-wed", scheduled_start: "2026-10-21T15:30:00Z", scheduled_local_date: "2026-10-21", scheduled_local_time: "18:30", student_name: "Mert A." }),
];

const acceptance = [
  {
    id: "a-1",
    student: { id: "u-1", name: "Can", surname: "T." },
    package: { id: "pk", plan_name: "Paket", lessons_per_week: 1, duration_days: 30, total_credits: 4, total_price: 2400 },
    coaching: { frequency: "weekly", total_sessions: 4, total_price_minor: 240000, service_status: "pending" },
    includes_coaching: true,
    status: "pending",
    purchase_status: "pending_acceptance",
    requested_at: "2026-10-19T08:00:00Z",
    expires_at: "2026-10-19T11:45:00Z",
    responded_at: null,
    rejection_reason: "",
    rejection_note: "",
  },
];

let currentPlan: CoachingPlan | null = plan;
let timeRequestsFail = false;
const requested: string[] = [];

function notFound() {
  return Object.assign(new Error("not found"), { response: { status: 404 } });
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
      usePathname: () => "/dashboard/tutor/coaching",
      useSearchParams: () => new URLSearchParams(),
    },
  });
  mock.module("@/components/coaching/CoachingGuard", {
    namedExports: { CoachingGuard: ({ children }: { children: React.ReactNode }) => <>{children}</> },
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
  mock.module("@/components/shared/PageIntroHint", { namedExports: { PageIntroHint: () => null } });
  mock.module("@/hooks/useCoachingFlag", {
    namedExports: { useCoachingFlag: () => ({ enabled: true, isLoading: false, checkoutEnabled: true }) },
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        requested.push(url);
        if (url === "/coaching/onboarding/") return { data: { is_completed: true } };
        if (url === "/coaching/plan/") {
          if (!currentPlan) throw notFound();
          return { data: currentPlan };
        }
        if (url === "/coaching/capacity/") return { data: capacity };
        if (url === "/coaching/tutor/sessions/") return { data: sessions };
        if (url === "/payments/tutor-acceptance/requests/") return { data: acceptance };
        if (url === "/coaching/tutor/time-requests/") {
          if (timeRequestsFail) throw new Error("boom");
          return { data: [] };
        }
        if (url === "/coaching/tutor/reschedule-requests/") return { data: [] };
        throw new Error(`unexpected GET ${url}`);
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  mock.timers.enable({ apis: ["Date"], now: NOW });
  currentPlan = plan;
  timeRequestsFail = false;
  requested.length = 0;
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

describe("Genel bakış page", () => {
  it("lists what is waiting, soonest first, from every source at once", async () => {
    renderPage();

    const heading = await screen.findByRole("heading", { name: "Yapılacaklar" });
    await screen.findByText("Can T. koçluk istiyor");
    const card = heading.closest("div.overflow-hidden") as HTMLElement;
    const rows = within(card).getAllByRole("listitem");
    assert.deepEqual(
      rows.map((row) => within(row).getByRole("link").textContent),
      ["Yanıtla", "Hazırlan", "Raporu yaz"]
    );
    assert.ok(within(rows[0]).getByText("2 sa 15 dk kaldı"));
    assert.ok(within(rows[1]).getByText("Bugün 19:00 · Zeynep K."));
    assert.ok(within(rows[2]).getByText("Yarın 18:00"));
  });

  it("shows the week with the meetings that fall in it and today marked", async () => {
    renderPage();

    const heading = await screen.findByRole("heading", { name: "Bu hafta" });
    const card = heading.closest("div.overflow-hidden") as HTMLElement;
    await waitFor(() => assert.ok(within(card).getByText("2 görüşme")));
    assert.ok(within(card).getByText("19:00 · Zeynep K."));
    assert.ok(within(card).getByText("18:30 · Mert A."));
    assert.ok(within(card).getByText("Bugün"));
    // The report session from last Sunday is not part of this week.
    assert.equal(within(card).queryByText(/Pzt 18|Paz 18/), null);
  });

  it("sums up the offer under the week without a separate status panel", async () => {
    renderPage();

    const footer = await screen.findByRole("region", { name: "Teklifin durumu" });
    assert.ok(within(footer).getByText("Teklifin yayında"));
    assert.ok(within(footer).getByText("3 / 6 öğrenci · 3 boş kontenjan"));
    assert.equal(screen.queryByRole("region", { name: "Koçluk hizmet durumu" }), null);
  });

  it("asks for the next setup step and lists nothing when there is no plan", async () => {
    currentPlan = null;
    renderPage();

    assert.ok(await screen.findByRole("region", { name: "Koçluk hizmet durumu" }));
    assert.equal(screen.queryByRole("heading", { name: "Yapılacaklar" }), null);
    assert.equal(requested.includes("/coaching/tutor/sessions/"), false);
  });

  it("does not pretend a failed source is an empty one, and retries just that one", async () => {
    timeRequestsFail = true;
    renderPage();

    const heading = await screen.findByRole("heading", { name: "Yapılacaklar" });
    const todoCard = heading.closest("div.overflow-hidden") as HTMLElement;
    await within(todoCard).findByText("Yapılacaklar yüklenemedi.");
    assert.equal(within(todoCard).queryByText("Şu an yapılacak bir şey yok."), null);
    // The week came from a source that worked.
    const week = (await screen.findByRole("heading", { name: "Bu hafta" })).closest("div.overflow-hidden") as HTMLElement;
    await waitFor(() => assert.ok(within(week).getByText("2 görüşme")));

    timeRequestsFail = false;
    requested.length = 0;
    fireEvent.click(within(todoCard).getByRole("button", { name: "Tekrar dene" }));

    await within(todoCard).findByText("Can T. koçluk istiyor");
    assert.deepEqual(requested, ["/coaching/tutor/time-requests/"]);
  });
});
