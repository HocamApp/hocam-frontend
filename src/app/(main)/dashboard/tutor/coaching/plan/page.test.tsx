import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type {
  CoachingCapacityDetail,
  CoachingPlan,
  CoachingPlanPreview,
  CoachingRevenuePreview,
  CoachingSetupConfig,
} from "@/lib/coachingApi";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const PLAN_HREF = "/dashboard/tutor/coaching/plan";

const savedPlan: CoachingPlan = {
  id: "plan-1",
  frequency: "weekly",
  session_duration_minutes: 30,
  price_per_session_minor: 60000,
  price_per_session_display: "600,00 ₺",
  price_cap_minor: 90000,
  max_active_students: 6,
  target_exam_types: ["YKS", "DGS"],
  description: "İlk görüşmede seviyeni çıkarıp haftalık programı birlikte yazarız.",
  is_published: false,
  is_accepting_new_students: true,
  published_at: null,
  capacity: null,
  created_at: "2026-10-01T09:00:00Z",
  updated_at: "2026-10-01T09:00:00Z",
};

const setupConfig: CoachingSetupConfig = {
  exam_groups: ["YKS", "DGS", "KPSS"],
  session_duration_minutes: 30,
  lesson_price_minor: 80000,
  lesson_price_display: "800,00 ₺",
  max_price_ratio_percent: 100,
  price_cap_minor: 90000,
  price_cap_display: "900,00 ₺",
  commission_bps: 1750,
  frequency_options: [
    {
      value: "weekly",
      label: "Haftada bir",
      packages: [{ duration_days: 30, weeks: 4, total_sessions: 4 }],
    },
  ],
};

const capacity: CoachingCapacityDetail = {
  weekly_slot_count: 12,
  theoretical_capacity: 8,
  max_active_students: 6,
  active_students: 3,
  is_accepting_new_students: true,
  can_accept_new_student: true,
  slots: [{ day_of_week: 0, start_time: "18:00" }],
};

const revenue: CoachingRevenuePreview = {
  commission_bps: 1750,
  unit_price_minor: 60000,
  unit_price_display: "600,00 ₺",
  rows: [
    {
      duration_days: 30,
      weeks: 4,
      total_sessions: 4,
      discount_percent: 0,
      subtotal_price_minor: 240000,
      subtotal_price_display: "2.400,00 ₺",
      discount_amount_minor: 0,
      discount_amount_display: "0,00 ₺",
      total_price_minor: 240000,
      total_price_display: "2.400,00 ₺",
      platform_fee_minor: 42000,
      platform_fee_display: "420,00 ₺",
      tutor_net_minor: 198000,
      tutor_net_display: "1.980,00 ₺",
    },
  ],
};

const preview: CoachingPlanPreview = {
  tutor_name: "Deniz K.",
  frequency: "weekly",
  frequency_display: "Haftada bir",
  session_duration_minutes: 30,
  price_per_session_minor: 60000,
  price_per_session_display: "600,00 ₺",
  is_free: false,
  target_exam_types: ["YKS", "DGS"],
  description: savedPlan.description,
  capacity_available: true,
};

let plan: CoachingPlan | null = savedPlan;
let slots: CoachingCapacityDetail | null = capacity;
let search = "";
const replaced: string[] = [];
const requests: string[] = [];

function notFound() {
  return Object.assign(new Error("not found"), { response: { status: 404 } });
}

let Page: React.ComponentType;

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({
        push: (href: string) => replaced.push(href),
        replace: (href: string) => replaced.push(href),
        back() {},
      }),
      usePathname: () => PLAN_HREF,
      useSearchParams: () => new URLSearchParams(search),
    },
  });
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("sonner", { namedExports: { toast: { success() {}, error() {} } } });
  // Who may see the page, and the tab strip around it, are not what this test is about.
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
  mock.module("@/components/coaching/CoachingAvailabilitySection", {
    namedExports: { CoachingAvailabilitySection: () => <div>saat düzenleyici</div> },
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        requests.push(`GET ${url}`);
        if (url === "/coaching/onboarding/") return { data: { is_completed: true } };
        if (url === "/coaching/plan/") {
          if (!plan) throw notFound();
          return { data: plan };
        }
        if (url === "/coaching/tutor/setup-config/") return { data: setupConfig };
        if (url === "/coaching/capacity/") {
          if (!slots) throw notFound();
          return { data: slots };
        }
        if (url === "/coaching/plan/revenue-preview/") return { data: revenue };
        if (url === "/coaching/plan/preview/") return { data: preview };
        throw new Error(`unexpected GET ${url}`);
      },
      put: async (url: string, body: Record<string, unknown>) => {
        requests.push(`PUT ${url}`);
        plan = { ...(plan ?? savedPlan), ...body } as CoachingPlan;
        return { data: plan };
      },
      post: async (url: string) => {
        requests.push(`POST ${url}`);
        if (url === "/coaching/plan/publish/") {
          plan = { ...(plan as CoachingPlan), is_published: true, published_at: "2026-10-02T09:00:00Z" };
        }
        return { data: plan };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  plan = savedPlan;
  slots = capacity;
  search = "";
  replaced.length = 0;
  requests.length = 0;
});

