import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

// Tuesday 20 October 2026, 15:20 in Istanbul. The page reads the clock; the tests freeze it.
const NOW = new Date("2026-10-20T12:20:00Z");

type Raw = {
  id: string;
  title: string;
  subject?: string;
  due_date: string | null;
  priority?: string | null;
  description?: string;
  sort_order: number;
  done?: boolean;
  completed_at?: string | null;
};

const baseTasks: Raw[] = [
  { id: "late", title: "Geçen haftanın fizik denemesi hata defteri", subject: "Fizik", due_date: "2026-10-18", priority: "Yüksek", sort_order: 1 },
  { id: "t1", title: "Problemler: 40 soru", subject: "Matematik", due_date: "2026-10-21", priority: "Yüksek", sort_order: 2 },
  { id: "t2", title: "Paragraf: 2 deneme", subject: "Türkçe", due_date: "2026-10-22", sort_order: 3 },
  { id: "t3", title: "Türev çıkmış soru analizi", subject: "Matematik", due_date: "2026-10-23", description: "Son 5 yılın türev sorularını çöz, yanlışları not et", sort_order: 4 },
  { id: "nodate", title: "Okuma listesi", subject: "Türkçe", due_date: null, sort_order: 5 },
  { id: "done1", title: "TYT Fizik denemesi", subject: "Fizik", due_date: "2026-10-17", sort_order: 6, done: true, completed_at: "2026-10-16T09:00:00Z" },
  { id: "done2", title: "Fonksiyonlar test seti", subject: "Matematik", due_date: "2026-10-15", sort_order: 7, done: true, completed_at: "2026-10-14T09:00:00Z" },
];

let tasks: Raw[] = baseTasks;
let state: Record<string, unknown> | "missing" | "error" = {};
let programMode: "ok" | "missing" | "error" = "ok";
let finished = new Set<string>();
const posted: string[] = [];
const toasts: { kind: string; message: string; options?: { action?: { label: string; onClick: () => void }; duration?: number } }[] = [];

const activeState = {
  id: "cp-1",
  service_period_id: "p-1",
  service_status: "active",
  frequency: "twice_weekly",
  weeks: 4,
  total_sessions: 8,
  slot_selection_deadline_at: null,
  required_slot_count: 2,
};

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
      useRouter: () => ({ push() {}, replace() {}, back() {} }),
      usePathname: () => "/dashboard/student/coaching/program",
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
  mock.module("sonner", {
    namedExports: {
      toast: {
        success: (message: string, options?: never) => toasts.push({ kind: "success", message, options }),
        error: (message: string) => toasts.push({ kind: "error", message }),
      },
    },
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/coaching/scheduling/") {
          if (state === "missing") throw httpError(404);
          if (state === "error") throw httpError(500);
          return { data: state };
        }
        if (url === "/coaching/service-periods/p-1/program/") {
          if (programMode === "missing") throw httpError(404);
          if (programMode === "error") throw httpError(500);
          return {
            data: {
              id: "pr-1",
              service_period_id: "p-1",
              title: "Ekim programı",
              objective: "Ekim sonuna kadar TYT matematik netini 22'den 28'e çıkarmak.",
              start_date: "2026-10-12",
              end_date: "2026-11-09",
              tasks: tasks.map((task) => {
                const is_completed = finished.has(task.id) ? !task.done : Boolean(task.done);
                return {
                  id: task.id,
                  title: task.title,
                  description: task.description ?? "",
                  subject: task.subject ?? "",
                  due_date: task.due_date,
                  priority: task.priority ?? null,
                  sort_order: task.sort_order,
                  is_completed,
                  completed_at: is_completed ? (task.completed_at ?? "2026-10-20T12:00:00Z") : null,
                };
              }),
            },
          };
        }
        throw new Error(`unexpected GET ${url}`);
      },
      post: async (url: string) => {
        posted.push(url);
        const match = /program-tasks\/(.+)\/toggle-completion/.exec(url);
        if (!match) throw new Error(`unexpected POST ${url}`);
        const id = match[1];
        if (finished.has(id)) finished.delete(id);
        else finished.add(id);
        const task = tasks.find((entry) => entry.id === id)!;
        const is_completed = finished.has(id) ? !task.done : Boolean(task.done);
        return { data: { id, is_completed } };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  mock.timers.enable({ apis: ["Date"], now: NOW });
  tasks = baseTasks;
  state = activeState;
  programMode = "ok";
  finished = new Set();
  posted.length = 0;
  toasts.length = 0;
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

describe("student Koçluk Programım: the goal", () => {
  it("states the goal, how many tasks are done, and where today sits in the program", async () => {
    renderPage();

    assert.ok(screen.getByRole("heading", { level: 1, name: "Koçluk Programım" }));
    const goal = await screen.findByRole("region", { name: "Program hedefi" });
    assert.ok(within(goal).getByText("Hedefin"));
    assert.ok(within(goal).getByText("Ekim sonuna kadar TYT matematik netini 22'den 28'e çıkarmak."));
    assert.match(goal.textContent ?? "", /2\s*\/\s*7/);
    assert.ok(within(goal).getByText("görev tamamlandı"));
    assert.ok(within(goal).getByText("12 Eki"));
    assert.ok(within(goal).getByText("9 Kas"));
    assert.ok(within(goal).getByText("Ekim programı"));
    assert.ok(within(goal).getByText("Bugün"));
  });
});

describe("student Koçluk Programım: what is left", () => {
  it("opens on Bekleyen and lists the tasks by date, the overdue one first and the undated one last", async () => {
    renderPage();

    const pending = await screen.findByRole("button", { name: "Bekleyen 5" });
    assert.equal(pending.getAttribute("aria-pressed"), "true");
    assert.equal(screen.getByRole("button", { name: "Tamamlanan 2" }).getAttribute("aria-pressed"), "false");

    const list = screen.getByRole("list", { name: "Bekleyen görevler" });
    const rows = within(list).getAllByRole("listitem");
    assert.deepEqual(
      rows.map((row) => within(row).getByRole("heading", { level: 3 }).textContent),
      [
        "Geçen haftanın fizik denemesi hata defteri",
        "Problemler: 40 soru",
        "Paragraf: 2 deneme",
        "Türev çıkmış soru analizi",
        "Okuma listesi",
      ],
    );
  });

  it("writes dates for people, marks the late task, and shows the subject, the priority as the tutor typed it and the description", async () => {
    renderPage();

    const list = await screen.findByRole("list", { name: "Bekleyen görevler" });
    const [late, problems, , derivative, undated] = within(list).getAllByRole("listitem");
    assert.ok(within(late).getByText("Paz 18 Eki"));
    assert.ok(within(late).getByText("Gecikti"));
    assert.ok(within(late).getByText("Fizik · Öncelik: Yüksek"));
    assert.equal(within(problems).queryByText("Gecikti"), null);
    assert.ok(within(problems).getByText("Çar 21 Eki"));
    assert.ok(within(derivative).getByText("Son 5 yılın türev sorularını çöz, yanlışları not et"));
    assert.equal(within(undated).queryByText("Hedef"), null);
    assert.equal(screen.queryByText(/2026-10-2\d/), null);
  });

  it("completes a task, takes it off the list, and offers to undo it for a few seconds", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Problemler: 40 soru görevini tamamla" }));

    await waitFor(() => assert.deepEqual(posted, ["/coaching/program-tasks/t1/toggle-completion/"]));
    await waitFor(() => assert.equal(screen.queryByText("Problemler: 40 soru"), null));
    assert.ok(screen.getByRole("button", { name: "Bekleyen 4" }));
    assert.ok(screen.getByRole("button", { name: "Tamamlanan 3" }));

    const toast = toasts.find((entry) => entry.message === "Görev tamamlandı.")!;
    assert.equal(toast.options?.action?.label, "Geri al");
    assert.equal(toast.options?.duration, 6000);

    toast.options!.action!.onClick();
    await waitFor(() => assert.equal(posted.length, 2));
    await screen.findByText("Problemler: 40 soru");
    assert.ok(toasts.some((entry) => entry.message === "Görev yeniden açıldı."));
  });

  it("says everything is done when nothing is left, and starts on the finished ones", async () => {
    tasks = baseTasks.filter((task) => task.done);
    renderPage();

    const finishedChip = await screen.findByRole("button", { name: "Tamamlanan 2" });
    assert.equal(finishedChip.getAttribute("aria-pressed"), "true");
    fireEvent.click(screen.getByRole("button", { name: "Bekleyen 0" }));
    assert.ok(screen.getByText("Bütün görevlerin tamam."));
  });
});

