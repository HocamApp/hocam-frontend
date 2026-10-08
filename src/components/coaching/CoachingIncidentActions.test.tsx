import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, before, describe, it, mock } from "node:test";
import React, { type ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const calls: string[] = [];
let CoachingIncidentActions: ComponentType<{ sessionId: string; viewerRole: "student" | "tutor" }>;

before(async () => {
  mock.module("sonner", { namedExports: { toast: { success: () => {}, error: () => {} } } });
  mock.module("@/lib/coachingApi", {
    namedExports: {
      reportCoachingSessionNoShow: async (_id: string, party: string) => { calls.push(`no_show:${party}`); },
      reportCoachingSessionTechnicalIssue: async () => { calls.push("technical"); },
      extractCoachingErrorMessage: () => "hata",
      COACHING_SESSION_QUERY_KEYS: {
        detail: (id: string) => ["d", id],
        studentList: () => ["s"],
        tutorList: () => ["t"],
        token: (id: string) => ["k", id],
      },
    },
  });
  ({ CoachingIncidentActions } = await import("./CoachingIncidentActions"));
});

after(() => window.close());
afterEach(() => {
  cleanup();
  calls.length = 0;
});

function renderActions(viewerRole: "student" | "tutor") {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <CoachingIncidentActions sessionId="s1" viewerRole={viewerRole} />
    </QueryClientProvider>,
  );
}

describe("CoachingIncidentActions", () => {
  it("does not report a no-show until the student confirms", async () => {
    renderActions("student");
    fireEvent.click(screen.getByRole("button", { name: "Öğretmen gelmedi" }));
    assert.deepEqual(calls, []);
    assert.ok(screen.getByRole("dialog", { name: '"Öğretmen gelmedi" bildirilsin mi?' }));

    fireEvent.click(screen.getByRole("button", { name: "Bildir" }));
    await waitFor(() => assert.deepEqual(calls, ["no_show:tutor"]));
  });

  it("lets the tutor back out of a technical-issue report", () => {
    renderActions("tutor");
    fireEvent.click(screen.getByRole("button", { name: "Teknik sorun bildir" }));
    fireEvent.click(screen.getByRole("button", { name: "Vazgeç" }));
    assert.deepEqual(calls, []);
  });

  it("speaks Turkish only", () => {
    renderActions("student");
    assert.equal(screen.queryByText(/incident/i), null);
    assert.ok(screen.getByRole("textbox", { name: "Sorun notu" }));
  });
});
