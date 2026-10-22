import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { CoachingProgram, CoachingProgramTask } from "@/lib/coachingApi";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

type Call = { method: string; url: string; body?: Record<string, unknown> };

let server: CoachingProgram | null = null;
let calls: Call[] = [];
let getCount = 0;
let failNext: { status: number; detail: string } | null = null;
let CoachingProgramEditor: typeof import("./CoachingProgramEditor").CoachingProgramEditor;
let PROGRAM_KEY: readonly unknown[];

// Wednesday 21 Ekim 2026, 14:00 in Istanbul.
const NOW = new Date("2026-10-21T11:00:00Z");

function task(overrides: Partial<CoachingProgramTask>): CoachingProgramTask {
  return {
    id: "t-1",
    title: "Görev",
    description: "",
    subject: "",
    due_date: null,
    priority: null,
    sort_order: 1,
    is_completed: false,
    completed_at: null,
    ...overrides,
  };
}

function seed(tasks?: CoachingProgramTask[]): CoachingProgram {
  return {
    id: "p-1",
    service_period_id: "sp-1",
    title: "Ekim–Aralık YKS programı",
    objective: "TYT matematikte 25 nete çıkmak",
    start_date: "2026-10-12",
    end_date: "2026-12-20",
    tasks: tasks ?? [
      task({ id: "t-1", title: "Limit-süreklilik 40 soru", subject: "AYT Matematik", priority: "Yüksek", due_date: "2026-10-20", sort_order: 1 }),
      task({ id: "t-2", title: "Paragraf denemesi", subject: "Türkçe", priority: "Orta", due_date: "2026-10-22", sort_order: 2 }),
      task({
        id: "t-3",
        title: "Fonksiyonlar test 30 soru",
        due_date: "2026-10-18",
        sort_order: 3,
        is_completed: true,
        completed_at: "2026-10-19T09:30:00Z",
      }),
      task({ id: "t-4", title: "Defter notları", description: "Defterden tekrar", sort_order: 4 }),
    ],
  };
}

function httpError(status: number, detail: string) {
  return Object.assign(new Error(detail), { response: { status, data: { detail } } });
}

before(async () => {
  mock.module("sonner", { namedExports: { toast: { success() {}, error() {} } } });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/coaching/service-periods/sp-1/program/") {
          getCount += 1;
          if (!server) throw httpError(404, "No program yet.");
          return { data: structuredClone(server) };
        }
        throw new Error(`unexpected GET ${url}`);
      },
      put: async (url: string, body: Record<string, unknown>) => {
        calls.push({ method: "PUT", url, body });
        if (failNext) {
          const { status, detail } = failNext;
          failNext = null;
          throw httpError(status, detail);
        }
        server = { ...(server ?? seed([])), ...(body as object), tasks: server?.tasks ?? [] } as CoachingProgram;
        return { data: structuredClone(server) };
      },
      post: async (url: string, body: Record<string, unknown>) => {
        calls.push({ method: "POST", url, body });
        if (failNext) {
          const { status, detail } = failNext;
          failNext = null;
          throw httpError(status, detail);
        }
        const created = task({ ...(body as object), id: `t-new-${calls.length}`, sort_order: 99, priority: (body.priority as string | null) ?? null });
        server = { ...server!, tasks: [...server!.tasks, created] };
        return { data: created };
      },
      patch: async (url: string, body: Record<string, unknown>) => {
        calls.push({ method: "PATCH", url, body });
        if (failNext) {
          const { status, detail } = failNext;
          failNext = null;
          throw httpError(status, detail);
        }
        const id = url.split("/").filter(Boolean).pop()!;
        server = { ...server!, tasks: server!.tasks.map((row) => (row.id === id ? { ...row, ...(body as object) } : row)) };
        return { data: server.tasks.find((row) => row.id === id) };
      },
      delete: async (url: string) => {
        calls.push({ method: "DELETE", url });
        if (failNext) {
          const { status, detail } = failNext;
          failNext = null;
          throw httpError(status, detail);
        }
        const id = url.split("/").filter(Boolean).pop()!;
        server = { ...server!, tasks: server!.tasks.filter((row) => row.id !== id) };
        return { data: undefined };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  const api = await import("@/lib/coachingApi");
  PROGRAM_KEY = api.COACHING_FAZ6_QUERY_KEYS.program("sp-1");
  ({ CoachingProgramEditor } = await import("./CoachingProgramEditor"));
});

