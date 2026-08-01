import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

type ResetRequest = { email: string };

let requestImpl: (data: ResetRequest) => Promise<unknown> = async () => undefined;
const requestCalls: ResetRequest[] = [];

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

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
  mock.module("@/lib/authApi", {
    namedExports: {
      requestPasswordReset: (data: ResetRequest) => {
        requestCalls.push(data);
        return requestImpl(data);
      },
    },
  });

  Page = (await import("./page")).default;
}

function renderPage() {
  const Component = Page as React.ComponentType;
  return render(<Component />);
}

function emailInput() {
  return screen.getByLabelText("E-posta adresi") as HTMLInputElement;
}

function submitButton() {
  return screen.getByRole("button", {
    name: "Sıfırlama bağlantısı gönder",
  }) as HTMLButtonElement;
}

function fillEmail(value: string) {
  fireEvent.change(emailInput(), { target: { value } });
}

beforeEach(async () => {
  await loadPage();
  requestCalls.length = 0;
  requestImpl = async () => undefined;
});

afterEach(() => {
  cleanup();
});

describe("forgot-password form", () => {
  it("rejects an invalid e-mail format with a safe inline message", async () => {
    renderPage();

    fillEmail("gecersiz-adres");
    fireEvent.click(submitButton());

    const alert = await screen.findByRole("alert");
    assert.equal(alert.textContent, "Geçerli bir e-posta adresi gir.");
    assert.equal(requestCalls.length, 0, "API must not be called for invalid input");
  });

  it("trims the e-mail before sending it to the API", async () => {
    renderPage();

    fillEmail("   kisi@example.com   ");
    fireEvent.click(submitButton());

    await screen.findByRole("heading", { name: "E-postanı kontrol et" });
    assert.deepEqual(requestCalls, [{ email: "kisi@example.com" }]);
  });

  it("disables the submit button and shows the spinner while submitting", async () => {
    const pending = deferred<unknown>();
    requestImpl = () => pending.promise;
    renderPage();

    fillEmail("kisi@example.com");
    fireEvent.click(submitButton());

    const submitting = (await screen.findByRole("button", {
      name: /Gönderiliyor/,
    })) as HTMLButtonElement;
    assert.equal(submitting.disabled, true);

    await act(async () => {
      pending.resolve(undefined);
    });
    await screen.findByRole("heading", { name: "E-postanı kontrol et" });
  });

  it("sends only one request on a double submit", async () => {
    const pending = deferred<unknown>();
    requestImpl = () => pending.promise;
    renderPage();

    fillEmail("kisi@example.com");
    const button = submitButton();
    fireEvent.click(button);
    fireEvent.click(button);

    await act(async () => {
      pending.resolve(undefined);
    });
    await screen.findByRole("heading", { name: "E-postanı kontrol et" });
    assert.equal(requestCalls.length, 1);
  });

  it("maps HTTP 429 to a rate-limit message", async () => {
    requestImpl = async () => {
      // eslint-disable-next-line no-throw-literal
      throw {
        isAxiosError: true,
        response: { status: 429, data: { detail: "GIZLI-DETAY-429" } },
      };
    };
    renderPage();

    fillEmail("kisi@example.com");
    fireEvent.click(submitButton());

    const alert = await screen.findByRole("alert");
    assert.equal(
      alert.textContent,
      "Çok fazla deneme yapıldı. Lütfen bir süre sonra tekrar dene."
    );
    assert.equal(
      document.body.textContent?.includes("GIZLI-DETAY-429"),
      false,
      "backend detail must never be rendered"
    );
    assert.equal(
      screen.queryByRole("heading", { name: "E-postanı kontrol et" }),
      null,
      "success state must not appear on failure"
    );
  });

  it("maps network errors to a generic message", async () => {
    requestImpl = async () => {
      throw new Error("Network Error");
    };
    renderPage();

    fillEmail("kisi@example.com");
    fireEvent.click(submitButton());

    const alert = await screen.findByRole("alert");
    assert.equal(
      alert.textContent,
      "Bir sorun oluştu. Lütfen biraz sonra tekrar dene."
    );
  });

  it("maps 5xx responses to the same generic message", async () => {
    requestImpl = async () => {
      // eslint-disable-next-line no-throw-literal
      throw { isAxiosError: true, response: { status: 500, data: {} } };
    };
    renderPage();

    fillEmail("kisi@example.com");
    fireEvent.click(submitButton());

    const alert = await screen.findByRole("alert");
    assert.equal(
      alert.textContent,
      "Bir sorun oluştu. Lütfen biraz sonra tekrar dene."
    );
  });
});

describe("forgot-password success state", () => {
  async function reachSuccessState(email = "kisi@example.com") {
    renderPage();
    fillEmail(email);
    fireEvent.click(submitButton());
    return screen.findByRole("heading", { name: "E-postanı kontrol et" });
  }

  it("renders the generic success copy and moves focus to the heading", async () => {
    const heading = await reachSuccessState();

    assert.ok(
      screen.getByText(
        "Bu e-posta adresiyle eşleşen bir hesap varsa, şifre sıfırlama bağlantısını gönderdik. Gelen kutunu ve spam klasörünü kontrol et."
      )
    );
    assert.equal(
      document.activeElement,
      heading,
      "focus must move to the success heading"
    );
    assert.equal(screen.queryByLabelText("E-posta adresi"), null);
  });

  it("offers change-email, resend and back-to-login actions", async () => {
    await reachSuccessState();

    assert.ok(
      screen.getByRole("button", { name: "E-posta adresini değiştir" })
    );
    assert.ok(screen.getByRole("button", { name: /Tekrar gönder \(60\)/ }));
    const loginLink = screen.getByRole("link", { name: "Girişe dön" });
    assert.equal(loginLink.getAttribute("href"), "/login");
  });

  it("keeps resend disabled during the 60s cooldown and blocks extra calls", async () => {
    await reachSuccessState();

    const resend = screen.getByRole("button", {
      name: /Tekrar gönder \(60\)/,
    }) as HTMLButtonElement;
    assert.equal(resend.disabled, true, "resend must be disabled right after sending");

    fireEvent.click(resend);
    assert.equal(
      requestCalls.length,
      1,
      "no resend request may fire while the cooldown is active"
    );
  });

  it("reopens the form with the previous e-mail preserved", async () => {
    await reachSuccessState("onceki@example.com");

    fireEvent.click(
      screen.getByRole("button", { name: "E-posta adresini değiştir" })
    );

    assert.equal(emailInput().value, "onceki@example.com");
    assert.ok(submitButton(), "the submit form must be back");
  });

  it("never renders a backend detail string from a successful response", async () => {
    requestImpl = async () => "GIZLI-BASARI-DETAY";
    await reachSuccessState();

    assert.equal(
      document.body.textContent?.includes("GIZLI-BASARI-DETAY"),
      false,
      "backend detail must never be rendered"
    );
  });
});