describe("student Koçluk Programım: what is done", () => {
  it("lists the latest finished first with the day, and reopens one", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Tamamlanan 2" }));
    const list = screen.getByRole("list", { name: "Tamamlanan görevler" });
    const rows = within(list).getAllByRole("listitem");
    assert.deepEqual(
      rows.map((row) => within(row).getByRole("heading", { level: 3 }).textContent),
      ["TYT Fizik denemesi", "Fonksiyonlar test seti"],
    );
    assert.ok(within(rows[0]).getByText("Tamamlandı Cum 16 Eki"));

    fireEvent.click(within(rows[0]).getByRole("button", { name: "TYT Fizik denemesi görevini yeniden aç" }));
    await waitFor(() => assert.deepEqual(posted, ["/coaching/program-tasks/done1/toggle-completion/"]));
    await waitFor(() => assert.equal(screen.queryByText("TYT Fizik denemesi"), null));
    assert.ok(toasts.some((entry) => entry.message === "Görev yeniden açıldı." && !entry.options?.action));
  });
});

describe("student Koçluk Programım: states", () => {
  it("says the program could not be read and retries only that", async () => {
    programMode = "error";
    renderPage();

    assert.ok(await screen.findByText("Programın yüklenemedi."));
    assert.equal(screen.queryByText("Programın henüz hazır değil"), null);

    programMode = "ok";
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    await screen.findByRole("region", { name: "Program hedefi" });
    await waitFor(() => assert.equal(screen.queryByText("Programın yüklenemedi."), null));
  });

  it("says the coaching could not be read and retries", async () => {
    state = "error";
    renderPage();

    assert.ok(await screen.findByText("Koçluk bilgilerin yüklenemedi. Bağlantını kontrol edip tekrar dene."));
    state = activeState;
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    await screen.findByRole("region", { name: "Program hedefi" });
  });

  it("explains an empty program, and a missing period in words that fit a coaching that has not started or has ended", async () => {
    programMode = "missing";
    const first = renderPage();
    assert.ok(await screen.findByText("Programın henüz hazır değil"));
    first.unmount();

    state = { ...activeState, service_period_id: null, service_status: "accepted_awaiting_schedule" };
    const second = renderPage();
    assert.ok(await screen.findByText(/koçluk dönemin başladığında burada görünür/));
    assert.ok(screen.getByText(/Raporlar sekmesinde kalır/));
    second.unmount();

    state = "missing";
    renderPage();
    assert.ok(await screen.findByText(/koçluk dönemin başladığında burada görünür/));
  });
});
