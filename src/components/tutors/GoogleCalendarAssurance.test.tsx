import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import {
  GOOGLE_CALENDAR_ASSURANCE_TEXT,
  GoogleCalendarAssurance,
} from "./GoogleCalendarAssurance";

after(() => window.close());
afterEach(cleanup);

describe("GoogleCalendarAssurance", () => {
  it("shows one short line when the tutor has an active connection", () => {
    render(<GoogleCalendarAssurance connected />);

    assert.ok(screen.getByTestId("google-calendar-assurance"));
    assert.ok(screen.getByText(GOOGLE_CALENDAR_ASSURANCE_TEXT));
  });

  it("renders nothing when the tutor is not connected", () => {
    const { container } = render(<GoogleCalendarAssurance connected={false} />);

    assert.equal(container.textContent, "");
  });

  it("renders nothing when the flag is absent (visitor, unknown state)", () => {
    const { container } = render(<GoogleCalendarAssurance />);

    assert.equal(container.textContent, "");
  });

  it("exposes no account, calendar, or permission detail", () => {
    render(<GoogleCalendarAssurance connected />);

    const text = document.body.textContent ?? "";
    assert.equal(text.includes("@"), false);
    assert.equal(text.toLowerCase().includes("scope"), false);
    assert.equal(text.toLowerCase().includes("token"), false);
    assert.equal(text.includes("Hocam Dersleri"), false);
    assert.equal(text.includes("Bağlantıyı kes"), false);
  });
  it("never renders management controls for a student or visitor", () => {
    render(<GoogleCalendarAssurance connected />);

    assert.equal(screen.queryByRole("button"), null);
    assert.equal(screen.queryByRole("link"), null);
    const text = document.body.textContent ?? "";
    for (const forbidden of [
      "Bağlantıyı kes",
      "Yeniden bağla",
      "Google Calendar'a bağla",
      "Vazgeç",
    ]) {
      assert.equal(text.includes(forbidden), false, forbidden);
    }
  });

  it("cannot leak a connection payload it is never given", () => {
    // The component's entire input is one boolean: there is no prop through
    // which an e-mail, calendar id, or error could reach a student.
    const props = Object.keys(
      (GoogleCalendarAssurance as unknown as { propTypes?: object }).propTypes ?? {}
    );
    assert.deepEqual(props, []);

    render(<GoogleCalendarAssurance connected />);
    const text = document.body.textContent ?? "";
    for (const forbidden of [
      "hocam-calendar-id",
      "refresh",
      "reauthorization",
      "disconnected",
      "last_error",
    ]) {
      assert.equal(text.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden);
    }
  });

  it("says only that the booking is mirrored, nothing operational", () => {
    render(<GoogleCalendarAssurance connected />);

    const text = screen.getByTestId("google-calendar-assurance").textContent ?? "";
    assert.equal(text.trim(), GOOGLE_CALENDAR_ASSURANCE_TEXT);
    assert.ok(text.length < 120);
  });
});
