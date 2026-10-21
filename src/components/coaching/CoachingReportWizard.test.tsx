import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { coachingDateTimeLabel } from "@/lib/coachingTime";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const LONG_50 = "Haftalık program gözden geçirildi; türevde ilerleme iyi, paragrafta süre sorunu var.";
const LONG_20 = "Türev uygulamaları ve süre yönetimi";

const COMPLETE = {
  short_summary: LONG_50,
  topics_discussed: LONG_20,
  student_progress: LONG_20,
  next_priorities: LONG_20,
  study_recommendations: LONG_20,
  focus_until_next_meeting: LONG_20,
  exam_analysis: { status: "no_new_result" },
  recommended_resources: [],
  program_changes_summary: "",
};

function sessionDetail(overrides: Record<string, unknown> = {}) {
  return {
    id: "s-1",
    service_period_id: "sp-1",
    sequence_number: 2,
    week_index: 1,
    status: "awaiting_report",
    scheduled_start: "2026-10-13T16:00:00Z",
    scheduled_local_date: "2026-10-13",
    scheduled_local_time: "19:00",
    duration_minutes: 30,
    reschedule_count: 0,
    student_name: "Ayşe Öğrenci",
    tutor_name: "Demo Koç",
    student_id: "u-9",
    viewer_role: "tutor",
    report_due_at: "2026-10-13T23:15:00Z",
    report_overdue: false,
    complaint_eligible_at: null,
    complaint_eligible: false,
    ...overrides,
  };
}

const REVISION = {
  id: "rev-1",
  report_id: "r-1",
  revision_number: 1,
  source_draft_version: 3,
  content: COMPLETE,
  published_at: "2026-10-14T10:00:00Z",
  change_note: null,
};

const PROGRAM = { id: "pg-1", service_period_id: "sp-1", title: "Program", tasks: [] };

let session: ReturnType<typeof sessionDetail>;
let sessionFails = false;
let draftContent: Record<string, unknown> | null;
let reports: unknown[];
let program: unknown | null;
let putGate: Promise<void> | null;
let putFails: unknown | null;
const puts: Record<string, unknown>[] = [];
const posts: { url: string; body: unknown }[] = [];
const order: string[] = [];

function httpError(status: number, data: unknown = {}) {
  return Object.assign(new Error(`http ${status}`), { response: { status, data } });
}

let Wizard: React.ComponentType<{ sessionId: string; autosaveDelayMs?: number }>;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("sonner", { namedExports: { toast: { success() {}, error() {}, info() {} } } });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/coaching/sessions/s-1/") {
          if (sessionFails) throw httpError(500);
          return { data: session };
        }
        if (url === "/coaching/sessions/s-1/report-draft/") {
          if (draftContent === null) throw httpError(404);
          return { data: { id: "r-1", session_id: "s-1", draft_version: 3, content: draftContent, updated_at: "2026-10-14T09:00:00Z" } };
        }
        if (url === "/coaching/reports/") return { data: reports };
        if (url === "/coaching/service-periods/sp-1/program/") {
          if (program === null) throw httpError(404);
          return { data: program };
        }
        if (url === "/coaching/sessions/s-1/attachments/") return { data: [] };
        if (url === "/coaching/reports/r-1/") {
          return { data: { draft: { id: "r-1", session_id: "s-1", draft_version: 3, content: draftContent, updated_at: "" }, revisions: [REVISION] } };
        }
        throw new Error(`unexpected GET ${url}`);
      },
      put: async (url: string, body: Record<string, unknown>) => {
        assert.equal(url, "/coaching/sessions/s-1/report-draft/");
        order.push("put");
        puts.push(body);
        if (putGate) await putGate;
        if (putFails) throw putFails;
        draftContent = { ...(draftContent ?? {}), ...body };
        return { data: { id: "r-1", session_id: "s-1", draft_version: 3 + puts.length, content: draftContent, updated_at: "" } };
      },
      post: async (url: string, body: unknown) => {
        posts.push({ url, body });
        if (url === "/coaching/sessions/s-1/publish-initial-report/") {
          order.push("publish-initial");
          reports = [{ report_id: "r-1", session_id: "s-1", draft_version: 4, latest_revision: REVISION }];
          return { data: REVISION };
        }
        if (url === "/coaching/reports/r-1/publish-revision/") {
          order.push("publish-revision");
          const next = { ...REVISION, id: "rev-2", revision_number: 2, change_note: (body as { change_note: string }).change_note };
          reports = [{ report_id: "r-1", session_id: "s-1", draft_version: 5, latest_revision: next }];
          return { data: next };
        }
        throw new Error(`unexpected POST ${url}`);
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ CoachingReportWizard: Wizard } = await import("./CoachingReportWizard"));
});

