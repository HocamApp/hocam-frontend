import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, mock, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Notification } from "@/types/api";

let isMobile = true;
let isAuthenticated = true;
let isLoading = false;
let notifications: Notification[] = [];
const pushed: string[] = [];
const marked: string[] = [];

mock.module("next/navigation", { namedExports: {
  usePathname: () => "/schedule",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: (href: string) => pushed.push(href) }),
} });
mock.module("next/link", { defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={String(href)} {...props}>{children}</a> });
mock.module("@/hooks/useAuth", { namedExports: { useAuth: () => ({ isAuthenticated, isLoading, isTutor: false, isAdmin: false, isImpersonating: false, user: { id: "student-1", role: "student", email: "student@example.com" } }) } });
mock.module("@/hooks/useMediaQuery", { namedExports: { useIsMobile: () => isMobile } });
mock.module("@/hooks/useCoachingFlag", { namedExports: { useCoachingFlag: () => ({ enabled: true }) } });
mock.module("@/hooks/useScheduleFlag", { namedExports: { useScheduleFlag: () => true } });
mock.module("@/hooks/useTutorAcceptanceConfig", { namedExports: { useTutorAcceptanceConfig: () => ({ showPackageRequests: false }) } });
mock.module("@/hooks/usePageVisibility", { namedExports: { usePageVisibility: () => true } });
mock.module("@/components/brand/BrandMark", { namedExports: { BrandMark: () => <span>Hocam</span> } });
mock.module("@/components/profile/ProfileMenu", { namedExports: { ProfileMenu: () => isAuthenticated ? <button aria-label="Profil menüsü">Profil</button> : null } });
mock.module("@/components/profile/StreakIndicator", { namedExports: { StreakIndicator: () => null } });
mock.module("@/components/tutors/AnimatedSearchBar", { namedExports: { AnimatedSearchBar: () => null } });
mock.module("@/components/messaging/MessagesPanel", { namedExports: { MessagesPanel: () => null } });
mock.module("@/lib/notificationsApi", { namedExports: {
  fetchNotificationSummary: async () => ({ has_unread: true, unread_count: 2 }),
  fetchNotifications: async () => notifications,
  markNotificationRead: async (id: string) => { marked.push(id); },
  deleteNotification: async () => {},
} });

let YsNavbar: React.ComponentType;
before(async () => { YsNavbar = (await import("./YsNavbar")).YsNavbar; });
beforeEach(() => {
  isMobile = true;
  isAuthenticated = true;
  isLoading = false;
  notifications = [];
  pushed.length = 0;
  marked.length = 0;
});
afterEach(cleanup);

function renderNavbar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><YsNavbar /></QueryClientProvider>);
}

test("mobile header mounts one notification control immediately before the profile avatar", async () => {
  renderNavbar();
  const header = screen.getByRole("banner");
  // Named in full so the find waits for the summary rather than racing it:
  // the bell mounts before the count is known.
  const bell = await within(header).findByRole("button", { name: "Bildirimler, 2 okunmamış" });
  assert.equal(bell.nextElementSibling, within(header).getByRole("button", { name: "Profil menüsü" }));
  assert.equal(screen.getAllByRole("button", { name: /Bildirimler/ }).length, 1);
  assert.equal(bell.getAttribute("aria-label"), "Bildirimler, 2 okunmamış");
});

test("mobile notifications open downward as a named compact dropdown and dismiss with Escape", async () => {
  renderNavbar();
  fireEvent.click(await within(screen.getByRole("banner")).findByRole("button", { name: /Bildirimler/ }));
  const dropdown = await screen.findByRole("dialog", { name: "Bildirimler" });
  assert.equal(dropdown.getAttribute("data-side"), "bottom");
  assert.ok(await within(dropdown).findByText("Yeni bildirim yok"));
  fireEvent.keyDown(dropdown, { key: "Escape" });
  assert.equal(screen.queryByRole("dialog"), null);
});

test("mobile notification selection hides private message text, marks read, routes and closes", async () => {
  notifications = [{ id: "n-1", type: "message", title: "Deniz sana mesaj gönderdi", body: "PRIVATE MESSAGE", is_read: false, related_object_type: "conversation", related_object_id: "conversation-1", created_at: "2026-09-02T09:00:00Z" }];
  renderNavbar();
  fireEvent.click(await within(screen.getByRole("banner")).findByRole("button", { name: /Bildirimler/ }));
  const item = await screen.findByRole("button", { name: /Deniz sana mesaj gönderdi/ });
  assert.equal(screen.queryByText("PRIVATE MESSAGE"), null);
  fireEvent.click(item);
  assert.deepEqual(pushed, ["/messages/conversation-1"]);
  assert.equal(screen.queryByRole("dialog"), null);
});

test("desktop retains its existing notification cluster and no top-row bell", () => {
  isMobile = false;
  renderNavbar();
  assert.equal(within(screen.getByRole("banner")).queryByRole("button", { name: /Bildirimler/ }), null);
  assert.equal(screen.getAllByRole("button", { name: /Bildirimler/ }).length, 1);
});

test("signed-out and loading headers never expose the mobile notification control", () => {
  isAuthenticated = false;
  const view = renderNavbar();
  assert.equal(screen.queryByRole("button", { name: /Bildirimler/ }), null);
  isAuthenticated = true;
  isLoading = true;
  view.rerender(<QueryClientProvider client={new QueryClient()}><YsNavbar /></QueryClientProvider>);
  assert.equal(screen.queryByRole("button", { name: /Bildirimler/ }), null);
});
