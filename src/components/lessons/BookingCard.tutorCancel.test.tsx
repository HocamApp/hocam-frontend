import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, before, mock, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { toBookingStartTime } from "@/lib/bookingTime";
import type { Booking } from "@/types";

mock.module("@/components/lessons/LessonJoinButton", {
  namedExports: { LessonJoinButton: () => null },
});
mock.module("@/components/messaging/ParticipantAvatar", {
  namedExports: { ParticipantAvatar: () => null },
});
mock.module("@/components/learning/LessonTopicCheckInDialog", {
  namedExports: { LessonTopicCheckInDialog: () => null },
});
mock.module("@/components/lessons/EmergencyCancelDialog", {
  namedExports: {
    EmergencyCancelDialog: ({ isOpen }: { isOpen: boolean }) =>
      isOpen ? <div data-testid="emergency-dialog">Acil durum penceresi</div> : null,
  },
});
mock.module("sonner", { namedExports: { toast: { success: () => undefined, error: () => undefined } } });

let BookingCard: typeof import("./BookingCard").BookingCard;
before(async () => {
  ({ BookingCard } = await import("./BookingCard"));
});
afterEach(cleanup);
after(() => window.close());

const HOUR = 60 * 60 * 1000;

function lessonIn(ms: number, overrides: Partial<Booking> = {}): Booking {
  return {
    id: "booking-1",
    status: "confirmed",
    start_time: toBookingStartTime(Date.now() + ms),
    duration_minutes: 40,
    price: 0,
    room_url: "https://8x8.vc/room",
    is_trial: false,
    package_purchase: "purchase-1",
    subject: { id: "math", name: "Matematik", exam_type: "TYT" },
    student: { id: "student", email: "ada@example.com", display_name: "Ada" },
    tutor: { id: "tutor", name: "Ayşe", surname: "Hoca" },
    ...overrides,
  } as unknown as Booking;
}

function mount(booking: Booking, role: "tutor" | "student" = "tutor") {
  const updates: Array<[string, string]> = [];
  render(
    <BookingCard
      booking={booking}
      currentUserRole={role}
      onStatusUpdate={(id, status) => updates.push([id, status])}
    />
  );
  return updates;
}

test("a tutor with notice can cancel a confirmed lesson, after a confirmation", () => {
  const updates = mount(lessonIn(2 * 24 * HOUR));

  assert.equal(screen.queryByRole("button", { name: "Acil durum bildir" }), null);
  fireEvent.click(screen.getByRole("button", { name: "İptal Et" }));

  // A confirmed lesson is a commitment: nothing is cancelled until they confirm.
  assert.equal(updates.length, 0);
  assert.ok(screen.getByText(/öğrencinin paket hakkı iade edilir/));
  assert.equal(screen.queryByText(/ceza puanı/), null);
  fireEvent.click(screen.getByRole("button", { name: "Rezervasyonu İptal Et" }));
  assert.deepEqual(updates, [["booking-1", "cancelled"]]);
});

test("inside 12 hours the tutor is offered the emergency request, not a cancel", () => {
  const updates = mount(lessonIn(3 * HOUR));

  assert.equal(screen.queryByRole("button", { name: "İptal Et" }), null);
  fireEvent.click(screen.getByRole("button", { name: "Acil durum bildir" }));

  assert.ok(screen.getByTestId("emergency-dialog"));
  assert.equal(updates.length, 0);
});

test("declining a pending request stays one click, even close to the start", () => {
  const updates = mount(lessonIn(HOUR, { status: "pending", room_url: undefined }));

  fireEvent.click(screen.getByRole("button", { name: "İptal Et" }));
  assert.deepEqual(updates, [["booking-1", "cancelled"]]);
  assert.equal(screen.queryByRole("button", { name: "Acil durum bildir" }), null);
});

test("the student's cancel button is unchanged inside 12 hours", () => {
  const updates = mount(lessonIn(3 * HOUR), "student");

  assert.equal(screen.queryByRole("button", { name: "Acil durum bildir" }), null);
  fireEvent.click(screen.getByRole("button", { name: "İptal Et" }));
  // A package credit is forfeited this late, so the student is asked first.
  assert.equal(updates.length, 0);
  assert.ok(screen.getByText(/paket hakkı iade edilmeyecek/));
});
