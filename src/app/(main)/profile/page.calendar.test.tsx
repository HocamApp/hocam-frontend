import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { GoogleCalendarConnection } from "@/types/api";

/**
 * The "Takvim bağlantıları" section on /profile is the single, shared home
 * of Google Calendar management. These tests prove the one product
 * guarantee that matters: the card renders for EVERY authenticated user —
 * student or tutor, brand-new or years-old account, with a complete tutor
 * profile, an incomplete one, or none at all. Nothing about onboarding
 * state, TutorProfile existence, or the public tutor endpoint may gate it.
 */

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

// next/link's runtime touches `self`; the shared jsdom setup does not define it.
Object.defineProperty(globalThis, "self", { value: window, configurable: true });

type Role = "student" | "tutor";

let currentRole: Role = "student";
let profileMeResponse: Record<string, unknown> = {};
let tutorMeShouldFail = false;
let connectionResponse: GoogleCalendarConnection | null = null;

const connected: GoogleCalendarConnection = {
  status: "connected",
  account_email: "kullanici@example.com",
  calendar_name: "Hocam Dersleri",
  connected_at: "2026-08-01T10:00:00Z",
  last_error: "",
};

const disconnected: GoogleCalendarConnection = {
  status: "disconnected",
  account_email: null,
  calendar_name: "",
  connected_at: null,
  last_error: "",
};

let ProfilePage: React.ComponentType | null = null;

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({ push: () => {}, replace: () => {} }),
      usePathname: () => "/profile",
      useSearchParams: () => new URLSearchParams(""),
    },
  });
  mock.module("@/hooks/useAuth", {
    namedExports: {
      useAuth: () => ({
        user: {
          id: `${currentRole}-1`,
          role: currentRole,
          email: "kullanici@example.com",
        },
        token: "token-1",
        isAuthenticated: true,
        isStudent: currentRole === "student",
        isTutor: currentRole === "tutor",
        isAdmin: false,
        isImpersonating: false,
        isLoading: false,
        logout: () => {},
        setAuth: () => {},
        updateUser: () => {},
      }),
    },
  });
  mock.module("@/lib/profileApi", {
    namedExports: {
      fetchProfileMe: async () => profileMeResponse,
      updateProfileMe: async () => ({}),
      uploadStudentProfileAvatar: async () => ({}),
      selectStudentAnonymousAvatar: async () => ({}),
    },
  });
  mock.module("@/lib/tutorsApi", {
    namedExports: {
      fetchMyTutorProfile: async () => {
        if (tutorMeShouldFail) throw new Error("no tutor profile");
        return { id: "tutor-profile-1", name: "Hoca", surname: "Hocaoğlu" };
      },
      updateMyTutorProfile: async () => ({}),
      uploadTutorProfilePicture: async () => ({}),
    },
  });
  mock.module("@/lib/googleCalendarApi", {
    namedExports: {
      fetchGoogleCalendarConnection: async () => connectionResponse,
      startGoogleCalendarConnection: async () => ({
        authorization_url: "https://accounts.google.com/o/oauth2/auth?x=1",
      }),
      disconnectGoogleCalendar: async () => {},
    },
  });
  // Heavy siblings irrelevant to the calendar section.
  mock.module("@/components/decor/ScribbleLayer", {
    namedExports: { ScribbleLayers: () => null },
  });
  mock.module("@/components/profile/StudentLearningProfile", {
    namedExports: { StudentLearningProfile: () => null },
  });
  mock.module("@/components/profile/TutorVideoSection", {
    namedExports: { TutorVideoSection: () => null },
  });
  mock.module("@/components/profile/AvatarEditor", {
    namedExports: { AvatarEditor: () => null },
  });

  ProfilePage = (await import("./page")).default;
});

function studentProfileMe() {
  return {
    user: { id: "student-1", role: "student", email: "kullanici@example.com" },
    profile: {
      name: "Öğrenci",
      surname: "Öğrencioğlu",
      target_exam_type: "TYT",
      school: "",
      grade: "12",
      avatar_kind: "anonymous",
      avatar_key: "cat",
      avatar_url: "",
    },
    stats: {},
    preferences: {},
  };
}

function tutorProfileMe() {
  return {
    user: { id: "tutor-1", role: "tutor", email: "kullanici@example.com" },
    profile: {
      id: "tutor-profile-1",
      name: "Hoca",
      surname: "Hocaoğlu",
      university: "Boğaziçi",
      department: "Matematik",
      hourly_price: "500",
      auto_approve_bookings: false,
    },
    stats: {},
    preferences: {},
  };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Page = ProfilePage as React.ComponentType;
  return render(
    <QueryClientProvider client={queryClient}>
      <Page />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  currentRole = "student";
  profileMeResponse = studentProfileMe();
  tutorMeShouldFail = false;
  connectionResponse = connected;
});

afterEach(cleanup);

describe("/profile — Takvim bağlantıları bölümü her kullanıcıda görünür", () => {
  it("öğrenci ortak Google Calendar kartını görür", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Takvim bağlantıları" });
    await screen.findByText("kullanici@example.com · Hocam Dersleri");
    assert.ok(screen.getByRole("button", { name: "Bağlantıyı kes" }));
  });

  it("hoca aynı ortak kartı görür", async () => {
    currentRole = "tutor";
    profileMeResponse = tutorProfileMe();
    renderPage();

    await screen.findByRole("heading", { name: "Takvim bağlantıları" });
    await screen.findByText("kullanici@example.com · Hocam Dersleri");
  });

  it("profil kaydı olmayan eski hesap da kartı görür", async () => {
    // Old account: /profile/me resolves but carries no profile row at all.
    profileMeResponse = {
      user: { id: "student-1", role: "student", email: "kullanici@example.com" },
      profile: null,
      stats: {},
      preferences: {},
    };
    renderPage();

    await screen.findByRole("heading", { name: "Takvim bağlantıları" });
    await screen.findByText("kullanici@example.com · Hocam Dersleri");
  });

  it("tutor profili eksik/oluşmamış hoca da kartı görür", async () => {
    // Incomplete tutor: role says tutor, but the TutorProfile row is missing
    // (or onboarding was never finished) and /tutors/me/ 404s. The card must
    // not depend on either endpoint.
    currentRole = "tutor";
    profileMeResponse = {
      user: { id: "tutor-1", role: "tutor", email: "kullanici@example.com" },
      profile: null,
      stats: {},
      preferences: {},
    };
    tutorMeShouldFail = true;
    renderPage();

    await screen.findByRole("heading", { name: "Takvim bağlantıları" });
    await screen.findByText("kullanici@example.com · Hocam Dersleri");
  });

  it("bağlı olmayan kullanıcı bağlantı çağrısını görür", async () => {
    connectionResponse = disconnected;
    renderPage();

    await screen.findByRole("heading", { name: "Takvim bağlantıları" });
    await screen.findByRole("button", { name: "Google Calendar'a bağla" });
    assert.equal(screen.queryByText(/kullanici@example\.com ·/), null);
  });
});