beforeEach(() => {
  session = sessionDetail();
  sessionFails = false;
  draftContent = null;
  reports = [];
  program = PROGRAM;
  putGate = null;
  putFails = null;
  puts.length = 0;
  posts.length = 0;
  order.length = 0;
});

afterEach(cleanup);

function renderWizard(autosaveDelayMs = 20) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Wizard sessionId="s-1" autosaveDelayMs={autosaveDelayMs} />
    </QueryClientProvider>,
  );
}

const fill = (label: string, text: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value: text } });
const rail = () => screen.getByRole("navigation", { name: "Rapor adımları" });
const railButton = (name: RegExp | string) => within(rail()).getByRole("button", { name });
const heading = (name: string) => screen.findByRole("heading", { level: 2, name });

describe("the report form: the steps", () => {
  it("opens on the first of six steps, each named in a list on the side", async () => {
    renderWizard();

    await heading("Özet");
    const buttons = within(rail()).getAllByRole("button");
    assert.equal(buttons.length, 6);
    assert.deepEqual(
      buttons.map((button) => button.textContent?.replace(/^(Tamamlandı|Sıradaki adım|Bekliyor)\.\s*/, "").trim()),
      ["Özet", "İlerleme", "Öncelikler", "Sınav analizi", "Kaynaklar isteğe bağlı", "Gözden geçir"],
    );
    assert.equal(buttons[0].getAttribute("aria-current"), "step");
    assert.equal(buttons[1].getAttribute("aria-current"), null);
    assert.ok(screen.getByText("Adım 1 / 6"));
  });

  it("goes to the next step with the gold button and back with a plain Geri", async () => {
    renderWizard();
    await heading("Özet");

    const back = screen.getByRole("button", { name: "Geri" }) as HTMLButtonElement;
    assert.equal(back.disabled, true);
    const next = screen.getByRole("button", { name: "İleri: İlerleme" });
    assert.match(next.className, /bg-gold/);
    fireEvent.click(next);

    await heading("İlerleme");
    assert.equal(railButton(/İlerleme/).getAttribute("aria-current"), "step");
    fireEvent.click(screen.getByRole("button", { name: "Geri" }));
    await heading("Özet");
  });

  it("jumps to any step from the list", async () => {
    renderWizard();
    await heading("Özet");

    fireEvent.click(railButton(/Sınav analizi/));

    await heading("Sınav analizi");
    assert.ok(screen.getByRole("radio", { name: "Yeni deneme sonucu değerlendirildi" }));
  });

  it("ticks a step once what it asks for is written, and says so in words too", async () => {
    draftContent = { ...COMPLETE, student_progress: "" };
    renderWizard();
    await heading("Özet");

    assert.match(railButton(/Özet/).textContent ?? "", /^Sıradaki adım\./);
    assert.match(railButton(/İlerleme/).textContent ?? "", /^Bekliyor\./);
    assert.match(railButton(/Sınav analizi/).textContent ?? "", /^Tamamlandı\./);
    fireEvent.click(railButton(/İlerleme/));
    await heading("İlerleme");
    assert.match(railButton(/Özet/).textContent ?? "", /^Tamamlandı\./);
  });
});

describe("the report form: the fields", () => {
  it("labels every field and puts an example and a counter under it", async () => {
    renderWizard();
    await heading("Özet");

    assert.ok(screen.getByLabelText("Kısa özet"));
    assert.ok(screen.getByLabelText("Görüşülen konular"));
    assert.ok(screen.getByText(/Görüşmenin bir iki cümlelik özeti/));
    assert.ok(screen.getByText("0 / en az 50"));
    assert.ok(screen.getByText("0 / en az 20"));
  });

  it("keeps the label on screen while typing, and counts as it goes", async () => {
    renderWizard();
    await heading("Özet");

    fill("Kısa özet", "Bu bir deneme.");

    assert.ok(screen.getByText("Kısa özet"));
    assert.ok(screen.getByText("14 / en az 50"));
  });

  it("fills the fields from the draft that is already on the server", async () => {
    draftContent = { ...COMPLETE };
    renderWizard();
    await heading("Özet");

    assert.equal((screen.getByLabelText("Kısa özet") as HTMLTextAreaElement).value, LONG_50);
    assert.ok(screen.getByText(`${LONG_50.length} / en az 50`));
  });
});

