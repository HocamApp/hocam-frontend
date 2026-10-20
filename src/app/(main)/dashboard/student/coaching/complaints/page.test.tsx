import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

function dispute(id: string, category: string, status: string, submittedAt: string) {
  return {
    id,
    category,
    status,
    description: "Açıklama",
    submitted_at: submittedAt,
    service_period_id: "sp-1",
    session_id: null,
    determination: null,
    selected_remedy: null,
    application: null,
    refund: { liability_minor: 0, settled_minor: 0, state: "none" },
    evidence: [],
    tutor_responses: [],
    timeline: [],
  };
}

const disputes = [
  dispute("d-old", "message_sla", "closed", "2026-10-02T18:40:00Z"),
  dispute("d-info", "report_absent", "needs_more_info", "2026-10-15T11:20:00Z"),
  dispute("d-done", "technical", "resolved", "2026-10-08T16:05:00Z"),
];

const activeState = {
  id: "cp-1",
  service_period_id: "sp-1",
  service_status: "active",
  frequency: "weekly",
  weeks: 4,
  total_sessions: 4,
  slot_selection_deadline_at: null,
  required_slot_count: 1,
};

const eligibility = {
  categories: ["report_absent", "program_absent", "other"],
  category_filing_deadlines: {
    report_absent: "2026-10-27T21:00:00Z",
    program_absent: "2026-10-27T21:00:00Z",
    other: "2026-10-29T10:00:00Z",
  },
  missing_report: { eligible: true, complaint_eligible_at: null, session_id: null },
  safety_intake_available: true,
};

const noRefund = {
  service_status: "active",
  financial_status: "none",
  collected_amount_minor: 0,
  refund_liability_minor: 0,
  refund_processing_count: 0,
  refund_settled_minor: 0,
  cancellation_pending: false,
  refund_state: "none",
};

