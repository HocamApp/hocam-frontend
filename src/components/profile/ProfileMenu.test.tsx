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
let currentRole: "student" | "tutor" = "student";

let ProfileMenu: React.ComponentType | null = null;

const tutorProfile = {
  id: "tutor-profile-1",
  user: "tutor-1",
  name: "Ada",
  surname: "Hoca",
  profile_picture: "",
  intro_video_url: "",
  bio: "Matematik hocası",
  university: "Boğaziçi Üniversitesi",
  department: "Matematik",
  yks_rank: 1,
  hourly_price: 1000,
  rating: 5,
  total_reviews: 10,
  is_verified: true,
  is_public: true,
  teaching_styles: [],
  is_online: false,
  subjects: [],
  created_at: "2026-09-01T00:00:00Z",
};

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
        user: {
          id: currentRole === "tutor" ? "tutor-1" : "student-1",
          role: currentRole,
          email:
            currentRole === "tutor"
              ? "hoca@example.com"
              : "ogrenci@example.com",
        },
        isAuthenticated: true,
        isTutor: currentRole === "tutor",
        isLoading: false,
        logout: () => {},
      }),
    },
  });
  mock.module("@/lib/profileApi", {
    namedExports: {
      fetchProfileMe: async () => ({
        user: {
          id: currentRole === "tutor" ? "tutor-1" : "student-1",
          role: currentRole,
          email:
            currentRole === "tutor"
              ? "hoca@example.com"
              : "ogrenci@example.com",
        },
        profile: currentRole === "tutor" ? tutorProfile : null,
        stats: undefined,
        preferences: {},
      }),
      updateProfileMe: async () => ({}),
    },
  });
  mock.module("@/lib/tutorsApi", {
    namedExports: {
      fetchMyTutorProfile: async () =>
        currentRole === "tutor" ? tutorProfile : null,
      pauseTutorProfile: async () => ({ detail: "ok" }),
      resumeTutorProfile: async () => ({ detail: "ok" }),
    },
  });

  const menuModule = await import("./ProfileMenu");
  ProfileMenu = menuModule.ProfileMenu;
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
  currentRole = "student";
  routerCalls.length = 0;
});

afterEach(() => {
  cleanup();
});

describe("ProfileMenu ders navigasyonu", () => {
  it("hoca menüsünde eski ders akordiyonunu ve profil ders bağlantısını göstermez", async () => {
    currentRole = "tutor";
    renderMenu();

    fireEvent.click(screen.getByRole("button", { name: "Profil menüsü" }));
    await screen.findByRole("button", { name: "Profil Detayları" });

    const legacyAccordion = screen.queryByRole("button", {
      name: "Dersler ve Rezervasyonlar",
    });
    const legacyLessonRow = screen.queryByRole("button", { name: "Derslerim" });
    const legacyHref = document.querySelector(
      'a[href="/profile/lessons/upcoming"]',
    );
    fireEvent.click(screen.getByRole("button", { name: "Profil menüsü" }));

    assert.equal(legacyAccordion, null);
    assert.equal(legacyLessonRow, null);
    assert.equal(legacyHref, null);
  });
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
