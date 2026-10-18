import "@/test/setupDom";
import assert from "node:assert/strict";
import { afterEach, before, beforeEach, mock, test } from "node:test";
import React, { useMemo, useRef } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { UiHintKey, UiHintRecord, UiHints } from "@/lib/tutorSetupHints";

let hints: UiHints = {};
let ready = true;
let api_neverResolves = false;
let rules: Array<Record<string, unknown>> = [];
let offers: Array<Record<string, unknown>> = [];
const recorded: Array<[UiHintKey, UiHintRecord]> = [];
const record = (key: UiHintKey, patch: UiHintRecord) => { recorded.push([key, patch]); };

mock.module("@/hooks/useUiHints", { namedExports: { useUiHints: () => ({ hints, ready, record }) } });
mock.module("@/lib/dashboardApi", { namedExports: { fetchAvailability: async () => (api_neverResolves ? new Promise<never>(() => {}) : rules) } });
mock.module("@/lib/paymentsApi", { namedExports: { fetchTutorPackageOffers: async () => (api_neverResolves ? new Promise<never>(() => {}) : offers) } });

let Tour: typeof import("./TutorSetupTour").TutorSetupTour;
before(async () => { Tour = (await import("./TutorSetupTour")).TutorSetupTour; });

const DAY = 24 * 60 * 60 * 1000;
const defaultOffer = { plan_id: "p", is_offered: true, discount_percent: null };
const rule = { id: "r", day_of_week: 0, start_time: "09:00:00", end_time: "10:00:00" };

let client: QueryClient;
beforeEach(() => {
  hints = {}; ready = true; rules = []; offers = [defaultOffer]; recorded.length = 0;
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
});
afterEach(() => { cleanup(); client.clear(); document.querySelectorAll("[data-test-modal]").forEach((node) => node.remove()); });

function Harness() {
  const bookings = useRef<HTMLAnchorElement>(null);
  const packages = useRef<HTMLAnchorElement>(null);
  const availability = useRef<HTMLButtonElement>(null);
  const anchors = useMemo(() => ({ bookings, packages, availability }), []);
  return (
    <>
      <a ref={bookings} href="/dashboard/tutor?tab=bookings" onClick={(event) => event.preventDefault()}>Rezervasyonlar</a>
      <a ref={packages} href="/dashboard/tutor/packages" onClick={(event) => event.preventDefault()}>Paket ayarları</a>
      <button ref={availability}>Müsaitliği düzenle</button>
      <Tour anchors={anchors} delayMs={0} />
    </>
  );
}
const mount = () => render(<QueryClientProvider client={client}><Harness /></QueryClientProvider>);
const settle = async () => {
  await waitFor(() => assert.equal(client.isFetching(), 0));
  await new Promise((resolve) => setTimeout(resolve, 30));
};
const acknowledged = () => recorded.filter(([key, patch]) => key === "tutor_dashboard_tour" && Boolean(patch.acknowledged_at));

test("every tutor walks bookings, packages, then availability, and must press the button to finish", async () => {
  mount();
  assert.ok(await screen.findByText("Rezervasyonlarını buradan yönet"));
  assert.ok(screen.getByText("Adım 1/3"));
  assert.equal(recorded[0][0], "tutor_dashboard_tour");
  assert.equal(recorded[0][1].shown_count, 1);

  fireEvent.click(screen.getByRole("button", { name: "İleri" }));
  assert.ok(await screen.findByText("Paketlerini ayarla"));
  assert.ok(screen.getByText("Adım 2/3"));

  fireEvent.click(screen.getByRole("button", { name: "İleri" }));
  assert.ok(await screen.findByText("Öğrenci alman için müsaitlik ekle"));
  assert.ok(screen.getByText("Adım 3/3"));
  assert.equal(acknowledged().length, 0, "nothing is answered before the last button");

  fireEvent.click(screen.getByRole("button", { name: "Anladım" }));
  await waitFor(() => assert.equal(screen.queryByText("Öğrenci alman için müsaitlik ekle"), null));
  assert.equal(acknowledged().length, 1);
  assert.equal(recorded.filter(([, patch]) => patch.shown_count).length, 1, "the whole walk counts as one showing");
});

