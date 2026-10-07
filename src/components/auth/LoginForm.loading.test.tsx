import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

mock.module("next/navigation", {
  namedExports: {
    useRouter: () => ({ push() {}, replace() {} }),
    useSearchParams: () => new URLSearchParams(),
  },
});
mock.module("next/link", {
  defaultExport: React.forwardRef<HTMLAnchorElement, { href: string; children?: React.ReactNode }>(
    function MockLink({ href, children, ...rest }, ref) {
      return React.createElement("a", { href, ref, ...rest }, children);
    }
  ),
});
mock.module("@/hooks/useAuth", {
  namedExports: {
    useAuth: () => ({
      setAuth() {},
      isAuthenticated: false,
      isLoading: true,
      user: null,
    }),
  },
});
mock.module("@/lib/authApi", {
  namedExports: {
    googleAuth: async () => {
      throw new Error("not used");
    },
    loginUser: async () => {
      throw new Error("not used");
    },
  },
});
mock.module("@/components/auth/GoogleSignInButton", {
  namedExports: { GoogleSignInButton: () => <div>Google</div> },
});

afterEach(() => cleanup());

describe("LoginForm while the session is restored", () => {
  it("renders the form instead of a spinner, so the page does not jump", async () => {
    const { LoginForm } = await import("./LoginForm");
    render(<LoginForm />);

    assert.ok(screen.getByPlaceholderText("E-posta adresini gir"));
    assert.ok(screen.getByPlaceholderText("Şifreni gir"));
  });
});
