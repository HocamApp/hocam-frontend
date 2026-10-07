import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const terms = {
  code: "terms_of_use",
  version: "2026-09-04",
  url: "/kullanim-kosullari",
};
const notice = {
  code: "general_kvkk_notice",
  version: "v1.1",
  url: "/kvkk/aydinlatma-metni",
  acknowledgement_required: true as const,
  terms,
};
type NoticeConfig = Omit<typeof notice, "terms"> & { terms?: typeof terms };

type RegistrationPayload = Record<string, unknown>;
const registrationCalls: RegistrationPayload[] = [];
const googleCalls: RegistrationPayload[] = [];
let noticeImpl: () => Promise<NoticeConfig> = async () => notice;
let noticeRequests = 0;
let registerError: unknown = null;
const authState = { isLoading: false };

function axios400(data: Record<string, string[]>) {
  return Object.assign(new Error("Request failed with status code 400"), {
    isAxiosError: true,
    response: { status: 400, data },
  });
}

mock.module("next/navigation", {
  namedExports: { useRouter: () => ({ push() {}, replace() {} }) },
});
mock.module("next/link", {
  defaultExport: React.forwardRef<
    HTMLAnchorElement,
    { href: string; prefetch?: boolean; children?: React.ReactNode }
  >(function MockLink({ href, prefetch: _prefetch, children, ...rest }, ref) {
    return React.createElement("a", { href, ref, ...rest }, children);
  }),
});
mock.module("@/hooks/useAuth", {
  namedExports: {
    useAuth: () => ({
      setAuth() {},
      isAuthenticated: false,
      isLoading: authState.isLoading,
      user: null,
    }),
  },
});
mock.module("@/lib/privacyApi", {
  namedExports: {
    fetchRegistrationNotice: () => {
      noticeRequests += 1;
      return noticeImpl();
    },
  },
});
mock.module("@/lib/authApi", {
  namedExports: {
    registerUser: async (payload: RegistrationPayload) => {
      registrationCalls.push(payload);
      if (registerError) throw registerError;
      return {
        requires_verification: true,
        email: String(payload.email),
        challenge_id: "register-challenge-1",
        expires_at: "2099-01-01T00:02:00Z",
        expires_in_seconds: 120,
        resend_available_at: "2099-01-01T00:01:00Z",
      };
    },
    resendRegistrationCode: async () => {
      throw new Error("not used");
    },
    confirmRegistration: async () => {
      throw new Error("not used");
    },
    googleAuth: async (payload: RegistrationPayload) => {
      googleCalls.push(payload);
      return { needs_role: true, email: "google@example.com" };
    },
  },
});
// Stands in for Google's iframe button. Clicking it calls the credential
// handler directly, as a completed Google popup would.
mock.module("@/components/auth/GoogleSignInButton", {
  namedExports: {
    GoogleSignInButton: ({
      onCredential,
    }: {
      onCredential: (credential: string) => void;
    }) => (
      <button type="button" onClick={() => onCredential("google-token")}>
        GIS iframe
      </button>
    ),
  },
});
mock.module("@/components/privacy/LegalDocumentPreview", {
  namedExports: {
    LegalDocumentPreview: ({ url }: { url: string }) => <p>Önizleme: {url}</p>,
  },
});

let RegisterForm: React.ComponentType | null = null;

async function loadRegisterForm() {
  if (!RegisterForm) {
    RegisterForm = (await import("./RegisterForm")).RegisterForm;
  }
}

function renderRegisterForm() {
  const Component = RegisterForm as React.ComponentType;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Component />
    </QueryClientProvider>
  );
}

