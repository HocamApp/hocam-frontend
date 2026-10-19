import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import type { AnsweredRow, CoachingInboxItem } from "@/lib/coachingInbox";
import { CoachingInboxBoard, type CoachingInboxActions } from "./CoachingInboxBoard";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });
after(() => window.close());
afterEach(cleanup);

const acceptance: CoachingInboxItem = {
  id: "acceptance-a-1",
  requestId: "a-1",
  kind: "acceptance",
  studentName: "Can T.",
  title: "Can T. koçluk istiyor",
  detail: "Ders ve koçluk paketi",
  lines: [
    { label: "Ders paketi · haftada 2 ders · 4 hafta · 8 ders", amount: "3.200,00 ₺" },
    { label: "Çalışma koçluğu · Haftada 1 görüşme · 4 görüşme", amount: "2.400,00 ₺" },
  ],
  due: { value: "2 sa 15 dk kaldı", urgent: true },
  at: 1,
};
const time: CoachingInboxItem = {
  id: "time-t-1",
  requestId: "t-1",
  kind: "time",
  studentName: "Deniz Ö.",
  title: "Deniz Ö. saat istiyor",
  detail: "Uygun saat bulamadı",
  note: "Hafta içi akşamları müsait değilim",
  due: { value: "Çar 12:00", urgent: false },
  at: 2,
};
const reschedule: CoachingInboxItem = {
  id: "reschedule-r-1",
  requestId: "r-1",
  kind: "reschedule",
  studentName: "Mert A.",
  title: "Mert A. saat değiştirmek istiyor",
  detail: "21 Ekim Çarşamba 18:30 yerine 22 Ekim Perşembe 18:30",
  current: "21 Ekim Çarşamba 18:30",
  wanted: "22 Ekim Perşembe 18:30",
  usesFreeChange: true,
  due: { value: "Çar 18:30", urgent: false },
  at: 3,
};
const answered: AnsweredRow[] = [
  { id: "a", title: "Elif Y. · koçluk talebi", detail: "Kabul ettin", when: "Dün", outcome: "accepted", at: 2 },
  { id: "b", title: "Ece B. · koçluk talebi", detail: "Reddettin", when: "3 gün önce", outcome: "declined", at: 1 },
];

function actions(overrides: Partial<CoachingInboxActions> = {}): CoachingInboxActions {
  return {
    onAccept: () => undefined,
    onRejectAcceptance: () => undefined,
    onPropose: () => undefined,
    onApprove: () => undefined,
    onRejectReschedule: () => undefined,
    busy: false,
    error: null,
    ...overrides,
  };
}

function board(overrides: Partial<React.ComponentProps<typeof CoachingInboxBoard>> = {}) {
  return (
    <CoachingInboxBoard
      pending={[acceptance, time, reschedule]}
      answered={answered}
      state="ready"
      actions={actions()}
      {...overrides}
    />
  );
}

function hero() {
  return screen.getByRole("region", { name: "Sıradaki talep" });
}