afterEach(() => cleanup());

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>
  );
}

describe("Teklif ayarları page", () => {
  it("opens a finished setup on its summary, not on the first step", async () => {
    renderPage();

    assert.ok(await screen.findByRole("heading", { name: "Koçluk teklifin" }));
    assert.equal(screen.queryByText(/Adım \d \/ 7/), null);
    assert.ok(screen.getByRole("link", { name: "Düzenle Görüşme fiyatı" }));
    assert.ok(screen.getByRole("heading", { level: 1, name: "Teklif ayarları" }));
  });

  it("opens the wizard on the chosen step when a setting is edited from the summary", async () => {
    search = "step=price";
    renderPage();

    assert.ok(await screen.findByText("Adım 2 / 7"));
    assert.ok(screen.getByRole("heading", { name: "Koçluk fiyatı" }));
    // The other six are still done: progress comes from saved data.
    assert.ok(screen.getByRole("link", { name: /Görüşme düzeni · Haftada bir/ }));
    assert.ok(screen.getByRole("link", { name: /Kapasite · 6 öğrenci/ }));
  });

  it("saves one edited setting and returns to the summary instead of walking on", async () => {
    search = "step=price";
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Kaydet" }));

    await waitFor(() => assert.ok(requests.includes("PUT /coaching/plan/")));
    await waitFor(() => assert.deepEqual(replaced, [PLAN_HREF]));
  });

  it("returns to the summary from the hours step with Tamam", async () => {
    search = "step=availability";
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Tamam" }));

    assert.deepEqual(replaced, [PLAN_HREF]);
  });

  it("starts a first setup on the first step, with nothing marked done", async () => {
    plan = null;
    slots = null;
    renderPage();

    assert.ok(await screen.findByText("Adım 1 / 7"));
    assert.ok(screen.getByRole("heading", { name: "Görüşme düzeni" }));
    assert.equal(screen.queryByRole("heading", { name: "Koçluk teklifin" }), null);
    const nav = screen.getByRole("navigation", { name: "Koçluk kurulum adımları" });
    assert.equal(within(nav).queryAllByRole("link").length, 0);
  });

  it("walks a first setup on to the next step rather than back to a summary", async () => {
    plan = null;
    slots = null;
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Devam et/ }));

    assert.deepEqual(replaced, [`${PLAN_HREF}?step=price`]);
  });

  it("sends the retired preview link to the combined review-and-publish step", async () => {
    search = "step=preview";
    renderPage();

    assert.ok(await screen.findByText("Adım 7 / 7"));
    assert.ok(screen.getByRole("heading", { name: "Gözden geçir ve yayınla" }));
    assert.ok(screen.getByRole("list", { name: "Hazır olanlar" }));
    assert.ok(screen.getByRole("button", { name: "Teklifi yayınla" }));
  });

  it("publishes from the review step and lands on the summary", async () => {
    search = "step=publish";
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Teklifi yayınla" }));

    await waitFor(() => assert.ok(requests.includes("POST /coaching/plan/publish/")));
    await waitFor(() => assert.deepEqual(replaced, [PLAN_HREF]));
  });

  it("holds the publish action back when the hours are missing", async () => {
    slots = { ...capacity, weekly_slot_count: 0, theoretical_capacity: 0, slots: [] };
    search = "step=publish";
    renderPage();

    assert.ok(await screen.findByText(/Yayınlamadan önce şu adımları tamamla: Koçluk saatlerin, Kapasite\./));
    assert.equal(screen.queryByRole("button", { name: "Teklifi yayınla" }), null);
    assert.equal(
      screen.getByRole("link", { name: "Eksik adıma git" }).getAttribute("href"),
      `${PLAN_HREF}?step=availability`
    );
  });
});
