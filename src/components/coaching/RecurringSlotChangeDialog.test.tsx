import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React, { type ComponentType, type ComponentProps } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const posted: { url: string; body: unknown }[] = [];
const requested: string[] = [];
let options: { day_of_week: number; start_time: string }[] = [];
let optionsFail = false;
let changeFails = false;

let Dialog: ComponentType<{
  purchaseId: string;
  slotIndex: number;
  currentDayOfWeek: number;
  currentStartTime: string;
}>;

before(async () => {
  mock.module("sonner", { namedExports: { toast: { success: () => {}, error: () => {} } } });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        requested.push(url);
        if (url !== "/coaching/recurring-slots/0/options/") throw new Error(`unexpected GET ${url}`);
        if (optionsFail) throw Object.assign(new Error("boom"), { response: { status: 500 } });
        return { data: { slots: options } };
      },
      post: async (url: string, body: unknown) => {
        posted.push({ url, body });
        if (changeFails) {
          throw Object.assign(new Error("boom"), {
            response: { status: 400, data: { code: "lesson_conflict", detail: "The new recurring time conflicts with an existing lesson." } },
          });
        }
        return { data: {} };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ RecurringSlotChangeDialog: Dialog } = await import("./RecurringSlotChangeDialog"));
});

beforeEach(() => {
  options = [
    { day_of_week: 2, start_time: "19:00" },
    { day_of_week: 0, start_time: "18:30" },
  ];
  optionsFail = false;
  changeFails = false;
});
after(() => window.close());
afterEach(() => {
  cleanup();
  posted.length = 0;
  requested.length = 0;
});

function open(props: Partial<ComponentProps<typeof Dialog>> = {}) {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Dialog purchaseId="p1" slotIndex={0} currentDayOfWeek={1} currentStartTime="18:30:00" {...props} />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Salı 18:30 saatini değiştir" }));
}

describe("RecurringSlotChangeDialog", () => {
  it("opens from a solid gold button and asks the server for the hours this slot can move to", async () => {
    open();

    // The open dialog hides everything behind it from the accessibility tree.
    const trigger = screen.getByRole("button", { name: "Salı 18:30 saatini değiştir", hidden: true });
    assert.match(trigger.className, /bg-gold/);
    assert.doesNotMatch(trigger.className, /border-ink|bg-transparent/);
    assert.equal(trigger.textContent, "Değiştir");
    await screen.findByRole("radio", { name: "Çarşamba 19:00" });
    assert.deepEqual(requested, ["/coaching/recurring-slots/0/options/"]);
  });

  it("lists those hours by day and sends the pick", async () => {
    open();

    fireEvent.click(await screen.findByRole("radio", { name: "Çarşamba 19:00" }));
    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() =>
      assert.deepEqual(posted, [
        {
          url: "/coaching/recurring-slots/change/",
          body: { purchase_id: "p1", slot_index: 0, new_day_of_week: 2, new_start_time: "19:00" },
        },
      ]),
    );
  });

  it("explains what to do when no other hour can be moved to", async () => {
    options = [];
    open();

    assert.ok(await screen.findByText(/geçebileceğin başka bir koçluk saati yok/));
    assert.equal((screen.getByRole("button", { name: "Kaydet" }) as HTMLButtonElement).disabled, true);
  });

  it("says the hours could not be read instead of looking empty, and tries again", async () => {
    optionsFail = true;
    open();

    assert.ok(await screen.findByText("Uygun saatler yüklenemedi."));
    assert.equal(screen.queryByText(/geçebileceğin başka bir koçluk saati yok/), null);

    optionsFail = false;
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    await screen.findByRole("radio", { name: "Çarşamba 19:00" });
  });

  it("keeps the pick and says why when the server still refuses the hour", async () => {
    changeFails = true;
    open();

    fireEvent.click(await screen.findByRole("radio", { name: "Pazartesi 18:30" }));
    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));

    assert.ok(await screen.findByText("Bu saat mevcut bir dersle çakışıyor."));
    assert.equal(screen.getByRole("radio", { name: "Pazartesi 18:30" }).getAttribute("aria-checked"), "true");
  });
});
