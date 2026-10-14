import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { paidPurchase } from "@/test/refundFixtures";
import type { PackagePurchase } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

/**
 * The page and the real flow together. Placing the credits makes the server
 * answer `remaining_credits: 0` on the next read of the package list, and the
 * page asks again the moment the flow succeeds. The student must still be
 * shown what was placed, not "Paket bulunamadı".
 */

const SUBJECTS = [{ id: 7, name: "Matematik", exam_type: "TYT" }];
let search = "purchase=purchase-1";
let stored: () => PackagePurchase;
let placedResult: () => unknown;
let listReads = 0;
let Page: React.ComponentType;

function unplaced(remaining: number): PackagePurchase {
  return paidPurchase({
    remaining_credits: remaining,
    tutor: { id: "tutor-1", name: "Ada", surname: "Lovelace", subjects: SUBJECTS as never },
  });
}

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({ push() {}, replace() {}, back() {} }),
      usePathname: () => "/profile/payments/place",
      useSearchParams: () => new URLSearchParams(search),
    },
  });
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("@/hooks/useAuth", {
    namedExports: {
      useAuth: () => ({
        user: { id: "student-1", role: "student", email: "deniz@example.com" },
        isAuthenticated: true,
        isStudent: true,
        isTutor: false,
        isAdmin: false,
        isImpersonating: false,
        isLoading: false,
      }),
    },
  });
  mock.module("@/components/lessons/RecurringLessonSlotPicker", {
    namedExports: {
      RecurringLessonSlotPicker: (props: Record<string, unknown>) => (
        <button
          type="button"
          onClick={() => (props.onChange as (v: unknown[]) => void)([{ day_of_week: 1, start_time: "10:00" }])}
        >
          Salı 10:00
        </button>
      ),
    },
  });
  mock.module("@/lib/tutorsApi", { namedExports: { fetchTutorById: async () => ({ subjects: SUBJECTS }) } });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/payments/package-purchases/") {
          listReads += 1;
          return { data: [stored()] };
        }
        throw new Error(`unexpected GET ${url}`);
      },
      post: async () => placedResult(),
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  search = "purchase=purchase-1";
  listReads = 0;
  stored = () => unplaced(4);
  placedResult = () => {
    // The lessons are written; from now on the list says nothing is left.
    stored = () => unplaced(0);
    return Promise.resolve({
      data: { placed: 4, lessons: [], remaining_credits: 0, skipped_after_term: 0, not_stored: 0 },
    });
  };
});

afterEach(cleanup);

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>
  );
}

describe("placing every credit of a package", () => {
  it("keeps showing what was placed after the package list says nothing is left", async () => {
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: "Salı 10:00" }));
    fireEvent.click(screen.getByRole("button", { name: "Salı 10:00" }));
    fireEvent.click(screen.getByRole("button", { name: "Hakları yerleştir" }));

    await waitFor(() => screen.getByText("4 ders takvimine eklendi."));
    // Let the refetch the success triggers land.
    await waitFor(() => assert.ok(listReads >= 2, "the package list is read again after the success"));
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(screen.getByText("4 ders takvimine eklendi."), "the summary is still there");
    assert.ok(screen.getByText("Bütün haklarını yerleştirdin."));
    assert.ok(!screen.queryByText("Paket bulunamadı"), "no 'package not found' over the success");
    assert.equal(screen.getByRole("link", { name: "Derslerimi gör" }).getAttribute("href"), "/dashboard/student");
  });

  it("still says 'Paket bulunamadı' when the student opens a package with nothing left to place", async () => {
    stored = () => unplaced(0);
    renderPage();
    await waitFor(() => screen.getByText("Paket bulunamadı"));
  });
});
