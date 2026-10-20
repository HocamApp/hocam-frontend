import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const open = {
  id: "d1",
  category: "report_absent",
  status: "under_review",
  description: "3. görüşmenin raporu cuma gününe kadar teslim edilmedi.",
  submitted_at: "2026-10-15T11:20:00Z",
  service_period_id: "sp-1",
  session_id: "s-3",
  determination: null,
  selected_remedy: null,
  application: null,
  refund: { liability_minor: 0, settled_minor: 0, state: "none" },
  evidence: [
    {
      id: "e1",
      original_name: "ekran-goruntusu.png",
      mime_type: "image/png",
      size_bytes: 1200,
      scan_state: "active",
      validated_at: null,
      deleted_requested: false,
    },
  ],
  tutor_responses: [{ body: "Rapor sistem hatası yüzünden gecikti.", created_at: "2026-10-16T07:15:00Z" }],
  timeline: [
    { event_type: "created", participant_message: "Bildirimin alındı.", created_at: "2026-10-15T11:20:00Z" },
    { event_type: "review", participant_message: "Destek ekibi incelemeye başladı.", created_at: "2026-10-16T06:00:00Z" },
  ],
};

const decided = {
  ...open,
  status: "awaiting_student_choice",
  determination: {
    id: "det-1",
    merit: "student_upheld",
    allowed_remedies: ["reschedule", "period_refund", "terminate_remaining"],
    determined_at: "2026-10-17T13:30:00Z",
  },
};

const applied = {
  ...decided,
  status: "resolved",
  selected_remedy: "period_refund",
  application: {
    id: "app-1",
    remedy_type: "period_refund",
    applied_at: "2026-10-18T10:00:00Z",
    session_id: null,
    service_period_id: "sp-1",
    refund_obligation_status: "pending",
  },
  refund: { liability_minor: 240000, settled_minor: 0, state: "processing" },
};

let current: unknown = open;
let loadStatus = 200;
let removeFails = false;
let viewFails = false;
const posted: { url: string; body: unknown }[] = [];
const deleted: string[] = [];
const opened: string[] = [];

function httpError(status: number) {
  return Object.assign(new Error(`http ${status}`), { response: { status } });
}

let Page: React.ComponentType;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("next/navigation", {
    namedExports: {
      useParams: () => ({ disputeId: "d1" }),
      useRouter: () => ({ push() {}, replace() {}, back() {} }),
      usePathname: () => "/dashboard/student/coaching/complaints/d1",
      useSearchParams: () => new URLSearchParams(),
    },
  });
  mock.module("@/components/shared/RouteGuard", {
    namedExports: { RouteGuard: ({ children }: { children: React.ReactNode }) => <>{children}</> },
  });
  mock.module("@/components/coaching/CoachingPageShell", {
    namedExports: {
      CoachingPageShell: ({ title, children }: { title: string; children: React.ReactNode }) => (
        <main>
          <h1>{title}</h1>
          {children}
        </main>
      ),
    },
  });
  mock.module("sonner", { namedExports: { toast: { success() {}, error() {} } } });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/coaching/disputes/d1/") {
          if (loadStatus !== 200) throw httpError(loadStatus);
          return { data: current };
        }
        if (url === "/coaching/dispute-evidence/e1/") {
          if (viewFails) throw httpError(500);
          return { data: { url: "https://files.example/e1" } };
        }
        throw new Error(`unexpected GET ${url}`);
      },
      post: async (url: string, body: unknown) => {
        posted.push({ url, body });
        if (url === "/coaching/disputes/d1/remedy/") current = applied;
        return { data: {} };
      },
      delete: async (url: string) => {
        deleted.push(url);
        if (removeFails) throw httpError(500);
        return { data: {} };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  current = open;
  loadStatus = 200;
  removeFails = false;
  viewFails = false;
  posted.length = 0;
  deleted.length = 0;
  opened.length = 0;
  window.open = ((url?: string | URL) => {
    opened.push(String(url));
    return null;
  }) as typeof window.open;
});
afterEach(cleanup);

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>,
  );
}

describe("student complaint detail: the head and the process", () => {
  it("is titled Sorun bildirimi, names the complaint, when it was filed, and how it stands", async () => {
    renderPage();

    assert.ok(screen.getByRole("heading", { level: 1, name: "Sorun bildirimi" }));
    const head = await screen.findByRole("region", { name: "Sorun özeti" });
    assert.ok(within(head).getByRole("heading", { name: "Rapor hazırlanmadı" }));
    assert.ok(within(head).getByText(/15 Ekim Perşembe 14:20/));
    assert.ok(within(head).getByText("İnceleniyor"));
    assert.ok(within(head).getByText("3. görüşmenin raporu cuma gününe kadar teslim edilmedi."));
    assert.equal(screen.getByRole("link", { name: "Tüm bildirimlerim" }).getAttribute("href"), "/dashboard/student/coaching/complaints");
  });

  it("shows the tutor's reply with its date", async () => {
    renderPage();

    const reply = await screen.findByRole("region", { name: "Hocanın yanıtı" });
    assert.ok(within(reply).getByText("16 Ekim Cuma 10:15"));
    assert.ok(within(reply).getByText("Rapor sistem hatası yüzünden gecikti."));
  });

  it("has no reply section when the tutor has not answered", async () => {
    current = { ...open, tutor_responses: [] };
    renderPage();

    await screen.findByRole("region", { name: "Süreç" });
    assert.equal(screen.queryByRole("region", { name: "Hocanın yanıtı" }), null);
  });

  it("dates every step of the process", async () => {
    renderPage();

    const process = await screen.findByRole("region", { name: "Süreç" });
    const steps = within(process).getAllByRole("listitem");
    assert.deepEqual(
      steps.map((step) => step.textContent),
      ["15 Ekim Perşembe 14:20Bildirimin alındı.", "16 Ekim Cuma 09:00Destek ekibi incelemeye başladı."],
    );
  });

  it("says when more information is wanted", async () => {
    current = { ...open, status: "needs_more_info" };
    renderPage();

    assert.ok(await screen.findByRole("heading", { name: "Ek bilgi gerekli" }));
  });
});

