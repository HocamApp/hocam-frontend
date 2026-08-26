import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import React, { useEffect } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

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
    { href: string; children?: React.ReactNode }
  >(function MockLink({ href, children, ...rest }, ref) {
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
        expires_in_seconds: 600,
      };
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
      disabled,
      onCredential,
    }: {
      disabled?: boolean;
      onCredential: (credential: string) => void;
    }) => (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onCredential("google-token")}
      >
        Google ile kaydol
      </button>
    ),
  },
});
mock.module("@/components/privacy/AydinlatmaMetniPreview", {
  namedExports: {
    AydinlatmaMetniPreview: ({ onReady }: { onReady: () => void }) => {
      useEffect(onReady, [onReady]);
      return <p>Güncel KVKK metni</p>;
    },
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
  return render(<Component />);
}

async function acknowledgeNotice() {
  const openButton = await screen.findByRole("button", {
    name: "KVKK Aydınlatma Metni’ni görüntüle",
  });
  await waitFor(() => assert.equal((openButton as HTMLButtonElement).disabled, false));
  fireEvent.click(openButton);

  const viewedButton = await screen.findByRole("button", {
    name: "Metni görüntüledim",
  });
  await waitFor(() => assert.equal((viewedButton as HTMLButtonElement).disabled, false));
  fireEvent.click(viewedButton);

  const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
  assert.equal(checkbox.disabled, false);
  fireEvent.click(checkbox);
  assert.equal(checkbox.checked, true);
}

beforeEach(async () => {
  await loadRegisterForm();
  registrationCalls.length = 0;
  googleCalls.length = 0;
  noticeImpl = async () => notice;
});

afterEach(() => cleanup());

describe("registration KVKK acknowledgement", () => {
  it("keeps email and Google registration disabled until acknowledgement", async () => {
    renderRegisterForm();

    assert.equal(
      (screen.getByRole("button", { name: "Kayıt Ol" }) as HTMLButtonElement).disabled,
      true
    );
    assert.equal(
      (screen.getByRole("button", { name: "Google ile kaydol" }) as HTMLButtonElement)
        .disabled,
      true
    );

    await acknowledgeNotice();

    assert.equal(
      (screen.getByRole("button", { name: "Kayıt Ol" }) as HTMLButtonElement).disabled,
      false
    );
    assert.equal(
      (screen.getByRole("button", { name: "Google ile kaydol" }) as HTMLButtonElement)
        .disabled,
      false
    );
  });

  it("submits server-provided evidence for email registration", async () => {
    renderRegisterForm();
    await acknowledgeNotice();

    fireEvent.change(screen.getByPlaceholderText("E-posta adresini gir"), {
      target: { value: "student@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Şifreni gir"), {
      target: { value: "safe-pass-123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Şifreni tekrar gir"), {
      target: { value: "safe-pass-123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Kayıt Ol" }));

    await waitFor(() => assert.equal(registrationCalls.length, 1));
    assert.equal(registrationCalls[0].notice_code, notice.code);
    assert.equal(registrationCalls[0].notice_version, notice.version);
    assert.equal(registrationCalls[0].notice_acknowledged, true);
  });

  it("submits the same evidence for new Google registration", async () => {
    renderRegisterForm();
    await acknowledgeNotice();

    fireEvent.click(screen.getByRole("button", { name: "Google ile kaydol" }));

    await waitFor(() => assert.equal(googleCalls.length, 1));
    assert.equal(googleCalls[0].credential, "google-token");
    assert.equal(googleCalls[0].notice_code, notice.code);
    assert.equal(googleCalls[0].notice_version, notice.version);
    assert.equal(googleCalls[0].notice_acknowledged, true);
  });

  it("fails closed when notice configuration cannot be loaded", async () => {
    noticeImpl = async () => {
      throw new Error("offline");
    };
    renderRegisterForm();

    await screen.findByText(
      "Aydınlatma Metni bilgisi alınamadı. Kayıt için sayfayı yenileyin."
    );
    assert.equal(
      (
        screen.getByRole("button", {
          name: "KVKK Aydınlatma Metni’ni görüntüle",
        }) as HTMLButtonElement
      ).disabled,
      true
    );
    assert.equal((screen.getByRole("checkbox") as HTMLInputElement).disabled, true);
  });
});
