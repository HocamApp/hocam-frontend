import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createDraft, writeDraft } from "@/lib/hocaBulDraft";
import { writePreview } from "@/lib/hocaBulPreviewCache";
import type { MatchingAnswers, MatchingPreview, TutorMatchResult } from "@/types";

const tracked: unknown[] = [];
const routerCalls: string[] = [];
let preference: MatchingAnswers & { updated_at: string } | null = null;
let preferenceCalls = 0;
let previewCalls = 0;

before(async () => {
  mock.module("next/link", {
    namedExports: {
      default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
        React.createElement("a", { href, ...props }, children),
    },
  });
  mock.module("@/lib/hocaBulAnalytics", {
    namedExports: { trackHocaBul: (event: unknown) => tracked.push(event) },
  });
  mock.module("next/navigation", {
    namedExports: { useRouter: () => ({ push: (href: string) => routerCalls.push(href), replace: (href: string) => routerCalls.push(href) }) },
  });
  mock.module("@/hooks/useAuth", {
    namedExports: { useAuth: () => ({ user: { id: "student-1", role: "student" } }) },
  });
  mock.module("@/lib/matchingApi", {
    namedExports: {
      fetchMatchingPreferences: async () => { preferenceCalls += 1; return preference; },
      fetchMatchingOptions: async () => ({
        goals: [{ value: "YKS", label: "YKS" }],
        stages: { YKS: [{ value: "12", label: "12. sınıf" }], DGS: [], KPSS: [], UNDECIDED: [] },
        subjects: [{ key: "mat", label: "Matematik", subject_ids: ["1"], exam_types: ["TYT"], tutor_count: 2 }],
        budget_ranges: [{ id: "balanced", label: "Dengeli", min: 400, max: 700 }],
      }),
      previewTutorMatches: async () => { previewCalls += 1; return { matches: [], candidate_count: 2 }; },
      saveMatchingPreferences: async () => preference,
    },
  });
  mock.module("@/hooks/useFavorites", {
    namedExports: {
      useFavorites: () => ({
        favoriteIds: new Set<string>(),
        toggle: () => undefined,
        isFavoritePending: () => false,
      }),
    },
  });
  mock.module("@/components/tutors/FavoriteButton", {
    namedExports: {
      FavoriteButton: ({ tutorId }: { tutorId: string }) =>
        React.createElement("button", { "aria-label": `favori-${tutorId}` }),
    },
  });
});

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  routerCalls.length = 0;
  preference = null;
  preferenceCalls = 0;
  previewCalls = 0;
});

afterEach(() => {
  cleanup();
  tracked.length = 0;
});

const answers: MatchingAnswers = {
  goal: "YKS", stage: "12", subject_keys: ["mat"], challenges: ["foundations"],
  teaching_styles: ["foundations_patient"], availability_windows: ["weekday_evening"],
  budget_segment: "balanced", schema_version: 1,
};

function match(id: string, level: TutorMatchResult["match_level"]): TutorMatchResult {
  return {
    tutor: {
      id, name: `Ad${id}`, surname: "Soyad", profile_picture: "",
      university: "Boğaziçi Üniversitesi", department: "Matematik",
      hourly_price: 600, rating: 4.9, total_reviews: 0,
      completed_lessons_count: 12, is_verified: id === "s",
      subjects: [],
    },
    score: 99, match_level: level,
    reason_codes: ["subject_match", "availability_match", "teaching_style_match", "budget_match"],
    caveat_codes: level === "strong" ? [] : ["budget_relaxed"],
    matched_subjects: ["Matematik"], matched_styles: ["foundations_patient"],
    nearest_available_at: id === "s" ? "2026-07-29T17:00:00Z" : null,
  };
}

