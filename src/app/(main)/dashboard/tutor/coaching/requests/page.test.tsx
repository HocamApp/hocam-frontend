import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

// Monday 19 October 2026, 12:30 in Istanbul. The page reads the clock; the tests freeze it.
const NOW = new Date("2026-10-19T09:30:00Z");

const acceptance = [
  {
    id: "a-1",
    student: { id: "u-1", name: "Can", surname: "T." },
    package: { id: "pk", plan_name: "Paket", lessons_per_week: 2, duration_days: 28, total_credits: 8, total_price: 3200 },
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
  {
    id: "a-old",
    student: { id: "u-2", name: "Elif", surname: "Y." },
    package: { id: "pk", plan_name: "Paket", lessons_per_week: 1, duration_days: 28, total_credits: 4, total_price: 1600 },
    coaching: { frequency: "weekly", total_sessions: 4, total_price_minor: 240000, service_status: "active" },
    includes_coaching: true,
    status: "accepted",
    purchase_status: "paid",
    requested_at: "2026-10-17T08:00:00Z",
    expires_at: "2026-10-18T08:00:00Z",
    responded_at: "2026-10-18T10:00:00Z",
    rejection_reason: "",
    rejection_note: "",
  },
];
const timeRequests = [
  {
    id: "t-1",
    slot_index: 0,
    status: "pending",
    note: "Hafta içi akşamları müsait değilim",
    requested_at: "2026-10-19T06:00:00Z",
    expires_at: "2026-10-21T09:00:00Z",
    resolved_at: null,
    proposals: [],
    student_name: "Deniz Ö.",
  },
];
const rescheduleRequests = [
  {
    id: "r-1",
    session_id: "s-9",
    requested_by: "student",
    original_start: "2026-10-21T15:30:00Z",
    proposed_start: "2026-10-22T15:30:00Z",
    is_free: true,
    consumes_student_free_entitlement: true,
    requires_tutor_approval: true,
    granted_free_by_tutor: false,
    status: "pending",
    requested_at: "2026-10-19T07:00:00Z",
    responded_at: null,
    rejection_reason: "",
    student_name: "Mert A.",
  },
];

let data = { acceptance, timeRequests, rescheduleRequests };
let timeFails = false;
const posts: { url: string; body: unknown }[] = [];

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
      usePathname: () => "/dashboard/tutor/coaching/requests",
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
        if (url === "/payments/tutor-acceptance/requests/") return { data: data.acceptance };
        if (url === "/coaching/tutor/time-requests/") {
          if (timeFails) throw new Error("boom");
          return { data: data.timeRequests };
        }
        if (url === "/coaching/tutor/reschedule-requests/") return { data: data.rescheduleRequests };
        throw new Error(`unexpected GET ${url}`);
      },
      post: async (url: string, body: unknown) => {
        posts.push({ url, body });
        return { data: {} };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  mock.timers.enable({ apis: ["Date"], now: NOW });
  data = { acceptance, timeRequests, rescheduleRequests };
  timeFails = false;
  posts.length = 0;
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

describe("Talepler page", () => {
  it("opens on the most urgent request, then the others, then what was answered", async () => {
    renderPage();

    const hero = await screen.findByRole("region", { name: "Sıradaki talep" });
    assert.ok(within(hero).getByText("Can T. koçluk istiyor"));
    assert.ok(within(hero).getByText("2 sa 15 dk kaldı"));
    const others = screen.getByRole("heading", { name: "Diğer talepler" }).closest("div.overflow-hidden") as HTMLElement;
    assert.ok(within(others).getByText("Deniz Ö. saat istiyor"));
    assert.ok(within(others).getByText("Mert A. saat değiştirmek istiyor"));
    assert.ok(screen.getByText("Elif Y. · koçluk talebi"));
  });

  it("accepts the whole coaching request", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Ders + koçluğu kabul et" }));

    await waitFor(() => assert.equal(posts.length, 1));
    assert.deepEqual(posts[0], {
      url: "/payments/tutor-acceptance/requests/a-1/respond/",
      body: { decision: "accept" },
    });
  });

  it("proposes a time for a student who could not find one", async () => {
    renderPage();
    const others = (await screen.findByRole("heading", { name: "Diğer talepler" })).closest("div.overflow-hidden") as HTMLElement;
    fireEvent.click(within(others).getByRole("button", { name: "Saat öner" }));

    const hero = screen.getByRole("region", { name: "Sıradaki talep" });
    fireEvent.change(within(hero).getByLabelText("Gün"), { target: { value: "2" } });
    fireEvent.change(within(hero).getByLabelText("Saat"), { target: { value: "19:30" } });
    fireEvent.click(within(hero).getByRole("button", { name: "Öner" }));

    await waitFor(() => assert.equal(posts.length, 1));
    assert.deepEqual(posts[0], {
      url: "/coaching/tutor/time-requests/t-1/propose/",
      body: { day_of_week: 2, start_time: "19:30" },
    });
  });

  it("approves a time change as an emergency, so the student's free change is kept", async () => {
    renderPage();
    const others = (await screen.findByRole("heading", { name: "Diğer talepler" })).closest("div.overflow-hidden") as HTMLElement;
    fireEvent.click(within(others).getByRole("button", { name: "Yanıtla" }));

    fireEvent.click(within(screen.getByRole("region", { name: "Sıradaki talep" })).getByRole("button", { name: "Acil durum olarak onayla" }));

    await waitFor(() => assert.equal(posts.length, 1));
    assert.deepEqual(posts[0], {
      url: "/coaching/tutor/reschedule-requests/r-1/respond/",
      body: { decision: "approve", grant_free: true, note: "" },
    });
  });

  it("does not pretend a failed source is an empty one, and retries", async () => {
    timeFails = true;
    renderPage();

    assert.ok(await screen.findByText("Talepler yüklenemedi."));
    assert.equal(screen.queryByText("Henüz talebin yok"), null);

    timeFails = false;
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    await waitFor(() => assert.ok(screen.getByRole("region", { name: "Sıradaki talep" })));
  });

  it("invites rather than apologises when there is nothing at all", async () => {
    data = { acceptance: [], timeRequests: [], rescheduleRequests: [] };
    renderPage();

    assert.ok(await screen.findByText("Henüz talebin yok"));
  });
});
