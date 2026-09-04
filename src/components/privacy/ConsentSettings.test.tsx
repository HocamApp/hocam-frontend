import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { ConsentState } from "@/lib/privacyApi";

/**
 * The regression these cover: the component used to render "Yükleniyor…"
 * whenever `data` was missing, so a failed request sat on the loading line
 * forever with no error, no explanation and no retry. That is precisely what
 * an anonymous visitor saw, because the page had no RouteGuard either.
 */

const BASE_STATE: ConsentState = {
  text_version: "v1.0",
  collection_enabled: false,
  guardian_approval_enabled: false,
  request_channel_enabled: false,
  birth_date: null,
  is_minor: null,
  guardian_required_purposes: [
    "R2_learning_tracking",
    "R3_personalized_recs",
    "R4_ai_assistant",
    "R5_marketing",
  ],
  consents: {
    R1_public_profile: false,
    R2_learning_tracking: false,
    R3_personalized_recs: false,
    R4_ai_assistant: false,
    R5_marketing: false,
  },
  contact_email: "iletisim@hocamozelders.com",
};

let response: { ok: true; state: ConsentState } | { ok: false } = {
  ok: true,
  state: BASE_STATE,
};

mock.module("@/hooks/useAuth", {
  namedExports: { useAuth: () => ({ user: { role: "student" } }) },
});
mock.module("sonner", { namedExports: { toast: Object.assign(() => {}, { success: () => {}, error: () => {} }) } });
mock.module("@/lib/privacyApi", {
  namedExports: {
    fetchConsentState: async () => {
      if (!response.ok) throw new Error("network down");
      return response.state;
    },
    updateConsent: async () => ({}),
    submitBirthDate: async () => ({}),
    startGuardianApproval: async () => ({}),
  },
});

let ConsentSettings: React.ComponentType | null = null;

beforeEach(async () => {
  if (!ConsentSettings) {
    ({ ConsentSettings } = await import("./ConsentSettings"));
  }
});
afterEach(() => cleanup());

function renderSettings() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const Component = ConsentSettings!;
  return render(
    <QueryClientProvider client={client}>
      <Component />
    </QueryClientProvider>,
  );
}

describe("ConsentSettings", () => {
  it("shows an error with a retry instead of a permanent loading line", async () => {
    response = { ok: false };
    renderSettings();

    await waitFor(() =>
      assert.ok(screen.getByText(/Onayların yüklenemedi/)),
    );
    assert.ok(screen.getByRole("button", { name: /Tekrar dene/ }));
    assert.equal(screen.queryByText(/Yükleniyor/), null);
  });

  it("lists every purpose even when consent collection is closed", async () => {
    // Filtering the list down to granted consents left the page blank, which
    // reads as broken rather than as "nothing is switched on".
    response = { ok: true, state: BASE_STATE };
    renderSettings();

    await waitFor(() =>
      assert.ok(screen.getByText(/Yeni onay toplama şu anda kapalı/)),
    );
    // A student sees four: R-1 (public tutor profile) is tutor-only.
    assert.equal(screen.getAllByText("Onaylı değil").length, 4);
    assert.ok(screen.getByText(/Şu anda etkin bir açık rızan bulunmuyor/));
  });

  it("cannot grant while collection is closed, but can always withdraw", async () => {
    response = {
      ok: true,
      state: {
        ...BASE_STATE,
        consents: { ...BASE_STATE.consents, R5_marketing: true },
      },
    };
    renderSettings();

    await waitFor(() => assert.ok(screen.getAllByText("Onaylı").length));

    const grant = screen.getAllByRole("button", { name: /Onay ver/ });
    const withdraw = screen.getAllByRole("button", { name: /Onayı geri al/ });
    // Every "Onay ver" is disabled: collection is closed.
    assert.ok(grant.every((b) => (b as HTMLButtonElement).disabled));
    // Exactly the granted one can be withdrawn. Withdrawal is never gated —
    // taking consent back must not be the harder path.
    assert.equal(
      withdraw.filter((b) => !(b as HTMLButtonElement).disabled).length,
      1,
    );
  });

  it("counts the granted consents in the summary line", async () => {
    response = {
      ok: true,
      state: {
        ...BASE_STATE,
        collection_enabled: true,
        birth_date: "2005-01-01",
        consents: {
          ...BASE_STATE.consents,
          // R-1 is tutor-only, so a student granting it would not be counted.
          R2_learning_tracking: true,
          R5_marketing: true,
        },
      },
    };
    renderSettings();

    await waitFor(() => assert.ok(screen.getByText(/tanesi etkin/)));
    assert.match(screen.getByText(/tanesi etkin/).textContent ?? "", /2 tanesi etkin/);
  });

  it("asks for a birth date only once collection is open", async () => {
    response = {
      ok: true,
      state: { ...BASE_STATE, collection_enabled: true, birth_date: null },
    };
    renderSettings();

    await waitFor(() => assert.ok(screen.getByText(/Doğum tarihini soruyoruz/)));
    assert.ok(screen.getByLabelText("Doğum tarihi"));
  });
});
