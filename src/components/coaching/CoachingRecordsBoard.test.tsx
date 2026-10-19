import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import type { CoachingReportListItem, CoachingSessionItem } from "@/lib/coachingApi";
import { buildCoachingRecords } from "@/lib/coachingRecords";
import { CoachingRecordsBoard, type RecordDispute } from "./CoachingRecordsBoard";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });
after(() => window.close());
afterEach(cleanup);

const NOW = new Date("2026-10-19T09:30:00Z");

const sessions = [
  {
    id: "s-1",
    service_period_id: "sp-1",
    sequence_number: 5,
    week_index: 1,
    status: "awaiting_report",
    scheduled_start: "2026-10-18T16:00:00Z",
    scheduled_local_date: "2026-10-18",
    scheduled_local_time: "19:00",
    duration_minutes: 30,
    reschedule_count: 0,
    student_name: "Zeynep K.",
    report_due_at: "2026-10-20T15:00:00Z",
    report_overdue: false,
    complaint_eligible_at: null,
    complaint_eligible: false,
  } as CoachingSessionItem,
];
const reports = [
  { id: "r-1", session_id: "s-d", draft_version: 2, latest_revision: null, student_name: "Mert A.", scheduled_start: "2026-10-14T15:30:00Z" },
  {
    id: "r-2",
    session_id: "s-p",
    draft_version: 1,
    student_name: "Elif Y.",
    scheduled_start: "2026-10-11T16:00:00Z",
    latest_revision: { id: "v", revision_number: 1, source_draft_version: 1, published_at: "2026-10-12T08:00:00Z" },
  },
] as unknown as CoachingReportListItem[];

const disputes: RecordDispute[] = [
  { id: "d-1", title: "Teknik sorun", status: "İncelemede", href: "/dashboard/tutor/coaching/complaints/d-1" },
];

function board(overrides: Partial<React.ComponentProps<typeof CoachingRecordsBoard>> = {}) {
  return (
    <CoachingRecordsBoard
      records={buildCoachingRecords({ sessions, reports, now: NOW })}
      today="2026-10-19"
      disputes={disputes}
      disputesState="ready"
      {...overrides}
    />
  );
}

function owedCard() {
  return screen.getByRole("heading", { name: "Yazılacak raporlar" }).closest("div.overflow-hidden") as HTMLElement;
}

describe("CoachingRecordsBoard: reports owed", () => {
  it("lists them on a pink band with a count, so nothing owed hides in another month", () => {
    render(board());

    const heading = screen.getByRole("heading", { name: "Yazılacak raporlar" });
    assert.ok(heading.closest("[class*='bg-pink']"));
    const card = owedCard();
    assert.ok(within(card).getByText("Zeynep K."));
    assert.ok(within(card).getByText("18 Ekim Pazar görüşmesi"));
  });

  it("sets the deadline large, as the thing to act on", () => {
    render(board());

    const caption = within(owedCard()).getByText("Son tarih");
    const value = within(owedCard()).getByText("Yarın 18:00");
    assert.equal(caption.parentElement, value.parentElement);
    assert.match(value.className, /font-bold/);
    assert.doesNotMatch(value.className, /text-small/);
  });

  it("makes Raporu yaz a solid pink button with white text", () => {
    render(board());

    const link = within(owedCard()).getByRole("link", { name: "Raporu yaz" });
    assert.equal(link.getAttribute("href"), "/dashboard/tutor/coaching/sessions/s-1/report");
    assert.match(link.className, /bg-pink/);
    assert.match(link.className, /text-white/);
    assert.doesNotMatch(link.className, /bg-gold/);
  });

  it("sets an overdue deadline in pink-deep", () => {
    const late = buildCoachingRecords({
      sessions: [{ ...sessions[0], report_overdue: true, report_due_at: "2026-10-19T08:00:00Z" }],
      reports: [],
      now: NOW,
    });
    render(board({ records: late }));

    assert.match(within(owedCard()).getByText("Süresi geçti").className, /text-pink-deep/);
  });

  it("is left out when none is owed", () => {
    render(board({ records: buildCoachingRecords({ sessions: [], reports, now: NOW }) }));

    assert.equal(screen.queryByRole("heading", { name: "Yazılacak raporlar" }), null);
  });
});

