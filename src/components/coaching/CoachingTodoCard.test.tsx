import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import type { CoachingTodo } from "@/lib/coachingOverview";
import { CoachingTodoCard } from "./CoachingTodoCard";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });
after(() => window.close());
afterEach(cleanup);

const todos: CoachingTodo[] = [
  {
    id: "acceptance-1",
    kind: "acceptance",
    tab: "requests",
    title: "Can T. koçluk istiyor",
    detail: "Haftada 1 görüşme · 4 görüşmelik paket · 2.400,00 ₺",
    due: { label: "2 sa 15 dk kaldı", urgent: true },
    action: { label: "Yanıtla", href: "/dashboard/tutor/coaching/requests" },
    at: 1,
  },
  {
    id: "session-1",
    kind: "session",
    tab: "today",
    title: "Bugün 19:00 · Zeynep K.",
    detail: "30 dk görüşme",
    due: null,
    action: { label: "Hazırlan", href: "/dashboard/tutor/coaching/sessions/s-1/prepare" },
    at: 2,
  },
  {
    id: "report-1",
    kind: "report",
    tab: "reports",
    title: "Zeynep K. raporu yazılmadı",
    detail: "18 Ekim Pazar görüşmesi",
    due: { label: "Yarın 18:00", urgent: false },
    action: { label: "Raporu yaz", href: "/dashboard/tutor/coaching/sessions/s-r/report" },
    at: 3,
  },
  {
    id: "reschedule-1",
    kind: "reschedule",
    tab: "requests",
    title: "Mert A. saat değiştirmek istiyor",
    detail: "21 Ekim Çarşamba 18:30 yerine 22 Ekim Perşembe 18:30",
    due: { label: "Çar 18:30 öncesi", urgent: false },
    action: { label: "Yanıtla", href: "/dashboard/tutor/coaching/reschedule-requests" },
    at: 4,
  },
];

function card(overrides: Partial<React.ComponentProps<typeof CoachingTodoCard>> = {}) {
  return <CoachingTodoCard todos={todos} state="ready" {...overrides} />;
}

describe("CoachingTodoCard", () => {
  it("heads the list with a pink band and how many things are waiting", () => {
    render(card());

    const heading = screen.getByRole("heading", { name: "Yapılacaklar" });
    const band = heading.closest("[class*='bg-pink']");
    assert.ok(band, "the heading sits on the pink band");
    assert.match(within(band as HTMLElement).getByText("4").className, /bg-gold/);
  });

  it("shows each thing with what it is, the detail, when it is due, and the way to do it", () => {
    render(card());

    const rows = screen.getAllByRole("listitem");
    assert.equal(rows.length, 4);
    const first = within(rows[0]);
    assert.ok(first.getByText("Can T. koçluk istiyor"));
    assert.ok(first.getByText(/2.400,00/));
    assert.ok(first.getByText("2 sa 15 dk kaldı"));
    assert.equal(first.getByRole("link", { name: "Yanıtla" }).getAttribute("href"), "/dashboard/tutor/coaching/requests");
    assert.equal(
      within(rows[1]).getByRole("link", { name: "Hazırlan" }).getAttribute("href"),
      "/dashboard/tutor/coaching/sessions/s-1/prepare"
    );
  });

  it("makes the action a solid gold button, never a pill the colour of the row behind it", () => {
    render(card());

    for (const link of screen.getAllByRole("link")) {
      assert.match(link.className, /bg-gold/);
      assert.match(link.className, /text-gold-ink/);
      assert.doesNotMatch(link.className, /bg-transparent|bg-surface|bg-paper|bg-white/);
      assert.match(link.className, /min-h-11/);
    }
  });

  it("paints an urgent deadline as a filled pink-deep pill and a calm one as an outline", () => {
    render(card());

    const urgent = screen.getByText("2 sa 15 dk kaldı");
    assert.match(urgent.className, /bg-pink-deep/);
    assert.match(urgent.className, /text-white/);
    const calm = screen.getByText("Yarın 18:00");
    assert.match(calm.className, /border-ink/);
    assert.doesNotMatch(calm.className, /bg-pink-deep|bg-gold/);
  });

  it("filters by kind with chips that carry their counts", () => {
    render(card());

    const chips = screen.getAllByRole("button");
    assert.deepEqual(
      chips.map((chip) => chip.textContent),
      ["Hepsi 4", "Talepler 2", "Raporlar 1", "Bugün 1"]
    );
    assert.equal(screen.getByRole("button", { name: "Hepsi 4" }).getAttribute("aria-pressed"), "true");

    fireEvent.click(screen.getByRole("button", { name: "Talepler 2" }));
    assert.equal(screen.getAllByRole("listitem").length, 2);
    assert.equal(screen.getByRole("button", { name: "Talepler 2" }).getAttribute("aria-pressed"), "true");
    assert.equal(screen.queryByText("Zeynep K. raporu yazılmadı"), null);

    fireEvent.click(screen.getByRole("button", { name: "Raporlar 1" }));
    assert.deepEqual(
      screen.getAllByRole("listitem").map((row) => within(row).getByRole("link").textContent),
      ["Raporu yaz"]
    );
  });

  it("keeps the band count at the total, whichever chip is chosen", () => {
    render(card());
    fireEvent.click(screen.getByRole("button", { name: "Bugün 1" }));

    const band = screen.getByRole("heading", { name: "Yapılacaklar" }).closest("[class*='bg-pink']") as HTMLElement;
    assert.ok(within(band).getByText("4"));
  });

  it("goes back to everything when the chosen kind has been cleared", () => {
    const { rerender } = render(card());
    fireEvent.click(screen.getByRole("button", { name: "Raporlar 1" }));

    rerender(card({ todos: todos.filter((todo) => todo.kind !== "report") }));

    assert.equal(screen.getAllByRole("listitem").length, 3);
    assert.equal(screen.getByRole("button", { name: "Hepsi 3" }).getAttribute("aria-pressed"), "true");
    assert.equal(screen.queryByRole("button", { name: /Raporlar/ }), null);
  });

  it("does not offer chips for a single thing", () => {
    render(card({ todos: [todos[0]] }));

    assert.equal(screen.queryAllByRole("button").length, 0);
    assert.equal(screen.getAllByRole("listitem").length, 1);
  });

  it("says so, quietly, when nothing is waiting", () => {
    render(card({ todos: [] }));

    assert.ok(screen.getByText("Şu an yapılacak bir şey yok."));
    assert.ok(screen.getByText(/Yeni talep.*burada görünür/));
    assert.equal(screen.queryByRole("listitem"), null);
    const band = screen.getByRole("heading", { name: "Yapılacaklar" }).closest("[class*='bg-pink']") as HTMLElement;
    assert.equal(within(band).queryByText("0"), null);
  });

  it("offers a retry when the list could not load", () => {
    const onRetry = mock.fn();
    render(card({ todos: [], state: "error", onRetry }));

    assert.ok(screen.getByText("Yapılacaklar yüklenemedi."));
    fireEvent.click(screen.getByRole("button", { name: /Tekrar dene/ }));
    assert.equal(onRetry.mock.callCount(), 1);
  });

  it("shows a placeholder while loading, not the empty message", () => {
    render(card({ todos: [], state: "loading" }));

    assert.equal(screen.queryByText("Şu an yapılacak bir şey yok."), null);
    assert.ok(screen.getByRole("status", { name: "Yapılacaklar yükleniyor" }));
  });

  it("lets the action drop under the text on a narrow phone", () => {
    render(card());

    const row = screen.getAllByRole("listitem")[0];
    assert.match(row.className, /min-\[400px\]:grid-cols-/);
  });
});
