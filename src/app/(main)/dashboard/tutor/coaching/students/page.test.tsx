import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { CoachingSessionItem, CoachingStudentRow } from "@/lib/coachingApi";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

// Monday 19 October 2026, 12:30 in Istanbul. The page reads the clock; the tests freeze it.
const NOW = new Date("2026-10-19T09:30:00Z");

function student(overrides: Partial<CoachingStudentRow>): CoachingStudentRow {
  return {
    purchase_id: "pu-1",
    service_period_id: "sp-1",
    student_name: "Zeynep K.",
    service_status: "active",
    frequency: "twice_weekly",
    recurring_slots: [
      { id: "r1", slot_index: 0, day_of_week: 0, start_time: "19:00:00", source: "availability" },
      { id: "r2", slot_index: 1, day_of_week: 4, start_time: "19:00:00", source: "availability" },
    ],
    ...overrides,
  } as CoachingStudentRow;
}

function session(overrides: Partial<CoachingSessionItem>): CoachingSessionItem {
  return {
    id: "s-1",
    service_period_id: "sp-1",
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

let students: CoachingStudentRow[] = [];
let sessions: CoachingSessionItem[] = [];
let studentsFail = false;
let rescheduleFail = false;
const posts: { url: string; body: unknown }[] = [];
const requested: string[] = [];

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
      usePathname: () => "/dashboard/tutor/coaching/students",
      useSearchParams: () => new URLSearchParams(),
    },
  });
  mock.module("@/components/coaching/CoachingGuard", {
    namedExports: {
      CoachingRecordGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      CoachingGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
        requested.push(url);
        if (url === "/coaching/students/") {
          if (studentsFail) throw new Error("boom");
          return { data: students };
        }
        if (url === "/coaching/tutor/sessions/") return { data: sessions };
        if (url === "/coaching/tutor/time-requests/") return { data: [] };
        if (url === "/coaching/tutor/reschedule-requests/") {
          if (rescheduleFail) throw new Error("boom");
          return { data: [] };
        }
        if (url === "/coaching/capacity/") {
          return {
            data: {
              weekly_slot_count: 12,
              theoretical_capacity: 8,
              max_active_students: 6,
              active_students: 2,
              is_accepting_new_students: true,
              can_accept_new_student: true,
              slots: [],
            },
          };
        }
        throw new Error(`unexpected GET ${url}`);
      },
      post: async (url: string, body: unknown) => {
        posts.push({ url, body });
        return { data: { service_status: "cancelled", refund_liability_minor: 0 } };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  mock.timers.enable({ apis: ["Date"], now: NOW });
  students = [
    student({}),
    student({
      purchase_id: "pu-3",
      service_period_id: "sp-3",
      student_name: "Elif Y.",
      frequency: "weekly",
      recurring_slots: [{ id: "e1", slot_index: 0, day_of_week: 3, start_time: "20:00:00", source: "availability" }],
    }),
    student({
      purchase_id: "pu-4",
      service_period_id: null,
      student_name: "Deniz Ö.",
      service_status: "accepted_awaiting_schedule",
      frequency: "weekly",
      recurring_slots: [],
    }),
  ];
  sessions = [
    session({}),
    session({
      id: "s-report",
      status: "awaiting_report",
      scheduled_start: "2026-10-18T16:00:00Z",
      scheduled_local_date: "2026-10-18",
      report_due_at: "2026-10-20T15:00:00Z",
    }),
    session({ id: "s-elif", service_period_id: "sp-3", scheduled_start: "2026-10-22T17:00:00Z", scheduled_local_date: "2026-10-22", student_name: "Elif Y." }),
  ];
  studentsFail = false;
  rescheduleFail = false;
  posts.length = 0;
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

function card(name: string) {
  return screen.getByRole("heading", { name }).closest("div.overflow-hidden") as HTMLElement;
}

describe("Öğrenciler page", () => {
  it("lists what waits on the tutor first, then the active students with their next meeting", async () => {
    renderPage();

    const waiting = card(await screen.findByText("Senden bekleyenler").then(() => "Senden bekleyenler"));
    assert.ok(within(waiting).getByText("Zeynep K. raporu yazılmadı"));
    assert.ok(within(waiting).getByText("Yarın 18:00"));

    const active = card("Aktif öğrenciler");
    assert.ok(within(active).getByText("Haftada 2 görüşme · Pzt 19:00, Cum 19:00"));
    assert.ok(within(active).getByText("Bugün 19:00"));
    assert.ok(within(active).getByText("Per 20:00"));
    assert.ok(within(active).getByText("2 / 6 kontenjan"));
    assert.equal(
      within(active).getAllByRole("link", { name: "Programı yönet" })[0].getAttribute("href"),
      "/dashboard/tutor/coaching/service-periods/sp-1/program"
    );
  });

  it("does not offer to end the coaching of a student with a program", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "Aktif öğrenciler" });

    assert.equal(within(card("Aktif öğrenciler")).queryByRole("button", { name: "Koçluğu sonlandır" }), null);
  });

  it("ends the coaching of a student who has not chosen hours, with a reason and a confirmation", async () => {
    renderPage();
    const pending = card(await screen.findByText("Beklemede").then(() => "Beklemede"));

    fireEvent.click(within(pending).getByRole("button", { name: "Koçluğu sonlandır" }));
    const dialog = await screen.findByRole("dialog", { name: "Deniz Ö. ile koçluğu sonlandır" });
    const confirm = within(dialog).getByRole("button", { name: "Koçluğu sonlandır" }) as HTMLButtonElement;
    assert.equal(confirm.disabled, true);
    assert.equal(posts.length, 0);

    fireEvent.change(within(dialog).getByLabelText("Sonlandırma gerekçesi"), {
      target: { value: "Müsaitliğim değişti" },
    });
    fireEvent.click(confirm);

    await waitFor(() => assert.equal(posts.length, 1));
    assert.deepEqual(posts[0], {
      url: "/coaching/tutor/purchases/pu-4/terminate/",
      body: { reason: "Müsaitliğim değişti" },
    });
  });

  it("does not pretend a failed source is an empty one, and retries just that one", async () => {
    rescheduleFail = true;
    renderPage();

    const waiting = card(await screen.findByText("Senden bekleyenler").then(() => "Senden bekleyenler"));
    await within(waiting).findByText("Bekleyenler yüklenemedi.");
    // The students themselves came from sources that worked.
    assert.ok(within(card("Aktif öğrenciler")).getByText("Zeynep K."));

    rescheduleFail = false;
    requested.length = 0;
    fireEvent.click(within(waiting).getByRole("button", { name: "Tekrar dene" }));

    await within(waiting).findByText("Zeynep K. raporu yazılmadı");
    assert.deepEqual(requested, ["/coaching/tutor/reschedule-requests/"]);
  });

  it("says the students could not be loaded, rather than that there are none", async () => {
    studentsFail = true;
    renderPage();

    assert.ok(await screen.findByText("Öğrenciler yüklenemedi."));
    assert.equal(screen.queryByText("Henüz koçluk öğrencin yok"), null);
  });

  it("invites rather than apologises when there are no students", async () => {
    students = [];
    sessions = [];
    renderPage();

    assert.ok(await screen.findByText("Henüz koçluk öğrencin yok"));
  });
});