describe("CoachingRecordsBoard: the calendar", () => {
  function calendar() {
    return screen.getByRole("heading", { name: "Ekim 2026" }).closest("div.overflow-hidden") as HTMLElement;
  }

  it("shows the month on an ink band, with the days Monday first", () => {
    render(board());

    assert.ok(screen.getByRole("heading", { name: "Ekim 2026" }).closest("[class*='bg-ink']"));
    const names = within(calendar()).getAllByText(/^(Pzt|Sal|Çar|Per|Cum|Cmt|Paz)$/).map((node) => node.textContent);
    assert.deepEqual(names, ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]);
  });

  it("names each day with what is on it, and marks today", () => {
    render(board());

    assert.ok(within(calendar()).getByRole("button", { name: "18 Ekim, 1 yazılacak" }));
    assert.ok(within(calendar()).getByRole("button", { name: "14 Ekim, 1 taslak" }));
    assert.ok(within(calendar()).getByRole("button", { name: "11 Ekim, 1 yayınlanan" }));
    assert.equal(within(calendar()).getByRole("button", { name: "19 Ekim" }).getAttribute("aria-current"), "date");
  });

  it("opens on the day of the most urgent report and lists it with its action", () => {
    render(board());

    const day = screen.getByRole("region", { name: "18 Ekim Pazar" });
    assert.ok(within(day).getByText("Zeynep K."));
    assert.ok(within(day).getByRole("link", { name: "Raporu yaz" }));
    assert.equal(within(calendar()).getByRole("button", { name: "18 Ekim, 1 yazılacak" }).getAttribute("aria-pressed"), "true");
  });

  it("shows another day's reports when it is pressed, a draft with pink Devam et", () => {
    render(board());

    fireEvent.click(within(calendar()).getByRole("button", { name: "14 Ekim, 1 taslak" }));

    const day = screen.getByRole("region", { name: "14 Ekim Çarşamba" });
    assert.ok(within(day).getByText("Mert A."));
    assert.ok(within(day).getByText("Taslak 2 · henüz yayınlanmadı"));
    const link = within(day).getByRole("link", { name: "Devam et" });
    assert.match(link.className, /bg-pink/);
  });

  it("shows a published report with a solid gold Görüntüle", () => {
    render(board());

    fireEvent.click(within(calendar()).getByRole("button", { name: "11 Ekim, 1 yayınlanan" }));

    const link = within(screen.getByRole("region", { name: "11 Ekim Pazar" })).getByRole("link", { name: "Görüntüle" });
    assert.match(link.className, /bg-gold/);
    assert.match(link.className, /text-gold-ink/);
  });

  it("says a day with no reports has none", () => {
    render(board());

    fireEvent.click(within(calendar()).getByRole("button", { name: "5 Ekim" }));

    assert.ok(screen.getByText("Bu gün için rapor yok."));
  });

  it("moves between months", () => {
    render(board());

    fireEvent.click(within(calendar()).getByRole("button", { name: "Önceki ay" }));
    assert.ok(screen.getByRole("heading", { name: "Eylül 2026" }));
    fireEvent.click(screen.getByRole("button", { name: "Sonraki ay" }));
    fireEvent.click(screen.getByRole("button", { name: "Sonraki ay" }));
    assert.ok(screen.getByRole("heading", { name: "Kasım 2026" }));
  });

  it("keeps every day a full touch target", () => {
    render(board());

    for (const button of within(calendar()).getAllByRole("button", { name: /^\d+ Ekim/ })) {
      assert.match(button.className, /min-h-11/);
    }
  });
});

describe("CoachingRecordsBoard: what cannot be dated, and complaints", () => {
  it("lists a report it cannot date apart, instead of dropping it", () => {
    const lost = buildCoachingRecords({
      sessions: [],
      reports: [{ id: "r-x", session_id: "s-x", draft_version: 1, latest_revision: null } as CoachingReportListItem],
      now: NOW,
    });
    render(board({ records: lost }));

    const card = screen.getByRole("heading", { name: "Tarihi görünmeyen raporlar" }).closest("div.overflow-hidden") as HTMLElement;
    assert.ok(within(card).getByText("Taslak 1 · henüz yayınlanmadı"));
    assert.ok(within(card).getByRole("link", { name: "Devam et" }));
  });

  it("lists complaints on an ink band, with a way in", () => {
    render(board());

    const heading = screen.getByRole("heading", { name: "Sorun bildirimleri" });
    assert.ok(heading.closest("[class*='bg-ink']"));
    const card = heading.closest("div.overflow-hidden") as HTMLElement;
    assert.ok(within(card).getByText("Teknik sorun"));
    assert.ok(within(card).getByText("İncelemede"));
    const link = within(card).getByRole("link", { name: "Aç" });
    assert.equal(link.getAttribute("href"), "/dashboard/tutor/coaching/complaints/d-1");
    assert.match(link.className, /bg-gold/);
  });

  it("leaves complaints out when there are none", () => {
    render(board({ disputes: [] }));

    assert.equal(screen.queryByRole("heading", { name: "Sorun bildirimleri" }), null);
  });

  it("says so and retries when complaints could not load", () => {
    const onRetry = mock.fn();
    render(board({ disputes: [], disputesState: "error", onRetryDisputes: onRetry }));

    assert.ok(screen.getByText("Sorun bildirimleri yüklenemedi."));
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    assert.equal(onRetry.mock.callCount(), 1);
  });
});
