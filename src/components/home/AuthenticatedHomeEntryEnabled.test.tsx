import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";

// The flag is read from the environment when featureFlags first loads, and a
// module mock cannot be re-registered inside one process — so the enabled case
// lives in its own file, with the variable set before any import happens.
process.env.NEXT_PUBLIC_HOCA_BUL_ENABLED = "true";

const SUBJECT_SEARCH = "subject-search-stub";
const ENTRY_CARD = "hoca-bul-entry-card-stub";
const TUTOR_HOME = "tutor-home-stub";

let Home: React.ComponentType | null = null;
let RoleAwareHome: React.ComponentType | null = null;
let isTutor = false;

function stub(testId: string) {
  const Stub = () => React.createElement("div", { "data-testid": testId });
  Stub.displayName = `Stub(${testId})`;
  return Stub;
}

before(async () => {
  mock.module("@/hooks/useAuth", {
    namedExports: {
      useAuth: () => ({
        user: { id: "student-1", role: isTutor ? "tutor" : "student" },
        isAuthenticated: true,
        isTutor,
        isLoading: false,
      }),
    },
  });
  mock.module("next/link", {
    defaultExport: React.forwardRef<
      HTMLAnchorElement,
      { href: string; children?: React.ReactNode }
    >(function MockLink({ href, children, ...rest }, ref) {
      return React.createElement("a", { href, ref, ...rest }, children);
    }),
  });
  mock.module("@/lib/profileApi", {
    namedExports: { fetchProfileMe: async () => ({ profile: null }) },
  });
  mock.module("@/lib/tutorsApi", {
    namedExports: {
      fetchSubjects: async () => [],
      fetchTutors: async () => ({ results: [], count: 0 }),
    },
  });
  mock.module("@/lib/learningApi", {
    namedExports: {
      fetchLearningDashboard: async () => ({
        goals: [
          {
            id: "goal-1",
            title: "TYT Matematik",
            status: "active",
            progress: 40,
            milestones: [],
          },
        ],
      }),
    },
  });
  mock.module("@/lib/lessonsApi", {
    namedExports: { fetchBookings: async () => [] },
  });
  mock.module("@/lib/paymentsApi", {
    namedExports: { fetchPackagePurchases: async () => [] },
  });
  mock.module("@/lib/homeAnalytics", {
    namedExports: { trackHomeEvent: () => {} },
  });
  mock.module("@/components/payments/PackagePurchaseCard", {
    namedExports: {
      computePackageExpiry: () => null,
      isPastPackage: () => false,
    },
  });

  mock.module("@/components/home/HomeHeroCarousel", {
    namedExports: { HomeHeroCarousel: stub("hero-stub") },
  });
  mock.module("@/components/home/HomeSubjectSearch", {
    namedExports: { HomeSubjectSearch: stub(SUBJECT_SEARCH) },
  });
  mock.module("@/components/home/HocaBulEntryCard", {
    namedExports: { HocaBulEntryCard: stub(ENTRY_CARD) },
  });
  mock.module("@/components/home/HomeExploreCarousel", {
    namedExports: { HomeExploreCarousel: stub("explore-stub") },
  });
  mock.module("@/components/home/HomeTeacherRail", {
    namedExports: { HomeTeacherRail: stub("teacher-rail-stub") },
  });
  mock.module("@/components/home/HomeTabbedDiscovery", {
    namedExports: { HomeTabbedDiscovery: stub("discovery-stub") },
  });
  mock.module("@/components/home/HomeTopicLinks", {
    namedExports: { HomeTopicLinks: stub("topic-links-stub") },
  });
  mock.module("@/components/home/HomePromoStrip", {
    namedExports: { HomePromoStrip: stub("promo-stub") },
  });
  mock.module("@/components/home/TutorAuthenticatedHome", {
    namedExports: { TutorAuthenticatedHome: stub(TUTOR_HOME) },
  });

  Home = (await import("./AuthenticatedHome")).AuthenticatedHome;
  RoleAwareHome = (await import("./RoleAwareHome")).RoleAwareHome;
});

function renderWith(Component: React.ComponentType | null) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      {Component ? <Component /> : null}
    </QueryClientProvider>
  );
}

afterEach(() => {
  cleanup();
  isTutor = false;
});

describe("authenticated home entry point (feature enabled)", () => {
  it("replaces the subject search with the matching card", async () => {
    renderWith(Home);

    assert.ok(await screen.findByTestId(ENTRY_CARD));
    assert.equal(screen.queryByTestId(SUBJECT_SEARCH), null);
  });

  it("turns on only this flow", async () => {
    const flags = await import("@/lib/featureFlags");
    assert.equal(flags.HOCA_BUL_ENABLED, true);
  });

  it("leaves the continuation band untouched", async () => {
    renderWith(Home);

    assert.ok(
      await screen.findByRole("heading", { name: "Kaldığın yerden devam et" })
    );
  });

  it("never shows the student card on the tutor home", async () => {
    isTutor = true;

    renderWith(RoleAwareHome);

    assert.ok(await screen.findByTestId(TUTOR_HOME));
    assert.equal(screen.queryByTestId(ENTRY_CARD), null);
    assert.equal(screen.queryByTestId(SUBJECT_SEARCH), null);
  });
});
