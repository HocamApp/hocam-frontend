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

import type { AvailabilityRule, TutorProfile } from "@/types";

const availability: AvailabilityRule[] = Array.from({ length: 7 }, (_, day) => ({
  id: `availability-${day}`,
  tutor: "tutor-1",
  day_of_week: day,
  start_time: "09:00:00",
  end_time: "11:00:00",
  created_at: "2026-09-02T00:00:00",
}));

mock.module("@/lib/dashboardApi", {
  namedExports: {
    fetchTutorAvailability: async () => availability,
  },
});

mock.module("@/lib/lessonsApi", {
  namedExports: {
    createBooking: async () => {
      throw new Error("Booking submission is outside this visual-state test.");
    },
    fetchTutorBusyIntervals: async () => [],
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

test("selected mobile date and time keep white text on the pink surface", async () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
    },
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

  fireEvent.click(screen.getByRole("button", { name: /Matematik/ }));
  fireEvent.click(screen.getByRole("button", { name: "İleri →" }));

  await screen.findByRole("heading", { name: /Tarih ve Saat Seç/ });

  const dateGroup = screen.getByText("Tarih").parentElement;
  assert.ok(dateGroup);
  let firstEnabledDate: HTMLButtonElement | undefined;
  await waitFor(() => {
    firstEnabledDate = Array.from(
      dateGroup.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => !button.disabled);
    assert.ok(firstEnabledDate);
  });

  assert.ok(firstEnabledDate);
  const selectedDateButton = firstEnabledDate;
  fireEvent.click(selectedDateButton);
  const time = await screen.findByRole("button", { name: "09:00" });
  fireEvent.click(time);

  await waitFor(() => {
    assert.equal(selectedDateButton.classList.contains("text-white"), true);
    assert.equal(time.classList.contains("!text-white"), true);
  });
});
