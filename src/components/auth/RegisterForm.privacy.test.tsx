import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const notice = {
  code: "general_kvkk_notice",
  version: "v1.1",
  url: "/kvkk/aydinlatma-metni",
  acknowledgement_required: true as const,
};

type RegistrationPayload = Record<string, unknown>;
const registrationCalls: RegistrationPayload[] = [];
const googleCalls: RegistrationPayload[] = [];
let noticeImpl: () => Promise<typeof notice> = async () => notice;

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
      isLoading: false,
      user: null,
    }),
  },
});
mock.module("@/lib/privacyApi", {
  namedExports: { fetchRegistrationNotice: () => noticeImpl() },
});
mock.module("@/lib/authApi", {
  namedExports: {
    registerUser: async (payload: RegistrationPayload) => {
      registrationCalls.push(payload);
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
mock.module("@/components/auth/GoogleSignInButton", {
  namedExports: {
    GoogleSignInButton: ({
      onCredential,
    }: {
      onCredential: (credential: string) => void;
    }) => (
      <button type="button" onClick={() => onCredential("google-token")}>
        Google ile kaydol
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
});

afterEach(() => cleanup());

describe("registration KVKK notice", () => {
  it("informs in one line without a checkbox or a gate on either button", () => {
    renderRegisterForm();

    assert.equal(screen.queryByRole("checkbox"), null);
    assert.equal(screen.queryByText(/Bu kutu açık rıza değildir/), null);
    assert.equal(
      (screen.getByRole("button", { name: "Kayıt Ol" }) as HTMLButtonElement).disabled,
      false
    );
    assert.equal(
      (screen.getByRole("button", { name: "Google ile kaydol" }) as HTMLButtonElement)
        .disabled,
      false
    );
    assert.equal(
      screen.getByRole("link", { name: "Kullanım Koşulları" }).getAttribute("href"),
      "/kullanim-kosullari"
    );
    assert.equal(
      screen.getByRole("link", { name: "KVKK Aydınlatma Metni" }).getAttribute("href"),
      "/kvkk/aydinlatma-metni"
    );
  });

  it("submits server-provided evidence for email registration", async () => {
    renderRegisterForm();
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Kayıt Ol" }));

    await waitFor(() => assert.equal(registrationCalls.length, 1));
    assert.equal(registrationCalls[0].notice_code, notice.code);
    assert.equal(registrationCalls[0].notice_version, notice.version);
    assert.equal(registrationCalls[0].notice_acknowledged, true);
  });

  it("submits the same evidence for new Google registration", async () => {
    renderRegisterForm();
    fireEvent.click(screen.getByRole("button", { name: "Google ile kaydol" }));

    await waitFor(() => assert.equal(googleCalls.length, 1));
    assert.equal(googleCalls[0].credential, "google-token");
    assert.equal(googleCalls[0].notice_code, notice.code);
    assert.equal(googleCalls[0].notice_version, notice.version);
    assert.equal(googleCalls[0].notice_acknowledged, true);
  });

  it("waits for a notice request still in flight instead of failing", async () => {
    const pending = deferred<typeof notice>();
    noticeImpl = () => pending.promise;
    renderRegisterForm();
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Kayıt Ol" }));

    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(registrationCalls.length, 0);

    pending.resolve(notice);
    await waitFor(() => assert.equal(registrationCalls.length, 1));
    assert.equal(registrationCalls[0].notice_version, notice.version);
  });

  it("fails closed without notice evidence and retries on the next attempt", async () => {
    let noticeRequests = 0;
    noticeImpl = async () => {
      noticeRequests += 1;
      throw new Error("offline");
    };
    renderRegisterForm();
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Kayıt Ol" }));

    await screen.findByText(
      "Aydınlatma Metni bilgisi alınamadı. Bağlantını kontrol edip tekrar dene."
    );
    assert.equal(registrationCalls.length, 0);
    const requestsAfterFirstAttempt = noticeRequests;

    noticeImpl = async () => notice;
    fireEvent.click(screen.getByRole("button", { name: "Kayıt Ol" }));

    await waitFor(() => assert.equal(registrationCalls.length, 1));
    assert.ok(requestsAfterFirstAttempt >= 1);
  });

  it("opens each legal text over the form and keeps the form however it closes", async () => {
    renderRegisterForm();
    fireEvent.change(screen.getByPlaceholderText("E-posta adresini gir"), {
      target: { value: "kept@example.com" },
    });

    fireEvent.click(screen.getByRole("link", { name: "Kullanım Koşulları" }));
    const terms = await screen.findByRole("dialog");
    assert.ok(screen.getByRole("heading", { name: "Kullanım Koşulları" }));
    assert.ok(screen.getByText("Önizleme: /kullanim-kosullari"));
    fireEvent.keyDown(terms, { key: "Escape" });
    await waitFor(() => assert.equal(screen.queryByRole("dialog"), null));

    fireEvent.click(screen.getByRole("link", { name: "KVKK Aydınlatma Metni" }));
    await screen.findByRole("dialog");
    assert.ok(screen.getByRole("heading", { name: "KVKK Aydınlatma Metni" }));
    assert.ok(screen.getByText(`Önizleme: ${notice.url}`));
    fireEvent.click(screen.getByRole("button", { name: "Pencereyi kapat" }));
    await waitFor(() => assert.equal(screen.queryByRole("dialog"), null));

    fireEvent.click(screen.getByRole("link", { name: "KVKK Aydınlatma Metni" }));
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: "Kapat" }));
    await waitFor(() => assert.equal(screen.queryByRole("dialog"), null));

    assert.equal(
      (screen.getByPlaceholderText("E-posta adresini gir") as HTMLInputElement).value,
      "kept@example.com"
    );
    assert.equal(
      (screen.getByRole("button", { name: "Kayıt Ol" }) as HTMLButtonElement).disabled,
      false
    );
  });
});