let client: QueryClient;

beforeEach(() => {
  mock.timers.enable({ apis: ["Date"], now: NOW });
  server = seed();
  calls = [];
  getCount = 0;
  failNext = null;
});
afterEach(() => {
  cleanup();
  mock.timers.reset();
});

function renderEditor() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CoachingProgramEditor servicePeriodId="sp-1" />
    </QueryClientProvider>
  );
}


/** Another tab (or the student) changes the program, so the next read is different data and the page renders again. */
function changeOnServer() {
  server = {
    ...server!,
    updated_at: "later",
    tasks: server!.tasks.map((row) => (row.id === "t-4" ? { ...row, title: "Defter notları (güncel)" } : row)),
  } as CoachingProgram;
}

const loaded = () => screen.findByRole("region", { name: "Program özeti" });
const rowFor = (title: string) => {
  const items = within(screen.getByRole("list", { name: "Görevler" })).getAllByRole("listitem");
  const found = items.find((item) => item.textContent?.includes(title));
  assert.ok(found, `row for ${title}`);
  return found as HTMLElement;
};
const type = (label: string | RegExp, value: string, root: Pick<typeof screen, "getByLabelText"> = screen) =>
  fireEvent.change(root.getByLabelText(label), { target: { value } });

describe("the program summary", () => {
  it("says what the program is, for how long, what it is for, and how far the student has come", async () => {
    renderEditor();
    const summary = await loaded();

    assert.ok(within(summary).getByText("Ekim–Aralık YKS programı"));
    assert.ok(within(summary).getByText("12 Eki – 20 Ara"));
    assert.ok(within(summary).getByText("TYT matematikte 25 nete çıkmak"));
    assert.ok(within(summary).getByText(/1 \/ 4/));
    assert.ok(within(summary).getByText(/tamamlandı/));
    assert.ok(within(summary).getByText(/1 gecikti/));
    const bar = within(summary).getByRole("progressbar", { name: "Görevlerin ne kadarı tamamlandı" });
    assert.equal(bar.getAttribute("aria-valuenow"), "25");
  });

  it("says nothing is late when nothing is", async () => {
    server = seed([task({ id: "t-9", title: "Yarın", due_date: "2026-10-22" })]);
    renderEditor();
    const summary = await loaded();
    assert.ok(within(summary).queryByText(/gecikti/) === null);
  });

  it("has no program form open, and no name that asks to be typed over", async () => {
    renderEditor();
    await loaded();
    assert.ok(screen.queryByLabelText("Program başlığı") === null);
  });
});

describe("a period with no program yet", () => {
  beforeEach(() => {
    server = null;
  });

  it("opens the form to make one, with today as the start, and says why it is needed", async () => {
    renderEditor();
    assert.ok(await screen.findByRole("heading", { name: "Programı oluştur" }));
    assert.ok(screen.getByText(/rapor/i));
    assert.equal((screen.getByLabelText("Başlangıç tarihi") as HTMLInputElement).value, "2026-10-21");
    assert.equal((screen.getByLabelText("Bitiş tarihi") as HTMLInputElement).value, "");
    assert.ok(screen.queryByRole("form", { name: "Yeni görev" }) === null);
  });

  it("asks for what is missing before it sends anything", async () => {
    renderEditor();
    await screen.findByRole("heading", { name: "Programı oluştur" });
    fireEvent.click(screen.getByRole("button", { name: "Programı kaydet" }));

    assert.equal((await screen.findByRole("alert")).textContent, "Program başlığını yaz.");
    assert.equal(calls.length, 0);
  });

  it("creates it, then shows the summary and the way to add tasks", async () => {
    renderEditor();
    await screen.findByRole("heading", { name: "Programı oluştur" });
    type("Program başlığı", "  Kasım programı ");
    type("Bitiş tarihi", "2026-12-20");
    type("Bu dönemin amacı", "Paragrafta hız");
    fireEvent.click(screen.getByRole("button", { name: "Programı kaydet" }));

    await loaded();
    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, "PUT");
    assert.equal(calls[0].url, "/coaching/service-periods/sp-1/program/");
    assert.deepEqual(calls[0].body, {
      title: "Kasım programı",
      objective: "Paragrafta hız",
      start_date: "2026-10-21",
      end_date: "2026-12-20",
    });
    assert.ok(screen.getByRole("form", { name: "Yeni görev" }));
  });
});

