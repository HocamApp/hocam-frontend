import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

function sessionRow(id: string, start: string, localDate: string) {
  return {
    id,
    service_period_id: "p-1",
    sequence_number: 1,
    week_index: 1,
    status: "completed",
    scheduled_start: start,
    scheduled_local_date: localDate,
    scheduled_local_time: "18:30",
    duration_minutes: 30,
    reschedule_count: 0,
    report_due_at: null,
    report_overdue: false,
    complaint_eligible_at: null,
    complaint_eligible: false,
  };
}

const sessions = [
  sessionRow("s1", "2026-10-05T15:30:00Z", "2026-10-05"),
  sessionRow("s2", "2026-10-08T15:30:00Z", "2026-10-08"),
  sessionRow("s3", "2026-10-12T15:30:00Z", "2026-10-12"),
];

const revision = {
  id: "rev-2",
  revision_number: 2,
  source_draft_version: 3,
  published_at: "2026-10-13T07:00:00Z",
  change_note: "Kaynak listesi eklendi.",
  session_id: "s3",
  scheduled_start: "2026-10-12T15:30:00Z",
  student_feedback: null as string | null,
  content: {
    short_summary: "Hedefler netleştirildi, problemler önceliklendirildi.",
    topics_discussed: "Fonksiyonlar ve türev",
    student_progress: "İstikrarlı ilerleme",
    next_priorities: "Problemler, türev hız çalışması",
    study_recommendations: "Her gün 20 soru",
    focus_until_next_meeting: "Günde 20 türev sorusu.",
  },
};

let current: typeof revision = revision;
let reportFails = false;
let threadMissing = false;
const requested: string[] = [];
const posted: { url: string; body: unknown }[] = [];

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
      useParams: () => ({ reportId: "r3" }),
      useRouter: () => ({ push() {}, replace() {}, back() {} }),
      usePathname: () => "/dashboard/student/coaching/reports/r3",
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
        requested.push(url);
        if (url === "/coaching/reports/r3/") {
          if (reportFails) throw httpError(500);
          return { data: current };
        }
        if (url === "/coaching/reports/r3/pdf/") return { data: new Blob(["pdf"]) };
        if (url === "/coaching/sessions/") return { data: sessions };
        if (url === "/coaching/scheduling/") {
          if (threadMissing) throw httpError(404);
          return { data: { id: "cp-1", service_period_id: "p-1", service_status: "active", frequency: "weekly", weeks: 4, total_sessions: 8, slot_selection_deadline_at: null, required_slot_count: 1 } };
        }
        if (url === "/coaching/purchases/cp-1/conversation/") return { data: { id: "c-1" } };
        throw new Error(`unexpected GET ${url}`);
      },
      post: async (url: string, body: unknown) => {
        posted.push({ url, body });
        return { data: { choice: (body as { choice: string }).choice } };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  current = revision;
  reportFails = false;
  threadMissing = false;
  requested.length = 0;
  posted.length = 0;
  window.URL.createObjectURL = () => "blob:report";
  window.URL.revokeObjectURL = () => {};
  HTMLAnchorElement.prototype.click = () => {};
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

describe("student report detail: the head", () => {
  it("says which meeting it is, when it came out, which version, and what changed", async () => {
    renderPage();

    assert.ok(screen.getByRole("heading", { level: 1, name: "Görüşme raporu" }));
    const head = await screen.findByRole("region", { name: "Rapor başlığı" });
    assert.ok(within(head).getByRole("heading", { name: "3. görüşme raporu" }));
    assert.ok(within(head).getByText("12 Ekim Pazartesi 18:30 görüşmesi"));
    assert.ok(within(head).getByText("Yayınlandı 13 Ekim Salı 10:00 · Sürüm 2"));
    assert.ok(within(head).getByText("Kaynak listesi eklendi."));
    assert.ok(within(head).getByText("Güncellendi:"));
  });

  it("downloads the PDF from a solid gold button", async () => {
    renderPage();

    const button = await screen.findByRole("button", { name: "PDF indir" });
    assert.match(button.className, /bg-gold/);
    assert.doesNotMatch(button.className, /border-ink|bg-transparent/);
    fireEvent.click(button);
    await waitFor(() => assert.ok(requested.includes("/coaching/reports/r3/pdf/")));
  });
});

describe("student report detail: the text", () => {
  it("reads in ink, not in the muted grey", async () => {
    renderPage();

    const summary = await screen.findByText("Hedefler netleştirildi, problemler önceliklendirildi.");
    assert.match(summary.className, /text-ink/);
    assert.doesNotMatch(summary.className, /text-ink-mid/);
    assert.ok(screen.getByText("Günde 20 türev sorusu."));
  });
});

describe("student report detail: the feedback", () => {
  it("offers Hocana yaz once the student asks for a change, in the coaching thread", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Bu hedefi değiştirmek istiyorum" }));
    await waitFor(() =>
      assert.deepEqual(posted, [{ url: "/coaching/reports/r3/feedback/", body: { choice: "want_to_change_goal" } }]),
    );
    const link = await screen.findByRole("link", { name: "Hocana yaz" });
    assert.equal(link.getAttribute("href"), "/messages/c-1");
  });

  it("shows no way to write when the thread is gone, and keeps the choices", async () => {
    threadMissing = true;
    current = { ...revision, student_feedback: "want_to_leave_note" };
    renderPage();

    const chip = await screen.findByRole("button", { name: "Öğretmenime not bırakmak istiyorum" });
    assert.equal(chip.getAttribute("aria-pressed"), "true");
    await waitFor(() => assert.ok(requested.includes("/coaching/scheduling/")));
    assert.equal(screen.queryByRole("link", { name: "Hocana yaz" }), null);
  });
});

describe("student report detail: states", () => {
  it("says the report could not be read and retries", async () => {
    reportFails = true;
    renderPage();

    assert.ok(await screen.findByText("Rapor yüklenemedi."));
    reportFails = false;
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    await screen.findByRole("region", { name: "Rapor başlığı" });
  });
});
