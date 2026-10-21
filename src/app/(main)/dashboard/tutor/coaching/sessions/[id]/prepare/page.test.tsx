import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

// Wednesday 21 October 2026, 12:00 in Istanbul. The page reads the clock; the tests freeze it.
const NOW = new Date("2026-10-21T09:00:00Z");

function detail(overrides: Record<string, unknown> = {}) {
  return {
    id: "s-1",
    service_period_id: "sp-1",
    sequence_number: 2,
    week_index: 1,
    status: "scheduled",
    scheduled_start: "2026-10-22T18:00:00Z",
    scheduled_local_date: "2026-10-22",
    scheduled_local_time: "21:00",
    duration_minutes: 30,
    reschedule_count: 0,
    student_name: "Ayşe Öğrenci",
    tutor_name: "Demo Koç",
    student_id: "u-9",
    viewer_role: "tutor",
    report_due_at: null,
    report_overdue: false,
    complaint_eligible_at: null,
    complaint_eligible: false,
    previous_report_feedback: "want_to_change_goal",
    ...overrides,
  };
}

const PREVIOUS = {
  id: "s-0",
  service_period_id: "sp-1",
  sequence_number: 1,
  week_index: 1,
  status: "completed",
  scheduled_start: "2026-10-14T16:00:00Z",
  scheduled_local_date: "2026-10-14",
  scheduled_local_time: "19:00",
  duration_minutes: 30,
  reschedule_count: 0,
  student_name: "Ayşe Öğrenci",
  report_due_at: null,
  report_overdue: false,
  complaint_eligible_at: null,
  complaint_eligible: false,
};

const REVISION = {
  id: "rev-1",
  report_id: "r-0",
  revision_number: 1,
  source_draft_version: 1,
  content: {
    short_summary: "Haftalık program gözden geçirildi; türevde ilerleme iyi.",
    topics_discussed: "",
    student_progress: "",
    next_priorities: "",
    study_recommendations: "",
    focus_until_next_meeting: "Her gün 2 paragraf seti ve türevde 20 soru.",
  },
  published_at: "2026-10-15T10:00:00Z",
  change_note: null,
};

function task(id: string, title: string, due: string | null, done = false) {
  return { id, title, description: "", subject: "", due_date: due, priority: null, sort_order: 1, is_completed: done, completed_at: null };
}

const PROGRAM = {
  id: "pg-1",
  service_period_id: "sp-1",
  title: "Program",
  objective: "",
  start_date: null,
  end_date: null,
  tasks: [
    task("a", "Paragraf süreli set", "2026-10-21"),
    task("b", "Türev soru seti", "2026-10-23"),
    task("c", "Eski görev 1", null, true),
    task("d", "Eski görev 2", null, true),
  ],
};

const FILES = [
  { id: "f-1", session_id: "s-1", original_name: "Soru_seti.pdf", mime_type: "application/pdf", size_bytes: 2_516_582, uploaded_by_role: "tutor", created_at: "2026-10-14T09:00:00Z" },
  { id: "f-2", session_id: null, original_name: "Cevaplar.jpg", mime_type: "image/jpeg", size_bytes: 655_360, uploaded_by_role: "student", created_at: "2026-10-19T09:00:00Z" },
];

let session: Record<string, unknown>;
let sessions: unknown[];
let reports: unknown[];
let program: unknown | null;
let files: unknown[];
let conversationFails: boolean;
const fails = new Set<string>();

