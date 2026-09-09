import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, test, mock } from "node:test";
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { TutorRecurringSlotsResponse } from "@/types";

// Monday and Thursday fully free; Wednesday open but only for part of the term.
const response: TutorRecurringSlotsResponse = {
  timezone: "Europe/Istanbul",
  duration_minutes: 40,
  starts_on: "2026-09-14",
  ends_on: "2026-10-11",
  candidates: [
    { day_of_week: 0, start_time: "10:00", free_occurrences: 4, total_occurrences: 4 },
    { day_of_week: 0, start_time: "11:00", free_occurrences: 4, total_occurrences: 4 },
    { day_of_week: 2, start_time: "16:00", free_occurrences: 3, total_occurrences: 4 },
    { day_of_week: 3, start_time: "09:00", free_occurrences: 4, total_occurrences: 4 },
  ],
};

mock.module("@/lib/lessonsApi", {
  namedExports: {
    fetchTutorRecurringSlots: async () => response,
  },
});

const tutor = {
  id: "tutor-1",
  name: "Deniz",
  surname: "Aydın",
  university: "Boğaziçi Üniversitesi",
  profile_picture: "",
};

let RecurringLessonSlotPicker: typeof import("./RecurringLessonSlotPicker").RecurringLessonSlotPicker;

before(async () => {
  RecurringLessonSlotPicker = (await import("./RecurringLessonSlotPicker"))
    .RecurringLessonSlotPicker;
});

afterEach(() => act(() => cleanup()));

function renderPicker(onChange: (next: unknown) => void, value: unknown[] = []) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <RecurringLessonSlotPicker
        tutor={tutor}
        durationMinutes={40}
        termDays={28}
        requiredCount={2}
        value={value as never}
        onChange={onChange as never}
        priceLabel="300,00 ₺ / 40 dk"
      />
    </QueryClientProvider>,
  );
  return queryClient;
}

test("looking at another weekday does not pick an hour on it", async () => {
  // The reported bug: the weekday card had no state of its own, so it changed
  // the view by selecting something. A student who clicked Thursday to see
  // Thursday found Thursday 09:00 already in their schedule.
  let calls = 0;
  const queryClient = renderPicker(() => {
    calls += 1;
  });

  const thursday = (await screen.findByText("Per")).closest("button");
  assert.ok(thursday);
  fireEvent.click(thursday);

  assert.equal(calls, 0, "clicking a weekday must not change the selection");
  // It did change what is on screen, though.
  await screen.findByText(/Her Perşembe saatleri/i);
  queryClient.clear();
});

test("an hour that is free only some weeks is not offered", async () => {
  // The per-slot "3 of 4 weeks free" line is gone, so a partly-taken hour
  // would be indistinguishable from a free one. It is left out instead.
  const queryClient = renderPicker(() => undefined);

  await screen.findByText("Pzt");
  const wednesday = screen.getByText("Çar").closest("button");
  assert.ok(wednesday);
  assert.equal((wednesday as HTMLButtonElement).disabled, true);
  assert.ok(screen.getByText("Çar").parentElement?.textContent?.includes("Müsait değil"));
  queryClient.clear();
});

test("a weekday the tutor never opens reads as unavailable, not as full", async () => {
  const queryClient = renderPicker(() => undefined);

  await screen.findByText("Sal");
  const tuesday = screen.getByText("Sal").closest("button");
  assert.ok(tuesday);
  assert.equal((tuesday as HTMLButtonElement).disabled, true);
  assert.equal(screen.queryByText("Dolu"), null);
  queryClient.clear();
});

test("an hour is selected only by clicking the hour itself", async () => {
  const selections: unknown[] = [];
  const queryClient = renderPicker((next) => selections.push(next));

  const hour = await screen.findByText("10:00 – 10:40");
  fireEvent.click(hour.closest("button")!);

  assert.deepEqual(selections, [[{ day_of_week: 0, start_time: "10:00" }]]);
  queryClient.clear();
});
