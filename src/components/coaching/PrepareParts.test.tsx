import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import type { CoachingSessionReportRevision } from "@/lib/coachingApi";
import type { PrepareAttentionItem, PrepareProgram } from "@/lib/coachingPrepare";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });
afterEach(cleanup);

let P: typeof import("./PrepareParts");

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  P = await import("./PrepareParts");
});

const revision = {
  id: "rev-1",
  revision_number: 1,
  source_draft_version: 1,
  content: {
    short_summary: "Haftalık program gözden geçirildi; türevde ilerleme iyi.",
    topics_discussed: "",
    student_progress: "",
    next_priorities: "",
    study_recommendations: "",
    focus_until_next_meeting: "Her gün 2 paragraf seti ve türevde 20 soru.",
  },
  published_at: "2026-10-15T10:00:00Z",
  change_note: null,
} as CoachingSessionReportRevision;

const task = (id: string, title: string, due: string | null) => ({
  id,
  title,
  description: "",
  subject: "",
  due_date: due,
  priority: null,
  sort_order: 1,
  is_completed: false,
  completed_at: null,
});

describe("PrepareHeader", () => {
  const base = {
    studentName: "Ayşe Öğrenci",
    headline: "2. görüşme · 30 dk · 22 Ekim Perşembe 21:00",
    status: "scheduled",
    reportHref: "/dashboard/tutor/coaching/sessions/s-1/report",
  };

  it("names the student and the meeting on a pink band", () => {
    render(<P.PrepareHeader {...base} join={null} />);

    const band = screen.getByRole("region", { name: "Görüşme" });
    assert.match(band.className, /bg-pink/);
    assert.ok(within(band).getByRole("heading", { name: "Ayşe Öğrenci" }));
    assert.ok(within(band).getByText("2. görüşme · 30 dk · 22 Ekim Perşembe 21:00"));
  });

  it("says when the room opens and offers no button while it is shut", () => {
    render(<P.PrepareHeader {...base} join={{ kind: "closed", opensLabel: "20:45'te açılır" }} />);

    assert.ok(screen.getByText("Oda 20:45'te açılır"));
    assert.equal(screen.queryByRole("link", { name: "Görüşmeye katıl" }), null);
  });

  it("offers a solid ink Görüşmeye katıl once the room is open", () => {
    render(<P.PrepareHeader {...base} join={{ kind: "open", href: "/session/coaching/s-1" }} />);

    const link = screen.getByRole("link", { name: "Görüşmeye katıl" });
    assert.equal(link.getAttribute("href"), "/session/coaching/s-1");
    assert.match(link.className, /bg-ink/);
    assert.doesNotMatch(link.className, /bg-pink/);
  });

  it("offers the report instead when the meeting is over and the report is owed", () => {
    render(<P.PrepareHeader {...base} status="awaiting_report" join={null} />);

    const link = screen.getByRole("link", { name: "Raporu hazırla" });
    assert.equal(link.getAttribute("href"), base.reportHref);
    assert.match(link.className, /bg-ink/);
  });

  it("says what became of a meeting that is no longer ahead, and nothing for one that merely is not today", () => {
    const view = render(<P.PrepareHeader {...base} status="completed" join={null} />);
    assert.ok(screen.getByText("Tamamlandı"));
    view.unmount();

    render(<P.PrepareHeader {...base} join={null} />);
    assert.equal(screen.queryByText("Tamamlandı"), null);
    assert.equal(screen.queryByRole("link"), null);
  });
});

describe("PrepareAttention", () => {
  const items: PrepareAttentionItem[] = [
    { id: "feedback", title: "Ayşe hedefi değiştirmek istiyor", detail: "Geçen rapordaki odağa geri bildirimi", action: { label: "Mesajlara git", href: "/messages/c-1" } },
    { id: "program", title: "2 program görevi bekliyor", detail: "Biri bugün bitmeli: Paragraf seti", action: { label: "Programı yönet", href: "/p" } },
    { id: "files", title: "Ayşe yeni dosya yükledi", detail: "Cevaplar.jpg", action: { label: "Dosyalara bak", kind: "files" } },
  ];

  it("is a gold band that counts what needs a look, each with a solid ink button", () => {
    render(<P.PrepareAttention items={items} onShowFiles={() => {}} />);

    const band = screen.getByRole("region", { name: "Bakılacaklar" });
    assert.match(band.firstElementChild?.className ?? "", /bg-gold/);
    assert.ok(within(band).getByText("3"));
    assert.ok(within(band).getByText("Biri bugün bitmeli: Paragraf seti"));
    const link = within(band).getByRole("link", { name: "Mesajlara git" });
    assert.equal(link.getAttribute("href"), "/messages/c-1");
    assert.match(link.className, /bg-ink/);
    assert.match(within(band).getByRole("button", { name: "Dosyalara bak" }).className, /bg-ink/);
  });

  it("opens the files when asked", () => {
    let asked = 0;
    render(<P.PrepareAttention items={items} onShowFiles={() => (asked += 1)} />);

    fireEvent.click(screen.getByRole("button", { name: "Dosyalara bak" }));
    assert.equal(asked, 1);
  });

  it("leaves out the button of an item that has nowhere to go, and shows nothing at all when nothing changed", () => {
    const view = render(<P.PrepareAttention items={[{ ...items[0], action: null }]} onShowFiles={() => {}} />);
    assert.equal(screen.queryByRole("link"), null);
    view.unmount();

    const { container } = render(<P.PrepareAttention items={[]} onShowFiles={() => {}} />);
    assert.equal(container.textContent, "");
  });
});