describe("HocaBulResultsView", () => {
  it("groups strong results first and renders only supported real details", async () => {
    const { HocaBulResultsView } = await import("./HocaBulResultsView");
    const preview: MatchingPreview = { matches: [match("r", "budget_relaxed"), match("s", "strong")], candidate_count: 8 };
    render(<HocaBulResultsView preview={preview} answers={answers} />);

    const articles = screen.getAllByRole("article");
    assert.match(articles[0].textContent ?? "", /Ads Soyad/);
    assert.match(articles[1].textContent ?? "", /Adr Soyad/);
    assert.ok(screen.getByText("Tercihlerine tam uymayan ama yakın öneriler"));
    assert.equal(screen.getAllByText("Henüz değerlendirme yok").length, 2);
    assert.equal(screen.getAllByText("Matematik dersinde uyum").length, 2);
    assert.ok(screen.getByText("Bu hoca seçtiğin bütçe aralığının üzerinde."));
    assert.equal(screen.queryByText(/99|%|yapay zek/i), null);
    assert.equal(screen.getAllByLabelText("Doğrulanmış hoca").length, 1);
    assert.equal(screen.getByRole("link", { name: /Ads Soyad profilini gör/i }).getAttribute("href"), "/tutors/s");
    const editControl = screen.getByRole("link", { name: "Tercihlerimi düzenle" });
    assert.equal(editControl.getAttribute("href"), "/hoca-bul?adim=kontrol&kaynak=sonuclar");
    assert.match(editControl.className, /border/);
    assert.match(editControl.className, /min-h-11/);
  });

  it("renders the approved zero state and edit/all-tutor actions", async () => {
    const { HocaBulResultsView } = await import("./HocaBulResultsView");
    render(<HocaBulResultsView preview={{ matches: [], candidate_count: 0 }} answers={answers} />);
    assert.ok(screen.getByRole("heading", { name: "Şu an tam uyan bir hoca bulamadık" }));
    assert.equal(screen.getByRole("link", { name: "Bütçemi genişlet" }).getAttribute("href"), "/hoca-bul?adim=butce&kaynak=sonuclar");
    assert.equal(screen.getByRole("link", { name: "Tüm hocaları gör" }).getAttribute("href"), "/tutors");
    fireEvent.click(screen.getByRole("link", { name: "Tüm hocaları gör" }));
    assert.deepEqual(tracked.at(-1), { event: "hoca_bul_all_tutors_clicked", candidate_count: 0 });
  });
});

describe("HocaBulResults route resolution", () => {
  function renderResults(Component: React.ComponentType) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    return render(<QueryClientProvider client={client}><Component /></QueryClientProvider>);
  }

  it("lets a partial current draft win and redirects to its exact first gap", async () => {
    writeDraft(window.localStorage, createDraft("student-1", Date.now(), {
      answers: { goal: "YKS", stage: "12" }, client: { yks_alan: ["unsure"] }, stepId: "dersler",
    }));
    const { HocaBulResults } = await import("./HocaBulResults");
    renderResults(HocaBulResults);
    await waitFor(() => assert.equal(routerCalls.at(-1), "/hoca-bul?adim=dersler&kaynak=sonuclar"));
    assert.equal(preferenceCalls, 0);
    assert.equal(previewCalls, 0);
  });

  it("uses a saved preference only when no draft exists and seeds a YKS draft", async () => {
    preference = { ...answers, updated_at: "2026-07-28T12:00:00Z" };
    const { HocaBulResults } = await import("./HocaBulResults");
    renderResults(HocaBulResults);
    await screen.findByRole("heading", { name: "Şu an tam uyan bir hoca bulamadık" });
    assert.equal(preferenceCalls, 1);
    assert.equal(previewCalls, 1);
    assert.match(window.localStorage.getItem("hocam:hoca-bul-draft:v1:student-1") ?? "", /unsure/);
  });

  it("renders a valid user-scoped cache immediately without API calls", async () => {
    writeDraft(window.localStorage, createDraft("student-1", Date.now(), {
      answers, client: { yks_alan: ["unsure"] }, stepId: "kontrol",
    }));
    writePreview(window.sessionStorage, "student-1", answers, { matches: [], candidate_count: 9 });
    const { HocaBulResults } = await import("./HocaBulResults");
    renderResults(HocaBulResults);
    await screen.findByRole("heading", { name: "Şu an tam uyan bir hoca bulamadık" });
    assert.equal(preferenceCalls, 0);
    assert.equal(previewCalls, 0);
  });

  it("redirects to the goal step when neither a draft nor a preference exists", async () => {
    const { HocaBulResults } = await import("./HocaBulResults");
    renderResults(HocaBulResults);
    await waitFor(() => assert.equal(routerCalls.at(-1), "/hoca-bul?adim=hedef"));
  });
});