describe("CoachingInboxBoard: the request being answered", () => {
  it("leads with the most urgent one on a pink card, with its deadline", () => {
    render(board());

    const card = hero();
    assert.match(card.className, /border-pink/);
    assert.ok(within(card).getByText("En acil talep · Koçluk talebi"));
    assert.ok(within(card).getByText("Can T. koçluk istiyor"));
    assert.ok(within(card).getByText("Son yanıt"));
    assert.ok(within(card).getByText("2 sa 15 dk kaldı"));
  });

  it("lays out both halves of the package with their prices, and says what accepting means", () => {
    render(board());

    const card = hero();
    assert.ok(within(card).getByText("Ders paketi · haftada 2 ders · 4 hafta · 8 ders"));
    assert.ok(within(card).getByText(/3\.200,00/));
    assert.ok(within(card).getByText(/2\.400,00/));
    assert.ok(within(card).getByText(/Kabul etmek ödeme değil, onaydır/));
  });

  it("makes the accepting button solid pink with white text", () => {
    render(board());

    const accept = within(hero()).getByRole("button", { name: "Ders + koçluğu kabul et" });
    assert.match(accept.className, /bg-pink/);
    assert.match(accept.className, /text-white/);
    assert.doesNotMatch(accept.className, /bg-gold/);
  });

  it("makes Reddet the plain outline: empty, black edge, and never the error colour", () => {
    render(board());

    const reject = within(hero()).getByRole("button", { name: "Reddet" });
    assert.match(reject.className, /border-ink/);
    assert.match(reject.className, /bg-transparent/);
    assert.match(reject.className, /hover:bg-ink/);
    assert.doesNotMatch(reject.className, /bg-error|bg-destructive|bg-red/);
  });

  it("accepts the whole request in one press", () => {
    const onAccept = mock.fn();
    render(board({ actions: actions({ onAccept }) }));

    fireEvent.click(within(hero()).getByRole("button", { name: "Ders + koçluğu kabul et" }));

    assert.deepEqual(onAccept.mock.calls[0].arguments, ["a-1"]);
  });

  it("asks before rejecting, takes an optional note, and only then sends it", () => {
    const onRejectAcceptance = mock.fn();
    render(board({ actions: actions({ onRejectAcceptance }) }));

    fireEvent.click(within(hero()).getByRole("button", { name: "Reddet" }));
    const dialog = screen.getByRole("dialog", { name: "Talebi reddet" });
    assert.equal(onRejectAcceptance.mock.callCount(), 0);
    fireEvent.change(within(dialog).getByLabelText("Reddetme notu"), { target: { value: "Kontenjanım dolu" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Reddet" }));

    assert.deepEqual(onRejectAcceptance.mock.calls[0].arguments, ["a-1", "Kontenjanım dolu"]);
  });

  it("shows a server error above the card and locks the buttons while busy", () => {
    render(board({ actions: actions({ error: "Talep zaten yanıtlandı.", busy: true }) }));

    assert.ok(screen.getByText("Talep zaten yanıtlandı."));
    assert.equal((within(hero()).getByRole("button", { name: "Ders + koçluğu kabul et" }) as HTMLButtonElement).disabled, true);
  });
});

describe("CoachingInboxBoard: the others", () => {
  function others() {
    return screen.getByRole("heading", { name: "Diğer talepler" }).closest("div.overflow-hidden") as HTMLElement;
  }

  it("lists the rest on a gold band, with a count", () => {
    render(board());

    const band = screen.getByRole("heading", { name: "Diğer talepler" }).closest("[class*='bg-gold']") as HTMLElement;
    assert.ok(band);
    assert.ok(within(band).getByText("2"));
  });

  it("gives each row a sentence, a quiet line, its deadline as caption over value, and a pink button", () => {
    render(board());

    const [timeRow, rescheduleRow] = within(others()).getAllByRole("listitem");
    assert.ok(within(timeRow).getByText("Deniz Ö. saat istiyor"));
    assert.ok(within(timeRow).getByText("Uygun saat bulamadı"));
    assert.equal(within(timeRow).getByText("Son yanıt").parentElement, within(timeRow).getByText("Çar 12:00").parentElement);
    const saatOner = within(timeRow).getByRole("button", { name: "Saat öner" });
    assert.match(saatOner.className, /bg-pink/);
    assert.match(saatOner.className, /text-white/);
    assert.match(within(rescheduleRow).getByRole("button", { name: "Yanıtla" }).className, /bg-pink/);
  });

  it("brings a chosen request up into the big card, labelled as the one chosen", () => {
    render(board());

    fireEvent.click(within(others()).getByRole("button", { name: "Saat öner" }));

    const card = hero();
    assert.ok(within(card).getByText("Seçtiğin talep · Saat isteği"));
    assert.ok(within(card).getByText("Deniz Ö. saat istiyor"));
    // The request that was on top now sits in the list.
    assert.ok(within(others()).getByText("Can T. koçluk istiyor"));
    assert.equal(within(others()).getAllByRole("listitem").length, 2);
  });
});

describe("CoachingInboxBoard: a time request", () => {
  function chooseTime() {
    fireEvent.click(within(screen.getByRole("heading", { name: "Diğer talepler" }).closest("div.overflow-hidden") as HTMLElement).getByRole("button", { name: "Saat öner" }));
  }

  it("quotes what the student wrote and asks for a day and a time", () => {
    render(board());
    chooseTime();

    const card = hero();
    assert.ok(within(card).getByText(/Hafta içi akşamları müsait değilim/));
    assert.ok(within(card).getByLabelText("Gün"));
    assert.ok(within(card).getByLabelText("Saat"));
  });

  it("sends the day as a number and the time as typed", () => {
    const onPropose = mock.fn();
    render(board({ actions: actions({ onPropose }) }));
    chooseTime();

    const card = hero();
    fireEvent.change(within(card).getByLabelText("Gün"), { target: { value: "2" } });
    fireEvent.change(within(card).getByLabelText("Saat"), { target: { value: "19:30" } });
    fireEvent.click(within(card).getByRole("button", { name: "Öner" }));

    assert.deepEqual(onPropose.mock.calls[0].arguments, ["t-1", 2, "19:30"]);
  });
});

describe("CoachingInboxBoard: a reschedule request", () => {
  function chooseReschedule() {
    fireEvent.click(
      within(screen.getByRole("heading", { name: "Diğer talepler" }).closest("div.overflow-hidden") as HTMLElement).getByRole("button", {
        name: "Yanıtla",
      })
    );
  }

  it("shows the time now and the time asked for", () => {
    render(board());
    chooseReschedule();

    const card = hero();
    assert.ok(within(card).getByText("21 Ekim Çarşamba 18:30"));
    assert.ok(within(card).getByText("22 Ekim Perşembe 18:30"));
  });

  it("says approving uses one of the student's free changes, and offers the emergency approval then", () => {
    const onApprove = mock.fn();
    render(board({ actions: actions({ onApprove }) }));
    chooseReschedule();

    const card = hero();
    assert.ok(within(card).getByText("Onaylarsan öğrencinin ücretsiz değişiklik hakkından 1 düşer."));
    fireEvent.click(within(card).getByRole("button", { name: "Onayla" }));
    fireEvent.click(within(card).getByRole("button", { name: "Acil durum olarak onayla" }));
    assert.deepEqual(onApprove.mock.calls.map((call) => call.arguments), [["r-1", false], ["r-1", true]]);
  });

  it("says nothing is used up, and hides the emergency approval, when it costs the student nothing", () => {
    render(board({ pending: [acceptance, time, { ...reschedule, usesFreeChange: false } as CoachingInboxItem] }));
    chooseReschedule();

    const card = hero();
    assert.ok(within(card).getByText("Bu değişiklik öğrencinin ücretsiz hakkından düşmez."));
    assert.equal(within(card).queryByRole("button", { name: "Acil durum olarak onayla" }), null);
  });

  it("asks before rejecting", () => {
    const onRejectReschedule = mock.fn();
    render(board({ actions: actions({ onRejectReschedule }) }));
    chooseReschedule();

    fireEvent.click(within(hero()).getByRole("button", { name: "Reddet" }));
    const dialog = screen.getByRole("dialog", { name: "Saat değişikliği reddedilsin mi?" });
    assert.equal(onRejectReschedule.mock.callCount(), 0);
    fireEvent.click(within(dialog).getByRole("button", { name: "Reddet" }));
    assert.deepEqual(onRejectReschedule.mock.calls[0].arguments, ["r-1"]);
  });
});

describe("CoachingInboxBoard: answered, empty and failing", () => {
  it("lists what was answered on an ink band, with what was decided and when", () => {
    render(board());

    const heading = screen.getByRole("heading", { name: "Yanıtladıkların" });
    assert.ok(heading.closest("[class*='bg-ink']"));
    const card = heading.closest("div.overflow-hidden") as HTMLElement;
    assert.ok(within(card).getByText("Elif Y. · koçluk talebi"));
    assert.ok(within(card).getByText("Kabul ettin"));
    assert.ok(within(card).getByText("Dün"));
  });

  it("says nothing waits, and still shows what was answered", () => {
    render(board({ pending: [] }));

    assert.ok(screen.getByText("Şu an yanıt bekleyen talep yok."));
    assert.equal(screen.queryByRole("region", { name: "Sıradaki talep" }), null);
    assert.ok(screen.getByRole("heading", { name: "Yanıtladıkların" }));
  });

  it("leaves out the other-requests card when only one is waiting", () => {
    render(board({ pending: [acceptance] }));

    assert.equal(screen.queryByRole("heading", { name: "Diğer talepler" }), null);
  });

  it("says so and retries when it could not load, instead of looking empty", () => {
    const onRetry = mock.fn();
    render(board({ pending: [], answered: [], state: "error", onRetry }));

    assert.ok(screen.getByText("Talepler yüklenemedi."));
    assert.equal(screen.queryByText("Şu an yanıt bekleyen talep yok."), null);
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    assert.equal(onRetry.mock.callCount(), 1);
  });

  it("shows a placeholder while loading", () => {
    render(board({ pending: [], answered: [], state: "loading" }));

    assert.ok(screen.getByRole("status", { name: "Talepler yükleniyor" }));
  });
});