describe("editing the program", () => {
  it("opens the form on what is saved, and closes it again without sending anything", async () => {
    renderEditor();
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Programı ve amacı düzenle" }));

    assert.equal((screen.getByLabelText("Program başlığı") as HTMLInputElement).value, "Ekim–Aralık YKS programı");
    assert.equal((screen.getByLabelText("Başlangıç tarihi") as HTMLInputElement).value, "2026-10-12");
    assert.equal((screen.getByLabelText("Bu dönemin amacı") as HTMLTextAreaElement).value, "TYT matematikte 25 nete çıkmak");
    fireEvent.click(screen.getByRole("button", { name: "Vazgeç" }));
    assert.ok(screen.queryByLabelText("Program başlığı") === null);
    assert.equal(calls.length, 0);
  });

  it("does not let the end come before the start", async () => {
    renderEditor();
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Programı ve amacı düzenle" }));
    type("Bitiş tarihi", "2026-10-01");
    fireEvent.click(screen.getByRole("button", { name: "Programı kaydet" }));

    assert.equal((await screen.findByRole("alert")).textContent, "Bitiş tarihi başlangıçtan önce olamaz.");
    assert.equal(calls.length, 0);
  });

  it("saves, and the summary shows the new words", async () => {
    renderEditor();
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Programı ve amacı düzenle" }));
    type("Program başlığı", "Kasım programı");
    fireEvent.click(screen.getByRole("button", { name: "Programı kaydet" }));

    await waitFor(() => assert.ok(screen.queryByLabelText("Program başlığı") === null));
    assert.ok(await screen.findByText("Kasım programı"));
    assert.equal(calls[0].method, "PUT");
  });

  it("keeps what was typed when the program is read again from the server", async () => {
    renderEditor();
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Programı ve amacı düzenle" }));
    type("Bu dönemin amacı", "Yarım kalan cümle");

    const before = getCount;
    changeOnServer();
    await client.invalidateQueries({ queryKey: PROGRAM_KEY });
    await waitFor(() => assert.ok(getCount > before));
    await screen.findByText("Defter notları (güncel)");

    assert.equal((screen.getByLabelText("Bu dönemin amacı") as HTMLTextAreaElement).value, "Yarım kalan cümle");
  });

  it("shows the server's refusal next to the form and keeps what was typed", async () => {
    renderEditor();
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Programı ve amacı düzenle" }));
    type("Program başlığı", "Kasım programı");
    failNext = { status: 400, detail: "Program kaydedilemedi." };
    fireEvent.click(screen.getByRole("button", { name: "Programı kaydet" }));

    assert.equal((await screen.findByRole("alert")).textContent, "Program kaydedilemedi.");
    assert.equal((screen.getByLabelText("Program başlığı") as HTMLInputElement).value, "Kasım programı");
  });
});

