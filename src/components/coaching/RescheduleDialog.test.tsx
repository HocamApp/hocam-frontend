import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, before, describe, it, mock } from "node:test";
import React, { type ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { CoachingSessionItem } from "@/lib/coachingApi";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const posted: unknown[] = [];
let appliesNow = true;
let RescheduleDialog: ComponentType<{ session: CoachingSessionItem; tone?: "gold" | "onPink" }>;

before(async () => {
  mock.module("sonner", { namedExports: { toast: { success: () => {}, error: () => {} } } });
  mock.module("@/lib/coachingApi", {
    namedExports: {
      extractCoachingErrorMessage: () => "hata",
      fetchCoachingRescheduleOptions: async () => ({
        window: { starts_on: "2026-10-12", ends_on: "2026-10-18" },
        free_change_applies_now: appliesNow,
        options: [
          { local_date: "2026-10-12", local_time: "19:00", start: "2026-10-12T16:00:00Z" },
          { local_date: "2026-10-14", local_time: "18:30", start: "2026-10-14T15:30:00Z" },
        ],
      }),
      requestCoachingSessionReschedule: async (_id: string, params: unknown) => {
        posted.push(params);
        return { status: "auto_approved" };
      },
    },
  });
  ({ RescheduleDialog } = await import("./RescheduleDialog"));
});

after(() => window.close());
afterEach(() => {
  cleanup();
  posted.length = 0;
  appliesNow = true;
});

const session = {
  id: "s1",
  scheduled_start: "2026-10-12T15:00:00Z",
  reschedule_window: { starts_on: "2026-10-12", ends_on: "2026-10-18" },
} as CoachingSessionItem;

function open() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RescheduleDialog session={session} />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: /yeniden planla/i }));
}

describe("RescheduleDialog", () => {
  it("offers the tutor's free hours grouped by day and sends the picked one", async () => {
    open();
    const slot = await screen.findByRole("radio", { name: "14 Ekim Çarşamba 18:30" });
    assert.ok(screen.getByText("12 Ekim Pazartesi"));

    fireEvent.click(slot);
    assert.equal(slot.getAttribute("aria-checked"), "true");
    fireEvent.click(screen.getByRole("button", { name: "Saati değiştir" }));

    await waitFor(() => assert.deepEqual(posted, [{ localDate: "2026-10-14", localTime: "18:30" }]));
  });

  it("says the move goes to the tutor when the free change no longer applies", async () => {
    appliesNow = false;
    open();
    await screen.findByText(/hocanın onayına gider/);
    assert.ok(screen.getByRole("button", { name: "Talebi gönder" }));
  });

  it("keeps a custom proposal inside the session's week", async () => {
    open();
    fireEvent.click(await screen.findByRole("button", { name: /Başka bir saat öner/ }));
    const date = screen.getByLabelText("Tarih") as HTMLInputElement;
    assert.equal(date.min, "2026-10-12");
    assert.equal(date.max, "2026-10-18");
    assert.ok(screen.getByLabelText("Saat"));
  });

  it("uses a keyboard-only focus ring and clears the selected time on reopen", async () => {
    open();
    const slot = await screen.findByRole("radio", { name: "14 Ekim Çarşamba 18:30" });
    fireEvent.click(slot);
    const close = screen.getByRole("button", { name: "Pencereyi kapat" });
    assert.match(close.className, /focus-visible:ring-2/);
    fireEvent.click(close);

    fireEvent.click(screen.getByRole("button", { name: /yeniden planla/i }));
    const reopened = await screen.findByRole("radio", { name: "14 Ekim Çarşamba 18:30" });
    assert.equal(reopened.getAttribute("aria-checked"), "false");
  });

  it("is a solid gold button in a row and a solid black one on the pink meeting card", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RescheduleDialog session={session} />
      </QueryClientProvider>,
    );
    const inRow = screen.getByRole("button", { name: /yeniden planla/i });
    assert.match(inRow.className, /bg-gold/);
    assert.doesNotMatch(inRow.className, /bg-ink/);
    cleanup();

    render(
      <QueryClientProvider client={new QueryClient()}>
        <RescheduleDialog session={session} tone="onPink" />
      </QueryClientProvider>,
    );
    const onPink = screen.getByRole("button", { name: /yeniden planla/i });
    assert.match(onPink.className, /bg-ink/);
    assert.doesNotMatch(onPink.className, /bg-gold|bg-pink/);
  });
});
