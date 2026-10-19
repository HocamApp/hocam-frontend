import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { ActiveStudentRow, PendingStudentRow, StudentWaitingItem } from "@/lib/coachingStudents";
import { CoachingStudentsBoard } from "./CoachingStudentsBoard";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });
after(() => window.close());
afterEach(cleanup);

const waiting: StudentWaitingItem[] = [
  {
    id: "report-1",
    kind: "report",
    initials: "ZK",
    title: "Zeynep K. raporu yazılmadı",
    detail: "18 Ekim Pazar görüşmesi",
    due: { caption: "Son tarih", value: "Yarın 18:00", urgent: false },
    action: { label: "Raporu yaz", href: "/dashboard/tutor/coaching/sessions/s-r/report" },
    at: 1,
  },
  {
    id: "time-1",
    kind: "time",
    initials: null,
    title: "Saat isteği geldi",
    detail: "Uygun saat bulamayan öğrenciye saat öner.",
    due: { caption: "Son yanıt", value: "45 dk kaldı", urgent: true },
    action: { label: "Saat öner", href: "/dashboard/tutor/coaching/time-requests" },
    at: 2,
  },
];

const active: ActiveStudentRow[] = [
  {
    purchaseId: "pu-1",
    name: "Zeynep K.",
    initials: "ZK",
    summary: "Haftada 2 görüşme · Pzt 19:00, Cum 19:00",
    next: "Bugün 19:00",
    programHref: "/dashboard/tutor/coaching/service-periods/sp-1/program",
  },
  {
    purchaseId: "pu-3",
    name: "Elif Y.",
    initials: "EY",
    summary: "Haftada 1 görüşme · Per 20:00",
    next: null,
    programHref: "/dashboard/tutor/coaching/service-periods/sp-3/program",
  },
];

const pending: PendingStudentRow[] = [
  { purchaseId: "pu-4", name: "Deniz Ö.", initials: "DÖ", status: "awaiting_schedule", note: "Henüz saat seçmedi", canEnd: true },
  { purchaseId: "pu-5", name: "Ece B.", initials: "EB", status: "cancellation_pending", note: "Sonlandırılıyor", canEnd: false },
];

function board(overrides: Partial<React.ComponentProps<typeof CoachingStudentsBoard>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <CoachingStudentsBoard
        waiting={waiting}
        waitingState="ready"
        active={active}
        pending={pending}
        nextKnown
        occupiedPlaces={2}
        maxStudents={6}
        {...overrides}
      />
    </QueryClientProvider>
  );
}

function card(name: string) {
  return screen.getByRole("heading", { name }).closest("div.overflow-hidden") as HTMLElement;
}

describe("CoachingStudentsBoard: what waits on the tutor", () => {
  it("opens with a pink band and a count, because this is what asks for action", () => {
    render(board());

    const heading = screen.getByRole("heading", { name: "Senden bekleyenler" });
    const band = heading.closest("[class*='bg-pink']") as HTMLElement;
    assert.ok(band);
    assert.match(within(band).getByText("2").className, /bg-gold/);
  });

  it("writes the deadline as a caption over a value on the right, not as a pill in the sentence", () => {
    render(board());

    const row = within(card("Senden bekleyenler")).getAllByRole("listitem")[0];
    assert.ok(within(row).getByText("Zeynep K. raporu yazılmadı"));
    assert.ok(within(row).getByText("18 Ekim Pazar görüşmesi"));
    const caption = within(row).getByText("Son tarih");
    const value = within(row).getByText("Yarın 18:00");
    assert.match(caption.className, /text-ink-mid/);
    assert.doesNotMatch(value.className, /rounded-pill|border|bg-/);
    assert.equal(caption.parentElement, value.parentElement);
  });

  it("sets an urgent deadline in pink-deep", () => {
    render(board());

    assert.match(screen.getByText("45 dk kaldı").className, /text-pink-deep/);
    assert.doesNotMatch(screen.getByText("Yarın 18:00").className, /text-pink-deep/);
  });

  it("makes each action a solid gold button, never a pill the colour of its row", () => {
    render(board());

    for (const link of within(card("Senden bekleyenler")).getAllByRole("link")) {
      assert.match(link.className, /bg-gold/);
      assert.match(link.className, /text-gold-ink/);
      assert.doesNotMatch(link.className, /bg-transparent|bg-surface|bg-paper|bg-white/);
      assert.match(link.className, /min-h-11/);
    }
    assert.equal(
      screen.getByRole("link", { name: "Raporu yaz" }).getAttribute("href"),
      "/dashboard/tutor/coaching/sessions/s-r/report"
    );
  });

  it("gives a student's row their initials and a request that names nobody an icon", () => {
    render(board());

    const [report, time] = within(card("Senden bekleyenler")).getAllByRole("listitem");
    assert.ok(within(report).getByText("ZK"));
    assert.equal(within(time).queryByText(/^[A-ZÇĞİÖŞÜ]{1,2}$/), null);
  });

  it("is left out entirely when nothing is waiting", () => {
    render(board({ waiting: [] }));

    assert.equal(screen.queryByRole("heading", { name: "Senden bekleyenler" }), null);
  });

  it("says when it could not load, and retries, rather than looking empty", () => {
    const onRetry = mock.fn();
    render(board({ waiting: [], waitingState: "error", onRetryWaiting: onRetry }));

    const waitingCard = card("Senden bekleyenler");
    assert.ok(within(waitingCard).getByText("Bekleyenler yüklenemedi."));
    fireEvent.click(within(waitingCard).getByRole("button", { name: "Tekrar dene" }));
    assert.equal(onRetry.mock.callCount(), 1);
  });

  it("shows a placeholder while it loads", () => {
    render(board({ waiting: [], waitingState: "loading" }));

    assert.ok(screen.getByRole("status", { name: "Bekleyenler yükleniyor" }));
  });
});