function fillValidForm() {
  fireEvent.change(screen.getByPlaceholderText("E-posta adresini gir"), {
    target: { value: "student@example.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("Şifreni gir"), {
    target: { value: "Safe-pass-123" },
  });
  fireEvent.change(screen.getByPlaceholderText("Şifreni tekrar gir"), {
    target: { value: "Safe-pass-123" },
  });
}

function termsCheckbox() {
  return screen.getByRole("checkbox", {
    name: "Kullanım Koşulları’nı okudum ve kabul ediyorum.",
  }) as HTMLInputElement;
}

const TERMS_REQUIRED = "Devam etmek için Kullanım Koşulları’nı kabul etmelisin.";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(async () => {
  await loadRegisterForm();
  registrationCalls.length = 0;
  googleCalls.length = 0;
  noticeImpl = async () => notice;
  noticeRequests = 0;
  registerError = null;
  authState.isLoading = false;
});

afterEach(() => cleanup());

describe("registration legal texts", () => {
  it("informs about KVKK without a control and asks for terms with an unticked box", () => {
    renderRegisterForm();

    assert.equal(screen.getAllByRole("checkbox").length, 1);
    assert.equal(termsCheckbox().checked, false);
    assert.equal(termsCheckbox().disabled, false);
    assert.ok(screen.getByText(/Kişisel verilerin/));
    assert.equal(
      screen.getByRole("link", { name: "KVKK Aydınlatma Metni" }).closest("label"),
      null
    );
    assert.equal(
      (screen.getByRole("button", { name: "Kayıt Ol" }) as HTMLButtonElement).disabled,
      false
    );
  });

  it("does not register by email until the terms are accepted", async () => {
    renderRegisterForm();
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Kayıt Ol" }));

    await screen.findByText(TERMS_REQUIRED);
    assert.equal(registrationCalls.length, 0);
    assert.equal(termsCheckbox().getAttribute("aria-invalid"), "true");
    assert.equal(document.activeElement, termsCheckbox());

    fireEvent.click(termsCheckbox());
    assert.equal(screen.queryByText(TERMS_REQUIRED), null);
  });

  it("explains instead of opening Google while the terms box is unticked", async () => {
    renderRegisterForm();

    fireEvent.click(screen.getByRole("button", { name: "Google ile kaydol" }));
    await screen.findByText(TERMS_REQUIRED);

    // A credential that still arrives (keyboard, stale popup) is refused too.
    fireEvent.click(screen.getByRole("button", { name: "GIS iframe" }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(googleCalls.length, 0);

    fireEvent.click(termsCheckbox());
    assert.equal(screen.queryByRole("button", { name: "Google ile kaydol" }), null);
    fireEvent.click(screen.getByRole("button", { name: "GIS iframe" }));

    await waitFor(() => assert.equal(googleCalls.length, 1));
    assert.equal(googleCalls[0].notice_code, notice.code);
    assert.equal(googleCalls[0].notice_acknowledged, true);
    assert.equal(googleCalls[0].terms_code, terms.code);
    assert.equal(googleCalls[0].terms_version, terms.version);
    assert.equal(googleCalls[0].terms_accepted, true);
  });

  it("sends notice and terms evidence with an email registration", async () => {
    renderRegisterForm();
    fillValidForm();
    fireEvent.click(termsCheckbox());
    fireEvent.click(screen.getByRole("button", { name: "Kayıt Ol" }));

    await waitFor(() => assert.equal(registrationCalls.length, 1));
    assert.equal(registrationCalls[0].notice_code, notice.code);
    assert.equal(registrationCalls[0].notice_version, notice.version);
    assert.equal(registrationCalls[0].notice_acknowledged, true);
    assert.equal(registrationCalls[0].terms_code, terms.code);
    assert.equal(registrationCalls[0].terms_version, terms.version);
    assert.equal(registrationCalls[0].terms_accepted, true);
  });

  it("sends no terms fields to a backend that does not name the terms", async () => {
    noticeImpl = async () => ({ ...notice, terms: undefined });
    renderRegisterForm();
    fillValidForm();
    fireEvent.click(termsCheckbox());
    fireEvent.click(screen.getByRole("button", { name: "Kayıt Ol" }));

    await waitFor(() => assert.equal(registrationCalls.length, 1));
    assert.equal("terms_code" in registrationCalls[0], false);
    assert.equal("terms_accepted" in registrationCalls[0], false);
    assert.equal(registrationCalls[0].notice_acknowledged, true);
  });

  it("refreshes the legal texts when the server says they changed", async () => {
    registerError = axios400({ terms_version: ["Kullanım Koşulları güncellendi."] });
    renderRegisterForm();
    fillValidForm();
    fireEvent.click(termsCheckbox());
    await waitFor(() => assert.equal(noticeRequests, 1));
    fireEvent.click(screen.getByRole("button", { name: "Kayıt Ol" }));

    await screen.findByText("Yasal metinler güncellendi. Güncel metinleri görüp tekrar dene.");
    await waitFor(() => assert.equal(noticeRequests, 2));
  });

  it("waits for a notice request still in flight instead of failing", async () => {
    const pending = deferred<NoticeConfig>();
    noticeImpl = () => pending.promise;
    renderRegisterForm();
    fillValidForm();
    fireEvent.click(termsCheckbox());
    fireEvent.click(screen.getByRole("button", { name: "Kayıt Ol" }));

    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(registrationCalls.length, 0);

    pending.resolve(notice);
    await waitFor(() => assert.equal(registrationCalls.length, 1));
    assert.equal(registrationCalls[0].notice_version, notice.version);
  });

  it("fails closed without notice evidence and retries on the next attempt", async () => {
    noticeImpl = async () => {
      throw new Error("offline");
    };
    renderRegisterForm();
    fillValidForm();
    fireEvent.click(termsCheckbox());
    fireEvent.click(screen.getByRole("button", { name: "Kayıt Ol" }));

    await screen.findByText(
      "Aydınlatma Metni bilgisi alınamadı. Bağlantını kontrol edip tekrar dene."
    );
    assert.equal(registrationCalls.length, 0);

    noticeImpl = async () => notice;
    fireEvent.click(screen.getByRole("button", { name: "Kayıt Ol" }));

    await waitFor(() => assert.equal(registrationCalls.length, 1));
  });

  it("opens each legal text over the form without ticking the box", async () => {
    renderRegisterForm();
    fireEvent.change(screen.getByPlaceholderText("E-posta adresini gir"), {
      target: { value: "kept@example.com" },
    });

    fireEvent.click(screen.getByRole("link", { name: "Kullanım Koşulları" }));
    const termsSheet = await screen.findByRole("dialog");
    assert.ok(screen.getByRole("heading", { name: "Kullanım Koşulları" }));
    assert.ok(screen.getByText("Önizleme: /kullanim-kosullari"));
    // The form behind an open dialog is hidden from the accessibility tree.
    assert.equal(
      (document.querySelector('input[type="checkbox"]') as HTMLInputElement).checked,
      false
    );
    fireEvent.keyDown(termsSheet, { key: "Escape" });
    await waitFor(() => assert.equal(screen.queryByRole("dialog"), null));

    fireEvent.click(screen.getByRole("link", { name: "KVKK Aydınlatma Metni" }));
    await screen.findByRole("dialog");
    assert.ok(screen.getByText(`Önizleme: ${notice.url}`));
    fireEvent.click(screen.getByRole("button", { name: "Kapat" }));
    await waitFor(() => assert.equal(screen.queryByRole("dialog"), null));

    assert.equal(termsCheckbox().checked, false);
    assert.equal(
      (screen.getByPlaceholderText("E-posta adresini gir") as HTMLInputElement).value,
      "kept@example.com"
    );
  });

  it("shows the form while the session is still being restored", () => {
    authState.isLoading = true;
    renderRegisterForm();

    assert.ok(screen.getByPlaceholderText("E-posta adresini gir"));
    assert.ok(screen.getByRole("button", { name: "Kayıt Ol" }));
  });
});
