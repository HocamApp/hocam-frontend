import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import type { CoachingCapacityDetail, CoachingPlan } from "@/lib/coachingApi";
import type { CoachingSettingRow } from "@/lib/coachingPlanSummary";
import { CoachingPlanSummary } from "./CoachingPlanSummary";
import { CoachingPublishActions } from "./CoachingPublishActions";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });
after(() => window.close());
afterEach(cleanup);

const plan: CoachingPlan = {
  id: "plan-1",
  frequency: "weekly",
  session_duration_minutes: 30,
  price_per_session_minor: 60000,
  price_per_session_display: "600,00 ₺",
  price_cap_minor: 90000,
  max_active_students: 6,
  target_exam_types: ["YKS", "DGS"],
  description: "İlk görüşmede seviyeni çıkarıp haftalık programı birlikte yazarız.",
  is_published: true,
  is_accepting_new_students: true,
  published_at: "2026-10-02T09:00:00Z",
  capacity: null,
  created_at: "2026-10-01T09:00:00Z",
  updated_at: "2026-10-02T09:00:00Z",
};

const capacity: CoachingCapacityDetail = {
  weekly_slot_count: 12,
  theoretical_capacity: 8,
  max_active_students: 6,
  active_students: 3,
  is_accepting_new_students: true,
  can_accept_new_student: true,
  slots: [],
};

const rows: CoachingSettingRow[] = [
  { step: "frequency", label: "Görüşme düzeni", value: "Haftada bir", hint: "4 haftalık pakette 4 görüşme · her görüşme 30 dk", chip: "Haftada bir" },
  { step: "price", label: "Görüşme fiyatı", value: "600,00 ₺ / görüşme", hint: "4 haftalık paket 2.400,00 ₺ · komisyon sonrası eline 1.980,00 ₺ geçer", chip: "600,00 ₺" },
  { step: "exams", label: "Sınavlar", value: "YKS, DGS", hint: null, chip: "YKS, DGS" },
  { step: "description", label: "Açıklama", value: "İlk görüşmede seviyeni çıkarıp haftalık programı birlikte yazarız.", hint: null, chip: null },
  { step: "availability", label: "Koçluk saatlerin", value: "Haftada 12 görüşme yeri", hint: "Pzt, Çar, Cum, Cmt", chip: "12 görüşme yeri" },
  { step: "capacity", label: "Kapasite", value: "En fazla 6 öğrenci", hint: "Şu an 3 öğrenci · saatlerinle 8 öğrenciye kadar bakabilirsin", chip: "6 öğrenci" },
];

describe("CoachingPlanSummary", () => {
  it("opens with a pink band that says how many students and free places there are", () => {
    render(<CoachingPlanSummary plan={plan} rows={rows} capacity={capacity} actions={<span>eylemler</span>} />);

    const heading = screen.getByRole("heading", { name: "Koçluk teklifin" });
    const band = heading.closest("[class*='bg-pink']");
    assert.ok(band, "the header sits on the pink band");
    assert.ok(within(band as HTMLElement).getByText("3 aktif öğrenci · 3 boş kontenjan"));
  });

  it("shows a flat gold Yayında pill once the offer is live, an outline when it is not", () => {
    const { rerender } = render(
      <CoachingPlanSummary plan={plan} rows={rows} capacity={capacity} actions={null} />
    );
    const live = screen.getByText("Yayında");
    assert.match(live.className, /bg-gold/);
    assert.match(live.className, /text-gold-ink/);

    rerender(
      <CoachingPlanSummary
        plan={{ ...plan, is_published: false, published_at: null }}
        rows={rows}
        capacity={capacity}
        actions={null}
      />
    );
    assert.equal(screen.queryByText("Yayında"), null);
    const draft = screen.getByText("Yayında değil");
    assert.doesNotMatch(draft.className, /bg-gold/);
  });

  it("lists every setting with its value, its hint and an Düzenle link to that step", () => {
    render(<CoachingPlanSummary plan={plan} rows={rows} capacity={capacity} actions={null} />);

    const items = screen.getAllByRole("listitem");
    assert.equal(items.length, rows.length);
    rows.forEach((row, index) => {
      const item = within(items[index]);
      assert.ok(item.getByText(row.label, { selector: "p" }), row.label);
      assert.ok(item.getByText(row.value), row.value);
      if (row.hint) assert.ok(item.getByText(row.hint), row.hint);
      const edit = item.getByRole("link", { name: `Düzenle ${row.label}` });
      assert.equal(edit.getAttribute("href"), `/dashboard/tutor/coaching/plan?step=${row.step}`);
    });
  });

  it("makes every Düzenle a solid gold button, not a pill the colour of the row behind it", () => {
    render(<CoachingPlanSummary plan={plan} rows={rows} capacity={capacity} actions={null} />);

    const links = screen.getAllByRole("link");
    assert.equal(links.length, rows.length);
    for (const link of links) {
      assert.match(link.className, /bg-gold/);
      assert.match(link.className, /text-gold-ink/);
      assert.doesNotMatch(link.className, /bg-transparent|bg-surface|bg-paper|bg-white/);
    }
  });

  it("keeps every Düzenle link a full touch target", () => {
    render(<CoachingPlanSummary plan={plan} rows={rows} capacity={capacity} actions={null} />);

    for (const link of screen.getAllByRole("link")) {
      assert.match(link.className, /min-h-11/);
    }
  });

  it("puts the publish actions in their own Yayın durumu row, with a sentence for the state", () => {
    render(
      <CoachingPlanSummary plan={plan} rows={rows} capacity={capacity} actions={<button>eylemler</button>} />
    );

    const region = screen.getByRole("region", { name: "Yayın durumu" });
    assert.ok(within(region).getByRole("button", { name: "eylemler" }));
    assert.ok(within(region).getByText("Öğrenciler teklifini görüp başvurabiliyor."));
  });

  it("says plainly when the offer is live but closed to new students", () => {
    render(
      <CoachingPlanSummary
        plan={{ ...plan, is_accepting_new_students: false }}
        rows={rows}
        capacity={capacity}
        actions={null}
      />
    );

    assert.ok(screen.getByText("Teklifin yayında ama yeni öğrenci almıyorsun."));
  });

  it("surfaces a server error above the list", () => {
    render(<CoachingPlanSummary plan={plan} rows={rows} capacity={capacity} error="Teklif yayından kaldırılamadı." actions={null} />);

    assert.ok(screen.getByText("Teklif yayından kaldırılamadı."));
  });

  it("writes lira after the number everywhere", () => {
    const { container } = render(
      <CoachingPlanSummary plan={plan} rows={rows} capacity={capacity} actions={null} />
    );

    assert.doesNotMatch(container.textContent ?? "", /₺\s?\d/);
  });

  it("drops the student counts rather than inventing them when capacity has not loaded", () => {
    render(<CoachingPlanSummary plan={plan} rows={rows} capacity={null} actions={null} />);

    assert.equal(screen.queryByText(/aktif öğrenci/), null);
  });
});

