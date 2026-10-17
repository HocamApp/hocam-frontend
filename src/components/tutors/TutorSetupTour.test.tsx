import "@/test/setupDom";
import assert from "node:assert/strict";
import { afterEach, before, beforeEach, mock, test } from "node:test";
import React, { useMemo, useRef } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { UiHintKey, UiHintRecord, UiHints } from "@/lib/tutorSetupHints";

let hints: UiHints = {};
let ready = true;
let rules: Array<Record<string, unknown>> = [];
let offers: Array<Record<string, unknown>> = [];
const recorded: Array<[UiHintKey, UiHintRecord]> = [];
const record = (key: UiHintKey, patch: UiHintRecord) => { recorded.push([key, patch]); };

mock.module("@/hooks/useUiHints", { namedExports: { useUiHints: () => ({ hints, ready, record }) } });
mock.module("@/lib/dashboardApi", { namedExports: { fetchAvailability: async () => rules } });
mock.module("@/lib/paymentsApi", { namedExports: { fetchTutorPackageOffers: async () => offers } });

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
  const packages = useRef<HTMLAnchorElement>(null);
  const availability = useRef<HTMLButtonElement>(null);
  const anchors = useMemo(() => ({ packages, availability }), []);
  return (
    <>
      <a ref={packages} href="/dashboard/tutor/packages" onClick={(event) => event.preventDefault()}>Paket ayarları</a>
      <button ref={availability}>Müsaitliği düzenle</button>
      <Tour anchors={anchors} delayMs={0} />
    </>
  );
}
const mount = () => render(<QueryClientProvider client={client}><Harness /></QueryClientProvider>);

test("a new tutor gets packages, then availability, and must press the button to finish", async () => {
  mount();
  assert.ok(await screen.findByText("Paketlerini ayarla"));
  assert.ok(screen.getByText("Adım 1/2"));
  assert.equal(recorded[0][0], "tutor_setup_tour");
  assert.equal(recorded[0][1].shown_count, 1);

  fireEvent.click(screen.getByRole("button", { name: "İleri" }));
  assert.ok(await screen.findByText("Öğrenci alman için müsaitlik ekle"));
  assert.ok(screen.getByText("Adım 2/2"));
  assert.equal(recorded.length, 1);

  fireEvent.click(screen.getByRole("button", { name: "Anladım" }));
  await waitFor(() => assert.equal(screen.queryByText("Öğrenci alman için müsaitlik ekle"), null));
  assert.ok(recorded.some(([key, patch]) => key === "tutor_setup_tour" && Boolean(patch.acknowledged_at)));
});

test("the first showing cannot be dismissed with Escape", async () => {
  mount();
  const dialog = await screen.findByRole("dialog", { name: "Paketlerini ayarla" });
  fireEvent.keyDown(dialog, { key: "Escape" });
  assert.ok(screen.getByText("Paketlerini ayarla"));
});

test("a tutor who finished the packages sees only the availability step, without a step count", async () => {
  offers = [{ ...defaultOffer, discount_percent: 10 }];
  mount();
  assert.ok(await screen.findByText("Öğrenci alman için müsaitlik ekle"));
  assert.equal(screen.queryByText(/Adım \d\/\d/), null);
  assert.ok(screen.getByRole("button", { name: "Anladım" }));
});

test("nothing shows when both are done", async () => {
  rules = [rule]; offers = [{ ...defaultOffer, discount_percent: 10 }];
  mount();
  await waitFor(() => assert.equal(client.isFetching(), 0));
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(screen.queryByRole("dialog"), null);
  assert.equal(recorded.length, 0);
});

test("nothing shows while the hint state is not ready", async () => {
  ready = false;
  mount();
  await waitFor(() => assert.equal(client.isFetching(), 0));
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(screen.queryByRole("dialog"), null);
  assert.equal(recorded.length, 0);
});

test("using the control the bubble points at counts as the answer", async () => {
  mount();
  await screen.findByText("Paketlerini ayarla");
  fireEvent.click(screen.getByText("Paket ayarları"));
  await waitFor(() => assert.equal(screen.queryByText("Paketlerini ayarla"), null));
  assert.ok(recorded.some(([, patch]) => Boolean(patch.acknowledged_at)));
});

test("an open modal postpones the tour without counting the visit", async () => {
  const modal = document.createElement("div");
  modal.setAttribute("role", "dialog"); modal.setAttribute("data-test-modal", "");
  document.body.appendChild(modal);
  mount();
  await waitFor(() => assert.equal(client.isFetching(), 0));
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(screen.queryByText("Paketlerini ayarla"), null);
  assert.equal(recorded.length, 0);
});

test("a later reminder is a courtesy: Escape closes it and records no answer", async () => {
  const lastShown = new Date(Date.now() - 2 * DAY).toISOString();
  hints = { tutor_setup_tour: { shown_count: 1, last_shown_at: lastShown, acknowledged_at: lastShown } };
  mount();
  const dialog = await screen.findByRole("dialog", { name: "Paketlerini ayarla" });
  assert.equal(recorded[0][1].shown_count, 2);
  fireEvent.keyDown(dialog, { key: "Escape" });
  await waitFor(() => assert.equal(screen.queryByText("Paketlerini ayarla"), null));
  assert.equal(recorded.filter(([, patch]) => patch.acknowledged_at).length, 0);
});

test("a reminder that is not due yet stays away", async () => {
  const lastShown = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  hints = { tutor_setup_tour: { shown_count: 1, last_shown_at: lastShown, acknowledged_at: lastShown } };
  mount();
  await waitFor(() => assert.equal(client.isFetching(), 0));
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(screen.queryByRole("dialog"), null);
});