describe("the task list", () => {
  it("is the student's own order: what is late first, then by date, undated, and what is done last", async () => {
    renderEditor();
    await loaded();
    const titles = within(screen.getByRole("list", { name: "Görevler" }))
      .getAllByRole("listitem")
      .map((item) => item.querySelector("h3")?.textContent);
    assert.equal(
      titles.join("|"),
      "Limit-süreklilik 40 soru|Paragraf denemesi|Defter notları|Fonksiyonlar test 30 soru"
    );
  });

  it("says each task's subject, priority and date, and calls the late one late", async () => {
    renderEditor();
    await loaded();
    const late = rowFor("Limit-süreklilik 40 soru");
    assert.ok(within(late).getByText("AYT Matematik · Öncelik: Yüksek"));
    assert.ok(within(late).getByText(/Gecikti · Sal 20 Eki/));
    const open = rowFor("Paragraf denemesi");
    assert.ok(within(open).getByText(/Hedef/));
    assert.ok(within(open).getByText("Per 22 Eki"));
    assert.ok(within(rowFor("Defter notları")).getByText("Tarihi yok"));
    assert.ok(within(rowFor("Defter notları")).getByText("Defterden tekrar"));
  });

  it("says who finished a task and when", async () => {
    renderEditor();
    await loaded();
    assert.ok(within(rowFor("Fonksiyonlar test 30 soru")).getByText("Öğrenci tamamladı · Pzt 19 Eki"));
    assert.ok(within(rowFor("Paragraf denemesi")).queryByText(/Öğrenci tamamladı/) === null);
  });

  it("has no buttons to move a task: the student's order is by date", async () => {
    renderEditor();
    await loaded();
    assert.ok(screen.queryByRole("button", { name: /taşı/i }) === null);
  });

  it("invites the first task when there are none", async () => {
    server = seed([]);
    renderEditor();
    await loaded();
    assert.ok(screen.getByText("Henüz görev yok"));
  });
});

describe("adding a task", () => {
  const form = () => screen.getByRole("form", { name: "Yeni görev" });

  it("asks for the title, the subject, a date and a priority of three, each with its label on screen", async () => {
    renderEditor();
    await loaded();
    const quick = within(form());
    assert.ok(quick.getByLabelText("Görev"));
    assert.ok(quick.getByLabelText("Ders (isteğe bağlı)"));
    assert.ok(quick.getByLabelText("Hedef tarih"));
    const group = quick.getByRole("group", { name: "Öncelik" });
    assert.equal(within(group).getAllByRole("button").map((button) => button.textContent).join("|"), "Yüksek|Orta|Düşük");
    assert.ok(quick.getByRole("button", { name: "Ekle" }));
  });

  it("sends the task, shows it, empties the form and puts the cursor back on the title", async () => {
    renderEditor();
    await loaded();
    const quick = within(form());
    type("Görev", "  Newton yasaları  ", quick);
    type("Ders (isteğe bağlı)", "AYT Fizik", quick);
    type("Hedef tarih", "2026-10-23", quick);
    fireEvent.click(within(quick.getByRole("group", { name: "Öncelik" })).getByRole("button", { name: "Orta" }));
    fireEvent.click(quick.getByRole("button", { name: "Ekle" }));

    await waitFor(() => assert.ok(screen.queryByText("Newton yasaları")));
    assert.deepEqual(calls[0], {
      method: "POST",
      url: "/coaching/programs/p-1/tasks/",
      body: { title: "Newton yasaları", description: "", subject: "AYT Fizik", due_date: "2026-10-23", priority: "Orta" },
    });
    const title = screen.getByLabelText("Görev") as HTMLInputElement;
    await waitFor(() => assert.equal(title.value, ""));
    assert.ok(document.activeElement === title);
    assert.equal((screen.getByLabelText("Ders (isteğe bağlı)") as HTMLInputElement).value, "");
    assert.equal(
      within(within(form()).getByRole("group", { name: "Öncelik" })).getAllByRole("button").filter((b) => b.getAttribute("aria-pressed") === "true").length,
      0
    );
  });

  it("sends no priority when none is picked, and lets a pick be taken back", async () => {
    renderEditor();
    await loaded();
    const quick = within(form());
    const group = within(quick.getByRole("group", { name: "Öncelik" }));
    fireEvent.click(group.getByRole("button", { name: "Yüksek" }));
    assert.equal(group.getByRole("button", { name: "Yüksek" }).getAttribute("aria-pressed"), "true");
    fireEvent.click(group.getByRole("button", { name: "Yüksek" }));
    assert.equal(group.getByRole("button", { name: "Yüksek" }).getAttribute("aria-pressed"), "false");
    type("Görev", "Sadece başlık", quick);
    fireEvent.click(quick.getByRole("button", { name: "Ekle" }));

    await waitFor(() => assert.equal(calls.length, 1));
    assert.ok(calls[0].body?.priority === null);
    assert.ok(calls[0].body?.due_date === null);
  });

  it("adds a description only when asked for", async () => {
    renderEditor();
    await loaded();
    const quick = within(form());
    assert.ok(quick.queryByLabelText("Açıklama") === null);
    fireEvent.click(quick.getByRole("button", { name: "Açıklama ekle" }));
    type("Görev", "Deneme", quick);
    type("Açıklama", "Süre tut", quick);
    fireEvent.click(quick.getByRole("button", { name: "Ekle" }));

    await waitFor(() => assert.equal(calls.length, 1));
    assert.equal(calls[0].body?.description, "Süre tut");
  });

  it("will not send a task with no title, and says so next to the form", async () => {
    renderEditor();
    await loaded();
    fireEvent.click(within(form()).getByRole("button", { name: "Ekle" }));

    assert.equal((await within(form()).findByRole("alert")).textContent, "Görev başlığını yaz.");
    assert.equal(calls.length, 0);
  });

  it("keeps what was typed when the server says no, and says what it said", async () => {
    renderEditor();
    await loaded();
    type("Görev", "Kaybolmasın", within(form()));
    failNext = { status: 400, detail: "Görev eklenemedi." };
    fireEvent.click(within(form()).getByRole("button", { name: "Ekle" }));

    assert.equal((await within(form()).findByRole("alert")).textContent, "Görev eklenemedi.");
    assert.equal((screen.getByLabelText("Görev") as HTMLInputElement).value, "Kaybolmasın");
  });

  it("keeps what is half typed when the program is read again", async () => {
    renderEditor();
    await loaded();
    type("Görev", "Yarım", within(form()));
    const before = getCount;
    changeOnServer();
    await client.invalidateQueries({ queryKey: PROGRAM_KEY });
    await waitFor(() => assert.ok(getCount > before));
    await screen.findByText("Defter notları (güncel)");
    assert.equal((screen.getByLabelText("Görev") as HTMLInputElement).value, "Yarım");
  });
});

