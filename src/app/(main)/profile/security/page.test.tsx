import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

const routerCalls: string[] = [];
const otpRequestCalls: number[] = [];
const confirmOtpCalls: string[] = [];
const requestDeletionCalls: string[] = [];
const cancelDeletionCalls: number[] = [];
const acceptOfferCalls: number[] = [];

let precheckResponse: Record<string, unknown> = {
  blockers: [],
  warnings: [],
  retention_offer: null,
};
let deletionStatusResponse: Record<string, unknown> = { active: false };
let securitySettingsResponse: Record<string, unknown> = {
  email: "ogrenci@example.com",
  is_email_verified: true,
  email_verification_enabled: true,
  has_usable_password: true,
  last_seen_at: null,
};

let SecuritySettingsPage: React.ComponentType | null = null;

async function loadPage() {
  if (SecuritySettingsPage) return;

  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({
        push: (href: string) => routerCalls.push(href),
        replace: () => {},
      }),
      usePathname: () => "/profile/security",
    },
  });
  mock.module("@/hooks/useAuth", {
    namedExports: {
      useAuth: () => ({
        user: { id: "student-1", role: "student", email: "ogrenci@example.com" },
        token: "token-1",
        isAuthenticated: true,
        isStudent: true,
        isTutor: false,
        isAdmin: false,
        isImpersonating: false,
        isLoading: false,
        logout: () => {},
        setAuth: () => {},
        updateUser: () => {},
      }),
    },
  });
  mock.module("@/providers/AuthProvider", {
    namedExports: {
      useAuthContext: () => ({
        user: { id: "student-1", role: "student", email: "ogrenci@example.com" },
        token: "token-1",
        isLoading: false,
        setAuth: () => {},
        clearAuth: () => {},
        updateUser: () => {},
      }),
    },
  });
  mock.module("@/lib/authApi", {
    namedExports: {
      fetchSecuritySettings: async () => securitySettingsResponse,
      fetchDeletionPrecheck: async () => precheckResponse,
      fetchDeletionStatus: async () => deletionStatusResponse,
      requestDeletionOtp: async () => {
        otpRequestCalls.push(1);
        return { detail: "ok" };
      },
      confirmDeletionOtp: async (code: string) => {
        confirmOtpCalls.push(code);
        return { detail: "ok" };
      },
      requestAccountDeletion: async (confirmText: string) => {
        requestDeletionCalls.push(confirmText);
        return {
          id: "del-1",
          status: "scheduled",
          scheduled_deletion_at: "2026-09-01T00:00:00Z",
        };
      },
      cancelAccountDeletion: async () => {
        cancelDeletionCalls.push(1);
        return { detail: "ok" };
      },
      changePassword: async () => ({}),
      confirmEmailVerificationCode: async () => ({}),
      logoutAllSessions: async () => {},
      requestEmailVerificationCode: async () => ({ detail: "ok" }),
      // Imported by TutorDeletionFlow (rendered only for tutors, but the
      // module graph needs every named export to exist).
      fetchTutorDeletionPrecheck: async () => ({
        blockers: [],
        warnings: [],
        offboarding_preview: [],
      }),
      requestTutorAccountDeletion: async () => ({
        id: "del-1",
        status: "offboarding",
      }),
      cancelTutorAccountDeletion: async () => ({
        cancelled: true,
        can_republish: true,
        started_actions: [],
      }),
      republishTutorProfile: async () => ({ detail: "ok" }),
      pauseTutorProfile: async () => ({ detail: "ok" }),
      resumeTutorProfile: async () => ({ detail: "ok" }),
    },
  });
  mock.module("@/lib/paymentsApi", {
    namedExports: {
      acceptRetentionOffer: async () => {
        acceptOfferCalls.push(1);
        return {
          promotion_code: "GUVEN20",
          plan_code: "weekly_1_30",
          discount_percent: 20,
          valid_until: "2026-08-10T00:00:00Z",
        };
      },
    },
  });

  SecuritySettingsPage = (await import("./page")).default;
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Page = SecuritySettingsPage as React.ComponentType;
  return render(
    <QueryClientProvider client={queryClient}>
      <Page />
    </QueryClientProvider>
  );
}

async function renderLoadedPage() {
  renderPage();
  await screen.findByRole("heading", { name: "Şifre ve oturumlar" });
}

function openDeletionFlow() {
  fireEvent.click(screen.getByRole("button", { name: "Hesabı sil" }));
}