describe("the report form: saving on its own", () => {
  it("saves only what was typed, says so, and has no save button to forget", async () => {
    renderWizard();
    await heading("Özet");
    assert.equal(screen.queryByRole("button", { name: /Taslağı kaydet/ }), null);
    assert.ok(screen.getByText("Otomatik kaydedilir"));

    fill("Kısa özet", LONG_50);

    await waitFor(() => assert.equal(puts.length, 1));
    assert.deepEqual(puts[0], { short_summary: LONG_50 });
    await waitFor(() => assert.match(screen.getByRole("status", { name: "Kayıt durumu" }).textContent ?? "", /^Kaydedildi · \d{2}:\d{2}$/));
  });

  it("saves at once when the step changes, without waiting for the pause", async () => {
    renderWizard(5000);
    await heading("Özet");

    fill("Kısa özet", LONG_50);
    fireEvent.click(screen.getByRole("button", { name: "İleri: İlerleme" }));

    await waitFor(() => assert.equal(puts.length, 1));
    assert.deepEqual(puts[0], { short_summary: LONG_50 });
  });

  it("keeps what is typed while a save is on its way, and saves that next", async () => {
    let release: () => void = () => {};
    putGate = new Promise<void>((resolve) => (release = resolve));
    renderWizard();
    await heading("Özet");

    fill("Kısa özet", "Birinci cümle.");
    await waitFor(() => assert.equal(puts.length, 1));
    fill("Kısa özet", "Birinci cümle. İkinci cümle de eklendi.");
    putGate = null;
    release();

    await waitFor(() => assert.equal(puts.length, 2));
    assert.deepEqual(puts[1], { short_summary: "Birinci cümle. İkinci cümle de eklendi." });
    assert.equal((screen.getByLabelText("Kısa özet") as HTMLTextAreaElement).value, "Birinci cümle. İkinci cümle de eklendi.");
  });

  it("says it could not save, in the form, and tries again from a button", async () => {
    putFails = httpError(400, { detail: "Kısa özet kaydedilemedi." });
    renderWizard();
    await heading("Özet");

    fill("Kısa özet", LONG_50);

    const state = await screen.findByRole("status", { name: "Kayıt durumu" });
    await waitFor(() => assert.match(state.textContent ?? "", /^Kaydedilemedi · Kısa özet kaydedilemedi\./));
    putFails = null;
    fireEvent.click(within(state).getByRole("button", { name: "Tekrar dene" }));

    await waitFor(() => assert.match(state.textContent ?? "", /^Kaydedildi/));
  });
});

describe("the report form: the deadline", () => {
  it("shows the deadline as a small caption over the date", async () => {
    renderWizard();
    await heading("Özet");

    const notice = screen.getByRole("region", { name: "Rapor süresi" });
    assert.ok(within(notice).getByText("Son tarih"));
    assert.ok(within(notice).getByText(coachingDateTimeLabel("2026-10-13T23:15:00Z")));
  });

  it("says plainly what a late report means once the student can report it", async () => {
    session = sessionDetail({ report_overdue: true, complaint_eligible: true, complaint_eligible_at: "2026-10-14T23:15:00Z" });
    renderWizard();
    await heading("Özet");

    assert.ok(
      within(screen.getByRole("region", { name: "Rapor süresi" })).getByText(
        "Süre geçti. Öğrenci bu görüşme için rapor eksikliğini bildirebilir; raporu hemen yayınla.",
      ),
    );
  });

  it("asks for no report at all when the meeting closed as an incident", async () => {
    session = sessionDetail({ status: "student_no_show", report_due_at: null });
    renderWizard();

    assert.ok(await screen.findByText("Bu görüşme için normal rapor yok"));
    assert.equal(screen.queryByRole("navigation", { name: "Rapor adımları" }), null);
  });

  it("says the report cannot be opened before the meeting starts", async () => {
    session = sessionDetail({ status: "scheduled" });
    renderWizard();

    assert.ok(await screen.findByText("Rapor henüz açılamaz"));
    assert.ok(screen.getByText("Rapor taslağı görüşme başladığında açılır."));
  });

  it("says the meeting could not be read, with a way to try again, instead of an empty page", async () => {
    sessionFails = true;
    renderWizard();

    assert.ok(await screen.findByText("Görüşme yüklenemedi."));
    sessionFails = false;
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    await heading("Özet");
  });
});

