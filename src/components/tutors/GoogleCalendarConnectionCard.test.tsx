import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import {
  DISCONNECT_CONFIRMATION,
  GoogleCalendarConnectionCardView,
} from "./GoogleCalendarConnectionCard";
import type { GoogleCalendarConnection } from "@/types/api";

const connected: GoogleCalendarConnection = {
  status: "connected",
  account_email: "hoca@example.com",
  calendar_name: "Hocam Dersleri",
  connected_at: "2026-08-01T10:00:00Z",
  last_error: "",
};

const noop = () => {};

function renderCard(
  overrides: Partial<React.ComponentProps<typeof GoogleCalendarConnectionCardView>> = {}
) {
  return render(
    <GoogleCalendarConnectionCardView
      connection={null}
      isLoading={false}
      isError={false}
      isConnecting={false}
      isDisconnecting={false}
      isConfirmingDisconnect={false}
      onRetry={noop}
      onConnect={noop}
      onRequestDisconnect={noop}
      onCancelDisconnect={noop}
      onConfirmDisconnect={noop}
      {...overrides}
    />
  );
}

after(() => window.close());
afterEach(cleanup);

describe("GoogleCalendarConnectionCardView", () => {
  it("renders the loading state", () => {
    renderCard({ isLoading: true });

    assert.ok(screen.getByTestId("google-calendar-loading"));
  });

  it("offers a retry when the status cannot be loaded", () => {
    const retries: number[] = [];
    renderCard({ isError: true, onRetry: () => retries.push(1) });

    fireEvent.click(screen.getByRole("button", { name: "Yeniden dene" }));

    assert.equal(retries.length, 1);
  });

  it("shows a connect call to action while disconnected", () => {
    const connects: number[] = [];
    renderCard({
      connection: { ...connected, status: "disconnected", account_email: null },
      onConnect: () => connects.push(1),
    });

    fireEvent.click(screen.getByRole("button", { name: "Google Calendar'a bağla" }));

    assert.equal(connects.length, 1);
    assert.equal(screen.queryByRole("button", { name: "Bağlantıyı kes" }), null);
  });

  it("shows the connected account and calendar to the owner", () => {
    renderCard({ connection: connected });

    assert.ok(screen.getByText("hoc***@example.com · Hocam Dersleri"));
    assert.ok(screen.getByRole("button", { name: "Bağlantıyı kes" }));
  });

  it("never prints the full connected address", () => {
    renderCard({
      connection: { ...connected, account_email: "officialardaguner@gmail.com" },
    });

    assert.ok(screen.getByText("off***@gmail.com · Hocam Dersleri"));
    assert.equal(screen.queryByText(/officialardaguner@gmail\.com/), null);
    assert.equal(screen.queryByText(/ardaguner/), null);
  });

  it("keeps short local parts readable", () => {
    renderCard({ connection: { ...connected, account_email: "ab@gmail.com" } });

    assert.ok(screen.getByText("ab***@gmail.com · Hocam Dersleri"));
  });

  it("falls back to the calendar name for a malformed address", () => {
    renderCard({ connection: { ...connected, account_email: "not-an-email" } });

    assert.ok(screen.getByText("Hocam Dersleri"));
    assert.equal(screen.queryByText(/not-an-email/), null);
    // The disconnect control must survive the fallback.
    assert.ok(screen.getByRole("button", { name: "Bağlantıyı kes" }));
  });

  it("falls back to the calendar name when the API sends no address", () => {
    renderCard({ connection: { ...connected, account_email: null } });

    assert.ok(screen.getByText("Hocam Dersleri"));
    assert.ok(screen.getByRole("button", { name: "Bağlantıyı kes" }));
  });

  it("asks to reconnect when reauthorization is required", () => {
    const connects: number[] = [];
    renderCard({
      connection: { ...connected, status: "reauthorization_required" },
      onConnect: () => connects.push(1),
    });

    fireEvent.click(screen.getByRole("button", { name: "Yeniden bağla" }));

    assert.equal(connects.length, 1);
  });

  it("marks the connect button busy while redirecting", () => {
    renderCard({
      connection: { ...connected, status: "disconnected", account_email: null },
      isConnecting: true,
    });

    const button = screen.getByRole("button", { name: "Yönlendiriliyor…" });
    assert.equal(button.hasAttribute("disabled"), true);
  });

  it("never disconnects without an explicit confirmation", () => {
    const requested: number[] = [];
    const first = renderCard({
      connection: connected,
      onRequestDisconnect: () => requested.push(1),
    });

    fireEvent.click(screen.getByRole("button", { name: "Bağlantıyı kes" }));
    assert.equal(requested.length, 1);
    assert.equal(screen.queryByTestId("google-calendar-disconnect-confirm"), null);
    first.unmount();

    const confirmed: number[] = [];
    renderCard({
      connection: connected,
      isConfirmingDisconnect: true,
      onConfirmDisconnect: () => confirmed.push(1),
    });

    fireEvent.click(screen.getByRole("button", { name: "Evet, bağlantıyı kes" }));
    assert.equal(confirmed.length, 1);
  });

  it("states that existing Google events are kept", () => {
    renderCard({ connection: connected, isConfirmingDisconnect: true });

    const text = screen.getByTestId("google-calendar-disconnect-confirm").textContent ?? "";
    assert.ok(text.includes(DISCONNECT_CONFIRMATION));
    assert.ok(text.includes("Mevcut etkinlikler Google Calendar'da kalır"));
    assert.ok(text.includes("senkronize edilmez"));
  });

  it("lets the tutor cancel the disconnect", () => {
    const cancelled: number[] = [];
    renderCard({
      connection: connected,
      isConfirmingDisconnect: true,
      onCancelDisconnect: () => cancelled.push(1),
    });

    fireEvent.click(screen.getByRole("button", { name: "Vazgeç" }));

    assert.equal(cancelled.length, 1);
  });

  it("disables both confirmation actions while disconnecting", () => {
    renderCard({
      connection: connected,
      isConfirmingDisconnect: true,
      isDisconnecting: true,
    });

    assert.equal(
      screen.getByRole("button", { name: "Kesiliyor…" }).hasAttribute("disabled"),
      true
    );
    assert.equal(
      screen.getByRole("button", { name: "Vazgeç" }).hasAttribute("disabled"),
      true
    );
  });

  it("never exposes tokens, calendar ids, or raw errors", () => {
    renderCard({
      connection: {
        ...connected,
        last_error: "calendar_id=hocam-calendar-id token=refresh-token-secret",
      },
    });

    const text = document.body.textContent ?? "";
    assert.equal(text.includes("refresh-token-secret"), false);
    assert.equal(text.includes("hocam-calendar-id"), false);
    assert.equal(text.includes("scope"), false);
  });
});
