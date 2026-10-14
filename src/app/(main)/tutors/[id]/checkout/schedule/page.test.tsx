import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

type Json = Record<string, unknown>;

let search = "";
const slotRequests: Json[] = [];

const tutor = {
  id: "tutor-1",
  name: "Ada",
  surname: "Lovelace",
  university: "ITU",
  department: "Matematik",
  profile_picture: "",
  hourly_price: 1000,
  offers_coaching: false,
  subjects: [{ id: 7, name: "Matematik", exam_type: "TYT" }],
};

function plan(perWeek: number, days: number, credits: number, discount: number) {
  return {
    id: `plan-${perWeek}-${days}`,
    name: `Haftada ${perWeek} · ${days} gün`,
    code: `weekly_${perWeek}_${days}d`,
    lesson_count: credits,
    lesson_duration_minutes: 40,
    lessons_per_week: perWeek,
    duration_days: days,
    discount_percent: discount,
    is_active: true,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  };
}

// Haftada 2: all four terms. Haftada 3: only 1 ay and 3 ay (no 90 default clash).
let plans = [
  plan(2, 14, 4, 1),
  plan(2, 30, 8, 6),
  plan(2, 90, 24, 16),
  plan(2, 180, 48, 26),
  plan(3, 30, 12, 6),
];

// The test can hold the hours back (the answer arrives after the plans, as it does
// when the plans were already cached by the previous step) and can answer the
// way the server does: a window that starts after today's already-passed hours.
let slotsGate: Promise<void> | null = null;
let candidatesFor: (params: Json) => ReturnType<typeof candidate>[] = () => [
  candidate(0, "10:00"),
  candidate(2, "10:00"),
  candidate(3, "09:00"),
];

const candidate = (day: number, start: string) => ({
  day_of_week: day,
  start_time: start,
  free_occurrences: 4,
  total_occurrences: 4,
});

let Page: React.ComponentType<{ params: { id: string } }>;

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({ push() {}, replace() {}, back() {} }),
      usePathname: () => "/tutors/tutor-1/checkout/schedule",
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
  mock.module("@/hooks/useAuth", {
    namedExports: {
      useAuth: () => ({
        user: { id: "student-1", role: "student", email: "deniz@example.com" },
        isAuthenticated: true,
        isStudent: true,
        isTutor: false,
        isAdmin: false,
        isImpersonating: false,
        isLoading: false,
      }),
    },
  });
  mock.module("@/hooks/useCoachingFlag", {
    namedExports: { useCoachingFlag: () => ({ checkoutEnabled: false }) },
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string, config?: { params?: Json }) => {
        if (url === "/tutors/tutor-1/") return { data: tutor };
        if (url === "/payments/tutors/tutor-1/offered-plans/") return { data: plans };
        if (url === "/tutors/tutor-1/recurring-slots/") {
          slotRequests.push(config?.params ?? {});
          if (slotsGate) await slotsGate;
          return {
            data: {
              timezone: "Europe/Istanbul",
              duration_minutes: 40,
              starts_on: "2026-10-12",
              ends_on: "2027-01-09",
              candidates: candidatesFor(config?.params ?? {}),
            },
          };
        }
        throw new Error(`unexpected GET ${url}`);
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  search = "";
  slotRequests.length = 0;
  slotsGate = null;
  candidatesFor = () => [candidate(0, "10:00"), candidate(2, "10:00"), candidate(3, "09:00")];
});

afterEach(() => cleanup());

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Page params={{ id: "tutor-1" }} />
    </QueryClientProvider>
  );
}

const lastRequest = () => slotRequests[slotRequests.length - 1];
const nextLink = () => screen.getByRole("link", { name: "Devam et" });

