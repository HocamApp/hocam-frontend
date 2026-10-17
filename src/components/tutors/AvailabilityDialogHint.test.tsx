import "@/test/setupDom";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, before, beforeEach, mock, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { UiHintKey, UiHintRecord, UiHints } from "@/lib/tutorSetupHints";

let hints: UiHints = {};
let ready = true;
let rules: Array<Record<string, unknown>> = [];
const recorded: Array<[UiHintKey, UiHintRecord]> = [];

mock.module("@/hooks/useUiHints", { namedExports: { useUiHints: () => ({ hints, ready, record: (key: UiHintKey, patch: UiHintRecord) => { recorded.push([key, patch]); } }) } });
mock.module("@/lib/dashboardApi", { namedExports: { fetchAvailability: async () => rules } });

let Hint: typeof import("./AvailabilityDialogHint").AvailabilityDialogHint;
before(async () => { Hint = (await import("./AvailabilityDialogHint")).AvailabilityDialogHint; });

let client: QueryClient;
beforeEach(() => {
  hints = {}; ready = true; rules = []; recorded.length = 0;
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
});
afterEach(() => { cleanup(); client.clear(); });
const mount = () => render(<QueryClientProvider client={client}><Hint /></QueryClientProvider>);

test("a tutor with no availability who has not answered sees how to add hours", async () => {
  mount();
  assert.ok(await screen.findByText("Saatlerini böyle ekle"));
  fireEvent.click(screen.getByRole("button", { name: "Anladım" }));
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0][0], "tutor_availability_hint");
  assert.ok(recorded[0][1].acknowledged_at);
});

test("it is gone once the tutor has pressed the button", async () => {
  hints = { tutor_availability_hint: { acknowledged_at: "2026-10-17T10:00:00Z" } };
  mount();
  await waitFor(() => assert.equal(client.isFetching(), 0));
  assert.equal(screen.queryByText("Saatlerini böyle ekle"), null);
});

test("it is gone once there is availability", async () => {
  rules = [{ id: "r", day_of_week: 0, start_time: "09:00:00", end_time: "10:00:00" }];
  mount();
  await waitFor(() => assert.equal(client.isFetching(), 0));
  assert.equal(screen.queryByText("Saatlerini böyle ekle"), null);
});

test("it stays quiet while the hint state is not ready", async () => {
  ready = false;
  mount();
  await waitFor(() => assert.equal(client.isFetching(), 0));
  assert.equal(screen.queryByText("Saatlerini böyle ekle"), null);
});

test("the packages page tells the tour about both ways of finishing", () => {
  const source = readFileSync(new URL("../../app/(main)/dashboard/tutor/packages/page.tsx", import.meta.url), "utf8");
  assert.equal((source.match(/record\("tutor_packages_reviewed", completedPatch\(\)\)/g) ?? []).length, 2);
  assert.doesNotMatch(source, /lucide/);
});
