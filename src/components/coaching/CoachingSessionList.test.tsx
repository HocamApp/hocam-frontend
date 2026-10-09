import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, before, describe, it, mock } from "node:test";
import React, { type ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";

import type { CoachingSessionItem } from "@/lib/coachingApi";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

let sessions: Partial<CoachingSessionItem>[] = [];
let CoachingSessionList: ComponentType;

before(async () => {
  mock.module("@/lib/coachingApi", {
    namedExports: { fetchCoachingSessions: async () => sessions },
  });
  mock.module("@/components/coaching/RescheduleDialog", {
    namedExports: { RescheduleDialog: () => null },
  });
  ({ CoachingSessionList } = await import("./CoachingSessionList"));
});

after(() => window.close());
afterEach(() => {
  cleanup();
  sessions = [];
});

function renderList() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CoachingSessionList />
    </QueryClientProvider>,
  );
}

const past = "2026-01-05T15:00:00Z";
const future = "2099-01-05T15:00:00Z";

describe("CoachingSessionList", () => {
  it("does not offer missing-report support once the report is in", async () => {
    sessions = [
      {
        id: "done",
        scheduled_start: past,
        status: "completed",
        complaint_eligible: false,
        complaint_eligible_at: "2026-01-07T15:30:00Z",
      },
    ];
    renderList();
    await screen.findByText(/1\. görüşme/);
    assert.equal(screen.queryByText(/eksik rapor/i), null);
  });

  it("tells the student when missing-report support opens while the report is pending", async () => {
    sessions = [
      {
        id: "waiting",
        scheduled_start: past,
        status: "awaiting_report",
        complaint_eligible: false,
        complaint_eligible_at: "2026-01-07T15:30:00Z",
      },
    ];
    renderList();
    await screen.findByText(/eksik rapor desteği/i);
  });

  it("keeps cancelled sessions out of the main list until expanded", async () => {
    sessions = [
      { id: "a", scheduled_start: past, status: "completed" },
      { id: "b", scheduled_start: future, status: "cancelled" },
      { id: "c", scheduled_start: "2099-01-12T15:00:00Z", status: "cancelled" },
    ];
    renderList();
    const summary = await screen.findByText(/İptal edilen görüşmeler \(2\)/);
    const details = summary.closest("details");
    assert.ok(details, "cancelled sessions sit in a collapsible group");
    assert.equal(details.open, false);
    assert.equal(details.querySelectorAll("[data-session-row]").length, 2);
  });
});