function typeDeleteConfirm(value: string) {
  fireEvent.change(screen.getByPlaceholderText("SİL"), {
    target: { value },
  });
}

beforeEach(async () => {
  await loadPage();
  routerCalls.length = 0;
  otpRequestCalls.length = 0;
  confirmOtpCalls.length = 0;
  requestDeletionCalls.length = 0;
  cancelDeletionCalls.length = 0;
  acceptOfferCalls.length = 0;
  precheckResponse = { blockers: [], warnings: [], retention_offer: null };
  deletionStatusResponse = { active: false };
  securitySettingsResponse = {
    email: "ogrenci@example.com",
    is_email_verified: true,
    email_verification_enabled: true,
    has_usable_password: true,
    last_seen_at: null,
  };
});

afterEach(() => {
  cleanup();
});

describe("Güvenlik sayfası — hesap silme onayı", () => {
  it("ilk render'da silme formunu gizler ve Hesabı sil aksiyonuyla açar", async () => {
    await renderLoadedPage();

    assert.equal(screen.queryByPlaceholderText("SİL"), null);
    assert.equal(screen.queryByText("Bu işlem kalıcıdır."), null);

    openDeletionFlow();

    await screen.findByPlaceholderText("SİL");
    screen.getByRole("button", { name: "Silme alanını kapat" });
  });

  it("SİL veya e-posta girilmeden silme butonu aktifleşmez", async () => {
    await renderLoadedPage();
    openDeletionFlow();

    const button = screen.getByRole("button", {
      name: "Hesabı kalıcı olarak sil",
    }) as HTMLButtonElement;
    assert.equal(button.disabled, true);

    typeDeleteConfirm("rastgele metin");
    assert.equal(button.disabled, true);

    typeDeleteConfirm("SİL");
    assert.equal(button.disabled, false);

    typeDeleteConfirm("ogrenci@example.com");
    assert.equal(button.disabled, false);
  });
});

describe("Güvenlik sayfası — precheck dallanması", () => {
  it("uyarı varsa seçenek listesi ve 'Yine de devam et' gösterilir", async () => {
    precheckResponse = {
      blockers: [],
      warnings: [
        { code: "unused_credits", message: "Kullanılmamış ders kredileriniz var." },
      ],
      retention_offer: null,
    };
    await renderLoadedPage();
    openDeletionFlow();

    typeDeleteConfirm("SİL");
    fireEvent.click(
      screen.getByRole("button", { name: "Hesabı kalıcı olarak sil" })
    );

    await screen.findByText("Kullanılmamış ders kredileriniz var.");
    const refundLink = screen.getByRole("link", { name: /İade talebi oluştur/ });
    assert.equal(refundLink.getAttribute("href"), "/profile/payments");
    screen.getByRole("button", { name: "Yine de devam et" });
  });

  it("engel varsa destructive uyarı gösterilir ve devam butonu olmaz", async () => {
    precheckResponse = {
      blockers: [
        { code: "open_refund", message: "Açık bir iade süreciniz var." },
      ],
      warnings: [],
      retention_offer: null,
    };
    await renderLoadedPage();
    openDeletionFlow();

    typeDeleteConfirm("SİL");
    fireEvent.click(
      screen.getByRole("button", { name: "Hesabı kalıcı olarak sil" })
    );

    await screen.findByText("Bunlar çözülmeden hesap silinemez.");
    screen.getByText("Açık bir iade süreciniz var.");
    assert.equal(
      screen.queryByRole("button", { name: "Yine de devam et" }),
      null
    );
  });

  it("teklif uygunsa retention dialogu açılır; reddedince OTP adımına geçilir", async () => {
    precheckResponse = {
      blockers: [],
      warnings: [],
      retention_offer: {
        eligible: true,
        campaign: {
          discount_percent: 20,
          plan_codes: ["weekly_1_30"],
          validity_hours: 48,
        },
      },
    };
    await renderLoadedPage();
    openDeletionFlow();

    typeDeleteConfirm("SİL");
    fireEvent.click(
      screen.getByRole("button", { name: "Hesabı kalıcı olarak sil" })
    );

    await screen.findByText("Gitmeden önce size özel bir teklifimiz var");
    assert.equal(otpRequestCalls.length, 0);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Teşekkürler, hesabımı silmek istiyorum",
      })
    );

    await screen.findByText("Son adım: e-posta doğrulaması");
    await waitFor(() => assert.equal(otpRequestCalls.length, 1));
    assert.equal(acceptOfferCalls.length, 0);
  });

  it("uyarı ve teklif yoksa doğrudan OTP adımına geçer", async () => {
    await renderLoadedPage();
    openDeletionFlow();

    typeDeleteConfirm("SİL");
    fireEvent.click(
      screen.getByRole("button", { name: "Hesabı kalıcı olarak sil" })
    );

    await screen.findByText("Son adım: e-posta doğrulaması");
    screen.getByText(/ogrenci@example\.com adresine 6 haneli bir kod gönderdik/);
    await waitFor(() => assert.equal(otpRequestCalls.length, 1));
  });
});

