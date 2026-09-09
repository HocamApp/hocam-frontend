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

import { addDays, istanbulToday, longDateLabel } from "./slotPickerFormat";

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

function renderModal(tutorOverrides: Partial<TutorProfile> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <BookingModal
        tutor={{ ...tutor, ...tutorOverrides }}
        isOpen
        isTrial
        onClose={() => undefined}
        onSuccess={() => undefined}
      />
    </QueryClientProvider>,
  );
  return queryClient;
}

test("the chosen day and hour both give strong pink selection feedback", async () => {
  const queryClient = renderModal();

  // The day strip no longer prints how many hours are left, so pick the card
  // by its date. Booking one lesson does not need a count of the rest.
  const day = (await screen.findByText(String(Number(today.slice(8))))).closest("button");
  assert.ok(day);
  fireEvent.click(day);

  const time = await screen.findByRole("button", { name: "09:00" });
  fireEvent.click(time);

  await waitFor(() => {
    assert.equal(time.classList.contains("text-white"), true);
    assert.equal(time.classList.contains("bg-pink"), true);
  });
  assert.equal(day.classList.contains("bg-pink"), true);
  assert.equal(day.classList.contains("border-pink"), true);
  assert.equal(day.classList.contains("text-white"), true);
  queryClient.clear();
});

test("an unavailable day stays disabled without repeating visible unavailable copy", async () => {
  const queryClient = renderModal();

  const unavailableDate = slotResponse.days[1].date;
  const unavailable = await screen.findByRole("button", {
    name: new RegExp(`${Number(unavailableDate.slice(8))}.*müsait değil`, "i"),
  });
  assert.equal((unavailable as HTMLButtonElement).disabled, true);
  assert.equal(screen.queryByText("Müsait değil"), null);
  queryClient.clear();
});

test("the trial header is a tutor identity row with purposeful Turkish copy", async () => {
  const queryClient = renderModal();

  assert.ok(screen.getByText("DA"));
  assert.ok(screen.getByRole("heading", { name: "Ücretsiz deneme dersi ayırt" }));
  assert.ok(screen.getByText("Seviyeni ve sana uygun çalışma planını konuşmak için."));
  assert.equal(screen.queryByText(/Deniz Aydın ile 20 dakika/), null);
  queryClient.clear();
});

test("the submit button stays disabled until a time is chosen", async () => {
  const queryClient = renderModal();

  await screen.findByRole("button", { name: "09:00" });
  const submit = screen.getByRole("button", { name: /Rezervasyonu tamamla/ });
  assert.equal((submit as HTMLButtonElement).disabled, true);
  assert.equal(submit.classList.contains("duration-200"), true);
  assert.equal(submit.classList.contains("motion-reduce:transition-none"), true);

  fireEvent.click(screen.getByRole("button", { name: "09:00" }));
  await waitFor(() =>
    assert.equal((screen.getByRole("button", { name: /Rezervasyonu tamamla/ }) as HTMLButtonElement).disabled, false),
  );
  queryClient.clear();
});

test("the selected lesson summary appears once in the fixed footer", async () => {
  const queryClient = renderModal();

  const time = await screen.findByRole("button", { name: "09:00" });
  fireEvent.click(time);

  const expected = `${longDateLabel(today)} · 09:00 – 09:20`;
  await waitFor(() => assert.equal(screen.getAllByText(expected).length, 1));
  assert.ok(screen.getByText("20 dakika · 0 ₺"));
  queryClient.clear();
});

test("the footer shows only the strongest trust signal the tutor has earned", async () => {
  let queryClient = renderModal({ completed_lessons_count: 128, total_reviews: 24, rating: 4.9 });
  let signal = screen.getByText("Çok tercih ediliyor · 128 ders verdi");
  assert.ok(signal.parentElement?.querySelector("svg"));
  queryClient.clear();
  cleanup();

  queryClient = renderModal({ completed_lessons_count: 12, total_reviews: 24, rating: 4.9 });
  signal = screen.getByText("Öğrencilerden 4,9/5 · 24 yorum");
  assert.ok(signal.parentElement?.querySelector("svg"));
  queryClient.clear();
  cleanup();

  queryClient = renderModal({ completed_lessons_count: 42, total_reviews: 2, rating: 5 });
  signal = screen.getByText("42 tamamlanan ders deneyimi");
  assert.ok(signal.parentElement?.querySelector("svg"));
  queryClient.clear();
  cleanup();

  queryClient = renderModal({ completed_lessons_count: 8, total_reviews: 9, rating: 5 });
  assert.equal(document.querySelector("[data-booking-trust-signal]"), null);
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

test("with more than one subject, the calendar waits for the subject", async () => {
  // The complaint about this dialog and about the package schedule step was
  // the same: the choice that has to be made sat in the quietest corner while
  // everything else was already on screen.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <BookingModal
        tutor={{
          ...tutor,
          subjects: [
            { id: "subject-1", name: "Matematik", exam_type: "TYT" },
            { id: "subject-2", name: "Fizik", exam_type: "AYT" },
          ],
        }}
        isOpen
        isTrial
        onClose={() => undefined}
        onSuccess={() => undefined}
      />
    </QueryClientProvider>,
  );

  await screen.findByText("Hangi dersi alacaksın?");
  assert.equal(screen.queryByRole("button", { name: "09:00" }), null);

  fireEvent.click(screen.getByRole("button", { name: /Matematik/ }));
  await screen.findByRole("button", { name: "09:00" });
  const subjectHeading = screen.getByRole("heading", { name: "Hangi dersi alacaksın?" });
  const scheduleHeading = screen.getByRole("heading", { name: "Hangi gün ve saatte?" });
  const hoursHeading = screen.getByRole("heading", { name: new RegExp(`${longDateLabel(today)} saatleri`) });
  for (const heading of [subjectHeading, scheduleHeading, hoursHeading]) {
    assert.equal(heading.classList.contains("text-h3-m"), true);
    assert.equal(heading.classList.contains("font-medium"), true);
  }
  assert.equal(screen.queryByText("Gün seç"), null);
  queryClient.clear();
});
