import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

let draftContent: Record<string, unknown> | null;
let draftFails = false;
const puts: Record<string, unknown>[] = [];

function httpError(status: number) {
  return Object.assign(new Error(`http ${status}`), { response: { status, data: {} } });
}

let QuickDraft: React.ComponentType<{ sessionId: string; autosaveDelayMs?: number }>;

before(async () => {
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        assert.equal(url, "/coaching/sessions/s-1/report-draft/");
        if (draftFails) throw httpError(500);
        if (draftContent === null) throw httpError(404);
        return { data: { id: "r-1", session_id: "s-1", draft_version: 1, content: draftContent, updated_at: "" } };
      },
      put: async (url: string, body: Record<string, unknown>) => {
        assert.equal(url, "/coaching/sessions/s-1/report-draft/");
        puts.push(body);
        return { data: { id: "r-1", session_id: "s-1", draft_version: 2, content: { ...draftContent, ...body }, updated_at: "" } };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ CoachingReportQuickDraft: QuickDraft } = await import("./CoachingReportQuickDraft"));
});

beforeEach(() => {
  draftContent = null;
  draftFails = false;
  puts.length = 0;
});
afterEach(cleanup);

function renderDraft(delay = 20) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <QuickDraft sessionId="s-1" autosaveDelayMs={delay} />
    </QueryClientProvider>,
  );
}

describe("the short report form in the room", () => {
  it("asks only for the summary and the topics, with the same labels and counters as the full form", async () => {
    renderDraft();

    assert.ok(await screen.findByLabelText("Kısa özet"));
    assert.ok(screen.getByLabelText("Görüşülen konular"));
    assert.ok(screen.getByText("0 / en az 50"));
    assert.equal(screen.queryByLabelText("Öğrencinin ilerlemesi"), null);
    assert.equal(screen.queryByRole("button", { name: /yayınla/i }), null);
    assert.equal(screen.queryByRole("button", { name: /Taslağı kaydet/ }), null);
  });

  it("opens the full report in a new tab, so the call is not left", async () => {
    renderDraft();

    const link = await screen.findByRole("link", { name: "Tam raporu aç" });
    assert.equal(link.getAttribute("href"), "/dashboard/tutor/coaching/sessions/s-1/report");
    assert.equal(link.getAttribute("target"), "_blank");
    assert.match(link.getAttribute("rel") ?? "", /noopener/);
    assert.match(link.className, /bg-gold/);
  });

  it("shows what is already in the draft and saves only the field that is typed in", async () => {
    draftContent = { short_summary: "Önceki özet metni burada duruyor, elli karakteri geçsin diye uzatıldı.", topics_discussed: "" };
    renderDraft();

    const summary = (await screen.findByLabelText("Kısa özet")) as HTMLTextAreaElement;
    assert.match(summary.value, /^Önceki özet/);
    fireEvent.change(screen.getByLabelText("Görüşülen konular"), { target: { value: "Türev ve paragraf süresi" } });

    await waitFor(() => assert.equal(puts.length, 1));
    assert.deepEqual(puts[0], { topics_discussed: "Türev ve paragraf süresi" });
    await waitFor(() => assert.match(screen.getByRole("status", { name: "Kayıt durumu" }).textContent ?? "", /^Kaydedildi/));
  });

  it("says the draft could not be read, with a way to try again, instead of showing empty boxes to type into", async () => {
    draftFails = true;
    renderDraft();

    assert.ok(await screen.findByText("Rapor taslağı yüklenemedi."));
    assert.equal(screen.queryByLabelText("Kısa özet"), null);
    draftFails = false;
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    assert.ok(await screen.findByLabelText("Kısa özet"));
  });
});
