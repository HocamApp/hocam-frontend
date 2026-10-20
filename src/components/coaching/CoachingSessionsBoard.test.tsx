import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import type { TutorNextSession, TutorReportRow, TutorSessionDay } from "@/lib/coachingSessions";
import { CoachingSessionsBoard } from "./CoachingSessionsBoard";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });
after(() => window.close());
afterEach(cleanup);

const next: TutorNextSession = {
  id: "s-1",
  time: "19:00",
  studentName: "Zeynep K.",
  detail: "30 dk · 5. görüşme",
  note: null,
  prepareHref: "/dashboard/tutor/coaching/sessions/s-1/prepare",
  join: { kind: "closed", opensLabel: "18:45'te açılır" },
  when: "Bugün 19:00",
  countdown: "6 sa 30 dk sonra",
};

const days: TutorSessionDay[] = [
  {
    dateKey: "2026-10-21",
    heading: "21 Ekim Çarşamba",
    rows: [
      {
        id: "car",
        time: "18:30",
        studentName: "Mert A.",
        detail: "30 dk · 4. görüşme",
        note: "Saat değişikliği istendi",
        prepareHref: "/dashboard/tutor/coaching/sessions/car/prepare",
        join: null,
      },
    ],
  },
  {
    dateKey: "2026-10-22",
    heading: "22 Ekim Perşembe",
    rows: [
      {
        id: "per",
        time: "20:00",
        studentName: "Elif Y.",
        detail: "30 dk · 2. görüşme",
        note: null,
        prepareHref: "/dashboard/tutor/coaching/sessions/per/prepare",
        join: null,
      },
    ],
  },
];

const reports: TutorReportRow[] = [
  {
    id: "r-1",
    studentName: "Zeynep K.",
    detail: "18 Ekim Pazar görüşmesi",
    due: { value: "Yarın 18:00", urgent: false },
    href: "/dashboard/tutor/coaching/sessions/r-1/report",
  },
];

function board(overrides: Partial<React.ComponentProps<typeof CoachingSessionsBoard>> = {}) {
  return <CoachingSessionsBoard next={next} days={days} reports={reports} total={3} {...overrides} />;
}

describe("CoachingSessionsBoard: the next meeting", () => {
  it("puts it first on a pink card, with how long until it", () => {
    render(board());

    const card = screen.getByRole("region", { name: "Sıradaki görüşme" });
    assert.match(card.className, /border-pink/);
    assert.ok(within(card).getByText("Sıradaki görüşme · 6 sa 30 dk sonra"));
    assert.ok(within(card).getByText("Bugün 19:00 · Zeynep K."));
    assert.ok(within(card).getByText("30 dk · 5. görüşme"));
  });

  it("offers Hazırlan as a solid gold button", () => {
    render(board());

    const link = within(screen.getByRole("region", { name: "Sıradaki görüşme" })).getByRole("link", { name: "Hazırlan" });
    assert.equal(link.getAttribute("href"), "/dashboard/tutor/coaching/sessions/s-1/prepare");
    assert.match(link.className, /bg-gold/);
    assert.match(link.className, /text-gold-ink/);
    assert.match(link.className, /min-h-11/);
  });

  it("says when the room opens, with no Katıl button, while it is closed", () => {
    render(board());

    const card = screen.getByRole("region", { name: "Sıradaki görüşme" });
    assert.ok(within(card).getByText("Katıl 18:45'te açılır"));
    assert.equal(within(card).queryByRole("link", { name: "Katıl" }), null);
  });

  it("offers a solid gold Katıl once the room is open", () => {
    render(board({ next: { ...next, join: { kind: "open", href: "/session/coaching/s-1" } } }));

    const link = within(screen.getByRole("region", { name: "Sıradaki görüşme" })).getByRole("link", { name: "Katıl" });
    assert.equal(link.getAttribute("href"), "/session/coaching/s-1");
    assert.match(link.className, /bg-gold/);
  });

  it("says a running meeting is running", () => {
    render(
      board({ next: { ...next, countdown: "Devam ediyor", join: { kind: "live", href: "/session/coaching/s-1" } } })
    );

    assert.ok(screen.getByText("Sıradaki görüşme · Devam ediyor"));
    assert.ok(screen.getByRole("link", { name: "Katıl" }));
  });

  it("shows the day instead of a countdown for a meeting further away", () => {
    render(board({ next: { ...next, when: "Per 20:00", countdown: null, join: null } }));

    assert.ok(screen.getByText("Sıradaki görüşme"));
    assert.ok(screen.getByText("Per 20:00 · Zeynep K."));
  });

  it("is left out when nothing is ahead", () => {
    render(board({ next: null, days: [], total: 0 }));

    assert.equal(screen.queryByRole("region", { name: "Sıradaki görüşme" }), null);
  });
});

