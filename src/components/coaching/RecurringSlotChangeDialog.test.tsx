import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, before, describe, it, mock } from "node:test";
import React, { type ComponentType, type ComponentProps } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const sent: unknown[] = [];
let Dialog: ComponentType<{
  purchaseId: string;
  slotIndex: number;
  currentDayOfWeek: number;
  currentStartTime: string;
  publishedSlots: { day_of_week: number; start_time: string }[];
}>;

before(async () => {
  mock.module("sonner", { namedExports: { toast: { success: () => {}, error: () => {} } } });
  mock.module("@/lib/coachingApi", {
    namedExports: {
      COACHING_DAY_LABEL: { 0: "Pazartesi", 1: "Salı", 2: "Çarşamba", 3: "Perşembe", 4: "Cuma", 5: "Cumartesi", 6: "Pazar" },
      extractCoachingErrorMessage: () => "hata",
      changeCoachingRecurringSlot: async (params: unknown) => { sent.push(params); return {}; },
    },
  });
  ({ RecurringSlotChangeDialog: Dialog } = await import("./RecurringSlotChangeDialog"));
});

after(() => window.close());
afterEach(() => { cleanup(); sent.length = 0; });

function open(props: Partial<ComponentProps<typeof Dialog>> = {}) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Dialog
        purchaseId="p1"
        slotIndex={0}
        currentDayOfWeek={0}
        currentStartTime="18:00:00"
        publishedSlots={[{ day_of_week: 2, start_time: "19:00" }, { day_of_week: 0, start_time: "18:30" }]}
        {...props}
      />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Düzenli saati değiştir" }));
}

describe("RecurringSlotChangeDialog", () => {
  it("offers only the tutor's published hours and sends the pick", async () => {
    open();
    assert.equal(screen.queryByLabelText("Saat"), null);
    fireEvent.click(screen.getByRole("radio", { name: "Çarşamba 19:00" }));
    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));
    await waitFor(() =>
      assert.deepEqual(sent, [{ purchaseId: "p1", slotIndex: 0, newDayOfWeek: 2, newStartTime: "19:00" }]),
    );
  });

  it("explains what to do when there is nothing else to pick", () => {
    open({ publishedSlots: [] });
    assert.ok(screen.getByText(/başka yayınlı koçluk saati yok/));
    assert.equal((screen.getByRole("button", { name: "Kaydet" }) as HTMLButtonElement).disabled, true);
  });
});
