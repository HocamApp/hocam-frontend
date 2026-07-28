import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { MatchingOptions } from "@/types";

// framer-motion and useMediaQuery both read matchMedia, which the shared jsdom
// setup does not provide.
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

const LEGACY_KEY = "hocam:matching-draft:v1:student-1";
const DRAFT_KEY = "hocam:hoca-bul-draft:v1:student-1";
const NOW = Date.now();

const options: MatchingOptions = {
  goals: [
    { value: "YKS", label: "YKS" },
    { value: "DGS", label: "DGS" },
    { value: "UNDECIDED", label: "Henüz karar vermedim" },
  ],
  stages: {
    YKS: [{ value: "grade_12", label: "12. sınıf" }],
    DGS: [{ value: "ongoing", label: "Bir süredir hazırlanıyorum" }],
    KPSS: [],
    UNDECIDED: [{ value: "exploring", label: "Hedefimi belirlemeye çalışıyorum" }],
  },
  subjects: [
    {
      key: "matematik",
      label: "Matematik",
      subject_ids: ["1"],
      exam_types: ["TYT", "AYT"],
      tutor_count: 9,
    },
  ],
  budget_ranges: [
    { id: "balanced", label: "Dengeli", min: 400, max: 700 },
    { id: "flexible", label: "Fiyat konusunda esneğim", min: null, max: null },
  ],
};

let fetchCalls = 0;
let shouldFail = false;
let searchParams = new URLSearchParams();
const routerCalls: Array<{ method: string; href?: string }> = [];

let Wizard: (() => React.ReactNode) | null = null;

async function loadWizard() {
  if (Wizard) return;

  mock.module("@/hooks/useAuth", {
    namedExports: {
      useAuth: () => ({ user: { id: "student-1", role: "student" }, isLoading: false }),
    },
  });
  mock.module("@/lib/matchingApi", {
    namedExports: {
      fetchMatchingOptions: async () => {
        fetchCalls += 1;
        if (shouldFail) throw new Error("options unavailable");
        return options;
      },
    },
  });
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({
        push: (href: string) => routerCalls.push({ method: "push", href }),
        replace: (href: string) => routerCalls.push({ method: "replace", href }),
        back: () => routerCalls.push({ method: "back" }),
      }),
      useSearchParams: () => searchParams,
      usePathname: () => "/hoca-bul",
    },
  });

  Wizard = (await import("./HocaBulWizard"))
    .HocaBulWizard as unknown as () => React.ReactNode;
}

function renderWizard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      {Wizard ? <Wizard /> : null}
    </QueryClientProvider>
  );
}

beforeEach(async () => {
  await loadWizard();
  fetchCalls = 0;
  shouldFail = false;
  searchParams = new URLSearchParams();
  routerCalls.length = 0;
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("wizard foundation", () => {
  it("renders the first question and a branch-aware counter once options load", async () => {
    renderWizard();

    const heading = await screen.findByRole("heading", { level: 1 });
    assert.equal(heading.textContent, "Hangi sınava hazırlanıyorsun?");
    // Eight steps until a goal says otherwise. The counter also appears in the
    // temporary development panel, so both occurrences are accepted.
    assert.ok(screen.getAllByText("1 / 8").length > 0);
  });

  it("switches the total to nine once the goal is YKS", async () => {
    renderWizard();
    // The goal control only exists once the options themselves arrived.
    const yks = await screen.findByRole("button", { name: "YKS" });

    fireEvent.click(yks);

    await waitFor(() => assert.ok(screen.getAllByText("1 / 9").length > 0));
  });

  it("shows an accessible retry when the options fail, and retrying refetches", async () => {
    shouldFail = true;
    renderWizard();

    const retry = await screen.findByRole("button", { name: /Tekrar dene/ });
    assert.ok(screen.getByText("Seçenekler şu anda yüklenemedi."));
    const callsBeforeRetry = fetchCalls;

    shouldFail = false;
    fireEvent.click(retry);

    await waitFor(() => assert.ok(fetchCalls > callsBeforeRetry));
    // The question itself never disappeared, so nothing the student answered is lost.
    await waitFor(() =>
      assert.equal(
        screen.getByRole("heading", { level: 1 }).textContent,
        "Hangi sınava hazırlanıyorsun?"
      )
    );
  });

  it("moves forward through the flow and writes the step to the URL", async () => {
    renderWizard();
    await screen.findByRole("heading", { level: 1 });

    fireEvent.click(screen.getByRole("button", { name: /Devam et/ }));

    await waitFor(() =>
      assert.equal(
        screen.getByRole("heading", { level: 1 }).textContent,
        "Şu an hangi aşamadasın?"
      )
    );
    assert.ok(routerCalls.some((call) => call.href === "?adim=asama"));
  });

  it("leaves for the home page from the first step instead of going nowhere", async () => {
    renderWizard();
    await screen.findByRole("heading", { level: 1 });

    fireEvent.click(screen.getByRole("button", { name: "Çıkış" }));

    assert.ok(routerCalls.some((call) => call.method === "push" && call.href === "/home"));
  });

  it("opens the exit dialog from the header control", async () => {
    renderWizard();
    await screen.findByRole("heading", { level: 1 });

    fireEvent.click(screen.getByRole("button", { name: "Eşleşmeden çık" }));

    const dialog = await screen.findByRole("dialog");
    assert.ok(dialog.textContent?.includes("Eşleşmeden çıkmak istiyor musun?"));
    assert.ok(screen.getByRole("button", { name: "Çık" }));
    assert.ok(screen.getByRole("button", { name: "Devam et" }));
  });
});

describe("draft resume", () => {
  function seedDraft() {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        meta: { schemaVersion: 1, userId: "student-1", createdAt: NOW, updatedAt: NOW },
        answers: { goal: "DGS", stage: "ongoing" },
        client: {},
        stepId: "dersler",
        expiresAt: NOW + 60_000,
      })
    );
  }

  it("offers to resume an unfinished draft", async () => {
    seedDraft();
    renderWizard();

    const dialog = await screen.findByRole("dialog");
    assert.ok(dialog.textContent?.includes("Yarım kalmış bir eşleşmen var"));
  });

  it("resumes at the stored step", async () => {
    seedDraft();
    renderWizard();
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("button", { name: "Kaldığın yerden devam et" }));

    await waitFor(() =>
      assert.equal(
        screen.getByRole("heading", { level: 1 }).textContent,
        "Hangi derslerde desteğe ihtiyacın var?"
      )
    );
    assert.ok(screen.getAllByText("3 / 8").length > 0);
  });

  it("restarts from the first step and clears only its own draft", async () => {
    seedDraft();
    window.localStorage.setItem(LEGACY_KEY, "legacy-untouched");
    renderWizard();
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("button", { name: "Baştan başla" }));

    await waitFor(() =>
      assert.equal(
        screen.getByRole("heading", { level: 1 }).textContent,
        "Hangi sınava hazırlanıyorsun?"
      )
    );
    // The legacy /match draft must survive untouched until that flow is retired.
    assert.equal(window.localStorage.getItem(LEGACY_KEY), "legacy-untouched");
  });

  it("never rewrites the legacy key while copying from it", async () => {
    window.localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify({
        answers: { goal: "KPSS", stage: "ongoing" },
        step: 2,
        expiresAt: NOW + 60_000,
      })
    );
    const before = window.localStorage.getItem(LEGACY_KEY);

    renderWizard();
    await screen.findByRole("heading", { level: 1 });

    assert.equal(window.localStorage.getItem(LEGACY_KEY), before);
  });
});