describe("editing a task", () => {
  it("opens on what is stored, writes only the content and closes", async () => {
    renderEditor();
    await loaded();
    fireEvent.click(within(rowFor("Paragraf denemesi")).getByRole("button", { name: "Paragraf denemesi görevini düzenle" }));

    const edit = screen.getByRole("form", { name: "Görevi düzenle" });
    assert.equal((within(edit).getByLabelText("Görev") as HTMLInputElement).value, "Paragraf denemesi");
    assert.equal((within(edit).getByLabelText("Hedef tarih") as HTMLInputElement).value, "2026-10-22");
    assert.equal(within(within(edit).getByRole("group", { name: "Öncelik" })).getByRole("button", { name: "Orta" }).getAttribute("aria-pressed"), "true");
    type("Görev", "Paragraf denemesi 2", within(edit));
    fireEvent.click(within(edit).getByRole("button", { name: "İçeriği kaydet" }));

    await waitFor(() => assert.ok(screen.queryByRole("form", { name: "Görevi düzenle" }) === null));
    assert.deepEqual(calls[0], {
      method: "PATCH",
      url: "/coaching/program-tasks/t-2/",
      body: { title: "Paragraf denemesi 2", description: "", subject: "Türkçe", due_date: "2026-10-22", priority: "Orta" },
    });
    assert.ok(await screen.findByText("Paragraf denemesi 2"));
  });

  it("shows the description it has, and offers an old free-text priority so it is not wiped", async () => {
    server = seed([task({ id: "t-7", title: "Eski", description: "Not", priority: "acil" })]);
    renderEditor();
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Eski görevini düzenle" }));
    const edit = screen.getByRole("form", { name: "Görevi düzenle" });

    assert.equal((within(edit).getByLabelText("Açıklama") as HTMLTextAreaElement).value, "Not");
    const group = within(within(edit).getByRole("group", { name: "Öncelik" }));
    assert.equal(group.getByRole("button", { name: "acil" }).getAttribute("aria-pressed"), "true");
  });

  it("keeps what was typed when the program is read again, and closes without sending on Vazgeç", async () => {
    renderEditor();
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Paragraf denemesi görevini düzenle" }));
    const edit = screen.getByRole("form", { name: "Görevi düzenle" });
    type("Görev", "Yarım kalan", within(edit));

    const before = getCount;
    changeOnServer();
    await client.invalidateQueries({ queryKey: PROGRAM_KEY });
    await waitFor(() => assert.ok(getCount > before));
    await screen.findByText("Defter notları (güncel)");
    const again = within(screen.getByRole("form", { name: "Görevi düzenle" }));
    assert.equal((again.getByLabelText("Görev") as HTMLInputElement).value, "Yarım kalan");

    fireEvent.click(within(screen.getByRole("form", { name: "Görevi düzenle" })).getByRole("button", { name: "Vazgeç" }));
    assert.ok(screen.queryByRole("form", { name: "Görevi düzenle" }) === null);
    assert.equal(calls.length, 0);
  });

  it("will not save an empty title", async () => {
    renderEditor();
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Paragraf denemesi görevini düzenle" }));
    const edit = screen.getByRole("form", { name: "Görevi düzenle" });
    type("Görev", "  ", within(edit));
    fireEvent.click(within(edit).getByRole("button", { name: "İçeriği kaydet" }));

    assert.equal((await within(edit).findByRole("alert")).textContent, "Görev başlığını yaz.");
    assert.equal(calls.length, 0);
  });
});

