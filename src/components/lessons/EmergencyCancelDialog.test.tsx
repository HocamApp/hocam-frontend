import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, mock, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { Booking } from "@/types";

const sent: Array<[string, string]> = [];
let failWith: Error | null = null;

mock.module("@/lib/lessonsApi", {
  namedExports: {
    requestEmergencyCancel: async (bookingId: string, reason: string) => {
      sent.push([bookingId, reason]);
      if (failWith) throw failWith;
      return { ticket_id: "ticket-1", status: "open" };
    },
    getBookingErrorMessage: (_error: unknown, fallback: string) => fallback,
  },
});

let EmergencyCancelDialog: typeof import("./EmergencyCancelDialog").EmergencyCancelDialog;
before(async () => {
  ({ EmergencyCancelDialog } = await import("./EmergencyCancelDialog"));
});
beforeEach(() => {
  sent.length = 0;
  failWith = null;
});
afterEach(cleanup);
after(() => window.close());

const booking = { id: "booking-1", subject: { name: "Matematik" } } as unknown as Booking;

function mount() {
  const calls = { closed: 0, succeeded: 0 };
  render(
    <EmergencyCancelDialog
      booking={booking}
      isOpen
      onClose={() => (calls.closed += 1)}
      onSuccess={() => (calls.succeeded += 1)}
    />
  );
  return calls;
}

const type = (value: string) =>
  fireEvent.change(screen.getByLabelText("Neden"), { target: { value } });

test("it explains why the tutor cannot cancel and what happens next", () => {
  mount();
  assert.ok(screen.getByRole("heading", { name: "Acil durum bildir" }));
  assert.ok(screen.getByText(/12 saatten az kaldığı için bu dersi kendin iptal edemezsin/));
  assert.ok(screen.getByText(/Karar verilene kadar dersi vermeye hazır ol/));
});

test("a thin reason is refused next to the field and nothing is sent", async () => {
  const calls = mount();
  type("acil");
  fireEvent.click(screen.getByRole("button", { name: "Talebi gönder" }));

  const alert = await screen.findByRole("alert");
  assert.match(alert.textContent ?? "", /en az 10 karakter/);
  assert.equal(sent.length, 0);
  assert.equal(calls.succeeded, 0);
  assert.equal(calls.closed, 0);
});

test("a real reason is sent trimmed, then the dialog reports success and closes", async () => {
  const calls = mount();
  type("   Hastaneye gitmem gerekiyor, dersi veremeyeceğim.   ");
  fireEvent.click(screen.getByRole("button", { name: "Talebi gönder" }));

  await waitFor(() => assert.equal(calls.succeeded, 1));
  assert.deepEqual(sent, [["booking-1", "Hastaneye gitmem gerekiyor, dersi veremeyeceğim."]]);
  assert.equal(calls.closed, 1);
});

test("a server failure is shown inline and the dialog stays open", async () => {
  failWith = new Error("offline");
  const calls = mount();
  type("Hastaneye gitmem gerekiyor, dersi veremeyeceğim.");
  fireEvent.click(screen.getByRole("button", { name: "Talebi gönder" }));

  await screen.findByText("Talep gönderilemedi. Lütfen tekrar dene.");
  assert.equal(calls.succeeded, 0);
  assert.equal(calls.closed, 0);
  // The tutor can fix it and try again: the button is live again.
  await waitFor(() =>
    assert.equal(
      (screen.getByRole("button", { name: "Talebi gönder" }) as HTMLButtonElement).disabled,
      false
    )
  );
});

test("cancelling closes without sending", async () => {
  const calls = mount();
  fireEvent.click(screen.getByRole("button", { name: "Vazgeç" }));
  assert.equal(calls.closed, 1);
  assert.equal(sent.length, 0);
});
