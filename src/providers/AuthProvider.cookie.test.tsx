import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Cookies from "js-cookie";

import type { User } from "@/types";

const user: User = {
  id: "user-1",
  email: "cookie@example.com",
  role: "student",
  tutor_profile_id: null,
  is_email_verified: true,
  is_admin: false,
  is_test_account: false,
  jitsi_tutorial_completed: true,
  jitsi_tutorial_grandfathered: false,
  impersonation: null,
};

const migrations: string[] = [];

mock.module("@/lib/api", {
  defaultExport: {},
  namedExports: {
    IMPERSONATION_ENDED_EVENT: "hocam:impersonation-ended",
    migrateLegacyAuthToken: async (token: string) => {
      migrations.push(token);
      return { data: { user, auth_mode: "dual" } };
    },
  },
});

mock.module("@/lib/authApi", {
  namedExports: { fetchMe: async () => user },
});

mock.module("@/lib/queryClient", {
  namedExports: { queryClient: { clear() {} } },
});

let AuthProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
let useAuthContext: (() => {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token?: string) => void;
  isLoading: boolean;
}) | null = null;

async function loadProvider() {
  if (!AuthProvider || !useAuthContext) {
    const providerModule = await import("./AuthProvider");
    AuthProvider = providerModule.AuthProvider;
    useAuthContext = providerModule.useAuthContext;
  }
}

function Probe() {
  const auth = (useAuthContext as NonNullable<typeof useAuthContext>)();
  return (
    <div>
      <span data-testid="token">{auth.token ?? "none"}</span>
      <span data-testid="email">{auth.user?.email ?? "none"}</span>
      <span data-testid="loading">{String(auth.isLoading)}</span>
      <button type="button" onClick={() => auth.setAuth(user)}>
        cookie login
      </button>
    </div>
  );
}

function renderProvider() {
  const Provider = AuthProvider as NonNullable<typeof AuthProvider>;
  return render(
    <Provider>
      <Probe />
    </Provider>
  );
}

beforeEach(async () => {
  await loadProvider();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: window.localStorage,
  });
  migrations.length = 0;
  window.localStorage.clear();
  Cookies.remove("auth_token");
});

afterEach(() => cleanup());

describe("AuthProvider HttpOnly cookie mode", () => {
  it("exchanges a legacy token and removes the JavaScript-readable cookie", async () => {
    window.localStorage.setItem("auth_user", JSON.stringify(user));
    Cookies.set("auth_token", "legacy-token");

    renderProvider();

    await waitFor(() => assert.deepEqual(migrations, ["legacy-token"]));
    await waitFor(() =>
      assert.equal(screen.getByTestId("token").textContent, "http-only-cookie")
    );
    assert.equal(screen.getByTestId("email").textContent, user.email);
    assert.equal(Cookies.get("auth_token"), undefined);
  });

  it("accepts a cookie-auth login response without a token in JavaScript", async () => {
    renderProvider();
    await waitFor(() =>
      assert.equal(screen.getByTestId("loading").textContent, "false")
    );

    fireEvent.click(screen.getByRole("button", { name: "cookie login" }));

    assert.equal(screen.getByTestId("token").textContent, "http-only-cookie");
    assert.equal(screen.getByTestId("email").textContent, user.email);
    assert.equal(Cookies.get("auth_token"), undefined);
  });
});
