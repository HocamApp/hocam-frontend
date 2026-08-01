import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

let statusResponse: Record<string, unknown> = { active: false };
let cancelResponse: Record<string, unknown> = {
  cancelled: true,
  can_republish: true,
  started_actions: [],
};

const pauseCalls: number[] = [];
const cancelCalls: number[] = [];
const republishCalls: unknown[] = [];
const tutorPrecheckCalls: number[] = [];
const otpRequestCalls: number[] = [];
const otpConfirmCalls: string[] = [];
const tutorDeletionCalls: string[] = [];

let TutorDeletionFlow: React.ComponentType<{ accountEmail: string }> | null =
  null;

async function loadFlow() {
  if (TutorDeletionFlow) return;

  mock.module("@/lib/authApi", {
    namedExports: {
      fetchDeletionStatus: async () => statusResponse,
      fetchTutorDeletionPrecheck: async () => {
        tutorPrecheckCalls.push(1);
        return { blockers: [], warnings: [], offboarding_preview: [] };
      },
      requestDeletionOtp: async () => {
        otpRequestCalls.push(1);
        return { detail: "ok" };
      },
      confirmDeletionOtp: async (code: string) => {
        otpConfirmCalls.push(code);
        return { detail: "ok" };
      },
      requestTutorAccountDeletion: async (confirmText: string) => {
        tutorDeletionCalls.push(confirmText);
        return { id: "del-1", status: "offboarding" };
      },
      cancelTutorAccountDeletion: async () => {
        cancelCalls.push(1);
        return cancelResponse;
      },
      republishTutorProfile: async (payload: unknown) => {
        republishCalls.push(payload);
        return { detail: "ok" };
      },
      pauseTutorProfile: async () => {
        pauseCalls.push(1);
        return { detail: "ok" };
      },
      resumeTutorProfile: async () => ({ detail: "ok" }),
    },
  });

  TutorDeletionFlow = (await import("./TutorDeletionFlow")).TutorDeletionFlow;
}

function renderFlow() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Flow = TutorDeletionFlow as React.ComponentType<{
    accountEmail: string;
  }>;
  return render(
    <QueryClientProvider client={queryClient}>
      <Flow accountEmail="hoca@example.com" />
    </QueryClientProvider>
  );
}

beforeEach(async () => {
  await loadFlow();
  statusResponse = { active: false };
  cancelResponse = { cancelled: true, can_republish: true, started_actions: [] };
  pauseCalls.length = 0;
  cancelCalls.length = 0;
  republishCalls.length = 0;
  tutorPrecheckCalls.length = 0;
  otpRequestCalls.length = 0;
  otpConfirmCalls.length = 0;
  tutorDeletionCalls.length = 0;
});

afterEach(() => {
  cleanup();
});

describe("TutorDeletionFlow", () => {
  it("ilk render'da nötr hesap yönetimi kartını gösterir ve silme akışını kapalı tutar", async () => {
    renderFlow();

    await screen.findByRole("heading", { name: "Hesap yönetimi" });
    screen.getByRole("button", { name: "Profili duraklat" });
    screen.getByRole("button", { name: "Hesabı sil" });
    assert.equal(screen.queryByText(/Bu işlem kalıcıdır/), null);

    fireEvent.click(screen.getByRole("button", { name: "Hesabı sil" }));

    await screen.findByText(/profilinizi duraklatabilirsiniz/);
    screen.getByRole("button", { name: /Kalıcı silmeye devam et/ });
    screen.getByRole("button", { name: "Silme alanını kapat" });
  });

  it("nötr karttaki duraklatma aksiyonunu korur", async () => {
    renderFlow();

    await screen.findByRole("button", { name: "Profili duraklat" });

    fireEvent.click(screen.getByRole("button", { name: "Profili duraklat" }));

    await waitFor(() => assert.equal(pauseCalls.length, 1));
    await screen.findByRole("button", { name: "Profili yeniden aç" });
  });

  it("öğretmen precheck ve OTP üzerinden kalıcı silme akışını sürdürür", async () => {
    renderFlow();

    fireEvent.click(await screen.findByRole("button", { name: "Hesabı sil" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Kalıcı silmeye devam et" })
    );

    await screen.findByText("Bu işlem kalıcıdır.");
    assert.equal(tutorPrecheckCalls.length, 1);

    fireEvent.change(screen.getByPlaceholderText("SİL"), {
      target: { value: "SİL" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Hesabı kalıcı olarak sil" })
    );

    await screen.findByText("Son adım: e-posta doğrulaması");
    assert.equal(otpRequestCalls.length, 1);

    fireEvent.change(screen.getByPlaceholderText("000000"), {
      target: { value: "654321" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Silme işlemini onayla" })
    );

    await screen.findByText("Kapanış süreci başladı.");
    assert.deepEqual(otpConfirmCalls, ["654321"]);
    assert.deepEqual(tutorDeletionCalls, ["SİL"]);
  });

  it("iptal sonrası can_republish=true ise yeniden yayımla akışını gösterir", async () => {
    statusResponse = {
      active: true,
      id: "del-1",
      role: "tutor",
      status: "offboarding",
      scheduled_deletion_at: "2026-09-01T00:00:00Z",
    };
    cancelResponse = {
      cancelled: true,
      can_republish: true,
      started_actions: [],
    };

    renderFlow();

    await screen.findByText(/Kapanış süreci başladı/);
    fireEvent.click(
      screen.getByRole("button", { name: "Silme işlemini iptal et" })
    );

    const republish = await screen.findByRole("button", {
      name: "Profili yeniden yayımla",
    });
    assert.equal(cancelCalls.length, 1);

    fireEvent.click(republish);

    await waitFor(() => assert.equal(republishCalls.length, 1));
    assert.deepEqual(republishCalls[0], { confirm: true });
  });

  it("can_republish=false ise started_actions listelenir, yayımla butonu olmaz", async () => {
    statusResponse = {
      active: true,
      id: "del-1",
      role: "tutor",
      status: "offboarding",
      scheduled_deletion_at: "2026-09-01T00:00:00Z",
    };
    cancelResponse = {
      cancelled: true,
      can_republish: false,
      started_actions: [
        {
          type: "farewell_notices",
          label: "3 öğrenciye ayrılık bildirimi gönderildi",
          reason:
            "Bu dersler için çözüm seçilmeden profil otomatik açılmaz.",
        },
      ],
    };

    renderFlow();

    await screen.findByText(/Kapanış süreci başladı/);
    fireEvent.click(
      screen.getByRole("button", { name: "Silme işlemini iptal et" })
    );

    await screen.findByText("3 öğrenciye ayrılık bildirimi gönderildi");
    screen.getByText(/Bu dersler için çözüm seçilmeden profil otomatik açılmaz/);
    assert.equal(
      screen.queryByRole("button", { name: /yeniden yayımla/i }),
      null,
      "republish button must not render when can_republish is false"
    );
  });
});
