import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { GoogleCalendarConnection } from "@/types/api";

/**
 * Container-level tests: the card wired to react-query and the callback hook.
 * The card is role-neutral and now lives in the shared "Takvim bağlantıları"
 * section on /profile, so the mocked pathname below is /profile — the same
 * screen a student and a tutor return to after the OAuth round-trip.
 *
 * Two things are deliberately NOT asserted here because this jsdom harness
 * cannot observe them (see the Phase 7 report):
 *   - `window.location.assign` — jsdom's `location` is a non-configurable,
 *     non-writable property, so the redirect cannot be intercepted without
 *     changing the component. It is covered indirectly: the authorization
 *     request fires exactly once and the button goes busy.
 *   - sonner toasts — the module mock does not reach the component's import,
 *     so the toast copy is asserted at the pure-function level in
 *     `useGoogleCalendarCallbackResult.test.ts` instead.
 */

const routerReplaceCalls: string[] = [];

let fetchCalls = 0;
let disconnectCalls = 0;
let startCalls = 0;
let connectionResponse: GoogleCalendarConnection | null = null;
let fetchShouldFail = false;
let startShouldFail = false;
let disconnectShouldFail = false;
let holdStart = false;
let releaseStart: (() => void) | null = null;
let currentSearch = "";

const connected: GoogleCalendarConnection = {
  status: "connected",
  account_email: "hoca@example.com",
  calendar_name: "Hocam Dersleri",
  connected_at: "2026-08-01T10:00:00Z",
  last_error: "",
};

let Card: React.ComponentType | null = null;

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({
        replace: (href: string) => routerReplaceCalls.push(href),
        push: () => {},
      }),
      usePathname: () => "/profile",
      useSearchParams: () => new URLSearchParams(currentSearch),
    },
  });
  mock.module("@/lib/googleCalendarApi", {
    namedExports: {
      fetchGoogleCalendarConnection: async () => {
        fetchCalls += 1;
        if (fetchShouldFail) throw new Error("network down");
        return connectionResponse;
      },
      startGoogleCalendarConnection: async () => {
        startCalls += 1;
        if (holdStart) {
          await new Promise<void>((resolve) => {
            releaseStart = resolve;
          });
        }
        if (startShouldFail) throw new Error("cannot start");
        return { authorization_url: "https://accounts.google.com/o/oauth2/auth?x=1" };
      },
      disconnectGoogleCalendar: async () => {
        disconnectCalls += 1;
        if (disconnectShouldFail) throw new Error("cannot disconnect");
      },
    },
  });

  Card = (await import("./GoogleCalendarConnectionCard"))
    .GoogleCalendarConnectionCard;
});

function renderCard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Component = Card as React.ComponentType;
  return render(
    <QueryClientProvider client={queryClient}>
      <Component />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  routerReplaceCalls.length = 0;
  fetchCalls = 0;
  disconnectCalls = 0;
  startCalls = 0;
  connectionResponse = connected;
  fetchShouldFail = false;
  startShouldFail = false;
  disconnectShouldFail = false;
  holdStart = false;
  releaseStart = null;
  currentSearch = "";
});

afterEach(() => {
  releaseStart?.();
  cleanup();
});

describe("GoogleCalendarConnectionCard — connection states", () => {
  it("shows the loading state before the status arrives", async () => {
    renderCard();

    assert.ok(screen.getByTestId("google-calendar-loading"));
    await screen.findByText("hoc***@example.com · Hocam Dersleri");
  });

  it("renders the connected account and the disconnect control", async () => {
    renderCard();

    await screen.findByText("hoc***@example.com · Hocam Dersleri");
    assert.ok(screen.getByRole("button", { name: "Bağlantıyı kes" }));
    assert.equal(
      screen.queryByRole("button", { name: "Google Calendar'a bağla" }),
      null
    );
  });

  it("renders the disconnected state with a connect call to action", async () => {
    connectionResponse = {
      ...connected,
      status: "disconnected",
      account_email: null,
      connected_at: null,
    };
    renderCard();

    await screen.findByRole("button", { name: "Google Calendar'a bağla" });
    assert.equal(screen.queryByText("hoca@example.com"), null);
    assert.equal(screen.queryByRole("button", { name: "Bağlantıyı kes" }), null);
  });

  it("renders the reauthorization state as a reconnect prompt", async () => {
    connectionResponse = { ...connected, status: "reauthorization_required" };
    renderCard();

    await screen.findByRole("button", { name: "Yeniden bağla" });
    assert.ok(screen.getByText(/Erişim sona erdi/));
  });

  it("shows an error state with a working retry", async () => {
    fetchShouldFail = true;
    renderCard();

    const retry = await screen.findByRole("button", { name: "Yeniden dene" });
    fetchShouldFail = false;
    fireEvent.click(retry);

    await screen.findByText("hoc***@example.com · Hocam Dersleri");
  });
});