test("a tutor who already has availability and packages still gets all three stops", async () => {
  rules = [rule]; offers = [{ ...defaultOffer, discount_percent: 10 }];
  mount();
  assert.ok(await screen.findByText("Rezervasyonlarını buradan yönet"));
  assert.ok(screen.getByText("Adım 1/3"));
  fireEvent.click(screen.getByRole("button", { name: "İleri" }));
  await screen.findByText("Paketlerini ayarla");
  fireEvent.click(screen.getByRole("button", { name: "İleri" }));
  assert.ok(await screen.findByText("Öğrenci alman için müsaitlik ekle"));
});

test("the first showing does not wait for the tutor's data", async () => {
  api_neverResolves = true;
  mount();
  assert.ok(await screen.findByText("Rezervasyonlarını buradan yönet"));
  api_neverResolves = false;
});

test("the first showing cannot be dismissed with Escape", async () => {
  mount();
  const dialog = await screen.findByRole("dialog", { name: "Rezervasyonlarını buradan yönet" });
  fireEvent.keyDown(dialog, { key: "Escape" });
  assert.ok(screen.getByText("Rezervasyonlarını buradan yönet"));
});

test("nothing shows while the hint state is not ready", async () => {
  ready = false;
  mount();
  await settle();
  assert.equal(screen.queryByRole("dialog"), null);
  assert.equal(recorded.length, 0);
});

test("using the control the bubble points at counts as the answer", async () => {
  mount();
  await screen.findByText("Rezervasyonlarını buradan yönet");
  fireEvent.click(screen.getByText("Rezervasyonlar"));
  await waitFor(() => assert.equal(screen.queryByText("Rezervasyonlarını buradan yönet"), null));
  assert.equal(acknowledged().length, 1);
});

test("an open modal postpones the tour without counting the visit", async () => {
  const modal = document.createElement("div");
  modal.setAttribute("role", "dialog"); modal.setAttribute("data-test-modal", "");
  document.body.appendChild(modal);
  mount();
  await settle();
  assert.equal(screen.queryByText("Rezervasyonlarını buradan yönet"), null);
  assert.equal(recorded.length, 0);
});

test("a reminder shows only the open work, as a courtesy: Escape closes it and records no answer", async () => {
  const lastShown = new Date(Date.now() - 2 * DAY).toISOString();
  hints = { tutor_dashboard_tour: { shown_count: 1, last_shown_at: lastShown, acknowledged_at: lastShown } };
  rules = [rule];
  mount();
  const dialog = await screen.findByRole("dialog", { name: "Paketlerini ayarla" });
  assert.equal(screen.queryByText(/Adım \d\/\d/), null, "one open step, no step count");
  assert.equal(screen.queryByText("Rezervasyonlarını buradan yönet"), null);
  assert.equal(recorded[0][1].shown_count, 2);
  fireEvent.keyDown(dialog, { key: "Escape" });
  await waitFor(() => assert.equal(screen.queryByText("Paketlerini ayarla"), null));
  assert.equal(acknowledged().length, 0);
});

test("a reminder is silent when there is nothing left to do", async () => {
  const lastShown = new Date(Date.now() - 30 * DAY).toISOString();
  hints = { tutor_dashboard_tour: { shown_count: 1, last_shown_at: lastShown, acknowledged_at: lastShown } };
  rules = [rule]; offers = [{ ...defaultOffer, discount_percent: 10 }];
  mount();
  await settle();
  assert.equal(screen.queryByRole("dialog"), null);
  assert.equal(recorded.length, 0);
});

test("a reminder that is not due yet stays away", async () => {
  const lastShown = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  hints = { tutor_dashboard_tour: { shown_count: 1, last_shown_at: lastShown, acknowledged_at: lastShown } };
  mount();
  await settle();
  assert.equal(screen.queryByRole("dialog"), null);
});