describe("CoachingSessionsBoard: what follows", () => {
  it("lists the rest day by day on an ink band, counting every meeting ahead", () => {
    render(board());

    const heading = screen.getByRole("heading", { name: "Sonraki görüşmeler" });
    const band = heading.closest("[class*='bg-ink']") as HTMLElement;
    assert.ok(band);
    assert.ok(within(band).getByText("3"));
    assert.ok(screen.getByText("21 Ekim Çarşamba"));
    assert.ok(screen.getByText("22 Ekim Perşembe"));
  });

  it("writes a row as time and student, with the number and any note", () => {
    render(board());

    const rows = screen.getAllByRole("listitem");
    const car = rows.find((row) => within(row).queryByText("18:30 · Mert A."));
    assert.ok(car);
    assert.ok(within(car as HTMLElement).getByText("30 dk · 4. görüşme"));
    assert.ok(within(car as HTMLElement).getByText("Saat değişikliği istendi"));
  });

  it("gives each row a solid gold Hazırlan, and a Katıl only where the room is open", () => {
    const withOpen: TutorSessionDay[] = [
      {
        ...days[0],
        rows: [{ ...days[0].rows[0], join: { kind: "open", href: "/session/coaching/car" } }],
      },
      days[1],
    ];
    render(board({ days: withOpen }));

    const links = screen.getAllByRole("link", { name: "Hazırlan" });
    assert.equal(links.length, 3);
    for (const link of links) assert.match(link.className, /bg-gold/);
    assert.equal(screen.getAllByRole("link", { name: "Katıl" }).length, 1);
  });

  it("is left out when only the next meeting is ahead", () => {
    render(board({ days: [], total: 1 }));

    assert.equal(screen.queryByRole("heading", { name: "Sonraki görüşmeler" }), null);
  });
});

describe("CoachingSessionsBoard: the rest of the list", () => {
  it("offers the meetings left out as a solid gold button under the list, and asks for them when pressed", () => {
    let asked = 0;
    render(board({ hidden: 12, onShowMore: () => (asked += 1) }));

    const button = screen.getByRole("button", { name: "12 görüşme daha göster" });
    assert.match(button.className, /bg-gold/);
    fireEvent.click(button);
    assert.equal(asked, 1);
  });

  it("has no such button when nothing is left out", () => {
    render(board({ hidden: 0, onShowMore: () => {} }));

    assert.equal(screen.queryByRole("button", { name: /daha göster/ }), null);
  });
});

describe("CoachingSessionsBoard: reports owed", () => {
  it("lists them with the deadline as a caption over a value, and a solid gold Raporu yaz", () => {
    render(board());

    const heading = screen.getByRole("heading", { name: "Rapor bekleyen" });
    const card = heading.closest("div.overflow-hidden") as HTMLElement;
    assert.ok(within(card).getByText("Zeynep K."));
    assert.ok(within(card).getByText("18 Ekim Pazar görüşmesi"));
    const caption = within(card).getByText("Son tarih");
    const value = within(card).getByText("Yarın 18:00");
    assert.equal(caption.parentElement, value.parentElement);
    const link = within(card).getByRole("link", { name: "Raporu yaz" });
    assert.equal(link.getAttribute("href"), "/dashboard/tutor/coaching/sessions/r-1/report");
    assert.match(link.className, /bg-gold/);
  });

  it("sets an urgent deadline in pink-deep", () => {
    render(board({ reports: [{ ...reports[0], due: { value: "Süresi geçti", urgent: true } }] }));

    assert.match(screen.getByText("Süresi geçti").className, /text-pink-deep/);
  });

  it("is left out when none is owed", () => {
    render(board({ reports: [] }));

    assert.equal(screen.queryByRole("heading", { name: "Rapor bekleyen" }), null);
  });
});
