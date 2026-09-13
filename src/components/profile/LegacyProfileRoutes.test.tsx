import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, mock, test } from "node:test";
import React from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type Role = "student" | "tutor";
type RoutePage = React.ComponentType;

let role: Role = "student";
const replacements: string[] = [];

mock.module("next/navigation", {
  namedExports: {
    useRouter: () => ({ replace: (href: string) => replacements.push(href) }),
  },
});
mock.module("@/hooks/useAuth", {
  namedExports: {
    useAuth: () => ({
      user: { id: `${role}-1`, role },
      isAuthenticated: true,
      isLoading: false,
    }),
  },
});
mock.module("@/components/shared/RouteGuard", {
  namedExports: {
    RouteGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
});
const routeModules = {
  upcoming: () => import("@/app/(main)/profile/lessons/upcoming/page"),
  history: () => import("@/app/(main)/profile/lessons/history/page"),
  pendingReservation: () => import("@/app/(main)/profile/reservations/pending/page"),
  pendingReview: () => import("@/app/(main)/profile/reviews/pending/page"),
  lessonsRoot: () => import("@/app/(main)/profile/lessons/page"),
};

const pages = new Map<keyof typeof routeModules, RoutePage | null>();

before(async () => {
  for (const [name, load] of Object.entries(routeModules)) {
    const loaded = await load().catch(() => null);
    pages.set(name as keyof typeof routeModules, loaded?.default ?? null);
  }
});

beforeEach(() => {
  role = "student";
  replacements.length = 0;
});

afterEach(cleanup);

function mount(name: keyof typeof routeModules) {
  const Page = pages.get(name);
  assert.ok(Page, `${name} legacy route must remain routable`);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><Page /></QueryClientProvider>);
}

for (const route of ["upcoming", "history", "pendingReservation", "lessonsRoot"] as const) {
  test(`${route} sends students directly to their dashboard`, async () => {
    mount(route);
    await waitFor(() => assert.equal(replacements.at(-1), "/dashboard/student"));
  });

  test(`${route} sends tutors directly to the bookings workspace`, async () => {
    role = "tutor";
    mount(route);
    await waitFor(() => assert.equal(replacements.at(-1), "/dashboard/tutor?tab=bookings"));
  });
}

test("pending reviews send students directly to their dashboard", async () => {
  mount("pendingReview");
  await waitFor(() => assert.equal(replacements.at(-1), "/dashboard/student"));
});

test("pending reviews send tutors directly to Panom", async () => {
  role = "tutor";
  mount("pendingReview");
  await waitFor(() => assert.equal(replacements.at(-1), "/dashboard/tutor"));
});
