import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, test, mock } from "node:test";
import React from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { TutorProfile, TutorSlotsResponse } from "@/types";

import { addDays, istanbulToday } from "./slotPickerFormat";

let slotsFail = false;

const today = istanbulToday();
// A closed day in the middle, so "every day is returned, some disabled" is
// exercised rather than assumed.
const slotResponse: TutorSlotsResponse = {
  timezone: "Europe/Istanbul",
  duration_minutes: 20,
  days: Array.from({ length: 5 }, (_, offset) => ({
    date: addDays(today, offset),
    slots: offset === 1 ? [] : ["09:00", "09:30", "10:00"],
  })),
};

mock.module("@/lib/lessonsApi", {
  namedExports: {
    createBooking: async () => {
      throw new Error("Booking submission is outside this visual-state test.");
    },
    fetchTutorSlots: async (): Promise<TutorSlotsResponse> => {
      if (slotsFail) throw new Error("offline");
      return slotResponse;
    },
  },
});

mock.module("@/lib/paymentsApi", {
  namedExports: {
    fetchPackagePurchases: async () => [],
  },
});

const tutor: TutorProfile = {
  id: "tutor-1",
  user: "user-1",
  name: "Deniz",
  surname: "Aydın",
  profile_picture: "",
  intro_video_url: "",
  bio: "",
  university: "Boğaziçi Üniversitesi",
  department: "Matematik",
  yks_rank: 1200,
  hourly_price: 0,
  rating: 5,
  total_reviews: 1,
  is_verified: true,
  is_public: true,
  teaching_styles: [],
  is_online: true,
  subjects: [{ id: "subject-1", name: "Matematik", exam_type: "TYT" }],
  created_at: "2026-09-02T00:00:00",
};

let BookingModal: typeof import("./BookingModal").BookingModal;

before(async () => {
  BookingModal = (await import("./BookingModal")).BookingModal;
});

afterEach(() => act(() => cleanup()));

function renderModal() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <BookingModal
        tutor={tutor}
        isOpen
        isTrial
        onClose={() => undefined}
        onSuccess={() => undefined}
      />
    </QueryClientProvider>,
  );
  return queryClient;
}

test("the selected day and time keep white text on their filled surface", async () => {
  // Regression guard with a specific cause: `cn()` drops a custom `text-*`
  // size when a conditional `text-*` colour sits in the same call, so a
  // selected control can silently lose its inverted text and end up dark on
  // dark. See the tailwind-merge note in the repo handover.
  const queryClient = renderModal();

  const openDays = await screen.findAllByText(/^3 boş$/);
  const day = openDays[0].closest("button");
  assert.ok(day);
  fireEvent.click(day);

  const time = await screen.findByRole("button", { name: "09:00" });
  fireEvent.click(time);

  await waitFor(() => {
    assert.equal(day.classList.contains("text-white"), true);
    assert.equal(time.classList.contains("text-white"), true);
  });
  queryClient.clear();
});

test("a day with no free slot is offered as full rather than hidden", async () => {
  const queryClient = renderModal();

  const full = await screen.findByText("Dolu");
  const button = full.closest("button");
  assert.ok(button);
  assert.equal(button.disabled, true);
  queryClient.clear();
});

test("the submit button stays disabled until a time is chosen", async () => {
  const queryClient = renderModal();

  await screen.findByRole("button", { name: "09:00" });
  const submit = screen.getByRole("button", { name: /Rezervasyonu tamamla/ });
  assert.equal((submit as HTMLButtonElement).disabled, true);

  fireEvent.click(screen.getByRole("button", { name: "09:00" }));
  await waitFor(() =>
    assert.equal((screen.getByRole("button", { name: /Rezervasyonu tamamla/ }) as HTMLButtonElement).disabled, false),
  );
  queryClient.clear();
});

test("a failing slot fetch offers a retry instead of an empty calendar", async () => {
  slotsFail = true;
  const queryClient = renderModal();

  await screen.findByRole("alert");
  assert.equal(screen.queryByRole("button", { name: "09:00" }), null);

  slotsFail = false;
  fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
  await screen.findByRole("button", { name: "09:00" });
  queryClient.clear();
});
