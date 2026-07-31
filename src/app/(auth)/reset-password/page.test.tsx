import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, beforeEach, describe, it, mock } from "node:test";
import { createRequire } from "node:module";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

// sonner's browser entry expects `self`.
Object.defineProperty(globalThis, "self", { value: window, configurable: true });

type ConfirmRequest = {
  uid: string;
  token: string;
  new_password: string;
  password_confirm: string;
};

let currentSearch = "?uid=U1&token=T1";
let confirmImpl: (data: ConfirmRequest) => Promise<unknown> = async () => undefined;
const confirmCalls: ConfirmRequest[] = [];
const pushCalls: string[] = [];
const toastSuccessCalls: unknown[][] = [];
const replaceStateCalls: unknown[][] = [];

// The page imports sonner's CJS build while the test file resolves the ESM
// build, so a module mock never reaches the page. Spy on the shared CJS
// instance instead.
const require = createRequire(import.meta.url);
const sonnerToast = (require("sonner") as { toast: { success: (...args: unknown[]) => void } }).toast;
const originalToastSuccess = sonnerToast.success;

let Page: React.ComponentType | null = null;

async function loadPage() {
  if (Page) return;

  // next/link needs an App Router context it has no business requiring here.
  mock.module("next/link", {
    defaultExport: React.forwardRef<
      HTMLAnchorElement,
      { href: string; children?: React.ReactNode }
    >(function MockLink({ href, children, ...rest }, ref) {
      return React.createElement("a", { href, ref, ...rest }, children);
    }),
  });
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({ push: (href: string) => pushCalls.push(href) }),
      useSearchParams: () => new URLSearchParams(currentSearch),
    },
  });
  mock.module("@/lib/authApi", {
    namedExports: {
      confirmPasswordReset: (data: ConfirmRequest) => {
        confirmCalls.push(data);
        return confirmImpl(data);
      },
    },
  });
  mock.method(window.history, "replaceState", (...args: unknown[]) => {
    replaceStateCalls.push(args);
  });

  sonnerToast.success = (...args: unknown[]) => {
    toastSuccessCalls.push(args);
  };

  Page = (await import("./page")).default;
}

function renderPage() {
  const Component = Page as React.ComponentType;
  return render(<Component />);
}

function fillPasswords(password: string, confirm = password) {
  fireEvent.change(screen.getByLabelText("Yeni şifre"), {
    target: { value: password },
  });
  fireEvent.change(screen.getByLabelText("Şifre tekrar"), {
    target: { value: confirm },
  });
}

function submitForm() {
  fireEvent.click(screen.getByRole("button", { name: "Şifremi Sıfırla" }));
}

beforeEach(async () => {
  await loadPage();
  currentSearch = "?uid=U1&token=T1";
  confirmCalls.length = 0;
  pushCalls.length = 0;
  toastSuccessCalls.length = 0;
  replaceStateCalls.length = 0;
  confirmImpl = async () => undefined;
});

afterEach(() => {
  cleanup();
});

after(() => {
  sonnerToast.success = originalToastSuccess;
});

