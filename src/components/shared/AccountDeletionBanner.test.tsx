import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// next/link's runtime touches `self`; the shared jsdom setup does not define it.
Object.defineProperty(globalThis, "self", { value: window, configurable: true });

let statusResponse: Record<string, unknown> = { active: false };
let authState: Record<string, unknown> = {
  user: { id: "student-1", role: "student", email: "ogrenci@example.com" },
  isAuthenticated: true,
  isLoading: false,
};
const fetchCalls: number[] = [];

let AccountDeletionBanner: React.ComponentType | null = null;

async function loadBanner() {
  if (AccountDeletionBanner) return;

  mock.module("@/lib/authApi", {
    namedExports: {
      fetchDeletionStatus: async () => {
        fetchCalls.push(1);
        return statusResponse;
      },
    },
  });
  mock.module("@/hooks/useAuth", {
    namedExports: {
      useAuth: () => authState,
    },
  });

  AccountDeletionBanner = (
    await import("./AccountDeletionBanner")
  ).AccountDeletionBanner;
}

function renderBanner() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Banner = AccountDeletionBanner as React.ComponentType;
  return render(
    <QueryClientProvider client={queryClient}>
      <Banner />
    </QueryClientProvider>
  );
}

beforeEach(async () => {
  await loadBanner();
  fetchCalls.length = 0;
  statusResponse = { active: false };
  authState = {
    user: { id: "student-1", role: "student", email: "ogrenci@example.com" },
    isAuthenticated: true,
    isLoading: false,
  };
});

afterEach(() => {
  cleanup();
});

describe("AccountDeletionBanner", () => {
  it("planlanmış silme varken amber bilgi çubuğunu gösterir", async () => {
    statusResponse = {
      active: true,
      id: "del-1",
      role: "student",
      status: "scheduled",
      scheduled_deletion_at: "2026-09-15T00:00:00Z",
    };

    renderBanner();

    await screen.findByText(/Hesabınızın silinmesi planlandı/);
    const link = screen.getByRole("link", {
      name: "Güvenlik ayarlarından yönetin",
    });
    assert.equal(link.getAttribute("href"), "/profile/security");
  });

  it("aktif silme yokken hiçbir şey render etmez", async () => {
    statusResponse = { active: false };

    renderBanner();

    await waitFor(() => assert.ok(fetchCalls.length > 0));
    assert.equal(
      screen.queryByText(/Hesabınızın silinmesi planlandı/),
      null,
      "banner must stay hidden when there is no active deletion"
    );
  });

  it("scheduled dışındaki aktif durumlarda gizli kalır", async () => {
    statusResponse = {
      active: true,
      id: "del-2",
      role: "tutor",
      status: "offboarding",
      scheduled_deletion_at: "2026-09-15T00:00:00Z",
    };

    renderBanner();

    await waitFor(() => assert.ok(fetchCalls.length > 0));
    assert.equal(screen.queryByText(/Hesabınızın silinmesi planlandı/), null);
  });

  it("anonim ziyaretçi için API çağrısı yapmaz", async () => {
    authState = { user: null, isAuthenticated: false, isLoading: false };
    statusResponse = {
      active: true,
      id: "del-3",
      role: "student",
      status: "scheduled",
      scheduled_deletion_at: "2026-09-15T00:00:00Z",
    };

    renderBanner();

    // Give react-query a chance to (wrongly) fire; it must stay silent.
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(
      fetchCalls.length,
      0,
      "banner must not call the status endpoint for anonymous visitors"
    );
    assert.equal(screen.queryByText(/Hesabınızın silinmesi planlandı/), null);
  });

  it("auth yüklenirken API çağrısı yapmaz", async () => {
    authState = { user: null, isAuthenticated: false, isLoading: true };

    renderBanner();

    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(fetchCalls.length, 0);
  });
});
