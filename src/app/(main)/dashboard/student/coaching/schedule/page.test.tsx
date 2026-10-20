import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

// Tuesday 20 October 2026, 15:20 in Istanbul. The deadline is Saturday 24 October, 18:00.
const NOW = "2026-10-20T12:20:00Z";
const DEADLINE = "2026-10-24T15:00:00Z";

const awaiting = {
  id: "cp-1",
  service_period_id: null,
  service_status: "accepted_awaiting_schedule",
  frequency: "twice_weekly",
  weeks: 4,
  total_sessions: 8,
  slot_selection_deadline_at: DEADLINE,
  required_slot_count: 2,
};

const openHours = [
  { day_of_week: 0, start_time: "17:00:00" },
  { day_of_week: 0, start_time: "18:30:00" },
  { day_of_week: 1, start_time: "18:30:00" },
  { day_of_week: 1, start_time: "20:00:00" },
  { day_of_week: 2, start_time: "19:00:00" },
  { day_of_week: 3, start_time: "17:30:00" },
  { day_of_week: 5, start_time: "11:00:00" },
  { day_of_week: 5, start_time: "12:00:00" },
  { day_of_week: 5, start_time: "14:00:00" },
];

let state: unknown = awaiting;
let stateStatus = 200;
let slots: unknown = { availability_slots: openHours, accepted_proposals: {} };
let slotsFail = false;
let confirmFails = false;
let timeRequests: unknown[] = [];
let nowIso = NOW;
const posted: { url: string; body: unknown }[] = [];
const replaced: string[] = [];
const toasts: string[] = [];