describe("deleting a task", () => {
  it("asks first, on the row, and Vazgeç leaves everything as it was", async () => {
    renderEditor();
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Paragraf denemesi görevini sil" }));

    const row = rowFor("Paragraf denemesi");
    assert.ok(within(row).getByText("Silinsin mi?"));
    assert.equal(calls.length, 0);
    fireEvent.click(within(row).getByRole("button", { name: "Vazgeç" }));
    assert.ok(within(rowFor("Paragraf denemesi")).queryByText("Silinsin mi?") === null);
    assert.equal(calls.length, 0);
  });

  it("deletes after the second tap", async () => {
    renderEditor();
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Paragraf denemesi görevini sil" }));
    fireEvent.click(within(rowFor("Paragraf denemesi")).getByRole("button", { name: "Evet, sil" }));

    await waitFor(() => assert.ok(screen.queryByText("Paragraf denemesi") === null));
    assert.deepEqual(calls, [{ method: "DELETE", url: "/coaching/program-tasks/t-2/" }]);
  });

  it("says what is lost when the student had finished the task, and not otherwise", async () => {
    renderEditor();
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Paragraf denemesi görevini sil" }));
    assert.ok(within(rowFor("Paragraf denemesi")).queryByText(/tamamlamıştı/) === null);
    fireEvent.click(within(rowFor("Paragraf denemesi")).getByRole("button", { name: "Vazgeç" }));

    fireEvent.click(screen.getByRole("button", { name: "Fonksiyonlar test 30 soru görevini sil" }));
    assert.ok(within(rowFor("Fonksiyonlar test 30 soru")).getByText(/Öğrenci bunu tamamlamıştı; silersen kaydı da kalkar\./));
  });

  it("says so on the row and keeps the task when the server refuses", async () => {
    renderEditor();
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Paragraf denemesi görevini sil" }));
    failNext = { status: 500, detail: "Görev silinemedi." };
    fireEvent.click(within(rowFor("Paragraf denemesi")).getByRole("button", { name: "Evet, sil" }));

    assert.equal((await within(rowFor("Paragraf denemesi")).findByRole("alert")).textContent, "Görev silinemedi.");
  });
});
