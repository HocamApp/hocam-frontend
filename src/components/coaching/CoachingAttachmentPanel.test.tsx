import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const FILES = [
  { id: "f-1", session_id: "s-1", original_name: "Soru_seti.pdf", mime_type: "application/pdf", size_bytes: 2_516_582, uploaded_by_role: "tutor", created_at: "2026-10-14T09:00:00Z" },
  { id: "f-2", session_id: null, original_name: "Cevaplar.jpg", mime_type: "image/jpeg", size_bytes: 655_360, uploaded_by_role: "student", created_at: "2026-10-19T09:00:00Z" },
];

let files: unknown[] = FILES;
let listFails = false;
const posted: { url: string; body: unknown }[] = [];
const requested: string[] = [];
const opened: unknown[][] = [];

function httpError(status: number) {
  return Object.assign(new Error(`http ${status}`), { response: { status, data: {} } });
}

let Panel: React.ComponentType<{ sessionId: string; viewerRole?: "tutor" | "student"; otherName?: string | null; heading?: string | null }>;

before(async () => {
  mock.module("sonner", { namedExports: { toast: { success() {}, error() {}, info() {} } } });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        requested.push(url);
        if (url === "/coaching/sessions/s-1/attachments/") {
          if (listFails) throw httpError(500);
          return { data: files };
        }
        if (url === "/coaching/attachments/f-2/download/") return { data: { url: "https://files.example/f-2" } };
        throw new Error(`unexpected GET ${url}`);
      },
      post: async (url: string, body: unknown) => {
        posted.push({ url, body });
        return { data: FILES[0] };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ CoachingAttachmentPanel: Panel } = await import("./CoachingAttachmentPanel"));
});

beforeEach(() => {
  files = FILES;
  listFails = false;
  posted.length = 0;
  requested.length = 0;
  opened.length = 0;
  mock.method(window, "open", (...args: unknown[]) => {
    opened.push(args);
    return null;
  });
});
afterEach(() => {
  cleanup();
  mock.restoreAll();
});

function renderPanel(props: Partial<React.ComponentProps<typeof Panel>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Panel sessionId="s-1" {...props} />
    </QueryClientProvider>,
  );
}

describe("the shared files of a meeting", () => {
  it("says who put each file there, when, and how big it is", async () => {
    renderPanel({ viewerRole: "tutor", otherName: "Ayşe Öğrenci" });

    const first = (await screen.findByText("Soru_seti.pdf")).closest("li") as HTMLElement;
    assert.ok(within(first).getByText("Sen yükledin · 14 Ekim · 2,4 MB"));
    const second = screen.getByText("Cevaplar.jpg").closest("li") as HTMLElement;
    assert.ok(within(second).getByText("Ayşe yükledi · 19 Ekim · 640 KB"));
  });

  it("tells the tutor that the student sees these files and can add to them", async () => {
    renderPanel({ viewerRole: "tutor", otherName: "Ayşe Öğrenci" });

    assert.ok(await screen.findByText("Ayşe bu dosyaları görür ve kendisi de dosya yükleyebilir."));
  });

  it("tells the student the same from the other side, and says it plainly when the viewer is not known", async () => {
    const view = renderPanel({ viewerRole: "student" });
    assert.ok(await screen.findByText("Hocan bu dosyaları görür ve o da dosya yükleyebilir."));
    view.unmount();

    renderPanel();
    assert.ok(await screen.findByText("Bu dosyalar öğrenci ve hoca arasında paylaşılır."));
  });

  it("takes a heading from the page, and has its own otherwise", async () => {
    const view = renderPanel({ heading: "Ayşe ile paylaşılan dosyalar" });
    assert.ok(await screen.findByRole("heading", { name: "Ayşe ile paylaşılan dosyalar" }));
    view.unmount();

    renderPanel();
    assert.ok(await screen.findByRole("heading", { name: "Görüşme dosyaları" }));
  });

  // On the Hazırlan page the row it opens from is already titled "Ayşe ile paylaşılan
  // dosyalar"; a second name for the same list ("Görüşme dosyaları") read as two lists.
  it("drops its heading when the place it sits in already names the list", async () => {
    renderPanel({ heading: null, viewerRole: "tutor", otherName: "Ayşe Öğrenci" });

    await screen.findByText("Soru_seti.pdf");
    assert.equal(screen.queryAllByRole("heading").length, 0);
    assert.ok(screen.getByText("Ayşe bu dosyaları görür ve kendisi de dosya yükleyebilir."));
  });

  it("offers a solid gold Dosya yükle and sends the file", async () => {
    renderPanel({ viewerRole: "tutor" });
    await screen.findByText("Soru_seti.pdf");

    const input = screen.getByLabelText("Dosya yükle") as HTMLInputElement;
    assert.match((input.closest("label") as HTMLElement).className, /bg-gold/);
    fireEvent.change(input, { target: { files: [new File(["x"], "yeni.pdf", { type: "application/pdf" })] } });

    await waitFor(() => assert.equal(posted.length, 1));
    assert.equal(posted[0].url, "/coaching/sessions/s-1/attachments/");
  });

  it("downloads a file from a solid gold İndir on its row", async () => {
    renderPanel({ viewerRole: "tutor", otherName: "Ayşe" });
    const row = (await screen.findByText("Cevaplar.jpg")).closest("li") as HTMLElement;

    const download = within(row).getByRole("button", { name: "İndir" });
    assert.match(download.className, /bg-gold/);
    fireEvent.click(download);

    await waitFor(() => assert.equal(opened.length, 1));
    assert.equal(opened[0][0], "https://files.example/f-2");
  });

  it("says there are no files yet instead of showing an empty box", async () => {
    files = [];
    renderPanel();

    assert.ok(await screen.findByText("Henüz dosya yok."));
  });

  it("says the files could not be read, with a way to try again, instead of looking empty", async () => {
    listFails = true;
    renderPanel();

    assert.ok(await screen.findByText("Dosyalar yüklenemedi."));
    assert.equal(screen.queryByText("Henüz dosya yok."), null);
    listFails = false;
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    assert.ok(await screen.findByText("Soru_seti.pdf"));
  });
});
