import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, test, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

mock.module("next/navigation", {
  namedExports: {
    usePathname: () => "/",
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

function renderMobileTabBar() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MobileTabBar />
    </QueryClientProvider>,
  );
}

test("student mobile navigation exposes five distinct primary destinations across the full bar", () => {
  renderMobileTabBar();

  const nav = screen.getByRole("navigation", { name: "Mobil ana menü" });
  assert.equal(nav.children.length, 5);
  assert.equal(
    (nav as HTMLElement).style.gridTemplateColumns,
    "repeat(5, minmax(0, 1fr))",
  );

  assert.deepEqual(
    Array.from(nav.children).map((item) => item.getAttribute("aria-label")),
    ["Hocalar", "Panelim", "Mesajlar", "Bildirimler", "Daha Fazla"],
  );
  assert.equal(screen.queryByRole("link", { name: "Ana Sayfa" }), null);
  assert.equal(screen.getByRole("link", { name: "Hocalar" }).getAttribute("href"), "/");
});

test("student mobile navigation uses filled active icons and regular inactive icons", () => {
  renderMobileTabBar();

  assert.equal(
    screen
      .getByRole("link", { name: "Hocalar" })
      .querySelector("svg")
      ?.getAttribute("data-icon-weight"),
    "fill",
  );
  assert.equal(
    screen
      .getByRole("link", { name: "Panelim" })
      .querySelector("svg")
      ?.getAttribute("data-icon-weight"),
    "regular",
  );
});

test("Daha Fazla opens secondary student destinations in a bottom sheet", () => {
  renderMobileTabBar();

  fireEvent.click(screen.getByRole("button", { name: "Daha Fazla" }));

  const sheet = screen.getByRole("dialog", { name: "Daha Fazla" });
  assert.ok(within(sheet).getByRole("link", { name: "Çalışma Programım" }));
  assert.ok(within(sheet).getByRole("link", { name: "Favoriler" }));
  assert.equal(within(sheet).queryByRole("link", { name: "Panelim" }), null);
});
