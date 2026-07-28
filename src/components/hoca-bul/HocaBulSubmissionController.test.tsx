import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { writePreview } from "@/lib/hocaBulPreviewCache";
import type { HocaBulAnalyticsPayload } from "@/types/hocaBul";
import type { MatchingAnswers, MatchingPreview } from "@/types";

const answers: MatchingAnswers = {
  goal: "DGS",
  stage: "ongoing",
  subject_keys: ["matematik"],
  challenges: ["foundations"],
  teaching_styles: ["question_speed"],
  availability_windows: ["weekday_evening"],
  budget_segment: "balanced",
  schema_version: 1,
};

const preview: MatchingPreview = { matches: [], candidate_count: 4 };
const routerCalls: string[] = [];
const analytics: HocaBulAnalyticsPayload[] = [];
let previewCalls = 0;
let preferenceCalls = 0;
let previewError: unknown = null;
let preferenceError: unknown = null;
let lastPreviewOptions: { signal?: AbortSignal; timeoutMs?: number } | undefined;
let holdPreview = false;
let releasePreview: (() => void) | null = null;

mock.module("next/navigation", {
  namedExports: {
    useRouter: () => ({ push: (href: string) => routerCalls.push(href) }),
  },
});

mock.module("@/hooks/useAuth", {
  namedExports: {
    useAuth: () => ({ user: { id: "student-1", role: "student" } }),
  },
});

mock.module("@/lib/matchingApi", {
  namedExports: {
    previewTutorMatches: async (
      _answers: MatchingAnswers,
      options?: { signal?: AbortSignal; timeoutMs?: number }
    ) => {
      previewCalls += 1;
      lastPreviewOptions = options;
      if (previewError) throw previewError;
      if (holdPreview) {
        await new Promise<void>((resolve) => { releasePreview = resolve; });
      }
      return preview;
    },
    saveMatchingPreferences: async () => {
      preferenceCalls += 1;
      if (preferenceError) throw preferenceError;
      return { ...answers, updated_at: "2026-07-28T12:00:00Z" };
    },
  },
});

mock.module("@/lib/hocaBulAnalytics", {
  namedExports: {
    trackHocaBul: (payload: HocaBulAnalyticsPayload) => analytics.push(payload),
  },
});

mock.module("./HocaBulWizard", {
  namedExports: {
    HocaBulWizard: ({
      onComplete,
      completionPending,
    }: {
      onComplete?: (payload: MatchingAnswers) => void;
      completionPending?: boolean;
    }) => (
      <button
        type="button"
        disabled={completionPending}
        onClick={() => onComplete?.(answers)}
      >
        Complete
      </button>
    ),
  },
});

let HocaBulSubmissionController: React.ComponentType | null = null;

async function loadController() {
  if (HocaBulSubmissionController) return;
  HocaBulSubmissionController = (await import("./HocaBulSubmissionController"))
    .HocaBulSubmissionController;
}

function renderController() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      {HocaBulSubmissionController ? <HocaBulSubmissionController /> : null}
    </QueryClientProvider>
  );
}

beforeEach(async () => {
  await loadController();
  window.sessionStorage.clear();
  routerCalls.length = 0;
  analytics.length = 0;
  previewCalls = 0;
  preferenceCalls = 0;
  previewError = null;
  preferenceError = null;
  lastPreviewOptions = undefined;
  holdPreview = false;
  releasePreview = null;
});

afterEach(cleanup);

describe("hoca-bul submission", () => {
  it("shows approved loading copy, caches a miss, saves preferences and navigates", async () => {
    renderController();

    fireEvent.click(screen.getByRole("button", { name: "Complete" }));

    assert.ok(
      await screen.findByRole("heading", {
        name: "Sana uygun hocaları karşılaştırıyoruz",
      })
    );
    await waitFor(() => assert.deepEqual(routerCalls, ["/hoca-bul/sonuclar"]));
    assert.equal(previewCalls, 1);
    assert.equal(preferenceCalls, 1);
    assert.equal(lastPreviewOptions?.timeoutMs, 15_000);
    assert.ok(lastPreviewOptions?.signal instanceof AbortSignal);
    assert.deepEqual(analytics, [
      {
        event: "hoca_bul_submitted",
        goal: "DGS",
        subject_count: 1,
        served_from_cache: false,
      },
    ]);
  });

  it("uses a valid cache without posting and records the cache source", async () => {
    writePreview(window.sessionStorage, "student-1", answers, preview);
    renderController();

    fireEvent.click(screen.getByRole("button", { name: "Complete" }));

    await waitFor(() => assert.deepEqual(routerCalls, ["/hoca-bul/sonuclar"]));
    assert.equal(previewCalls, 0);
    assert.equal(preferenceCalls, 1);
    assert.equal(
      analytics.find((item) => item.event === "hoca_bul_submitted")?.served_from_cache,
      true
    );
  });

  it("shows the exact 429 message and retries through the network", async () => {
    previewError = { isAxiosError: true, response: { status: 429 } };
    renderController();
    fireEvent.click(screen.getByRole("button", { name: "Complete" }));

    assert.ok(
      await screen.findByText("Çok fazla deneme yaptın. Birkaç dakika sonra tekrar dene.")
    );
    previewError = null;
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));

    await waitFor(() => assert.deepEqual(routerCalls, ["/hoca-bul/sonuclar"]));
    assert.equal(previewCalls, 2);
  });

  it("does not block valid results when preference persistence fails", async () => {
    preferenceError = new Error("preference unavailable");
    renderController();
    fireEvent.click(screen.getByRole("button", { name: "Complete" }));

    await waitFor(() => assert.deepEqual(routerCalls, ["/hoca-bul/sonuclar"]));
    assert.equal(preferenceCalls, 1);
    assert.equal(screen.queryByRole("alert"), null);
  });

  it("locks duplicate completion attempts while the preview is pending", async () => {
    holdPreview = true;
    renderController();
    const complete = screen.getByRole("button", { name: "Complete" });
    fireEvent.click(complete);
    fireEvent.click(complete);
    await waitFor(() => assert.equal(previewCalls, 1));
    releasePreview?.();
    await waitFor(() => assert.deepEqual(routerCalls, ["/hoca-bul/sonuclar"]));
  });

  it("aborts the active preview on unmount without showing an error", async () => {
    holdPreview = true;
    const view = renderController();
    fireEvent.click(screen.getByRole("button", { name: "Complete" }));
    await waitFor(() => assert.ok(lastPreviewOptions?.signal));
    view.unmount();
    assert.equal(lastPreviewOptions?.signal?.aborted, true);
    releasePreview?.();
    assert.equal(screen.queryByRole("alert"), null);
  });
});