describe("reset-password link handling", () => {
  it("scrubs uid/token from the address bar after capturing them", () => {
    renderPage();

    assert.ok(
      replaceStateCalls.some(
        (args) => args[0] === null && args[1] === "" && args[2] === "/"
      ),
      `expected history.replaceState(null, "", "/"), got ${JSON.stringify(replaceStateCalls)}`
    );
    assert.ok(screen.getByLabelText("Yeni şifre"), "form should render for a valid link");
  });

  it("shows the single safe screen when the token is missing", async () => {
    currentSearch = "";
    renderPage();

    assert.ok(
      await screen.findByRole("heading", {
        name: "Bağlantı geçersiz veya süresi dolmuş",
      })
    );
    assert.ok(
      screen.getByText(
        "Bu sıfırlama bağlantısı artık kullanılamıyor. Yeni bir bağlantı isteyebilirsin."
      )
    );
    const restart = screen.getByRole("link", { name: "Yeni bağlantı gönder" });
    assert.equal(restart.getAttribute("href"), "/forgot-password");
    assert.equal(screen.queryByLabelText("Yeni şifre"), null);
    // The query string is scrubbed even when the link is unusable.
    assert.ok(replaceStateCalls.length > 0);
  });

  it("shows the same safe screen when the backend rejects the token", async () => {
    confirmImpl = async () => {
      // eslint-disable-next-line no-throw-literal
      throw {
        isAxiosError: true,
        response: { status: 400, data: { token: ["SECRET-TOKEN-DETAIL"] } },
      };
    };
    renderPage();

    fillPasswords("yeni-sifre-123");
    submitForm();

    assert.ok(
      await screen.findByRole("heading", {
        name: "Bağlantı geçersiz veya süresi dolmuş",
      })
    );
    assert.deepEqual(confirmCalls, [
      {
        uid: "U1",
        token: "T1",
        new_password: "yeni-sifre-123",
        password_confirm: "yeni-sifre-123",
      },
    ]);
    assert.equal(
      document.body.textContent?.includes("SECRET-TOKEN-DETAIL"),
      false,
      "backend detail must never be rendered"
    );
    assert.equal(toastSuccessCalls.length, 0);
    assert.equal(pushCalls.length, 0);
  });
});

describe("reset-password form", () => {
  it("marks password fields and show/hide toggles accessibly", () => {
    renderPage();

    const password = screen.getByLabelText("Yeni şifre") as HTMLInputElement;
    assert.equal(password.getAttribute("autocomplete"), "new-password");
    assert.equal(password.type, "password");

    const confirm = screen.getByLabelText("Şifre tekrar") as HTMLInputElement;
    assert.equal(confirm.getAttribute("autocomplete"), "new-password");
    assert.equal(confirm.type, "password");

    const toggle = screen.getByRole("button", { name: "Şifreyi göster" });
    assert.equal(toggle.getAttribute("aria-pressed"), "false");
    fireEvent.click(toggle);
    assert.equal(password.type, "text");
    assert.equal(
      screen.getByRole("button", { name: "Şifreyi gizle" }).getAttribute("aria-pressed"),
      "true"
    );

    const confirmToggle = screen.getByRole("button", {
      name: "Şifre tekrarını göster",
    });
    assert.equal(confirmToggle.getAttribute("aria-pressed"), "false");
    fireEvent.click(confirmToggle);
    assert.equal(confirm.type, "text");
    assert.equal(
      screen
        .getByRole("button", { name: "Şifre tekrarını gizle" })
        .getAttribute("aria-pressed"),
      "true"
    );
  });

  it("keeps password validation 400s inline with role=alert, not the link screen", async () => {
    confirmImpl = async () => {
      // eslint-disable-next-line no-throw-literal
      throw {
        isAxiosError: true,
        response: { status: 400, data: { new_password: ["Bu şifre çok zayıf."] } },
      };
    };
    renderPage();

    fillPasswords("yeni-sifre-123");
    submitForm();

    const alert = await screen.findByRole("alert");
    assert.equal(alert.textContent, "Bu şifre çok zayıf.");
    assert.equal(
      screen.queryByRole("heading", {
        name: "Bağlantı geçersiz veya süresi dolmuş",
      }),
      null,
      "password errors must not collapse into the invalid-link screen"
    );
    assert.ok(screen.getByLabelText("Yeni şifre"), "form stays visible");
    assert.equal(pushCalls.length, 0);
  });

  it("toasts and routes to /login on success without auto-login", async () => {
    renderPage();

    fillPasswords("yeni-sifre-123");
    submitForm();

    await waitFor(() => {
      assert.ok(pushCalls.includes("/login"));
    });
    assert.equal(toastSuccessCalls.length, 1);
    assert.equal(
      toastSuccessCalls[0]?.[0],
      "Şifren başarıyla yenilendi. Yeni şifrenle giriş yapabilirsin."
    );
  });
});