describe("GoogleCalendarConnectionCard — connect", () => {
  it("requests an authorization URL exactly once per click", async () => {
    connectionResponse = { ...connected, status: "disconnected", account_email: null };
    holdStart = true;
    renderCard();

    fireEvent.click(
      await screen.findByRole("button", { name: "Google Calendar'a bağla" })
    );

    await waitFor(() => assert.equal(startCalls, 1));
  });

  it("goes busy and blocks a second click while connecting", async () => {
    connectionResponse = { ...connected, status: "disconnected", account_email: null };
    holdStart = true;
    renderCard();

    fireEvent.click(
      await screen.findByRole("button", { name: "Google Calendar'a bağla" })
    );

    const busy = await screen.findByRole("button", { name: "Yönlendiriliyor…" });
    assert.equal(busy.hasAttribute("disabled"), true);
    fireEvent.click(busy);
    assert.equal(startCalls, 1);
  });

  it("returns to an actionable state when the request fails", async () => {
    connectionResponse = { ...connected, status: "disconnected", account_email: null };
    startShouldFail = true;
    renderCard();

    fireEvent.click(
      await screen.findByRole("button", { name: "Google Calendar'a bağla" })
    );

    await waitFor(() => assert.equal(startCalls, 1));
    await screen.findByRole("button", { name: "Google Calendar'a bağla" });
  });
});

describe("GoogleCalendarConnectionCard — disconnect", () => {
  it("opens the confirmation without sending anything", async () => {
    renderCard();
    fireEvent.click(await screen.findByRole("button", { name: "Bağlantıyı kes" }));

    const panel = screen.getByTestId("google-calendar-disconnect-confirm");
    assert.ok(
      (panel.textContent ?? "").includes("Mevcut etkinlikler Google Calendar'da kalır")
    );
    assert.equal(disconnectCalls, 0);
  });

  it("cancelling closes the confirmation and sends nothing", async () => {
    renderCard();
    fireEvent.click(await screen.findByRole("button", { name: "Bağlantıyı kes" }));
    fireEvent.click(screen.getByRole("button", { name: "Vazgeç" }));

    await waitFor(() =>
      assert.equal(screen.queryByTestId("google-calendar-disconnect-confirm"), null)
    );
    assert.equal(disconnectCalls, 0);
    assert.ok(screen.getByRole("button", { name: "Bağlantıyı kes" }));
  });

  it("confirming sends the DELETE and refreshes the status", async () => {
    renderCard();
    await screen.findByRole("button", { name: "Bağlantıyı kes" });
    const callsBefore = fetchCalls;

    fireEvent.click(screen.getByRole("button", { name: "Bağlantıyı kes" }));
    connectionResponse = {
      ...connected,
      status: "disconnected",
      account_email: null,
      connected_at: null,
    };
    fireEvent.click(screen.getByRole("button", { name: "Evet, bağlantıyı kes" }));

    await waitFor(() => assert.equal(disconnectCalls, 1));
    await waitFor(() => assert.ok(fetchCalls > callsBefore));
    await screen.findByRole("button", { name: "Google Calendar'a bağla" });
  });

  it("keeps the connection visible when the DELETE fails", async () => {
    disconnectShouldFail = true;
    renderCard();
    fireEvent.click(await screen.findByRole("button", { name: "Bağlantıyı kes" }));
    fireEvent.click(screen.getByRole("button", { name: "Evet, bağlantıyı kes" }));

    await waitFor(() => assert.equal(disconnectCalls, 1));
    assert.ok(screen.getByText("hoc***@example.com · Hocam Dersleri"));
  });
});

describe("GoogleCalendarConnectionCard — OAuth callback cleanup", () => {
  it("cleans the URL after a successful connection", async () => {
    currentSearch = "google_calendar=connected";
    renderCard();

    await waitFor(() => assert.equal(routerReplaceCalls.length, 1));
    assert.equal(routerReplaceCalls[0], "/profile");
  });

  it("cleans the URL after a failed callback", async () => {
    currentSearch = "google_calendar=error";
    renderCard();

    await waitFor(() => assert.equal(routerReplaceCalls.length, 1));
    assert.equal(routerReplaceCalls[0], "/profile");
  });

  it("cleans the URL after an invalid state", async () => {
    currentSearch = "google_calendar=invalid_state";
    renderCard();

    await waitFor(() => assert.equal(routerReplaceCalls.length, 1));
    assert.equal(routerReplaceCalls[0], "/profile");
  });

  it("keeps the other query parameters when cleaning up", async () => {
    currentSearch =
      "learning_goal_id=goal-1&google_calendar=connected&discovery_impression_id=imp-9";
    renderCard();

    await waitFor(() => assert.equal(routerReplaceCalls.length, 1));
    const [path, query] = routerReplaceCalls[0].split("?");
    const params = new URLSearchParams(query);
    assert.equal(path, "/profile");
    assert.equal(params.get("learning_goal_id"), "goal-1");
    assert.equal(params.get("discovery_impression_id"), "imp-9");
    assert.equal(params.has("google_calendar"), false);
  });

  it("shows the freshly connected status after returning from Google", async () => {
    // The mount fetch already reads the post-callback state; the hook's
    // invalidation is a no-op on that first mount, which is why the card is
    // correct without a second request.
    currentSearch = "google_calendar=connected";
    renderCard();

    await screen.findByText("hoc***@example.com · Hocam Dersleri");
    assert.ok(fetchCalls >= 1);
  });

  it("touches the URL only once, not on every render", async () => {
    currentSearch = "google_calendar=connected";
    renderCard();

    await waitFor(() => assert.equal(routerReplaceCalls.length, 1));
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(routerReplaceCalls.length, 1);
  });

  it("does nothing when there is no callback marker", async () => {
    renderCard();

    await screen.findByRole("button", { name: "Bağlantıyı kes" });
    assert.equal(routerReplaceCalls.length, 0);
  });
});
