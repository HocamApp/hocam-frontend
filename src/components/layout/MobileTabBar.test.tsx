import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, test, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

let pathname = "/";
let isTutor = false;
let isAuthenticated = true;
let scheduleEnabled = true;
let coachingEnabled = false;
let showPackageRequests = false;
let isMobile = true;

beforeEach(() => {
  pathname = "/";
  isTutor = false;
  isAuthenticated = true;
  scheduleEnabled = true;
  coachingEnabled = false;
  showPackageRequests = false;
  isMobile = true;
});

mock.module("next/navigation", {
  namedExports: {
    usePathname: () => pathname,
    useSearchParams: () => new URLSearchParams(),
  },
});

mock.module("next/link", {
  defaultExport: ({ href, children, onClick, ...props }: React.ComponentProps<"a">) => (
    <a href={String(href)} {...props} onClick={(event) => { event.preventDefault(); onClick?.(event); }}>
      {children}
    </a>
  ),
});

mock.module("@/hooks/useAuth", {
  namedExports: {
    useAuth: () => ({
      isAuthenticated,
      isTutor,
      isLoading: false,
    }),
  },
});

mock.module("@/hooks/useCoachingFlag", {
  namedExports: { useCoachingFlag: () => ({ enabled: coachingEnabled }) },
});
mock.module("@/hooks/useScheduleFlag", {
  namedExports: { useScheduleFlag: () => scheduleEnabled },
});
mock.module("@/hooks/useTutorAcceptanceConfig", {
  namedExports: {
    useTutorAcceptanceConfig: () => ({ showPackageRequests }),
  },
});
mock.module("@/hooks/usePageVisibility", {
  namedExports: { usePageVisibility: () => true },
});
mock.module("@/hooks/useMediaQuery", {
  namedExports: { useIsMobile: () => isMobile },
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
    ["Hocalar", "Panelim", "Mesajlar", "Çalışma Programım", "Daha Fazla"],
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

test("Daha Fazla keeps coaching and favorites in a right-side drawer, without duplicating the program", () => {
  coachingEnabled = true;
  renderMobileTabBar();

  fireEvent.click(screen.getByRole("button", { name: "Daha Fazla" }));

  const sheet = screen.getByRole("dialog", { name: "Daha Fazla" });
  assert.ok(sheet.classList.contains("right-0"));
  assert.ok(sheet.classList.contains("inset-y-0"));
  assert.equal(within(sheet).queryByRole("link", { name: "Çalışma Programım" }), null);
  assert.ok(within(sheet).getByRole("link", { name: "Koçluk" }));
  assert.ok(within(sheet).getByRole("link", { name: "Favoriler" }));
  assert.equal(within(sheet).queryByRole("link", { name: "Panelim" }), null);
});

test("program is a direct active destination and notifies neither the bar nor More", () => {
  pathname = "/schedule";
  renderMobileTabBar();
  const program = screen.getByRole("link", { name: "Çalışma Programım" });
  assert.equal(program.getAttribute("href"), "/schedule");
  assert.equal(program.getAttribute("aria-current"), "page");
  assert.equal(program.textContent, "Programım");
  assert.equal(screen.getByRole("button", { name: "Daha Fazla" }).getAttribute("aria-current"), null);
  assert.equal(screen.queryByRole("button", { name: "Bildirimler" }), null);
});

test("disabled study schedule preserves five slots without exposing the guarded route", () => {
  scheduleEnabled = false;
  renderMobileTabBar();
  assert.equal(screen.queryByRole("link", { name: "Çalışma Programım" }), null);
  assert.equal(screen.getByRole("navigation").children.length, 5);
  assert.ok(screen.getByRole("link", { name: "Favoriler" }));
});

test("tutor navigation preserves package requests instead of exposing student schedule", () => {
  isTutor = true;
  showPackageRequests = true;
  renderMobileTabBar();
  assert.equal(screen.queryByRole("link", { name: "Çalışma Programım" }), null);
  assert.equal(screen.getByRole("link", { name: "Paket Talepleri" }).getAttribute("href"), "/dashboard/tutor/requests");
  assert.equal(screen.getByRole("navigation").children.length, 5);
});

test("choosing a secondary route dismisses the drawer", () => {
  renderMobileTabBar();
  fireEvent.click(screen.getByRole("button", { name: "Daha Fazla" }));
  fireEvent.click(screen.getByRole("link", { name: "Favoriler" }));
  assert.equal(screen.queryByRole("dialog"), null);
});

test("signed-out users do not receive authenticated bottom navigation", () => {
  isAuthenticated = false;
  renderMobileTabBar();
  assert.equal(screen.queryByRole("navigation"), null);
});

test("a drawer opened on mobile unmounts when crossing the desktop breakpoint", () => {
  const view = renderMobileTabBar();
  fireEvent.click(screen.getByRole("button", { name: "Daha Fazla" }));
  assert.ok(screen.getByRole("dialog"));
  isMobile = false;
  view.rerender(<QueryClientProvider client={new QueryClient()}><MobileTabBar /></QueryClientProvider>);
  assert.equal(screen.queryByRole("dialog"), null);
});