describe("the schedule step asks the term before the hours", () => {
  it("shows no term and no hours until a weekly count is chosen", async () => {
    renderPage();

    await screen.findByText("Haftada kaç ders?");
    assert.equal(screen.queryByText("Paket ne kadar sürsün?"), null);
    assert.equal(screen.queryByText("Hangi gün ve saatte?"), null);
    assert.equal(nextLink().getAttribute("aria-disabled"), "true");
  });

  it("offers the tutor's terms for that count, the popular one chosen", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "2 ders" }));

    await screen.findByText("Paket ne kadar sürsün?");
    const radios = screen.getAllByRole("radio");
    assert.equal(radios.length, 4);
    assert.equal(screen.getByRole("radio", { name: /3 Ay/ }).getAttribute("aria-checked"), "true");
    await screen.findByText("Hangi gün ve saatte?");
  });

  it("asks the server for the hours of the real term and weekly count, not for four weeks", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "2 ders" }));
    await screen.findByText("Hangi gün ve saatte?");

    await waitFor(() =>
      assert.deepEqual(lastRequest(), { duration_days: 90, duration: 40, lessons_per_week: 2 })
    );

    fireEvent.click(screen.getByRole("radio", { name: /6 Ay/ }));
    await waitFor(() =>
      assert.deepEqual(lastRequest(), { duration_days: 180, duration: 40, lessons_per_week: 2 })
    );
  });

  it("keeps the term in the link to the next step, with the hours picked for it", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "2 ders" }));
    fireEvent.click(await screen.findByRole("radio", { name: /1 Ay/ }));
    await waitFor(() => assert.equal(lastRequest().duration_days, 30));

    await screen.findByText("Pzt");
    fireEvent.click(await screen.findByRole("button", { name: /10:00 – 10:40/ }));
    fireEvent.click(screen.getByText("Çar").closest("button")!);
    // Monday's hour is now in the weekly list too; the one to press is Wednesday's.
    const wednesdays = await screen.findAllByRole("button", { name: /10:00 – 10:40/ });
    fireEvent.click(wednesdays.find((button) => button.getAttribute("aria-pressed") === "false")!);

    await waitFor(() => assert.equal(nextLink().getAttribute("aria-disabled"), "false"));
    const href = nextLink().getAttribute("href") ?? "";
    const params = new URLSearchParams(href.split("?")[1]);
    assert.equal(href.startsWith("/tutors/tutor-1/checkout?"), true);
    assert.equal(params.get("per_week"), "2");
    assert.equal(params.get("duration"), "30");
    assert.match(params.get("schedule") ?? "", /^7~0:10:00,2:10:00$/);
  });

  it("stops telling her to choose the term once one is chosen (N2)", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "2 ders" }));
    await screen.findByText("Hangi gün ve saatte?");

    // 3 Ay is chosen, so "Önce süreyi seç" is an order she has already followed.
    const text = document.body.textContent ?? "";
    assert.doesNotMatch(text, /Önce süreyi seç/);
    assert.match(text, /yalnız bu sürenin tamamında boş olan saatleri görürsün/);
  });

  it("says the same when the count and term came in from a link (N2)", async () => {
    search = "per_week=2&duration=30";
    renderPage();
    await screen.findByText("Paket ne kadar sürsün?");
    await waitFor(() =>
      assert.equal(screen.getByRole("radio", { name: /1 Ay/ }).getAttribute("aria-checked"), "true")
    );
    assert.doesNotMatch(document.body.textContent ?? "", /Önce süreyi seç/);
  });

  it("draws the unavailable Devam et like a disabled button, not like a live one (N2)", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "2 ders" }));
    await screen.findByText("Hangi gün ve saatte?");

    const link = nextLink();
    assert.equal(link.getAttribute("aria-disabled"), "true");
    for (const part of [
      "aria-disabled:bg-line",
      "aria-disabled:text-ink-mid",
      "aria-disabled:pointer-events-none",
      "aria-disabled:border-transparent",
    ]) {
      assert.ok(link.className.includes(part), `missing ${part}`);
    }
  });

  it("does not let the student go on before a term is chosen for the hours", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "2 ders" }));
    await screen.findByText("Hangi gün ve saatte?");

    // One hour of two: not ready, and the footer says how many are left.
    fireEvent.click(await screen.findByRole("button", { name: /10:00 – 10:40/ }));
    assert.equal(nextLink().getAttribute("aria-disabled"), "true");
    assert.match(document.body.textContent ?? "", /2 haftalık ders saati seç/);
  });
});

describe("a term that comes in from a link", () => {
  it("is chosen when the tutor sells it at that weekly count", async () => {
    search = "per_week=2&duration=30";
    renderPage();

    await screen.findByText("Paket ne kadar sürsün?");
    assert.equal(screen.getByRole("radio", { name: /1 Ay/ }).getAttribute("aria-checked"), "true");
  });

  it("falls back to the popular term when the tutor does not sell it at that count", async () => {
    search = "per_week=3&duration=180";
    renderPage();

    await screen.findByText("Paket ne kadar sürsün?");
    // Haftada 3 is sold for 1 ay only here, so that is what is chosen.
    await waitFor(() =>
      assert.equal(screen.getByRole("radio", { name: /1 Ay/ }).getAttribute("aria-checked"), "true")
    );
    assert.equal(screen.getAllByRole("radio").length, 1);
  });
});

