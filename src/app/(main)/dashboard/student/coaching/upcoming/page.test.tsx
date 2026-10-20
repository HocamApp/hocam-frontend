import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

// Tuesday 20 October 2026, 15:20 in Istanbul. The page reads the clock; the tests freeze it.
const NOW = new Date("2026-10-20T12:20:00Z");

function sessionRow(id: string, status: string, start: string, localDate: string, extra: Record<string, unknown> = {}) {
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
    rating_submitted: false,
    pending_reschedule: null,
    ...extra,
  };
}

const plan = [
  sessionRow("s1", "completed", "2026-10-12T15:30:00Z", "2026-10-12", { rating_submitted: true }),
  sessionRow("c1", "cancelled", "2026-10-14T15:30:00Z", "2026-10-14"),
  sessionRow("s2", "awaiting_report", "2026-10-15T15:30:00Z", "2026-10-15", {
    report_due_at: "2026-10-17T15:30:00Z",
    report_overdue: true,
    complaint_eligible: true,
    complaint_eligible_at: "2026-10-17T16:00:00Z",
  }),
  sessionRow("s3", "scheduled", "2026-10-21T15:30:00Z", "2026-10-21"),
  sessionRow("s4", "reschedule_requested", "2026-10-23T15:30:00Z", "2026-10-23", {
    pending_reschedule: { proposed_start: "2026-10-24T08:00:00Z" },
  }),
  sessionRow("s5", "scheduled", "2026-10-26T15:30:00Z", "2026-10-26"),
  sessionRow("s6", "scheduled", "2026-10-29T15:30:00Z", "2026-10-29"),
  sessionRow("s7", "scheduled", "2026-11-02T15:30:00Z", "2026-11-02"),
  sessionRow("s8", "scheduled", "2026-11-05T15:30:00Z", "2026-11-05"),
  sessionRow("s9", "scheduled", "2026-11-09T15:30:00Z", "2026-11-09"),
  sessionRow("s10", "scheduled", "2026-11-12T15:30:00Z", "2026-11-12"),
];

let rows: unknown[] = plan;
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
      usePathname: () => "/dashboard/student/coaching/upcoming",
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
  mock.module("sonner", { namedExports: { toast: { success() {}, error() {} } } });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/coaching/sessions/") {
          if (sessionsFail) throw Object.assign(new Error("boom"), { response: { status: 500 } });
          return { data: rows };
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
  rows = plan;
  sessionsFail = false;
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

describe("student Görüşmeler: the next meeting", () => {
  it("is titled like its tab and leads with the next meeting, saying when the room opens", async () => {
    renderPage();

    assert.ok(screen.getByRole("heading", { level: 1, name: "Görüşmeler" }));
    const hero = await screen.findByRole("region", { name: "Sıradaki görüşme" });
    assert.ok(within(hero).getByText("3. görüşme"));
    assert.ok(within(hero).getByText("21 Ekim Çarşamba"));
    assert.ok(within(hero).getByText("18:30"));
    assert.ok(within(hero).getByText(/1 gün 3 sa sonra/));
    assert.ok(within(hero).getByText("Katıl 18:20'de açılır"));
    assert.equal(within(hero).queryByRole("link", { name: "Katıl" }), null);
    assert.ok(within(hero).getByRole("button", { name: /yeniden planla/i }));
  });

  it("offers Katıl from ten minutes before the start", async () => {
    mock.timers.reset();
    mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-21T15:21:00Z") });
    renderPage();

    const hero = await screen.findByRole("region", { name: "Sıradaki görüşme" });
    const join = await within(hero).findByRole("link", { name: "Katıl" });
    assert.equal(join.getAttribute("href"), "/session/coaching/s3");
  });
});

describe("student Görüşmeler: Yaklaşanlar", () => {
  it("lists the following meetings, with Yeniden planla only where the plan can still be changed", async () => {
    renderPage();

    const region = await screen.findByRole("region", { name: "Yaklaşanlar" });
    const items = within(region).getAllByRole("listitem");
    assert.deepEqual(
      items.map((item) => within(item).getByText(/\. görüşme · 18:30/).textContent),
      ["4. görüşme · 18:30", "5. görüşme · 18:30", "6. görüşme · 18:30", "7. görüşme · 18:30", "8. görüşme · 18:30"],
    );
    assert.equal(within(items[0]).queryByRole("button", { name: /yeniden planla/i }), null);
    for (const item of items.slice(1)) {
      assert.ok(within(item).getByRole("button", { name: /yeniden planla/i }));
    }
    assert.ok(within(region).getByText("2 görüşme daha: 9 Kas, 12 Kas"));
  });

  it("shows the time the student asked for while the tutor has not answered", async () => {
    renderPage();

    const region = await screen.findByRole("region", { name: "Yaklaşanlar" });
    const waiting = within(region).getAllByRole("listitem")[0];
    assert.ok(within(waiting).getByText("Önerdiğin saat"));
    assert.ok(within(waiting).getByText("Cmt 24 Eki 11:00"));
    assert.ok(within(waiting).getByText("Hocanın yanıtı bekleniyor"));
  });
});