function httpError(status: number, data?: unknown) {
  return Object.assign(new Error(`http ${status}`), { response: { status, data } });
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
      useRouter: () => ({ push() {}, replace: (href: string) => replaced.push(href), back() {} }),
      usePathname: () => "/dashboard/student/coaching/schedule",
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
    namedExports: { toast: { success: (message: string) => toasts.push(message), error() {} } },
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/coaching/scheduling/") {
          if (stateStatus !== 200) throw httpError(stateStatus);
          return { data: state };
        }
        if (url === "/coaching/scheduling/slots/") {
          if (slotsFail) throw httpError(500);
          return { data: slots };
        }
        if (url === "/coaching/scheduling/time-request/") return { data: timeRequests };
        throw new Error(`unexpected GET ${url}`);
      },
      post: async (url: string, body: unknown) => {
        posted.push({ url, body });
        if (confirmFails) throw httpError(409, { code: "slot_unavailable", detail: "The slot is no longer available." });
        return { data: {} };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  state = awaiting;
  stateStatus = 200;
  slots = { availability_slots: openHours, accepted_proposals: {} };
  slotsFail = false;
  confirmFails = false;
  timeRequests = [];
  nowIso = NOW;
  posted.length = 0;
  replaced.length = 0;
  toasts.length = 0;
  mock.timers.enable({ apis: ["Date"], now: new Date(nowIso) });
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

const chip = (name: string) => screen.getByRole("button", { name }) as HTMLButtonElement;
const summary = () => screen.getByRole("region", { name: "Seçtiklerin" });
const confirmButton = () => screen.getByRole("button", { name: "Saatleri onayla" }) as HTMLButtonElement;

async function waitForHours() {
  await screen.findByRole("region", { name: "Hocanın açık saatleri" });
}

describe("student Saat seçme: the hours", () => {
  it("is titled Saat seçme and groups the tutor's hours by day, in week order", async () => {
    renderPage();

    assert.ok(screen.getByRole("heading", { level: 1, name: "Saat seçme" }));
    await waitForHours();
    const days = within(screen.getByRole("region", { name: "Hocanın açık saatleri" })).getAllByRole("group");
    assert.deepEqual(
      days.map((day) => day.getAttribute("aria-label") ?? day.querySelector("legend")?.textContent),
      ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cumartesi"],
    );
    assert.equal(chip("Salı 18:30").getAttribute("aria-pressed"), "false");
    assert.ok(chip("Cumartesi 14:00"));
  });

  it("says a failed read instead of looking empty, and tries again", async () => {
    slotsFail = true;
    renderPage();

    assert.ok(await screen.findByText("Hocanın açık saatleri yüklenemedi."));
    assert.equal(screen.queryByText(/boş ya da başka görüşmelerle çakışıyor/), null);

    slotsFail = false;
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    await waitForHours();
    assert.ok(chip("Salı 18:30"));
  });

  it("explains an empty answer and points to asking the tutor", async () => {
    slots = { availability_slots: [], accepted_proposals: {} };
    renderPage();

    assert.ok(await screen.findByText(/Hocanın açık saatleri şu an boş ya da başka görüşmelerle çakışıyor/));
    assert.ok(await screen.findByRole("heading", { name: "Uygun saat bulamadın mı?" }));
  });
});

describe("student Saat seçme: choosing", () => {
  it("shows the deadline as a caption and a value, what is chosen, and what is still missing", async () => {
    renderPage();
    await waitForHours();

    const card = summary();
    assert.ok(within(card).getByText("Son gün"));
    assert.ok(within(card).getByText("24 Ekim Cumartesi 18:00"));
    assert.ok(within(card).getByText("4 gün 2 saat kaldı"));
    assert.ok(within(card).getByText("Haftada 2 görüşme · 30 dakika · 8 görüşme"));
    assert.ok(within(card).getByText("2 saat seç"));
    assert.equal(confirmButton().disabled, true);

    fireEvent.click(chip("Salı 18:30"));

    assert.equal(chip("Salı 18:30").getAttribute("aria-pressed"), "true");
    const rows = within(summary()).getAllByRole("listitem");
    assert.ok(within(rows[0]).getByText("Salı 18:30"));
    assert.ok(within(rows[1]).getByText("seçilmedi"));
    assert.ok(within(summary()).getByText("1 saat daha seç"));
    assert.equal(confirmButton().disabled, true);
  });

  it("takes a chosen hour back on a second click", async () => {
    renderPage();
    await waitForHours();

    fireEvent.click(chip("Salı 18:30"));
    fireEvent.click(chip("Salı 18:30"));

    assert.equal(chip("Salı 18:30").getAttribute("aria-pressed"), "false");
    assert.ok(within(summary()).getByText("2 saat seç"));
  });

  it("opens Saatleri onayla once every slot has an hour, and sends them with their slot numbers", async () => {
    renderPage();
    await waitForHours();

    fireEvent.click(chip("Salı 18:30"));
    fireEvent.click(chip("Cumartesi 11:00"));

    assert.equal(confirmButton().disabled, false);
    assert.equal(chip("Çarşamba 19:00").disabled, true);
    fireEvent.click(confirmButton());

    await waitFor(() =>
      assert.deepEqual(posted, [
        {
          url: "/coaching/scheduling/confirm/",
          body: {
            slots: [
              { slot_index: 0, day_of_week: 1, start_time: "18:30:00" },
              { slot_index: 1, day_of_week: 5, start_time: "11:00:00" },
            ],
          },
        },
      ]),
    );
    await waitFor(() => assert.equal(toasts.length, 1));
  });

  it("keeps the choice and says why when the server refuses it", async () => {
    confirmFails = true;
    renderPage();
    await waitForHours();

    fireEvent.click(chip("Salı 18:30"));
    fireEvent.click(chip("Cumartesi 11:00"));
    fireEvent.click(confirmButton());

    assert.ok(await screen.findByText("Bu saat artık uygun değil. Lütfen listeyi yenile."));
    assert.equal(chip("Salı 18:30").getAttribute("aria-pressed"), "true");
    assert.equal(chip("Cumartesi 11:00").getAttribute("aria-pressed"), "true");
  });

  it("shows an hour the tutor proposed and the student accepted as fixed, and sends it with the rest", async () => {
    slots = {
      availability_slots: openHours,
      accepted_proposals: { 1: { day_of_week: 3, start_time: "21:00:00" } },
    };
    renderPage();
    await waitForHours();

    const fixed = within(screen.getByRole("region", { name: "Hocanın açık saatleri" })).getByText("Perşembe 21:00");
    assert.ok(fixed);
    assert.ok(screen.getByText("Hocanın önerdiği saat"));
    const rows = within(summary()).getAllByRole("listitem");
    assert.ok(within(rows[1]).getByText("Perşembe 21:00"));

    fireEvent.click(chip("Salı 18:30"));
    assert.equal(confirmButton().disabled, false);
    fireEvent.click(confirmButton());

    await waitFor(() =>
      assert.deepEqual((posted[0].body as { slots: unknown[] }).slots, [
        { slot_index: 0, day_of_week: 1, start_time: "18:30:00" },
        { slot_index: 1, day_of_week: 3, start_time: "21:00:00" },
      ]),
    );
  });

  it("closes Saatleri onayla once the deadline has passed, and says so", async () => {
    mock.timers.reset();
    mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-24T16:00:00Z") });
    renderPage();
    await waitForHours();

    fireEvent.click(chip("Salı 18:30"));
    fireEvent.click(chip("Cumartesi 11:00"));

    assert.equal(confirmButton().disabled, true);
    assert.ok(within(summary()).getAllByText("Süre doldu").length >= 1);
  });
});

describe("student Saat seçme: the other states", () => {
  it("sends a student whose coaching is already running to Görüşmeler instead of showing a second list", async () => {
    state = { ...awaiting, service_status: "active", service_period_id: "sp-1" };
    renderPage();

    await waitFor(() => assert.deepEqual(replaced, ["/dashboard/student/coaching/upcoming"]));
    assert.equal(screen.queryByRole("region", { name: "Hocanın açık saatleri" }), null);
  });

  it("says there is nothing to schedule when no coaching waits for hours", async () => {
    stateStatus = 404;
    renderPage();

    assert.ok(await screen.findByText("Şu anda planlanacak bir koçluğun yok"));
  });

  it("says the time to choose ran out when the coaching ended before it had a schedule", async () => {
    state = { ...awaiting, service_status: "cancelled", service_period_id: null };
    renderPage();

    assert.ok(await screen.findByText("Saat seçme süresi doldu"));
  });

  it("says the coaching could not be read and tries again", async () => {
    stateStatus = 500;
    renderPage();

    assert.ok(await screen.findByText(/Koçluk bilgilerin yüklenemedi/));
    stateStatus = 200;
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    await waitForHours();
  });
});