describe("what the weekly count buttons show is what is chosen", () => {
  it("shows no count as chosen until one is", async () => {
    renderPage();
    await screen.findByText("Haftada kaç ders?");
    await waitFor(() =>
      assert.equal((screen.getByRole("button", { name: "2 ders" }) as HTMLButtonElement).disabled, false)
    );

    for (const count of [2, 3, 4, 5, 6]) {
      assert.equal(
        screen.getByRole("button", { name: `${count} ders` }).getAttribute("aria-pressed"),
        "false",
        `${count} ders looks chosen while nothing is`
      );
    }
    assert.equal(screen.queryByText("Paket ne kadar sürsün?"), null);
  });

  it("shows the count a link carries as chosen, and its term and hours", async () => {
    search = "per_week=2&duration=30";
    renderPage();

    await screen.findByText("Hangi gün ve saatte?");
    assert.equal(screen.getByRole("button", { name: "2 ders" }).getAttribute("aria-pressed"), "true");
    assert.equal(screen.getByRole("button", { name: "3 ders" }).getAttribute("aria-pressed"), "false");
  });

  it("keeps the count a link carries while the tutor's hours are still on their way", async () => {
    let release!: () => void;
    slotsGate = new Promise<void>((resolve) => (release = resolve));
    search = "per_week=2&duration=30";
    renderPage();

    // The plans are in (the term section needs them); the hours are not.
    await screen.findByText("Paket ne kadar sürsün?");
    await new Promise((resolve) => setTimeout(resolve, 60));
    assert.ok(screen.queryByText("Paket ne kadar sürsün?"), "the count was dropped before the hours arrived");
    assert.equal(screen.getByRole("button", { name: "2 ders" }).getAttribute("aria-pressed"), "true");

    release();
    await screen.findByText("Hangi gün ve saatte?");
    assert.equal(screen.getByRole("button", { name: "2 ders" }).getAttribute("aria-pressed"), "true");
  });

  it("still drops a count from a link that the tutor's hours cannot fill, once they are known", async () => {
    // Three a week is sold here, but only two weekly hours are free.
    candidatesFor = () => [candidate(0, "10:00"), candidate(2, "10:00")];
    search = "per_week=3&duration=30";
    renderPage();

    await screen.findByRole("button", { name: "3 ders" });
    await waitFor(() => assert.ok(!screen.queryByText("Paket ne kadar sürsün?")));
    assert.equal(screen.getByRole("button", { name: "3 ders" }).getAttribute("aria-pressed"), "false");
    assert.match(document.body.textContent ?? "", /haftada bu kadar boş saati yok/);
  });
});

describe("an hour that has already passed today", () => {
  // Server: with no start the window opens today, and today's 10:00 is behind us,
  // so Wednesday 10:00 is free for 3 of its 4 weeks and drops out of "free all
  // term". Opening the window after today (the package starts a day from now at
  // the earliest) leaves only the hours that really are taken.
  const wedPassedToday = (params: Json) =>
    params.start
      ? [candidate(2, "10:00"), candidate(5, "10:00")]
      : [{ ...candidate(2, "10:00"), free_occurrences: 3 }, candidate(5, "10:00")];

  it("does not close the weekly counts of a tutor with few hours", async () => {
    candidatesFor = wedPassedToday;
    renderPage();

    await screen.findByText("Haftada kaç ders?");
    await waitFor(() =>
      assert.equal((screen.getByRole("button", { name: "2 ders" }) as HTMLButtonElement).disabled, false)
    );
    // Three or more a week really is more than this tutor's two hours.
    assert.equal((screen.getByRole("button", { name: "3 ders" }) as HTMLButtonElement).disabled, true);
  });

  it("asks for the hours from the day after the earliest first lesson", async () => {
    candidatesFor = wedPassedToday;
    renderPage();
    await screen.findByText("Haftada kaç ders?");
    await waitFor(() => assert.ok(slotRequests.length > 0));

    const first = slotRequests[0] as { start?: string };
    const dayAfter = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(
      new Date(Date.now() + 24 * 3_600_000)
    );
    assert.equal(first.start, dayAfter);
  });

  it("still closes a count the tutor really has too few hours for", async () => {
    candidatesFor = () => [candidate(2, "10:00")];
    renderPage();

    await screen.findByText(/haftada bu kadar boş saati yok/i);
    assert.equal((screen.getByRole("button", { name: "2 ders" }) as HTMLButtonElement).disabled, true);
  });
});