function httpError(status: number) {
  return Object.assign(new Error(`http ${status}`), { response: { status, data: {} } });
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
      useParams: () => ({ id: "s-1" }),
      useRouter: () => ({ push() {}, replace() {}, back() {} }),
      usePathname: () => "/dashboard/tutor/coaching/sessions/s-1/prepare",
      useSearchParams: () => new URLSearchParams(),
    },
  });
  mock.module("sonner", { namedExports: { toast: { success() {}, error() {}, info() {} } } });
  mock.module("@/components/coaching/CoachingGuard", {
    namedExports: { CoachingRecordGuard: ({ children }: { children: React.ReactNode }) => <>{children}</> },
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
  mock.module("@/components/tutors/TutorStudentNotes", {
    namedExports: {
      TutorStudentNotes: ({ studentId, bare }: { studentId: string; bare?: boolean }) => <p data-bare={String(Boolean(bare))}>Notlar kutusu {studentId}</p>,
    },
  });
  mock.module("@/components/tutors/TutorStudentMaterials", {
    namedExports: {
      TutorStudentMaterials: ({ studentId, bare }: { studentId: string; bare?: boolean }) => <p data-bare={String(Boolean(bare))}>Materyaller kutusu {studentId}</p>,
    },
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        const key = url.split("?")[0];
        if (fails.has(key)) throw httpError(500);
        if (url === "/coaching/sessions/s-1/") return { data: session };
        if (url === "/coaching/tutor/sessions/") return { data: sessions };
        if (url === "/coaching/reports/") return { data: reports };
        if (url === "/coaching/service-periods/sp-1/program/") {
          if (program === null) throw httpError(404);
          return { data: program };
        }
        if (url === "/coaching/sessions/s-1/attachments/") return { data: files };
        if (url === "/coaching/students/") return { data: [{ purchase_id: "pu-1", service_period_id: "sp-1", student_name: "Ayşe Öğrenci", service_status: "active", frequency: "weekly", recurring_slots: [] }] };
        if (url === "/coaching/purchases/pu-1/conversation/") {
          if (conversationFails) throw httpError(404);
          return { data: { id: "c-1" } };
        }
        if (url === "/notifications/tutor-student-notes/?student=u-9") return { data: [{ id: "n-1", content: "Not", created_at: "2026-10-14T09:00:00Z" }] };
        if (url === "/notifications/tutor-student-materials/?student=u-9") return { data: [{ id: "m-1" }, { id: "m-2" }] };
        throw new Error(`unexpected GET ${url}`);
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  mock.timers.enable({ apis: ["Date"], now: NOW });
  session = detail();
  sessions = [PREVIOUS, session];
  reports = [{ report_id: "r-0", session_id: "s-0", draft_version: 1, latest_revision: REVISION }];
  program = PROGRAM;
  files = FILES;
  conversationFails = false;
  fails.clear();
});
afterEach(() => {
  cleanup();
  mock.timers.reset();
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>,
  );
}

const region = (name: string) => screen.findByRole("region", { name });

describe("Görüşmeye hazırlan", () => {
  it("opens on the meeting, then what needs a look, then last time and the program", async () => {
    renderPage();

    const header = await region("Görüşme");
    assert.ok(within(header).getByRole("heading", { name: "Ayşe Öğrenci" }));
    assert.ok(within(header).getByText("2. görüşme · 30 dk · 22 Ekim Perşembe 21:00"));
    assert.ok(screen.getByRole("heading", { level: 1, name: "Görüşmeye hazırlan" }));

    const previous = await region("Geçen görüşme");
    assert.ok(within(previous).getByText("Haftalık program gözden geçirildi; türevde ilerleme iyi."));
    assert.ok(within(previous).getByText("Bu hedefi değiştirmek istiyorum"));

    const program = await region("Program");
    assert.ok(within(program).getByText("2 / 4 tamam"));
    assert.ok(within(program).getByText("Paragraf süreli set"));
  });

  it("lists what needs a look, with a way to the thread, the program and the files", async () => {
    renderPage();

    const band = await region("Bakılacaklar");
    await waitFor(() => assert.ok(within(band).getByRole("link", { name: "Mesajlara git" })));
    assert.equal(within(band).getByRole("link", { name: "Mesajlara git" }).getAttribute("href"), "/messages/c-1");
    assert.ok(within(band).getByText("Ayşe hedefi değiştirmek istiyor"));
    assert.ok(within(band).getByText("2 program görevi bekliyor"));
    assert.ok(within(band).getByText("Biri bugün bitmeli: Paragraf süreli set"));
    assert.equal(
      within(band).getByRole("link", { name: "Programı yönet" }).getAttribute("href"),
      "/dashboard/tutor/coaching/service-periods/sp-1/program",
    );
    assert.ok(within(band).getByText("Ayşe yeni dosya yükledi"));
  });

  it("gives no link to a thread it could not read, instead of one that opens nothing", async () => {
    conversationFails = true;
    renderPage();

    const band = await region("Bakılacaklar");
    await within(band).findByText("Ayşe hedefi değiştirmek istiyor");
    await waitFor(() => assert.ok(within(band).getByText("2 program görevi bekliyor")));
    assert.equal(within(band).queryByRole("link", { name: "Mesajlara git" }), null);
  });

  it("shows no band when nothing changed since the last meeting", async () => {
    session = detail({ previous_report_feedback: "goals_understood" });
    sessions = [PREVIOUS, session];
    program = { ...PROGRAM, tasks: PROGRAM.tasks.map((item) => ({ ...item, is_completed: true })) };
    files = [FILES[0]];
    renderPage();

    await region("Program");
    await waitFor(() => assert.ok(screen.getByText("Tüm görevler tamam.")));
    assert.equal(screen.queryByRole("region", { name: "Bakılacaklar" }), null);
  });

  it("keeps the files and the tutor's private things in rows that say who sees them and how many there are", async () => {
    renderPage();

    const files = await screen.findByRole("button", { name: /Ayşe ile paylaşılan dosyalar/ });
    await waitFor(() => assert.ok(within(files).getByText("2 dosya")));
    const notes = screen.getByRole("button", { name: /Özel notlarım/ });
    assert.ok(within(notes).getByText(/yalnız sana görünür/));
    await waitFor(() => assert.ok(within(notes).getByText("1 not")));
    const materials = screen.getByRole("button", { name: /Materyallerim/ });
    await waitFor(() => assert.ok(within(materials).getByText("2 dosya")));
    assert.equal(files.getAttribute("aria-expanded"), "false");
    assert.equal(screen.queryByText("Soru_seti.pdf"), null);
    assert.equal(screen.queryByText("Notlar kutusu u-9"), null);
  });

  it("opens the files from the band, and each private row on a press", async () => {
    renderPage();

    const band = await region("Bakılacaklar");
    fireEvent.click(await within(band).findByRole("button", { name: "Dosyalara bak" }));
    assert.ok(await screen.findByText("Ayşe yükledi · 19 Ekim · 640 KB"));
    assert.equal(screen.getByRole("button", { name: /Ayşe ile paylaşılan dosyalar/ }).getAttribute("aria-expanded"), "true");
    // The row already names the list and says who sees it; the list does not title itself a second time.
    assert.ok(screen.getByText("Ayşe bu dosyaları görür ve kendisi de dosya yükleyebilir."));
    assert.equal(screen.queryAllByRole("heading", { name: "Görüşme dosyaları" }).length, 0);

    fireEvent.click(screen.getByRole("button", { name: /Özel notlarım/ }));
    assert.ok(screen.getByText("Notlar kutusu u-9"));
    fireEvent.click(screen.getByRole("button", { name: /Materyallerim/ }));
    assert.ok(screen.getByText("Materyaller kutusu u-9"));
  });

  // The rows are already titled "Özel notlarım · yalnız sana görünür" and "Materyallerim · …":
  // the panels inside leave off their own card, band and caption, so nothing is named twice.
  it("opens the private panels without a second title of their own", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Özel notlarım/ }));
    fireEvent.click(screen.getByRole("button", { name: /Materyallerim/ }));
    assert.equal(screen.getByText("Notlar kutusu u-9").getAttribute("data-bare"), "true");
    assert.equal(screen.getByText("Materyaller kutusu u-9").getAttribute("data-bare"), "true");
  });

  it("says when the room opens on the day, and offers Görüşmeye katıl once it can be entered", async () => {
    session = detail({ scheduled_start: "2026-10-21T16:00:00Z", scheduled_local_date: "2026-10-21", scheduled_local_time: "19:00" });
    sessions = [PREVIOUS, session];
    const view = renderPage();
    assert.ok(await screen.findByText("Oda 18:45'te açılır"));
    assert.equal(screen.queryByRole("link", { name: "Görüşmeye katıl" }), null);
    view.unmount();

    mock.timers.reset();
    mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-21T15:50:00Z") });
    renderPage();
    const link = await screen.findByRole("link", { name: "Görüşmeye katıl" });
    assert.equal(link.getAttribute("href"), "/session/coaching/s-1");
  });

  it("offers the report instead once the meeting is over and the report is owed", async () => {
    session = detail({ status: "awaiting_report", scheduled_start: "2026-10-20T16:00:00Z", scheduled_local_date: "2026-10-20" });
    sessions = [PREVIOUS, session];
    renderPage();

    const link = await screen.findByRole("link", { name: "Raporu hazırla" });
    assert.equal(link.getAttribute("href"), "/dashboard/tutor/coaching/sessions/s-1/report");
  });

  it("says a part could not be read, with a way to try again, instead of leaving it out", async () => {
    fails.add("/coaching/service-periods/sp-1/program/");
    renderPage();

    const program = await screen.findByText("Program yüklenemedi.");
    assert.ok(program);
    fails.clear();
    fireEvent.click(screen.getAllByRole("button", { name: "Tekrar dene" })[0]);
    assert.ok(await screen.findByText("2 / 4 tamam"));
  });

  it("says last time could not be read, and that the meeting could not be read, each with a retry", async () => {
    fails.add("/coaching/reports/");
    const view = renderPage();
    assert.ok(await screen.findByText("Geçen görüşme yüklenemedi."));
    view.unmount();

    fails.clear();
    fails.add("/coaching/sessions/s-1/");
    renderPage();
    assert.ok(await screen.findByText("Görüşme yüklenemedi."));
    fails.clear();
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    assert.ok(await region("Görüşme"));
  });
});
