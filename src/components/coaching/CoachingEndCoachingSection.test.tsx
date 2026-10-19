import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { CoachingStudentRow } from "@/lib/coachingApi";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const pushed: string[] = [];
const posts: { url: string; body: unknown }[] = [];
let students: CoachingStudentRow[] = [];
let CoachingEndCoachingSection: typeof import("./CoachingEndCoachingSection").CoachingEndCoachingSection;

function row(overrides: Partial<CoachingStudentRow>): CoachingStudentRow {
  return {
    purchase_id: "pu-1",
    service_period_id: "sp-1",
    student_name: "Zeynep K.",
    service_status: "active",
    frequency: "weekly",
    recurring_slots: [],
    ...overrides,
  } as CoachingStudentRow;
}

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({ push: (href: string) => pushed.push(href), replace() {}, back() {} }),
    },
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/coaching/students/") return { data: students };
        throw new Error(`unexpected GET ${url}`);
      },
      post: async (url: string, body: unknown) => {
        posts.push({ url, body });
        return { data: { service_status: "cancelled", refund_liability_minor: 0 } };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ CoachingEndCoachingSection } = await import("./CoachingEndCoachingSection"));
});

beforeEach(() => {
  pushed.length = 0;
  posts.length = 0;
  students = [row({}), row({ purchase_id: "pu-2", service_period_id: "sp-2", student_name: "Mert A." })];
});
afterEach(cleanup);

function renderSection(servicePeriodId: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CoachingEndCoachingSection servicePeriodId={servicePeriodId} />
    </QueryClientProvider>
  );
}

describe("CoachingEndCoachingSection", () => {
  it("offers to end this student's coaching, by name, at the foot of their program page", async () => {
    renderSection("sp-2");

    assert.ok(await screen.findByRole("heading", { name: "Koçluğu sonlandır" }));
    assert.ok(screen.getByText(/Mert A\./));
    const button = screen.getByRole("button", { name: "Koçluğu sonlandır" });
    assert.match(button.className, /bg-error/);
  });

  it("ends the right purchase, asks for a reason first, and returns to the student list", async () => {
    renderSection("sp-2");
    fireEvent.click(await screen.findByRole("button", { name: "Koçluğu sonlandır" }));
    const dialog = await screen.findByRole("dialog", { name: "Mert A. ile koçluğu sonlandır" });

    const confirm = within(dialog).getByRole("button", { name: "Koçluğu sonlandır" }) as HTMLButtonElement;
    assert.equal(confirm.disabled, true);
    fireEvent.change(within(dialog).getByLabelText("Sonlandırma gerekçesi"), {
      target: { value: "Müsaitliğim değişti" },
    });
    fireEvent.click(confirm);

    await waitFor(() => assert.equal(posts.length, 1));
    assert.equal(posts[0].url, "/coaching/tutor/purchases/pu-2/terminate/");
    await waitFor(() => assert.deepEqual(pushed, ["/dashboard/tutor/coaching/students"]));
  });

  it("shows nothing for a period that is not one of this tutor's active students", async () => {
    students = [row({ service_status: "cancellation_pending" })];
    const { container } = renderSection("sp-1");

    await waitFor(() => assert.equal(container.textContent, ""));
    assert.equal(screen.queryByRole("heading", { name: "Koçluğu sonlandır" }), null);
  });

  it("shows nothing for an unknown period", async () => {
    const { container } = renderSection("sp-unknown");

    await waitFor(() => assert.equal(container.textContent, ""));
  });
});
