import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";

// No flag mock and no environment variable: with NEXT_PUBLIC_HOCA_BUL_ENABLED
// unset the real module evaluates to false, which is the shipped default this
// file pins down. The enabled case cannot live here — one module mock per
// process — so it has its own file.

const SUBJECT_SEARCH = "subject-search-stub";
const ENTRY_CARD = "hoca-bul-entry-card-stub";

let Home: React.ComponentType | null = null;

function stub(testId: string) {
  const Stub = () => React.createElement("div", { "data-testid": testId });
  Stub.displayName = `Stub(${testId})`;
  return Stub;
}

before(async () => {
  mock.module("@/hooks/useAuth", {
    namedExports: {
      useAuth: () => ({
        user: { id: "student-1", role: "student" },
        isAuthenticated: true,
        isTutor: false,
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
  mock.module("@/lib/questionsApi", {
    namedExports: { fetchQuestionMetadata: async () => ({ enabled: true }) },
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

  // The surrounding sections are stubbed so this file only ever answers "which
  // entry point does the flag select?".
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
  mock.module("@/components/home/HomeGoalCards", {
    namedExports: { HomeGoalCards: stub("goal-cards-stub") },
  });
  mock.module("@/components/home/HomeTopicLinks", {
    namedExports: { HomeTopicLinks: stub("topic-links-stub") },
  });
  mock.module("@/components/home/HomePromoStrip", {
    namedExports: { HomePromoStrip: stub("promo-stub") },
  });

  Home = (await import("./AuthenticatedHome")).AuthenticatedHome;
});

function renderHome() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      {Home ? <Home /> : null}
    </QueryClientProvider>
  );
}

afterEach(() => cleanup());

describe("authenticated home entry point (default configuration)", () => {
  it("keeps the subject search and never reveals the matching card", async () => {
    renderHome();

    assert.ok(await screen.findByTestId(SUBJECT_SEARCH));
    assert.equal(screen.queryByTestId(ENTRY_CARD), null);
  });

  it("leaves the flag itself switched off", async () => {
    const flags = await import("@/lib/featureFlags");
    assert.equal(flags.HOCA_BUL_ENABLED, false);
    assert.equal(flags.MATCHING_FEATURE_ENABLED, false);
  });

  it("leaves the surrounding quick links and continuation band untouched", async () => {
    renderHome();

    assert.ok(await screen.findByRole("link", { name: /Çıkmış sorulara göz at/ }));
    assert.ok(screen.getByRole("link", { name: /Yanlış sorularım/ }));
    assert.ok(
      await screen.findByRole("heading", { name: "Kaldığın yerden devam et" })
    );
  });
});