describe("student complaint detail: evidence", () => {
  it("adds a file from a solid gold button", async () => {
    renderPage();

    const evidence = await screen.findByRole("region", { name: "Kanıtlar" });
    const picker = within(evidence).getByText("Kanıt dosyası ekle").closest("label")!;
    assert.match(picker.className, /bg-gold/);
    assert.doesNotMatch(picker.className, /border-dashed|bg-transparent/);
  });

  it("opens a file, and says so when it cannot be opened", async () => {
    renderPage();

    const evidence = await screen.findByRole("region", { name: "Kanıtlar" });
    fireEvent.click(within(evidence).getByRole("button", { name: "Görüntüle" }));
    await waitFor(() => assert.deepEqual(opened, ["https://files.example/e1"]));

    viewFails = true;
    fireEvent.click(within(evidence).getByRole("button", { name: "Görüntüle" }));
    assert.ok(await within(evidence).findByText("Dosya görüntülenemedi."));
  });

  it("says when a deletion request did not go through", async () => {
    removeFails = true;
    renderPage();

    const evidence = await screen.findByRole("region", { name: "Kanıtlar" });
    fireEvent.click(within(evidence).getByRole("button", { name: "Silinmesini iste" }));

    assert.ok(await within(evidence).findByText("Silme talebi gönderilemedi."));
    assert.deepEqual(deleted, ["/coaching/dispute-evidence/e1/"]);
  });
});

describe("student complaint detail: choosing a remedy", () => {
  beforeEach(() => {
    current = decided;
  });

  it("offers each remedy with a solid gold button and says how the review ended", async () => {
    renderPage();

    const choice = await screen.findByRole("region", { name: "Seçimin gerekli" });
    assert.ok(within(choice).getByText(/İnceleme sonucu: Öğrenci lehine/));
    for (const label of ["Yeniden görüşme", "İlgili dönem iadesi", "Kalan koçluğu sonlandır"]) {
      const button = within(choice).getByRole("button", { name: `${label}: Bunu seç` });
      assert.match(button.className, /bg-gold/);
    }
  });

  it("asks first, and applies nothing if the student backs out", async () => {
    renderPage();

    const choice = await screen.findByRole("region", { name: "Seçimin gerekli" });
    fireEvent.click(within(choice).getByRole("button", { name: "İlgili dönem iadesi: Bunu seç" }));
    const dialog = await screen.findByRole("dialog");
    assert.ok(within(dialog).getByText(/sonra değiştiremezsin/));
    assert.ok(within(dialog).getByText(/İlgili dönem iadesi/));
    fireEvent.click(within(dialog).getByRole("button", { name: "Vazgeç" }));

    await waitFor(() => assert.equal(screen.queryByRole("dialog"), null));
    assert.equal(posted.length, 0);
  });

  it("applies the remedy on confirmation, then says what was chosen and the refund that followed", async () => {
    renderPage();

    const choice = await screen.findByRole("region", { name: "Seçimin gerekli" });
    fireEvent.click(within(choice).getByRole("button", { name: "İlgili dönem iadesi: Bunu seç" }));
    fireEvent.click(await screen.findByRole("button", { name: "Seçimi onayla" }));

    await waitFor(() =>
      assert.deepEqual(posted, [
        { url: "/coaching/disputes/d1/remedy/", body: { remedy_type: "period_refund", determination_id: "det-1" } },
      ]),
    );
    const chosen = await screen.findByRole("region", { name: "Seçtiğin çözüm" });
    assert.ok(within(chosen).getByText("İlgili dönem iadesi"));
    assert.ok(within(chosen).getByText("İade işlemi işleniyor."));
    assert.equal(screen.queryByRole("region", { name: "Seçimin gerekli" }), null);
  });
});

describe("student complaint detail: states", () => {
  it("says the complaint could not be read and tries again", async () => {
    loadStatus = 500;
    renderPage();

    assert.ok(await screen.findByText("Sorun bildirimin yüklenemedi."));
    loadStatus = 200;
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    await screen.findByRole("region", { name: "Sorun özeti" });
  });

  it("says the complaint was not found", async () => {
    loadStatus = 404;
    renderPage();

    assert.ok(await screen.findByText("Sorun bildirimi bulunamadı"));
  });
});
