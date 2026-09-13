import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, mock, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";

let StudentCoachingOverviewPage: React.ComponentType;
let StudentCoachingProgramPage: React.ComponentType;
let CoachingSummarySection: React.ComponentType;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>{children}</a>
    ),
  });
  mock.module("next/navigation", {
    namedExports: { useRouter: () => ({ push: () => {} }) },
  });
  mock.module("@/hooks/useAuth", {
    namedExports: {
      useAuth: () => ({
        isAuthenticated: true,
        isLoading: false,
        isStudent: true,
        isTutor: false,
        isAdmin: false,
        isImpersonating: false,
      }),
    },
  });
  mock.module("@/hooks/useCoachingFlag", {
    namedExports: { useCoachingFlag: () => ({ enabled: true }) },
  });
  mock.module("@/lib/coachingApi", {
    namedExports: {
      COACHING_FAZ6_QUERY_KEYS: { program: (id: string) => ["coaching-program", id] },
      coachingServiceStatusLabel: () => "Aktif",
      extractCoachingErrorMessage: () => "Koçluk verisi yüklenemedi",
      fetchCoachingProgram: async () => null,
      fetchCoachingSchedulingState: async () => ({
        service_period_id: "period-1",
        service_status: "active",
      }),
      fetchCoachingSessions: async () => [],
    },
  });

  StudentCoachingOverviewPage = (await import("@/app/(main)/dashboard/student/coaching/page")).default;
  StudentCoachingProgramPage = (await import("@/app/(main)/dashboard/student/coaching/program/page")).default;
  CoachingSummarySection = (await import("@/components/dashboard/CoachingSummarySection")).CoachingSummarySection;
});

afterEach(cleanup);

function renderWithQueryClient(node: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

test("student coaching overview names the workspace and both program entries consistently", async () => {
  renderWithQueryClient(<StudentCoachingOverviewPage />);

  // The overview is the coaching workspace; "Koçluk Programım" names only the
  // program inside it, so the two pages never share a heading.
  assert.ok(screen.getByRole("heading", { level: 1, name: "Çalışma koçluğum" }));
  const subnav = screen.getByRole("navigation", { name: "Koçluk bölümleri" });
  assert.equal(
    within(subnav).getByRole("link", { name: "Koçluk Programım" }).getAttribute("href"),
    "/dashboard/student/coaching/program",
  );
  await waitFor(() => {
    assert.equal(screen.getAllByRole("link", { name: "Koçluk Programım" }).length, 2);
  });
});

test("student coaching program page does not borrow the study schedule name", () => {
  renderWithQueryClient(<StudentCoachingProgramPage />);

  assert.ok(screen.getByRole("heading", { level: 1, name: "Koçluk Programım" }));
  assert.equal(screen.queryByRole("heading", { name: "Çalışma Programım" }), null);
});

test("student dashboard coaching card opens the coaching workspace, not the program", async () => {
  renderWithQueryClient(<CoachingSummarySection />);

  assert.ok(await screen.findByText("Çalışma koçluğun"));
  assert.equal(
    screen.getByRole("link", { name: "Koçluğu aç" }).getAttribute("href"),
    "/dashboard/student/coaching",
  );
});