describe("the report form: the sources and the exam", () => {
  it("asks for one exam status and opens the details only for an analysed result", async () => {
    renderWizard();
    await heading("Özet");
    fireEvent.click(railButton(/Sınav analizi/));
    await heading("Sınav analizi");
    assert.equal(screen.queryByLabelText("Puan veya net"), null);

    fireEvent.click(screen.getByRole("radio", { name: "Yeni deneme sonucu değerlendirildi" }));

    assert.ok(screen.getByLabelText("Puan veya net"));
    await waitFor(() => assert.equal(puts.length, 1));
    assert.deepEqual(puts[0], { exam_analysis: { status: "analyzed" } });
  });

  it("adds a source row with a gold button, and saves it once it has a title", async () => {
    renderWizard();
    await heading("Özet");
    fireEvent.click(railButton(/Kaynaklar/));
    await heading("Kaynaklar");

    const add = screen.getByRole("button", { name: "Kaynak ekle" });
    assert.match(add.className, /bg-gold/);
    fireEvent.click(add);
    fill("Kaynak 1 başlığı", "Paragraf seti");

    await waitFor(() => assert.equal(puts.length, 1));
    assert.deepEqual(puts[0], { recommended_resources: [{ title: "Paragraf seti" }] });
  });
});

describe("the report form: reviewing and publishing", () => {
  it("lists what is still missing, each with a way to the step that holds it", async () => {
    draftContent = { ...COMPLETE, short_summary: "x".repeat(36) };
    renderWizard();
    await heading("Özet");

    fireEvent.click(railButton(/Gözden geçir/));
    await heading("Gözden geçir ve yayınla");

    const list = screen.getByRole("list", { name: "Yayın listesi" });
    const missing = within(list).getByText("Kısa özet: 14 karakter daha").closest("li") as HTMLElement;
    assert.ok(within(list).getByText("Görüşülen konular"));
    fireEvent.click(within(missing).getByRole("button", { name: "Düzelt" }));

    await heading("Özet");
  });

  it("shows the student's own view of the report before it goes out", async () => {
    draftContent = { ...COMPLETE };
    renderWizard();
    await heading("Özet");

    fireEvent.click(railButton(/Gözden geçir/));
    await heading("Gözden geçir ve yayınla");

    const preview = screen.getByRole("region", { name: "Rapor başlığı" });
    assert.ok(within(preview).getByText("Önizleme"));
    assert.ok(screen.getByText(LONG_50));
  });

  it("will not publish while the meeting is still running, and says why instead of staying silently shut", async () => {
    session = sessionDetail({ status: "in_progress" });
    draftContent = { ...COMPLETE };
    renderWizard();
    await heading("Özet");

    fireEvent.click(railButton(/Gözden geçir/));
    await heading("Gözden geçir ve yayınla");

    assert.equal((screen.getByRole("button", { name: "İlk raporu yayınla" }) as HTMLButtonElement).disabled, true);
    assert.ok(screen.getByText("Görüşme bitince yayınlayabilirsin."));
  });

  it("will not publish an incomplete report, and counts what is missing", async () => {
    renderWizard();
    await heading("Özet");

    fireEvent.click(railButton(/Gözden geçir/));
    await heading("Gözden geçir ve yayınla");

    assert.equal((screen.getByRole("button", { name: "İlk raporu yayınla" }) as HTMLButtonElement).disabled, true);
    assert.ok(screen.getByText("7 madde eksik"));
  });

  it("saves the last words first, then publishes, then says it is out with a way back to the records", async () => {
    program = null;
    draftContent = { ...COMPLETE };
    renderWizard(5000);
    await heading("Özet");
    fireEvent.click(railButton(/Gözden geçir/));
    await heading("Gözden geçir ve yayınla");
    fill("Program olmadan yayınlama gerekçesi", "Deneme sonuçlarını bekliyoruz.");

    const publish = screen.getByRole("button", { name: "İlk raporu yayınla" }) as HTMLButtonElement;
    assert.equal(publish.disabled, false);
    assert.match(publish.className, /bg-pink/);
    assert.deepEqual(order, []);
    fireEvent.click(publish);

    await heading("Rapor yayınlandı");
    assert.deepEqual(order, ["put", "publish-initial"]);
    assert.deepEqual(puts, [{ no_program_reason: "Deneme sonuçlarını bekliyoruz." }]);
    assert.ok(screen.getByText("Öğrenciye bildirildi."));
    const back = screen.getByRole("link", { name: "Kayıtlar'a dön" });
    assert.equal(back.getAttribute("href"), "/dashboard/tutor/coaching/reports");
    assert.match(back.className, /bg-gold/);
    assert.ok(screen.getByRole("button", { name: "Yeni sürüm yaz" }));
    assert.equal(screen.queryByRole("navigation", { name: "Rapor adımları" }), null);
  });

  it("does not publish a draft it could not save, and says so in the form", async () => {
    program = null;
    draftContent = { ...COMPLETE };
    putFails = httpError(400, { detail: "Kayıt reddedildi." });
    renderWizard(5000);
    await heading("Özet");
    fireEvent.click(railButton(/Gözden geçir/));
    await heading("Gözden geçir ve yayınla");
    fill("Program olmadan yayınlama gerekçesi", "Bekliyoruz.");

    fireEvent.click(screen.getByRole("button", { name: "İlk raporu yayınla" }));

    assert.ok(await screen.findByText("Taslak kaydedilemedi, bu yüzden yayınlanmadı. Kayıt durumunu kontrol et."));
    assert.deepEqual(posts, []);
  });

  it("asks for a short reason when the period has no study program, and links to the program page", async () => {
    program = null;
    draftContent = { ...COMPLETE };
    renderWizard();
    await heading("Özet");
    fireEvent.click(railButton(/Gözden geçir/));
    await heading("Gözden geçir ve yayınla");

    assert.ok(screen.getByText("Program yoksa kısa gerekçe yaz"));
    const link = screen.getByRole("link", { name: "Programı hazırla" });
    assert.equal(link.getAttribute("href"), "/dashboard/tutor/coaching/service-periods/sp-1/program");
    assert.equal((screen.getByRole("button", { name: "İlk raporu yayınla" }) as HTMLButtonElement).disabled, true);

    fill("Program olmadan yayınlama gerekçesi", "Deneme sonuçlarını bekliyoruz.");

    await waitFor(() => assert.equal((screen.getByRole("button", { name: "İlk raporu yayınla" }) as HTMLButtonElement).disabled, false));
  });
});