describe("CoachingStudentsBoard: active students", () => {
  it("heads the students being coached with an ink band and how full the offer is", () => {
    render(board());

    const heading = screen.getByRole("heading", { name: "Aktif öğrenciler" });
    const band = heading.closest("[class*='bg-ink']") as HTMLElement;
    assert.ok(band);
    assert.ok(within(band).getByText("2 / 6 kontenjan"));
  });

  it("shows each student's rhythm and hours and the next meeting as a clock time", () => {
    render(board());

    const [zeynep, elif] = within(card("Aktif öğrenciler")).getAllByRole("listitem");
    assert.ok(within(zeynep).getByText("Zeynep K."));
    assert.ok(within(zeynep).getByText("Haftada 2 görüşme · Pzt 19:00, Cum 19:00"));
    assert.ok(within(zeynep).getByText("Sıradaki"));
    assert.ok(within(zeynep).getByText("Bugün 19:00"));
    assert.ok(within(elif).getByText("Görüşme planlanmadı"));
  });

  it("does not claim a next meeting it could not read", () => {
    render(board({ nextKnown: false }));

    assert.equal(screen.queryByText("Sıradaki"), null);
    assert.equal(screen.queryByText("Görüşme planlanmadı"), null);
  });

  it("opens the program in a solid gold button", () => {
    render(board());

    const links = within(card("Aktif öğrenciler")).getAllByRole("link", { name: "Programı yönet" });
    assert.equal(links.length, 2);
    assert.equal(links[0].getAttribute("href"), "/dashboard/tutor/coaching/service-periods/sp-1/program");
    for (const link of links) {
      assert.match(link.className, /bg-gold/);
      assert.match(link.className, /text-gold-ink/);
    }
  });

  it("never puts an end-the-coaching control on an active student's row", () => {
    render(board());

    assert.equal(within(card("Aktif öğrenciler")).queryByRole("button", { name: "Koçluğu sonlandır" }), null);
  });
});

describe("CoachingStudentsBoard: set apart", () => {
  it("lets a student who has not chosen hours be ended from the list, quietly, since there is no program page yet", () => {
    render(board());

    const [deniz] = within(card("Beklemede")).getAllByRole("listitem");
    assert.ok(within(deniz).getByText("Deniz Ö."));
    assert.ok(within(deniz).getByText("Henüz saat seçmedi"));
    const end = within(deniz).getByRole("button", { name: "Koçluğu sonlandır" });
    assert.match(end.className, /underline/);
  });

  it("only reports a coaching that is already being ended", () => {
    render(board());

    const ece = within(card("Beklemede")).getAllByRole("listitem")[1];
    assert.ok(within(ece).getByText("Ece B."));
    assert.ok(within(ece).getByText("Sonlandırılıyor"));
    assert.equal(within(ece).queryByRole("button"), null);
  });

  it("is left out when nobody is set apart", () => {
    render(board({ pending: [] }));

    assert.equal(screen.queryByRole("heading", { name: "Beklemede" }), null);
  });
});

describe("CoachingStudentsBoard: no active students", () => {
  it("says so inside the active card when students exist but none is active", () => {
    render(board({ active: [] }));

    assert.ok(screen.getByText("Şu an aktif koçluk öğrencin yok."));
  });
});
