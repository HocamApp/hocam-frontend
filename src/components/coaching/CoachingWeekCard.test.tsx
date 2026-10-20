import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import type { CoachingWeekDay } from "@/lib/coachingOverview";
import { CoachingWeekCard } from "./CoachingWeekCard";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });
after(() => window.close());
afterEach(cleanup);

const labels = ["Pzt 19", "Sal 20", "Çar 21", "Per 22", "Cum 23", "Cmt 24", "Paz 25"];
const sessionsByIndex: Record<number, { id: string; time: string; studentName: string }[]> = {
  0: [{ id: "pzt", time: "19:00", studentName: "Zeynep K." }],
  2: [{ id: "car", time: "18:30", studentName: "Mert A." }],
  3: [
    { id: "per-1", time: "09:00", studentName: "Can T." },
    { id: "per-2", time: "20:00", studentName: "Elif Y." },
  ],
  4: [{ id: "cum", time: "19:00", studentName: "Zeynep K." }],
  5: [{ id: "cmt", time: "11:00", studentName: "Mert A." }],
};

const days: CoachingWeekDay[] = labels.map((label, index) => ({
  dateKey: `2026-10-${19 + index}`,
  label,
  isToday: index === 0,
  sessions: sessionsByIndex[index] ?? [],
}));
const week = { days, total: 6 };

const offer = { published: true, acceptingNewStudents: true, activeStudents: 3, maxStudents: 6 };

function card(overrides: Partial<React.ComponentProps<typeof CoachingWeekCard>> = {}) {
  return <CoachingWeekCard week={week} state="ready" offer={offer} {...overrides} />;
}

describe("CoachingWeekCard", () => {
  it("heads the week with an ink band, since the meetings are the tutor's own record", () => {
    render(card());

    const heading = screen.getByRole("heading", { name: "Bu hafta" });
    const band = heading.closest("[class*='bg-ink']") as HTMLElement;
    assert.ok(band);
    assert.ok(within(band).getByText("6 görüşme"));
  });

  it("lists the seven days Monday to Sunday", () => {
    render(card());

    const rows = screen.getAllByRole("listitem");
    assert.deepEqual(
      rows.map((row) => within(row).getByText(/^(Pzt|Sal|Çar|Per|Cum|Cmt|Paz) \d+$/).textContent),
      labels
    );
  });

  it("writes each meeting as time and student, and several on one day one under another", () => {
    render(card());

    const thursday = screen.getAllByRole("listitem")[3];
    assert.deepEqual(
      within(thursday).getAllByText(/·/).map((line) => line.textContent),
      ["09:00 · Can T.", "20:00 · Elif Y."]
    );
  });

  it("says a day with no meeting has none", () => {
    render(card());

    const tuesday = screen.getAllByRole("listitem")[1];
    assert.ok(within(tuesday).getByText("Görüşme yok"));
  });

  it("marks today with a flat gold pill and nothing else", () => {
    render(card());

    const pills = screen.getAllByText("Bugün");
    assert.equal(pills.length, 1);
    assert.match(pills[0].className, /bg-gold/);
    assert.match(pills[0].className, /text-gold-ink/);
    assert.ok(within(screen.getAllByRole("listitem")[0]).getByText("Bugün"));
    // No pale-pink row fill: DESIGN.md keeps --pink-pale a section surface only.
    for (const row of screen.getAllByRole("listitem")) {
      assert.doesNotMatch(row.className, /pink-pale|pink-soft/);
    }
  });

  it("does not turn a quiet week into a row of nothing", () => {
    render(card({ week: { days: days.map((day) => ({ ...day, sessions: [] })), total: 0 } }));

    assert.ok(screen.getByText("Bu hafta görüşme yok"));
    assert.equal(screen.queryByText("0 görüşme"), null);
  });

  it("sums up the offer under the week: live, how many students, how many places free", () => {
    render(card());

    const footer = screen.getByRole("region", { name: "Teklifin durumu" });
    const live = within(footer).getByText("Teklifin yayında");
    assert.match(live.className, /bg-gold/);
    assert.ok(within(footer).getByText("3 / 6 kontenjan dolu · 3 boş"));
    assert.equal(
      within(footer).getByRole("link", { name: "Teklif ayarları" }).getAttribute("href"),
      "/dashboard/tutor/coaching/plan"
    );
  });

  it("shows an outline, not gold, when the offer is not live", () => {
    render(card({ offer: { ...offer, published: false } }));

    const draft = screen.getByText("Yayında değil");
    assert.doesNotMatch(draft.className, /bg-gold/);
    assert.match(draft.className, /border-ink/);
  });

  it("says when new students are not being taken, rather than showing places as free", () => {
    render(card({ offer: { ...offer, acceptingNewStudents: false } }));

    assert.ok(screen.getByText("3 / 6 kontenjan dolu · yeni öğrenci almıyorsun"));
  });

  it("never prints a negative number of free places", () => {
    render(card({ offer: { ...offer, activeStudents: 7, maxStudents: 6 } }));

    assert.ok(screen.getByText("7 / 6 kontenjan dolu · 0 boş"));
  });

  it("leaves the footer out when there is no offer yet", () => {
    render(card({ offer: null }));

    assert.equal(screen.queryByRole("region", { name: "Teklifin durumu" }), null);
  });

  it("offers a retry when the week could not load", () => {
    const onRetry = mock.fn();
    render(card({ state: "error", onRetry }));

    assert.ok(screen.getByText("Bu hafta yüklenemedi."));
    fireEvent.click(screen.getByRole("button", { name: /Tekrar dene/ }));
    assert.equal(onRetry.mock.callCount(), 1);
  });

  it("shows a placeholder while loading", () => {
    render(card({ state: "loading" }));

    assert.ok(screen.getByRole("status", { name: "Bu hafta yükleniyor" }));
    assert.equal(screen.queryByText("Görüşme yok"), null);
  });
});
