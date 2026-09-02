import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, test, mock } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

mock.module("next/navigation", {
  namedExports: {
    usePathname: () => "/home",
    useSearchParams: () => new URLSearchParams(),
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
      isAuthenticated: true,
      isTutor: false,
      isLoading: false,
    }),
  },
});

mock.module("@/hooks/useCoachingFlag", {
  namedExports: { useCoachingFlag: () => ({ enabled: false }) },
});
mock.module("@/hooks/useScheduleFlag", {
  namedExports: { useScheduleFlag: () => true },
});
mock.module("@/hooks/useTutorAcceptanceConfig", {
  namedExports: {
    useTutorAcceptanceConfig: () => ({ showPackageRequests: false }),
  },
});
mock.module("@/hooks/usePageVisibility", {
  namedExports: { usePageVisibility: () => true },
});
mock.module("@/lib/notificationsApi", {
  namedExports: {
    fetchNotificationSummary: async () => ({ unread_count: 0 }),
  },
});

let MobileTabBar: React.ComponentType;

before(async () => {
  MobileTabBar = (await import("./MobileTabBar")).MobileTabBar;
});

afterEach(() => cleanup());

test("student mobile navigation distributes its five visible items across the full bar", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MobileTabBar />
    </QueryClientProvider>,
  );

  const nav = screen.getByRole("navigation", { name: "Mobil ana menü" });
  assert.equal(nav.children.length, 5);
  assert.equal(
    (nav as HTMLElement).style.gridTemplateColumns,
    "repeat(5, minmax(0, 1fr))",
  );
});