describe("CoachingPublishActions", () => {
  const handlers = () => ({
    onPublish: mock.fn(),
    onUnpublish: mock.fn(),
    onClose: mock.fn(),
    onReopen: mock.fn(),
  });

  it("offers one solid gold Yayınla action while the offer is a draft", () => {
    const h = handlers();
    render(
      <CoachingPublishActions
        plan={{ is_published: false, is_accepting_new_students: true }}
        pending={false}
        {...h}
      />
    );

    const publish = screen.getByRole("button", { name: "Teklifi yayınla" });
    assert.match(publish.className, /bg-gold/);
    assert.match(publish.className, /text-gold-ink/);
    assert.equal(screen.getAllByRole("button").length, 1);
    fireEvent.click(publish);
    assert.equal(h.onPublish.mock.callCount(), 1);
  });

  it("lets a live offer stop taking new students or come down", () => {
    const h = handlers();
    render(
      <CoachingPublishActions
        plan={{ is_published: true, is_accepting_new_students: true }}
        pending={false}
        {...h}
      />
    );

    assert.equal(screen.queryByRole("button", { name: "Teklifi yayınla" }), null);
    fireEvent.click(screen.getByRole("button", { name: "Yeni öğrenci almayı durdur" }));
    fireEvent.click(screen.getByRole("button", { name: "Yayından kaldır" }));
    assert.equal(h.onClose.mock.callCount(), 1);
    assert.equal(h.onUnpublish.mock.callCount(), 1);
  });

  it("keeps the live actions solid gold too, never an outline the colour of the row", () => {
    const h = handlers();
    render(
      <CoachingPublishActions
        plan={{ is_published: true, is_accepting_new_students: true }}
        pending={false}
        {...h}
      />
    );

    for (const button of screen.getAllByRole("button")) {
      assert.match(button.className, /bg-gold/);
      assert.match(button.className, /text-gold-ink/);
      assert.doesNotMatch(button.className, /bg-transparent|border-ink/);
    }
  });

  it("offers to reopen when intake is closed", () => {
    const h = handlers();
    render(
      <CoachingPublishActions
        plan={{ is_published: true, is_accepting_new_students: false }}
        pending={false}
        {...h}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Yeni öğrenci almayı aç" }));
    assert.equal(h.onReopen.mock.callCount(), 1);
    assert.equal(screen.queryByRole("button", { name: "Yeni öğrenci almayı durdur" }), null);
  });

  it("disables every action while one is in flight", () => {
    const h = handlers();
    render(
      <CoachingPublishActions
        plan={{ is_published: true, is_accepting_new_students: true }}
        pending
        {...h}
      />
    );

    for (const button of screen.getAllByRole("button")) {
      assert.equal((button as HTMLButtonElement).disabled, true);
    }
  });
});