describe("student Görüşmeler: Geçmiş", () => {
  it("offers a rating and the problem report on the meeting awaiting its report, and nothing on a rated one", async () => {
    renderPage();

    const region = await screen.findByRole("region", { name: "Geçmiş" });
    const items = within(region).getAllByRole("listitem");
    assert.deepEqual(
      items.map((item) => within(item).getByText(/görüşme · 18:30/).textContent),
      ["2. görüşme · 18:30", "İptal edilen görüşme · 18:30", "1. görüşme · 18:30"],
    );

    const awaiting = items[0];
    assert.ok(within(awaiting).getByText("Rapor bekleniyor"));
    assert.equal(
      within(awaiting).getByRole("link", { name: /değerlendir/i }).getAttribute("href"),
      "/session/coaching/s2/summary",
    );
    assert.equal(
      within(awaiting).getByRole("link", { name: "Teknik sorun mu vardı, hoca gelmedi mi?" }).getAttribute("href"),
      "/session/coaching/s2/summary",
    );

    const rated = items[2];
    assert.ok(within(rated).getByText("Tamamlandı · Değerlendirmen alındı"));
    assert.equal(within(rated).queryByRole("link"), null);
  });

  it("offers the problem report but no second rating on a meeting that is already rated", async () => {
    rows = [
      sessionRow("r", "awaiting_report", "2026-10-15T15:30:00Z", "2026-10-15", { rating_submitted: true }),
    ];
    renderPage();

    const region = await screen.findByRole("region", { name: "Geçmiş" });
    assert.ok(within(region).getByText("Rapor bekleniyor · Değerlendirmen alındı"));
    assert.ok(within(region).getByRole("link", { name: "Teknik sorun mu vardı, hoca gelmedi mi?" }));
    assert.equal(within(region).queryByRole("link", { name: /değerlendir/i }), null);
  });

  it("tells the student the report is late and how to reach support", async () => {
    renderPage();

    const region = await screen.findByRole("region", { name: "Geçmiş" });
    const notice = within(region).getByRole("status");
    assert.ok(within(notice).getByText("Görüşme raporu gecikti"));
    assert.ok(within(notice).getByText("Son teslim zamanı: 17 Ekim Cumartesi 18:30"));
    assert.equal(
      within(notice).getByRole("link", { name: "Eksik rapor için desteğe başvur" }).getAttribute("href"),
      "/dashboard/student/coaching/complaints",
    );
  });

  it("says when missing-report support opens while the report is not late yet, and offers none once the report is in", async () => {
    rows = [
      sessionRow("a", "awaiting_report", "2026-10-15T15:30:00Z", "2026-10-15", { complaint_eligible_at: "2026-10-22T16:00:00Z" }),
      sessionRow("b", "completed", "2026-10-12T15:30:00Z", "2026-10-12", { rating_submitted: true, complaint_eligible_at: "2026-10-14T15:30:00Z" }),
    ];
    renderPage();

    const region = await screen.findByRole("region", { name: "Geçmiş" });
    assert.ok(within(region).getByText(/Eksik rapor desteği 22 Ekim Perşembe 19:00 itibarıyla kullanılabilir\./));
    assert.equal(within(region).queryByRole("status"), null);
    assert.equal(within(region).queryByRole("link", { name: "Eksik rapor için desteğe başvur" }), null);
    assert.equal(within(region).getAllByText(/eksik rapor/i).length, 1);
  });
});

describe("student Görüşmeler: states", () => {
  it("says the meetings could not be read and retries, rather than showing an empty list", async () => {
    sessionsFail = true;
    renderPage();

    assert.ok(await screen.findByText("Görüşmelerin yüklenemedi."));
    assert.equal(screen.queryByText("Henüz görüşmen oluşturulmadı"), null);

    sessionsFail = false;
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    await screen.findByRole("region", { name: "Sıradaki görüşme" });
    await waitFor(() => assert.equal(screen.queryByText("Görüşmelerin yüklenemedi."), null));
  });

  it("keeps the empty state for a coaching with no meetings yet", async () => {
    rows = [];
    renderPage();

    assert.ok(await screen.findByText("Henüz görüşmen oluşturulmadı"));
  });
});