describe("the report form: after it is published", () => {
  beforeEach(() => {
    draftContent = { ...COMPLETE };
    reports = [{ report_id: "r-1", session_id: "s-1", draft_version: 3, latest_revision: REVISION }];
  });

  it("opens on the state of the published report, not on an editable form", async () => {
    renderWizard();

    await heading("Rapor yayınlandı");
    assert.ok(screen.getByText(`Sürüm 1 · ${coachingDateTimeLabel("2026-10-14T10:00:00Z")}`));
    assert.equal(screen.queryByText("Öğrenciye bildirildi."), null);
    assert.ok(screen.getByRole("link", { name: "Kayıtlar'a dön" }));
    assert.ok(await screen.findByText("Yayın geçmişi"));
  });

  it("writes a new version from there, with a note, and ends on the published state again", async () => {
    renderWizard();
    await heading("Rapor yayınlandı");

    fireEvent.click(screen.getByRole("button", { name: "Yeni sürüm yaz" }));
    await heading("Özet");
    fireEvent.click(railButton(/Gözden geçir/));
    await heading("Gözden geçir ve yayınla");
    fill("Bu sürümde neyi değiştirdin?", "Odak cümlesini düzelttim.");
    fireEvent.click(screen.getByRole("button", { name: "Yeni sürümü yayınla" }));

    await heading("Rapor yayınlandı");
    assert.deepEqual(posts, [{ url: "/coaching/reports/r-1/publish-revision/", body: { change_note: "Odak cümlesini düzelttim." } }]);
    assert.ok(screen.getByText(/^Sürüm 2 ·/));
  });
});
