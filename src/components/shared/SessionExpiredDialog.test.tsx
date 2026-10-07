import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

const SESSION_EXPIRED_EVENT = "hocam:session-expired";
const routerCalls: string[] = [];
let clearAuthCalls = 0;

let SessionExpiredDialog: React.ComponentType;

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({
        push: (href: string) => routerCalls.push(href),
        replace: (href: string) => routerCalls.push(href),
      }),
    },
  });
  mock.module("@/providers/AuthProvider", {
    namedExports: {
      useAuthContext: () => ({ clearAuth: () => { clearAuthCalls += 1; } }),
    },
  });
  mock.module("@/lib/api", {
    namedExports: { SESSION_EXPIRED_EVENT },
  });
  ({ SessionExpiredDialog } = await import("./SessionExpiredDialog"));
});

beforeEach(() => {
  routerCalls.length = 0;
  clearAuthCalls = 0;
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

function expireSessionAt(path: string) {
  window.history.replaceState(null, "", path);
  act(() => {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  });
}

function clickLogin() {
  fireEvent.click(screen.getByRole("button", { name: /Giriş Yap/ }));
}

describe("SessionExpiredDialog", () => {
  it("sends the student back to the payment page they were on", () => {
    render(<SessionExpiredDialog />);
    expireSessionAt("/package-purchases/p-1/pay");

    assert.equal(clearAuthCalls, 1);
    clickLogin();

    assert.deepEqual(routerCalls, ["/login?returnUrl=%2Fpackage-purchases%2Fp-1%2Fpay"]);
  });

  // The pay page and the PayTR return screen redirect to /login themselves as
  // soon as auth is cleared, under the still-open dialog. The button must not
  // replace their returnUrl with one pointing at /login.
  it("remembers where the session expired, not where the page went next", () => {
    render(<SessionExpiredDialog />);
    expireSessionAt("/odeme/basarisiz");
    window.history.replaceState(null, "", "/login?returnUrl=%2Fodeme%2Fbasarisiz");

    clickLogin();

    assert.deepEqual(routerCalls, ["/login?returnUrl=%2Fodeme%2Fbasarisiz"]);
  });

  it("keeps the query string the checkout selection lives in", () => {
    render(<SessionExpiredDialog />);
    expireSessionAt("/tutors/t-1/checkout?plan=w3-d30&context=yks");

    clickLogin();

    assert.deepEqual(routerCalls, [
      "/login?returnUrl=%2Ftutors%2Ft-1%2Fcheckout%3Fplan%3Dw3-d30%26context%3Dyks",
    ]);
  });

  it("does not navigate when the student only closes the dialog", () => {
    render(<SessionExpiredDialog />);
    expireSessionAt("/messages");

    fireEvent.click(screen.getByRole("button", { name: "Kapat" }));

    assert.deepEqual(routerCalls, []);
  });
});
