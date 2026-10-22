import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const base = {
  id: "d1",
  category: "report_absent",
  status: "under_review",
  description: "",
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
      original_name: "rapor-taslagi.pdf",
      mime_type: "application/pdf",
      size_bytes: 1200,
      scan_state: "active",
      validated_at: null,
      deleted_requested: false,
    },
  ],
  tutor_responses: [{ body: "Rapor sistem hatası yüzünden gecikti.", created_at: "2026-10-16T06:12:00Z" }],
  timeline: [
    { event_type: "created", participant_message: "Bildirim alındı.", created_at: "2026-10-15T11:20:00Z" },
    { event_type: "review", participant_message: "Destek ekibi incelemeye başladı.", created_at: "2026-10-15T13:05:00Z" },
  ],
};

const sessions = [
  {
    id: "s-3",
    sequence_number: 3,
    week_index: 2,
    status: "completed",
    scheduled_start: "2026-10-14T16:00:00Z",
    scheduled_local_date: "2026-10-14",
    scheduled_local_time: "19:00:00",
    duration_minutes: 30,
    reschedule_count: 0,
    report_due_at: null,
    report_overdue: false,
    complaint_eligible_at: null,
    complaint_eligible: false,
  },
];

let current: unknown;
let loadStatus = 200;
let sessionsFail = false;
let postFails = false;
let accessFails = false;
const posted: { url: string; body: unknown }[] = [];
const opened: string[] = [];
const requested: string[] = [];

function httpError(status: number) {
  return Object.assign(new Error(`http ${status}`), { response: { status } });
}

let TutorComplaintDetail: React.ComponentType<{ disputeId: string }>;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        requested.push(url);
        if (url === "/coaching/tutor/disputes/d1/") {
          if (loadStatus !== 200) throw httpError(loadStatus);
          return { data: structuredClone(current) };
        }
        if (url === "/coaching/tutor/sessions/") {
          if (sessionsFail) throw httpError(500);
          return { data: sessions };
        }
        if (url === "/coaching/tutor/dispute-evidence/e1/") {
          if (accessFails) throw httpError(409);
          return { data: { url: "https://signed.example/e1" } };
        }
        throw new Error(`unexpected GET ${url}`);
      },
      post: async (url: string, body: { body: string }) => {
        posted.push({ url, body });
        if (postFails) throw httpError(500);
        const reply = { body: body.body, created_at: "2026-10-17T08:00:00Z" };
        current = { ...(current as object), tutor_responses: [...(current as typeof base).tutor_responses, reply] };
        return { data: reply };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ TutorComplaintDetail } = await import("./TutorComplaintDetail"));
});

beforeEach(() => {
  current = structuredClone(base);
  loadStatus = 200;
  sessionsFail = false;
  postFails = false;
  accessFails = false;
  posted.length = 0;
  opened.length = 0;
  requested.length = 0;
  (window as unknown as { open: (url: string) => void }).open = (url: string) => {
    opened.push(url);
  };
});
afterEach(cleanup);

function renderDetail() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TutorComplaintDetail disputeId="d1" />
    </QueryClientProvider>
  );
}

const loaded = () => screen.findByRole("heading", { name: "Rapor hazırlanmadı" });

describe("the head", () => {
  it("says what it is about, when it was filed, where it stands and which meeting it is", async () => {
    renderDetail();
    await loaded();

    const head = within(screen.getByRole("region", { name: "Bildirim özeti" }));
    assert.ok(head.getByText("15 Ekim Perşembe 14:20", { exact: false }));
    assert.ok(head.getByText("İnceleniyor"));
    await screen.findByText(/3\. görüşme · 14 Ekim Çarşamba 19:00/);
    const meeting = screen.getByRole("link", { name: "Görüşmeye git" });
    assert.equal(meeting.getAttribute("href"), "/session/coaching/s-3/summary");
    assert.equal(screen.getByRole("link", { name: "Kayıtlar'a dön" }).getAttribute("href"), "/dashboard/tutor/coaching/reports");
  });

  it("still points at the meeting when the meetings list cannot be read", async () => {
    sessionsFail = true;
    renderDetail();
    await loaded();
    assert.equal(screen.getByRole("link", { name: "Görüşmeye git" }).getAttribute("href"), "/session/coaching/s-3/summary");
    assert.ok(screen.queryByText(/3\. görüşme/) === null);
  });

  it("never shows what the student wrote, and says it is kept private", async () => {
    current = { ...base, description: "Öğrencinin özel açıklaması" };
    renderDetail();
    await loaded();
    assert.ok(screen.queryByText(/özel açıklaması/) === null);
    assert.ok(screen.getByText(/açıklaması gizlidir/));
  });
});

describe("the way", () => {
  it("marks where the complaint is, and the steps before and after it", async () => {
    renderDetail();
    await loaded();
    const path = screen.getByRole("list", { name: "Bildirimin durumu" });
    const items = within(path).getAllByRole("listitem");
    assert.equal(items.map((item) => (item.textContent ?? "").replace("—", "")).join("|"), "Alındı, tamam|İnceleniyor, şu an burada|Karar, bekliyor|Kapandı, bekliyor");
    assert.equal(items[1].getAttribute("aria-current"), "step");
    assert.equal(items[0].getAttribute("aria-current"), null);
  });

  it("says what it is waiting for when it waits for the student", async () => {
    current = { ...base, status: "awaiting_student_choice" };
    renderDetail();
    await loaded();
    assert.ok(screen.getByText("Öğrencinin çözümü seçmesi bekleniyor."));
  });
});

