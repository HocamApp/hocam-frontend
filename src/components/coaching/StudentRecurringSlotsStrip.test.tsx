import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const slots = [
  { id: "rs-1", slot_index: 0, day_of_week: 1, start_time: "18:30:00", source: "availability" },
  { id: "rs-2", slot_index: 1, day_of_week: 5, start_time: "11:00:00", source: "tutor_proposal" },
];

let payload: unknown = { purchase_id: "cp-1", recurring_slots: slots, published_slots: [] };
let fails = false;
let reads = 0;

let Strip: React.ComponentType;

before(async () => {
  mock.module("sonner", { namedExports: { toast: { success() {}, error() {} } } });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url !== "/coaching/my-recurring-slots/") throw new Error(`unexpected GET ${url}`);
        reads += 1;
        if (fails) throw Object.assign(new Error("boom"), { response: { status: 500 } });
        return { data: payload };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ StudentRecurringSlotsStrip: Strip } = await import("./StudentRecurringSlotsStrip"));
});

beforeEach(() => {
  payload = { purchase_id: "cp-1", recurring_slots: slots, published_slots: [] };
  fails = false;
  reads = 0;
});
afterEach(cleanup);

function renderStrip() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Strip />
    </QueryClientProvider>,
  );
}

describe("StudentRecurringSlotsStrip", () => {
  it("lists each regular hour with its slot, and says which one the tutor proposed", async () => {
    renderStrip();

    const region = await screen.findByRole("region", { name: "Düzenli saatlerin" });
    const rows = within(region).getAllByRole("listitem");
    assert.equal(rows.length, 2);
    assert.ok(within(rows[0]).getByText("1. saat"));
    assert.ok(within(rows[0]).getByText("Salı 18:30"));
    assert.equal(within(rows[0]).queryByText(/özel saat/), null);
    assert.ok(within(rows[1]).getByText("2. saat · hocanın önerdiği özel saat"));
    assert.ok(within(rows[1]).getByText("Cumartesi 11:00"));
  });

  it("changes each hour from its own solid gold button", async () => {
    renderStrip();

    const first = await screen.findByRole("button", { name: "Salı 18:30 saatini değiştir" });
    const second = screen.getByRole("button", { name: "Cumartesi 11:00 saatini değiştir" });
    for (const button of [first, second]) {
      assert.match(button.className, /bg-gold/);
      assert.doesNotMatch(button.className, /border-ink|bg-transparent/);
    }
  });

  it("says the hours could not be read instead of disappearing, and tries again", async () => {
    fails = true;
    renderStrip();

    assert.ok(await screen.findByText("Düzenli saatlerin yüklenemedi."));
    assert.equal(screen.queryByRole("region", { name: "Düzenli saatlerin" }), null);

    fails = false;
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    await screen.findByRole("region", { name: "Düzenli saatlerin" });
  });

  it("is not there when the student has no regular hours, or no running coaching to change them in", async () => {
    payload = { purchase_id: null, recurring_slots: [], published_slots: [] };
    const first = renderStrip();
    await waitFor(() => assert.equal(reads, 1));
    assert.equal(screen.queryByRole("region", { name: "Düzenli saatlerin" }), null);
    assert.equal(screen.queryByText("Düzenli saatlerin yüklenemedi."), null);
    first.unmount();

    payload = { purchase_id: null, recurring_slots: slots, published_slots: [] };
    renderStrip();
    await waitFor(() => assert.equal(reads, 2));
    assert.equal(screen.queryByRole("region", { name: "Düzenli saatlerin" }), null);
  });
});
