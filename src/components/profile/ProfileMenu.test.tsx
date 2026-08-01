import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// framer-motion's useReducedMotion reads matchMedia, which the shared jsdom
// setup does not provide.
Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

// The accordion sections and Radix Popper observe element sizes; jsdom has no
// layout engine, so a noop observer is enough.
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(globalThis, "ResizeObserver", {
  value: NoopResizeObserver,
  configurable: true,
});
Object.defineProperty(window, "ResizeObserver", {
  value: NoopResizeObserver,
  configurable: true,
});
Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const routerCalls: string[] = [];

let ProfileMenu: React.ComponentType | null = null;

async function loadMenu() {
  if (ProfileMenu) return;

  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({
        push: (href: string) => routerCalls.push(href),
      }),
    },
  });
  mock.module("@/hooks/useAuth", {
    namedExports: {
      useAuth: () => ({
        user: { id: "student-1", role: "student", email: "ogrenci@example.com" },
        isAuthenticated: true,
        isLoading: false,
        logout: () => {},
      }),
    },
  });
  mock.module("@/lib/profileApi", {
    namedExports: {
      fetchProfileMe: async () => ({
        user: { id: "student-1", role: "student", email: "ogrenci@example.com" },
        profile: null,
        stats: undefined,
        preferences: {},
      }),
      updateProfileMe: async () => ({}),
    },
  });
  mock.module("@/lib/tutorsApi", {
    namedExports: {
      fetchMyTutorProfile: async () => null,
    },
  });

  ProfileMenu = (await import("./ProfileMenu")).ProfileMenu;
}

function renderMenu() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Menu = ProfileMenu as React.ComponentType;
  return render(
    <QueryClientProvider client={queryClient}>
      <Menu />
    </QueryClientProvider>
  );
}

beforeEach(async () => {
  await loadMenu();
  routerCalls.length = 0;
});

afterEach(() => {
  cleanup();
});

describe("ProfileMenu güvenlik bölümü", () => {
  it('"Şifre değiştir" satırı /profile/security sayfasına gider', async () => {
    renderMenu();

    fireEvent.click(screen.getByRole("button", { name: "Profil menüsü" }));
    // Accordion content is aria-hidden until its section is expanded.
    fireEvent.click(
      await screen.findByRole("button", { name: "Güvenlik ve Gizlilik" })
    );
    const row = await screen.findByRole("button", { name: "Şifre değiştir" });
    fireEvent.click(row);

    assert.ok(
      routerCalls.includes("/profile/security"),
      `expected navigation to /profile/security, got ${JSON.stringify(routerCalls)}`
    );
    assert.equal(
      routerCalls.includes("/forgot-password"),
      false,
      "must not route password change through the public forgot-password flow"
    );
  });
});
