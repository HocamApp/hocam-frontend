import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { formatDateLocal, jsDayToBackendDay } from "@/lib/utils";
import type { AvailabilityRule, Booking } from "@/types";

/**
 * Availability calendar: the six day statuses (Müsait, Kısmen dolu, Dolu,
 * Kapalı, Rezervasyon var, Geçmiş gün) plus the tutor/student control
 * split. All dates are derived from "today" so the tests never go stale.
 */

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

Object.defineProperty(globalThis, "self", { value: window, configurable: true });
// Radix Select (TimeSelect in the day editor) checks DocumentFragment.
Object.defineProperty(globalThis, "DocumentFragment", {
  value: window.DocumentFragment,
  configurable: true,
});

const today = new Date();
const todayBackendDay = jsDayToBackendDay(today.getDay());
const todayString = formatDateLocal(today);

let availabilityResponse: AvailabilityRule[] = [];

function weeklyRule(overrides: Partial<AvailabilityRule> = {}): AvailabilityRule {
  return {
    id: "rule-weekly",
    tutor: "tutor-1",
    day_of_week: todayBackendDay,
    specific_date: null,
    is_unavailable: false,
    start_time: "10:00:00",
    end_time: "12:00:00",
    created_at: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "booking-1",
    student: { id: "student-1", email: "ogrenci@example.com", display_name: "Öğrenci" },
    tutor: { id: "tutor-1", name: "Hoca", surname: "Hocaoğlu" },
    subject: { id: "subject-1", name: "Matematik", exam_type: "TYT" },
    start_time: `${todayString}T10:00:00`,
    duration_minutes: 40,
    price: 500,
    status: "confirmed",
    lesson_request: null,
    created_at: "2026-08-01T00:00:00Z",
    ...overrides,
  } as Booking;
}

let AvailabilityCalendar: React.ComponentType<{
  availability: AvailabilityRule[];
  bookings?: Booking[];
  editable?: boolean;
  showBookings?: boolean;
}> | null = null;

before(async () => {
  mock.module("@/lib/dashboardApi", {
    namedExports: {
      fetchAvailability: async () => availabilityResponse,
      createAvailabilityRule: async () => ({}),
      deleteAvailabilityRule: async () => {},
    },
  });
  AvailabilityCalendar = (
    await import("./AvailabilityCalendar")
  ).AvailabilityCalendar as typeof AvailabilityCalendar;
});

function renderCalendar(props: {
  availability: AvailabilityRule[];
  bookings?: Booking[];
  editable?: boolean;
  showBookings?: boolean;
}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Component = AvailabilityCalendar as React.ComponentType<typeof props>;
  return render(
    <QueryClientProvider client={queryClient}>
      <Component {...props} />
    </QueryClientProvider>
  );
}

afterEach(cleanup);

describe("AvailabilityCalendar — durum gösterimi", () => {
  it("açıklamada altı durumun tamamını listeler", () => {
    renderCalendar({ availability: [weeklyRule()], editable: false });

    const legend = screen.getByLabelText("Takvim açıklaması");
    for (const label of [
      "Müsait",
      "Kısmen dolu",
      "Dolu",
      "Kapalı",
      "Rezervasyon var",
      "Geçmiş gün",
    ]) {
      assert.ok(
        (legend.textContent ?? "").includes(label),
        `legend missing: ${label}`
      );
    }
  });

  it("açık günü Müsait olarak işaretler", () => {
    renderCalendar({ availability: [weeklyRule()], editable: false });

    const status = screen.getByTestId("availability-day-status");
    assert.equal(status.dataset.status, "available");
    assert.ok((status.textContent ?? "").includes("Müsait"));
  });

  it("kapalı günü Kapalı olarak işaretler", () => {
    renderCalendar({
      availability: [
        weeklyRule({
          id: "rule-closed",
          specific_date: todayString,
          is_unavailable: true,
        }),
      ],
      editable: false,
    });

    const status = screen.getByTestId("availability-day-status");
    assert.equal(status.dataset.status, "closed");
    screen.getByText("Bu gün kapalı olarak işaretlenmiş.");
  });

  it("kısmen rezerve edilmiş günü Kısmen dolu olarak işaretler", () => {
    renderCalendar({
      availability: [weeklyRule()],
      bookings: [booking({ duration_minutes: 40 })],
      editable: false,
    });

    const status = screen.getByTestId("availability-day-status");
    assert.equal(status.dataset.status, "partial");
    assert.ok((status.textContent ?? "").includes("Kısmen dolu"));
    assert.ok((status.textContent ?? "").includes("Rezervasyon var"));
    assert.equal(
      screen.getByTestId("availability-slot").dataset.status,
      "partial"
    );
  });

  it("tamamen rezerve edilmiş günü Dolu olarak işaretler", () => {
    renderCalendar({
      availability: [weeklyRule()],
      bookings: [booking({ duration_minutes: 120 })],
      editable: false,
    });

    const status = screen.getByTestId("availability-day-status");
    assert.equal(status.dataset.status, "full");
    assert.ok((status.textContent ?? "").includes("Dolu"));
  });
});

describe("AvailabilityCalendar — hoca düzenleme kontrolleri", () => {
  it("hoca Düzenle butonunu görür ve gün editörünü açar", async () => {
    availabilityResponse = [weeklyRule({ specific_date: todayString })];
    renderCalendar({ availability: [weeklyRule()], editable: true });

    fireEvent.click(screen.getByRole("button", { name: /Düzenle/ }));

    await screen.findByText(/Müsaitliği/);
    // The free slot stays deletable in the editor (rules load async).
    await screen.findByRole("button", { name: /saatini sil/ });
  });

  it("rezervasyonu olan saat editörde silinemez", async () => {
    availabilityResponse = [weeklyRule({ specific_date: todayString })];
    renderCalendar({
      availability: [weeklyRule()],
      bookings: [booking({ duration_minutes: 120 })],
      editable: true,
    });

    fireEvent.click(screen.getByRole("button", { name: /Düzenle/ }));

    await screen.findByTestId("availability-slot-booked");
    assert.ok(
      (screen.getByTestId("availability-slot-booked").textContent ?? "").includes(
        "Rezervasyon var"
      )
    );
    assert.equal(screen.queryByRole("button", { name: /saatini sil/ }), null);
  });
});

describe("AvailabilityCalendar — öğrenci salt-okunur görünümü", () => {
  it("öğrenci düzenleme kontrolü görmez", () => {
    renderCalendar({ availability: [weeklyRule()], editable: false });

    assert.equal(screen.queryByRole("button", { name: /Düzenle/ }), null);
    assert.equal(screen.queryByRole("button", { name: /saatini sil/ }), null);
  });

  it("müsait günde rezervasyon yönlendirmesi gösterir", () => {
    renderCalendar({ availability: [weeklyRule()], editable: false });

    screen.getByText(/rezervasyon butonunu kullan/);
  });

  it("dolu saat tıklanabilir değildir", () => {
    renderCalendar({
      availability: [weeklyRule()],
      bookings: [booking({ duration_minutes: 120 })],
      editable: false,
    });

    const slot = screen.getByTestId("availability-slot");
    assert.equal(slot.dataset.status, "full");
    assert.equal(slot.getAttribute("aria-disabled"), "true");
    // A plain span, never a button: full slots cannot be clicked.
    assert.equal(slot.tagName, "SPAN");
  });
});