describe("the process, the result and the evidence", () => {
  it("dates each step of the process", async () => {
    renderDetail();
    await loaded();
    const process = screen.getByRole("region", { name: "Süreç" });
    assert.ok(within(process).getByText("Destek ekibi incelemeye başladı."));
    assert.ok(within(process).getByText("15 Ekim Perşembe 16:05"));
  });

  it("gives the result once the review has decided, and not before", async () => {
    renderDetail();
    await loaded();
    assert.ok(screen.queryByRole("region", { name: "İnceleme sonucu" }) === null);
    cleanup();
    current = {
      ...base,
      status: "awaiting_student_choice",
      determination: { id: "det", merit: "partial", allowed_remedies: ["reschedule"], determined_at: "2026-10-17T07:40:00Z" },
    };
    renderDetail();
    await loaded();
    const result = screen.getByRole("region", { name: "İnceleme sonucu" });
    assert.ok(within(result).getByText("Kısmi"));
    assert.ok(within(result).getByText("17 Ekim Cumartesi 10:40"));
  });

  it("lists the evidence staff opened, and opens a file through the server's short-lived address", async () => {
    renderDetail();
    await loaded();
    const evidence = screen.getByRole("region", { name: "Kanıtlar" });
    assert.ok(within(evidence).getByText("rapor-taslagi.pdf"));
    fireEvent.click(within(evidence).getByRole("button", { name: "rapor-taslagi.pdf dosyasını görüntüle" }));

    await waitFor(() => assert.equal(opened.length, 1));
    assert.equal(opened[0], "https://signed.example/e1");
    assert.ok(requested.includes("/coaching/tutor/dispute-evidence/e1/"));
  });

  it("says so next to the file when it cannot be opened", async () => {
    accessFails = true;
    renderDetail();
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "rapor-taslagi.pdf dosyasını görüntüle" }));
    assert.equal((await screen.findByRole("alert")).textContent, "Dosya görüntülenemedi. Biraz sonra tekrar dene.");
    assert.equal(opened.length, 0);
  });

  it("says there is none when staff opened none", async () => {
    current = { ...base, evidence: [] };
    renderDetail();
    await loaded();
    assert.ok(screen.getByText("Sana açılmış kanıt yok."));
  });
});

describe("the tutor's answer", () => {
  const box = () => screen.getByLabelText("Yanıt metni") as HTMLTextAreaElement;

  it("lists what was already answered, dated, and says who sees a new answer", async () => {
    renderDetail();
    await loaded();
    const answers = screen.getByRole("region", { name: "Yanıtın" });
    assert.ok(within(answers).getByText("Rapor sistem hatası yüzünden gecikti."));
    assert.ok(within(answers).getByText("16 Ekim Cuma 09:12"));
    assert.ok(within(answers).getByText("Yazdığın öğrenci ve destek ekibi tarafından görülür, sonra silinemez."));
  });

  it("sends the answer trimmed, shows it in the list and empties the box", async () => {
    renderDetail();
    await loaded();
    fireEvent.change(box(), { target: { value: "  Raporu görüşmeden iki gün sonra yükledim.  " } });
    assert.ok(screen.getByText(/\d+ \/ 2000/));
    fireEvent.click(screen.getByRole("button", { name: "Yanıtı gönder" }));

    await screen.findByText("Raporu görüşmeden iki gün sonra yükledim.");
    assert.deepEqual(posted, [
      { url: "/coaching/tutor/disputes/d1/response/", body: { body: "Raporu görüşmeden iki gün sonra yükledim." } },
    ]);
    assert.equal(box().value, "");
  });

  it("will not send an empty answer, and says so by the box", async () => {
    renderDetail();
    await loaded();
    fireEvent.change(box(), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Yanıtı gönder" }));

    assert.equal((await screen.findByRole("alert")).textContent, "Yanıtını yaz.");
    assert.equal(posted.length, 0);
  });

  it("keeps what was typed when the server says no", async () => {
    postFails = true;
    renderDetail();
    await loaded();
    fireEvent.change(box(), { target: { value: "Kaybolmasın" } });
    fireEvent.click(screen.getByRole("button", { name: "Yanıtı gönder" }));

    assert.equal((await screen.findByRole("alert")).textContent, "Yanıt gönderilemedi. Tekrar dene.");
    assert.equal(box().value, "Kaybolmasın");
  });

  it("takes no more once the complaint is resolved or closed, keeps the old answers, and says why", async () => {
    current = { ...base, status: "resolved" };
    renderDetail();
    await loaded();
    assert.ok(screen.queryByLabelText("Yanıt metni") === null);
    assert.ok(screen.queryByRole("button", { name: "Yanıtı gönder" }) === null);
    assert.ok(screen.getByText("Bu bildirim çözüldüğü için yeni yanıt eklenemiyor."));
    assert.ok(screen.getByText("Rapor sistem hatası yüzünden gecikti."));
  });
});

describe("when it cannot be shown", () => {
  it("says the complaint is not there when the server does not know it", async () => {
    loadStatus = 404;
    renderDetail();
    assert.ok(await screen.findByText("Sorun bildirimi bulunamadı"));
  });

  it("says it could not be loaded, with a way to try again, for any other failure", async () => {
    loadStatus = 500;
    renderDetail();
    assert.ok(await screen.findByText("Sorun bildirimi yüklenemedi."));
    assert.ok(screen.getByRole("button", { name: "Tekrar dene" }));
  });
});