describe("PreviousReportCard", () => {
  it("shows what was written last time: the summary, the focus, and what the student answered", () => {
    render(
      <P.PreviousReportCard
        previous={{ kind: "report", sessionId: "s-0", scheduledStart: "2026-10-14T16:00:00Z", revision }}
        feedback="want_to_change_goal"
      />,
    );

    const card = screen.getByRole("region", { name: "Geçen görüşme" });
    assert.ok(within(card).getByText("14 Ekim"));
    assert.ok(within(card).getByText("Haftalık program gözden geçirildi; türevde ilerleme iyi."));
    assert.ok(within(card).getByText("Her gün 2 paragraf seti ve türevde 20 soru."));
    assert.ok(within(card).getByText("Öğrencinin geri bildirimi"));
    assert.ok(within(card).getByText("Bu hedefi değiştirmek istiyorum"));
  });

  it("says the report is still owed, with a gold way to write it", () => {
    render(
      <P.PreviousReportCard
        previous={{ kind: "awaiting", sessionId: "s-0", scheduledStart: "2026-10-14T16:00:00Z" }}
        feedback={null}
      />,
    );

    assert.ok(screen.getByText("Geçen görüşmenin raporu henüz yayınlanmadı."));
    const link = screen.getByRole("link", { name: "Raporu yaz" });
    assert.equal(link.getAttribute("href"), "/dashboard/tutor/coaching/sessions/s-0/report");
    assert.match(link.className, /bg-gold/);
  });

  it("tells a first meeting from one whose earlier reports do not exist", () => {
    const view = render(<P.PreviousReportCard previous={{ kind: "none", firstSession: true }} feedback={null} />);
    assert.ok(screen.getByText("Bu ilk görüşmen; geçen rapor yok."));
    view.unmount();

    render(<P.PreviousReportCard previous={{ kind: "none", firstSession: false }} feedback={null} />);
    assert.ok(screen.getByText("Önceki görüşmeler için yayınlanmış rapor yok."));
  });
});

describe("PrepareProgramCard", () => {
  const summary: PrepareProgram = {
    total: 7,
    done: 4,
    pending: [task("a", "Paragraf süreli set", "2026-10-22"), task("b", "Türev uygulamaları soru seti", "2026-10-23"), task("c", "Deneme analizi", null)],
  };

  it("counts what is done and lists what waits, with the day as a small caption over a value", () => {
    render(<P.PrepareProgramCard summary={summary} today="2026-10-22" programHref="/p" />);

    const card = screen.getByRole("region", { name: "Program" });
    assert.ok(within(card).getByText("4 / 7 tamam"));
    const bar = within(card).getByRole("progressbar", { name: "Program ilerlemesi" });
    assert.equal(bar.getAttribute("aria-valuenow"), "4");
    assert.equal(bar.getAttribute("aria-valuemax"), "7");
    const today = within(card).getByText("Paragraf süreli set").closest("li") as HTMLElement;
    assert.ok(within(today).getByText("Son tarih"));
    assert.match(within(today).getByText("Bugün").className, /text-pink-deep/);
    assert.ok(within(card).getByText("Cum 23 Eki"));
    assert.ok(within(card).getByText("Tarihsiz"));
    const link = within(card).getByRole("link", { name: "Programı yönet" });
    assert.equal(link.getAttribute("href"), "/p");
    assert.match(link.className, /bg-gold/);
  });

  it("shows the first few and says how many more", () => {
    const many = { ...summary, total: 10, pending: Array.from({ length: 6 }, (_, i) => task(`t${i}`, `Görev ${i}`, null)) };
    render(<P.PrepareProgramCard summary={many} today="2026-10-22" programHref="/p" />);

    assert.ok(screen.getByText("Görev 3"));
    assert.equal(screen.queryByText("Görev 4"), null);
    assert.ok(screen.getByText("+ 2 görev daha"));
  });

  it("says so when everything is done, when the program is empty, and when there is none", () => {
    const done = render(<P.PrepareProgramCard summary={{ total: 3, done: 3, pending: [] }} today="2026-10-22" programHref="/p" />);
    assert.ok(screen.getByText("Tüm görevler tamam."));
    done.unmount();

    const empty = render(<P.PrepareProgramCard summary={{ total: 0, done: 0, pending: [] }} today="2026-10-22" programHref="/p" />);
    assert.ok(screen.getByText("Programda henüz görev yok."));
    empty.unmount();

    render(<P.PrepareProgramCard summary={null} today="2026-10-22" programHref="/p" />);
    assert.ok(screen.getByText("Bu dönem için program yok."));
    assert.equal(screen.getByRole("link", { name: "Programı hazırla" }).getAttribute("href"), "/p");
  });
});

describe("PrepareDisclosure", () => {
  it("is shut until asked, says what is inside, and opens on a press", () => {
    function Harness() {
      const [open, setOpen] = React.useState(false);
      return (
        <P.PrepareDisclosure id="d" title="Özel notlarım" caption="yalnız sana görünür" count="1 not" open={open} onToggle={() => setOpen(!open)}>
          <p>Notun içi</p>
        </P.PrepareDisclosure>
      );
    }
    render(<Harness />);

    const button = screen.getByRole("button", { name: /Özel notlarım/ });
    assert.equal(button.getAttribute("aria-expanded"), "false");
    assert.ok(within(button).getByText("1 not"));
    assert.ok(within(button).getByText(/yalnız sana görünür/));
    assert.equal(screen.queryByText("Notun içi"), null);

    fireEvent.click(button);
    assert.equal(button.getAttribute("aria-expanded"), "true");
    assert.ok(screen.getByText("Notun içi"));
  });
});