let list: unknown[] = disputes;
let listFails = false;
let stateStatus = 200;
let state: unknown = activeState;
let financial: unknown = noRefund;
let financialFails = false;
let eligibilityValue: unknown = eligibility;
let eligibilityFails = false;
let search = "";
const posted: { url: string; body: unknown }[] = [];
const pushed: string[] = [];

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
      useRouter: () => ({ push: (href: string) => pushed.push(href), replace() {}, back() {} }),
      usePathname: () => "/dashboard/student/coaching/complaints",
      useSearchParams: () => new URLSearchParams(search),
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
        if (url === "/coaching/scheduling/") {
          if (stateStatus !== 200) throw httpError(stateStatus);
          return { data: state };
        }
        if (url === "/coaching/disputes/") {
          if (listFails) throw httpError(500);
          return { data: list };
        }
        if (url === "/coaching/purchases/cp-1/dispute-eligibility/") {
          if (eligibilityFails) throw httpError(500);
          return { data: eligibilityValue };
        }
        if (url === "/coaching/purchases/cp-1/financial-summary/") {
          if (financialFails) throw httpError(500);
          return { data: financial };
        }
        throw new Error(`unexpected GET ${url}`);
      },
      post: async (url: string, body: unknown) => {
        posted.push({ url, body });
        if (url === "/coaching/purchases/cp-1/disputes/") return { data: { id: "d-new" } };
        return { data: {} };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  list = disputes;
  listFails = false;
  stateStatus = 200;
  state = activeState;
  financial = noRefund;
  financialFails = false;
  eligibilityValue = eligibility;
  eligibilityFails = false;
  search = "";
  posted.length = 0;
  pushed.length = 0;
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

const cards = async () => within(await screen.findByRole("list", { name: "Bildirimler" })).getAllByRole("listitem");

describe("student Sorun bildir: the list", () => {
  it("is titled like its tab and says how many complaints wait for a step from the student", async () => {
    renderPage();

    assert.ok(screen.getByRole("heading", { level: 1, name: "Sorun bildir" }));
    assert.ok(await screen.findByText("3 bildirim · 1 tanesi senden bir adım bekliyor"));
  });

  it("lists what waits for the student first, with a solid gold way in, and the rest with a plain link", async () => {
    renderPage();

    const rows = await cards();
    assert.deepEqual(
      rows.map((row) => within(row).getByRole("heading", { level: 3 }).textContent),
      ["Rapor hazırlanmadı", "Teknik sorun", "Mesajıma süresinde yanıt verilmedi"],
    );
    assert.ok(within(rows[0]).getByText("Ek bilgi gerekli"));
    assert.ok(within(rows[0]).getByText("15 Ekim Perşembe 14:20"));
    const open = within(rows[0]).getByRole("link", { name: "Bildirimi aç" });
    assert.equal(open.getAttribute("href"), "/dashboard/student/coaching/complaints/d-info");
    assert.match(open.className, /bg-gold/);
    assert.doesNotMatch(open.className, /border-ink|bg-transparent/);
    const detail = within(rows[1]).getByRole("link", { name: "Ayrıntıyı gör" });
    assert.doesNotMatch(detail.className, /bg-gold|border-ink|bg-transparent/);
  });

  it("says the complaints could not be read, and tries again, instead of claiming there are none", async () => {
    listFails = true;
    renderPage();

    assert.ok(await screen.findByText("Bildirimlerin yüklenemedi."));
    assert.equal(screen.queryByText("Henüz bildirdiğin bir sorun yok"), null);

    listFails = false;
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    await cards();
    await waitFor(() => assert.equal(screen.queryByText("Bildirimlerin yüklenemedi."), null));
  });

  it("keeps the list when the coaching itself cannot be found", async () => {
    stateStatus = 404;
    renderPage();

    assert.equal((await cards()).length, 3);
    assert.equal(screen.queryByRole("button", { name: "Yeni sorun bildir" }), null);
    assert.equal(screen.queryByRole("region", { name: "Koçluğu sonlandır" }), null);
  });

  it("says there is no coaching record when there is neither a coaching nor a complaint", async () => {
    stateStatus = 404;
    list = [];
    renderPage();

    assert.ok(await screen.findByText("Koçluk kaydı bulunamadı"));
  });

  it("says the coaching could not be read, next to a list that still shows", async () => {
    stateStatus = 500;
    renderPage();

    assert.equal((await cards()).length, 3);
    assert.ok(await screen.findByText("Koçluk bilgilerin yüklenemedi."));
    assert.equal(screen.getAllByRole("button", { name: "Tekrar dene" }).length, 1);
  });
});

describe("student Sorun bildir: a new complaint", () => {
  it("opens the form by itself when there is nothing filed yet", async () => {
    list = [];
    renderPage();

    assert.ok(await screen.findByText("Henüz bildirdiğin bir sorun yok"));
    assert.ok(await screen.findByLabelText("Sorun konusu"));
    assert.equal(screen.queryByRole("button", { name: "Yeni sorun bildir" }), null);
  });

  it("opens the form from a solid gold button when complaints exist, with no topic chosen for the student", async () => {
    renderPage();

    await cards();
    assert.equal(screen.queryByLabelText("Sorun konusu"), null);
    const open = await screen.findByRole("button", { name: "Yeni sorun bildir" });
    assert.match(open.className, /bg-gold/);
    fireEvent.click(open);

    const topic = (await screen.findByLabelText("Sorun konusu")) as HTMLSelectElement;
    assert.equal(topic.value, "");
    assert.deepEqual(
      Array.from(topic.options).map((option) => option.text),
      ["Konu seç", "Rapor hazırlanmadı", "Çalışma programı hazırlanmadı", "Diğer"],
    );
    assert.equal(screen.queryByRole("button", { name: "Yeni sorun bildir" }), null);
  });

  it("says the last day to file for the chosen topic", async () => {
    list = [];
    renderPage();

    const topic = await screen.findByLabelText("Sorun konusu");
    assert.equal(screen.queryByText(/Son bildirim günü/), null);
    fireEvent.change(topic, { target: { value: "report_absent" } });
    assert.ok(screen.getByText("Son bildirim günü: 27 Ekim Salı"));
    fireEvent.change(topic, { target: { value: "other" } });
    assert.ok(screen.getByText("Son bildirim günü: 29 Ekim Perşembe"));
  });

  it("sends the complaint and goes to it, without reloading the page", async () => {
    list = [];
    renderPage();

    fireEvent.change(await screen.findByLabelText("Sorun konusu"), { target: { value: "report_absent" } });
    assert.equal((screen.getByRole("button", { name: "Sorunu gönder" }) as HTMLButtonElement).disabled, true);
    fireEvent.change(screen.getByLabelText("Durumun açıklaması"), { target: { value: "Rapor gelmedi." } });
    fireEvent.click(screen.getByRole("button", { name: "Sorunu gönder" }));

    await waitFor(() => assert.equal(posted.length, 1));
    assert.equal(posted[0].url, "/coaching/purchases/cp-1/disputes/");
    const body = posted[0].body as { category: string; description: string; submission_key: string };
    assert.equal(body.category, "report_absent");
    assert.equal(body.description, "Rapor gelmedi.");
    assert.equal(typeof body.submission_key, "string");
    await waitFor(() => assert.deepEqual(pushed, ["/dashboard/student/coaching/complaints/d-new"]));
  });

  it("opens with the topic chosen when the link says which one, but only if it is open to the student", async () => {
    search = "konu=report_absent";
    list = [];
    const first = renderPage();
    assert.equal(((await screen.findByLabelText("Sorun konusu")) as HTMLSelectElement).value, "report_absent");
    first.unmount();

    search = "konu=tutor_no_show";
    renderPage();
    assert.equal(((await screen.findByLabelText("Sorun konusu")) as HTMLSelectElement).value, "");
  });

  it("says the topics could not be read, with a way to try again", async () => {
    list = [];
    eligibilityFails = true;
    renderPage();

    assert.ok(await screen.findByText("Sorun konuları yüklenemedi."));
    assert.equal(screen.queryByText(/bildirebileceğin bir sorun konusu görünmüyor/), null);

    eligibilityFails = false;
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    assert.ok(await screen.findByLabelText("Sorun konusu"));
  });
});

describe("student Sorun bildir: Koçluğu sonlandır", () => {
  const section = async () => within(await screen.findByRole("region", { name: "Koçluğu sonlandır" }));

  it("is its own section at the foot, in a plain solid red button", async () => {
    renderPage();

    const end = await section();
    assert.ok(end.getByText(/sonraki haftalar iptal edilir/));
    const button = await end.findByRole("button", { name: "Koçluğu sonlandır" });
    assert.match(button.className, /bg-danger/);
    assert.doesNotMatch(button.className, /bg-transparent|border-ink|bg-error/);
    const everything = screen.getByRole("main");
    const sections = Array.from(everything.querySelectorAll("section"));
    assert.equal(sections[sections.length - 1].getAttribute("aria-label"), "Koçluğu sonlandır");
  });

  it("asks once more, and only then ends it", async () => {
    renderPage();

    fireEvent.click(await (await section()).findByRole("button", { name: "Koçluğu sonlandır" }));
    assert.ok(await screen.findByText("Koçluğu sonlandırmak istiyor musun?"));
    assert.equal(posted.length, 0);
    fireEvent.click(screen.getByRole("button", { name: "Sonlandırmayı iste" }));

    await waitFor(() => assert.deepEqual(posted, [{ url: "/coaching/purchases/cp-1/cancel-coaching/", body: undefined }]));
  });

  it("says the request was received instead of offering the button again", async () => {
    financial = { ...noRefund, service_status: "cancellation_pending", cancellation_pending: true };
    renderPage();

    const end = await section();
    assert.ok(await end.findByText(/İptal talebin alındı/));
    assert.equal(end.queryByRole("button", { name: "Koçluğu sonlandır" }), null);
  });

  it("says nothing about a refund when there is none", async () => {
    renderPage();

    await section();
    await cards();
    assert.equal(screen.queryByText(/iade/i), null);
  });

  it("says what the server recorded about a refund, and where to ask about it", async () => {
    financial = {
      ...noRefund,
      service_status: "cancellation_pending",
      cancellation_pending: true,
      refund_liability_minor: 240000,
      refund_state: "obligation_pending",
    };
    renderPage();

    const end = await section();
    assert.ok(await end.findByText("İade edilecek tutar kaydedildi; işlem sırada."));
    assert.ok(end.getByText(/2\.400/));
    assert.equal(end.getByRole("link", { name: "Hocam destek" }).getAttribute("href"), "/support");
  });

  it("says the state of the coaching could not be read, with no button to press blind", async () => {
    financialFails = true;
    renderPage();

    const end = await section();
    assert.ok(await end.findByText("İptal durumu yüklenemedi."));
    assert.equal(end.queryByRole("button", { name: "Koçluğu sonlandır" }), null);
    assert.ok(end.getByRole("button", { name: "Tekrar dene" }));
  });
});