describe("Güvenlik sayfası — OTP ve planlama", () => {
  it("OTP onayı silme isteğini tetikler; iptal butonu geri alır", async () => {
    await renderLoadedPage();
    openDeletionFlow();

    typeDeleteConfirm("SİL");
    fireEvent.click(
      screen.getByRole("button", { name: "Hesabı kalıcı olarak sil" })
    );
    await screen.findByText("Son adım: e-posta doğrulaması");

    fireEvent.change(screen.getByPlaceholderText("000000"), {
      target: { value: "123456" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Silme işlemini onayla" })
    );

    await screen.findByText(/Silme işleminiz planlandı/);
    assert.deepEqual(confirmOtpCalls, ["123456"]);
    assert.deepEqual(requestDeletionCalls, ["SİL"]);

    // Grace window: the account still exists, no logout / redirect happens.
    assert.equal(routerCalls.includes("/register"), false);

    fireEvent.click(
      screen.getByRole("button", { name: "Silme işlemini iptal et" })
    );

    await waitFor(() => assert.equal(cancelDeletionCalls.length, 1));
    // Back to the neutral account-management card.
    await screen.findByRole("button", { name: "Hesabı sil" });
    assert.equal(screen.queryByPlaceholderText("SİL"), null);
  });

  it("aktif silme isteği varsa form yerine durum kartı gösterilir", async () => {
    deletionStatusResponse = {
      active: true,
      id: "del-1",
      role: "student",
      status: "blocked",
      scheduled_deletion_at: "2026-09-01T00:00:00Z",
    };
    await renderLoadedPage();

    await screen.findByText(/iade\/ihtilaf/);
    assert.equal(screen.queryByPlaceholderText("SİL"), null);
    screen.getByRole("button", { name: "Silme işlemini iptal et" });
  });
});

describe("Güvenlik sayfası — kullanıcı odaklı güvenlik metinleri", () => {
  it("teknik oturum metnini kaldırır ve doğal güvenlik yönlendirmesini gösterir", async () => {
    await renderLoadedPage();

    screen.getByText(
      "Tanımadığınız bir işlem fark ederseniz şifrenizi değiştirin ve tüm oturumlardan çıkış yapın."
    );
    assert.equal(screen.queryByText(/tek tokenlı oturum sistemi/i), null);
  });

  it("doğrulanmamış e-posta için amacı, çağrıyı ve kod süresini açıklar", async () => {
    securitySettingsResponse = {
      ...securitySettingsResponse,
      is_email_verified: false,
    };

    await renderLoadedPage();

    screen.getByText("Doğrulanmadı");
    screen.getByText(
      "E-posta doğrulaması; şifre sıfırlama, hesap silme ve önemli güvenlik bildirimleri için kullanılır."
    );
    screen.getByText(
      "Bu e-posta size ait mi? 6 haneli bir kod göndererek hesabınızı güvenceye alın."
    );
    screen.getByText("Kod 10 dakika geçerlidir.");
    assert.equal(screen.queryByText("Doğrulama gerekiyor."), null);
  });

  it("doğrulanmış e-posta için olumlu güvenlik metnini gösterir", async () => {
    await renderLoadedPage();

    screen.getByText("Doğrulandı");
    screen.getByText(
      "E-postanız doğrulandı. Hassas hesap işlemleri için bu adresi kullanacağız."
    );
  });

  it("e-posta doğrulama özelliği kapalıyken mevcut bilgilendirmeyi korur", async () => {
    securitySettingsResponse = {
      ...securitySettingsResponse,
      is_email_verified: false,
      email_verification_enabled: false,
    };

    await renderLoadedPage();

    screen.getByText("Geçici olarak kapalı");
    screen.getByText("E-posta doğrulaması geçici olarak kapalı.");
    assert.equal(screen.queryByRole("button", { name: "Kod gönder" }), null);
  });
});