/**
 * The resolution depends on localStorage and sessionStorage, which the query key
 * cannot observe. These cases run against the real production cache defaults and
 * one shared client across both visits — exactly what the app does — so a
 * resolution that is replayed instead of recomputed fails here.
 */
describe("HocaBulResults revisit resolution", () => {
  // Mirrors src/lib/queryClient.ts. Copied rather than imported so a future
  // change to the app-wide default cannot silently disarm this regression.
  const PRODUCTION_STALE_TIME = 1000 * 60 * 5;

  function productionClient() {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: PRODUCTION_STALE_TIME,
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });
  }

  function mount(client: QueryClient, Component: React.ComponentType) {
    return render(
      <QueryClientProvider client={client}>
        <Component />
      </QueryClientProvider>
    );
  }

  function completeDraft() {
    writeDraft(
      window.localStorage,
      createDraft("student-1", Date.now(), {
        answers,
        client: { yks_alan: ["unsure"] },
        stepId: "kontrol",
      })
    );
  }

  it("does not replay a cold-visit redirect after the student finishes the wizard", async () => {
    const { HocaBulResults } = await import("./HocaBulResults");
    const client = productionClient();

    // Visit one: nothing stored yet, so the route sends them to the first step.
    mount(client, HocaBulResults);
    await waitFor(() => assert.equal(routerCalls.at(-1), "/hoca-bul?adim=hedef"));
    cleanup();

    // The student then completes the wizard and submits, which writes the draft
    // and the preview cache before the results route is opened again. The
    // baseline is taken after unmount so it counts only what the second visit
    // navigates, not the first visit's own trailing effect run.
    completeDraft();
    writePreview(window.sessionStorage, "student-1", answers, {
      matches: [],
      candidate_count: 9,
    });
    const redirectsBefore = routerCalls.length;

    mount(client, HocaBulResults);

    await screen.findByRole("heading", {
      name: "Şu an tam uyan bir hoca bulamadık",
    });
    assert.deepEqual(
      routerCalls.slice(redirectsBefore),
      [],
      "the stale redirect must not fire again on the second visit"
    );
  });

  it("resolves the new preview after preferences are edited and resubmitted", async () => {
    const { HocaBulResults } = await import("./HocaBulResults");
    const client = productionClient();

    // Visit one: the current answers genuinely match nobody.
    completeDraft();
    writePreview(window.sessionStorage, "student-1", answers, {
      matches: [],
      candidate_count: 9,
    });
    mount(client, HocaBulResults);
    await screen.findByRole("heading", {
      name: "Şu an tam uyan bir hoca bulamadık",
    });
    cleanup();

    // The student widens their budget and resubmits. New answers, new hash, so
    // the wizard writes a second preview entry beside the first.
    const widened: MatchingAnswers = { ...answers, budget_segment: "flexible" };
    writeDraft(
      window.localStorage,
      createDraft("student-1", Date.now(), {
        answers: widened,
        client: { yks_alan: ["unsure"] },
        stepId: "kontrol",
      })
    );
    writePreview(window.sessionStorage, "student-1", widened, {
      matches: [match("s", "strong")],
      candidate_count: 4,
    });

    mount(client, HocaBulResults);

    // The widened answers must win; the previous empty result must not persist.
    await screen.findByRole("article", { name: "Ads Soyad" });
    assert.equal(
      screen.queryByRole("heading", {
        name: "Şu an tam uyan bir hoca bulamadık",
      }),
      null
    );
    // Both visits were served from the session cache, so no request was needed.
    assert.equal(previewCalls, 0);
  });
});
