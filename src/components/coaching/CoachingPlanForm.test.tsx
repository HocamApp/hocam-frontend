import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import type { CoachingPlan, CoachingSetupConfig } from "@/lib/coachingApi";
import { CoachingPlanForm } from "./CoachingPlanForm";

after(() => window.close());
afterEach(cleanup);

const setupConfig: CoachingSetupConfig = {
  exam_groups: ["YKS", "DGS", "KPSS"],
  session_duration_minutes: 30,
  lesson_price_minor: 107000,
  // Deliberately not the minor value. The component must compute
  // from *_minor; if it ever echoes the server string instead, the
  // negative assertion below is what catches it.
  lesson_price_display: "9.999,99 ₺",
  max_price_ratio_percent: 72,
  price_cap_minor: 77040,
  price_cap_display: "8.888,88 ₺",
  commission_bps: 1234,
  frequency_options: [
    {
      value: "weekly",
      label: "Haftada bir",
      packages: [
        { duration_days: 14, weeks: 2, total_sessions: 2 },
        { duration_days: 30, weeks: 4, total_sessions: 4 },
        { duration_days: 90, weeks: 12, total_sessions: 12 },
        { duration_days: 180, weeks: 24, total_sessions: 24 },
      ],
    },
  ],
};

function form(step: "frequency" | "price" | "exams") {
  return (
    <CoachingPlanForm
      plan={null}
      setupConfig={setupConfig}
      currentStep={step}
      capacity={null}
      onSubmit={() => undefined}
      onContinue={() => undefined}
      isSaving={false}
      error={null}
    />
  );
}

describe("CoachingPlanForm", () => {
  it("renders frequency package counts only from server setup config", () => {
    render(form("frequency"));
    const card = screen.getByRole("button", { name: /Haftada bir/ });
    assert.equal(card.getAttribute("aria-pressed"), "true");
    assert.ok(within(card).getByText("Seçili"));
    // The four-week package is the headline number, set large above its caption.
    assert.equal(
      within(card).getByText("görüşme, 4 haftalık pakette").previousElementSibling?.textContent,
      "4",
    );
    // The other packages follow as rows, all of it from the server config.
    for (const weeks of [2, 12, 24]) assert.ok(within(card).getByText(`${weeks} haftada`));
    assert.equal(within(card).queryByText("4 haftada"), null);
    assert.equal(screen.queryByText(/Sayılar sunucudaki güncel paket modelinden gelir/), null);
  });

  it("marks the chosen routine with the pink band and a flat gold pill, and nothing else", () => {
    const config: CoachingSetupConfig = {
      ...setupConfig,
      frequency_options: [
        { value: "biweekly", label: "İki haftada bir", packages: [{ duration_days: 30, weeks: 4, total_sessions: 2 }] },
        ...setupConfig.frequency_options,
      ],
    };
    render(
      <CoachingPlanForm
        plan={null}
        setupConfig={config}
        currentStep="frequency"
        capacity={null}
        onSubmit={() => undefined}
        onContinue={() => undefined}
        isSaving={false}
        error={null}
      />
    );

    const first = screen.getByRole("button", { name: /İki haftada bir/ });
    const second = screen.getByRole("button", { name: /Haftada bir/ });
    assert.equal(first.getAttribute("aria-pressed"), "true");
    assert.ok(first.querySelector("[class*='bg-pink']"), "the chosen card has the pink band");
    assert.match(within(first).getByText("Seçili").className, /\bbg-gold\b/);
    assert.equal(second.querySelector("[class*='bg-pink']"), null);
    assert.equal(within(second).queryByText("Seçili"), null);

    fireEvent.click(second);
    assert.equal(second.getAttribute("aria-pressed"), "true");
    assert.equal(first.getAttribute("aria-pressed"), "false");
    assert.ok(second.querySelector("[class*='bg-pink']"));
  });

  it("says the fixed meeting length in one plain line", () => {
    render(form("frequency"));
    assert.ok(screen.getByText("Her görüşme 30 dakika."));
    assert.ok(screen.getByText(/Bu süre bütün koçluk planlarında aynıdır/));
  });

  it("explains the dynamic lesson-price cap without hardcoding 75 percent", () => {
    render(form("price"));
    assert.ok(screen.getByText(/1\.070,00\s₺/));
    assert.ok(screen.getByText(/%72/));
    assert.ok(screen.getByText(/770,40\s₺/));
    assert.equal(screen.queryByText(/%75/), null);
  });

  it("formats setup money from canonical minor values", () => {
    render(form("price"));
    assert.ok(screen.getByText("1.070,00 ₺"));
    assert.ok(screen.getByText("770,40 ₺"));
    assert.equal(screen.queryByText("9.999,99 ₺"), null);
  });

  it("offers only the server-provided canonical Coaching exams", () => {
    render(form("exams"));
    const yks = screen.getByRole("button", { name: /YKS/ });
    assert.ok(yks.textContent?.includes("TYT, AYT ve YDT hedeflerini birlikte kapsar"));
    fireEvent.click(yks);
    assert.equal(yks.getAttribute("aria-pressed"), "true");
    assert.ok(yks.textContent?.includes("Seçildi"));
    assert.ok(screen.getByRole("button", { name: "DGS" }));
    assert.ok(screen.getByRole("button", { name: "KPSS" }));
    assert.equal(screen.queryByRole("button", { name: "TYT" }), null);
    assert.equal(screen.queryByRole("button", { name: "AYT" }), null);
    assert.equal(screen.queryByRole("button", { name: "YDT" }), null);
  });

  it("asks the capacity question in plain words and names the range the tutor may type", () => {
    render(
      <CoachingPlanForm
        plan={null}
        setupConfig={setupConfig}
        currentStep="capacity"
        capacity={{
          weekly_slot_count: 4,
          theoretical_capacity: 8,
          max_active_students: 1,
          active_students: 0,
          is_accepting_new_students: true,
          can_accept_new_student: true,
          slots: [],
        }}
        onSubmit={() => undefined}
        onContinue={() => undefined}
        isSaving={false}
        error={null}
      />
    );

    assert.ok(screen.getByLabelText("Aynı anda en fazla kaç öğrenciye koçluk vereceksin?"));
    assert.ok(screen.getByText(/En az 1, en fazla 8 yazabilirsin/));
    assert.ok(screen.getByText(/30 dakikalık görüşmelere bölünür/));
    assert.equal(/teorik|slot/i.test(document.body.textContent ?? ""), false);
  });

  describe("capacity step validation", () => {
    const capacityDetail = {
      weekly_slot_count: 4,
      theoretical_capacity: 8,
      max_active_students: 1,
      active_students: 0,
      is_accepting_new_students: true,
      can_accept_new_student: true,
      slots: [],
    };

    // By the capacity step a draft plan exists, with its exam already chosen.
    const plan = {
      id: "p1",
      frequency: "weekly",
      session_duration_minutes: 30,
      price_per_session_minor: 0,
      price_per_session_display: "",
      price_cap_minor: 77040,
      max_active_students: 1,
      target_exam_types: ["YKS"],
      description: "",
      is_published: false,
      is_accepting_new_students: true,
      published_at: null,
      capacity: null,
      created_at: "",
      updated_at: "",
    } as CoachingPlan;

    function capacityStep(onSubmit: (payload: unknown) => void = () => undefined) {
      return (
        <CoachingPlanForm
          plan={plan}
          setupConfig={setupConfig}
          currentStep="capacity"
          capacity={capacityDetail}
          onSubmit={onSubmit}
          onContinue={() => undefined}
          isSaving={false}
          error={null}
        />
      );
    }
    const field = () => screen.getByLabelText("Aynı anda en fazla kaç öğrenciye koçluk vereceksin?");

    it("is quiet while the number is fine", () => {
      render(capacityStep());
      assert.equal(field().getAttribute("aria-invalid"), null);
      assert.equal(screen.queryByRole("alert"), null);
    });

    it("turns the box red and says why when the number is too small", () => {
      render(capacityStep());
      fireEvent.change(field(), { target: { value: "0" } });

      assert.equal(field().getAttribute("aria-invalid"), "true");
      assert.match(field().className, /\bborder-error\b/);
      assert.equal(screen.getByRole("alert").textContent, "En az 1 yazabilirsin.");
    });

    it("names the ceiling when the number is too large, and rejects a decimal or an empty box", () => {
      render(capacityStep());

      fireEvent.change(field(), { target: { value: "9" } });
      assert.match(screen.getByRole("alert").textContent ?? "", /En fazla 8 yazabilirsin/);

      fireEvent.change(field(), { target: { value: "1.5" } });
      assert.equal(screen.getByRole("alert").textContent, "Tam sayı yaz.");

      fireEvent.change(field(), { target: { value: "" } });
      assert.equal(screen.getByRole("alert").textContent, "En az 1 yazabilirsin.");
    });

    it("clears the error as soon as the number is fine again", () => {
      render(capacityStep());
      fireEvent.change(field(), { target: { value: "0" } });
      fireEvent.change(field(), { target: { value: "3" } });

      assert.equal(field().getAttribute("aria-invalid"), null);
      assert.equal(screen.queryByRole("alert"), null);
    });

    it("does not save an invalid number, and keeps the focus on the box", () => {
      let saved = 0;
      render(capacityStep(() => { saved += 1; }));
      fireEvent.change(field(), { target: { value: "0" } });
      fireEvent.click(screen.getByRole("button", { name: /devam et/i }));

      assert.equal(saved, 0);
      assert.equal(document.activeElement, field());
    });

    it("saves a valid number as it was typed", () => {
      let payload: unknown = null;
      render(capacityStep((value) => { payload = value; }));
      fireEvent.change(field(), { target: { value: "3" } });
      fireEvent.click(screen.getByRole("button", { name: /devam et/i }));

      assert.equal((payload as { max_active_students: number }).max_active_students, 3);
    });
  });

  describe("price step", () => {
    function priceStep(onSubmit: (payload: unknown) => void = () => undefined) {
      return (
        <CoachingPlanForm
          plan={{
            id: "p1",
            frequency: "weekly",
            session_duration_minutes: 30,
            price_per_session_minor: 0,
            price_per_session_display: "",
            price_cap_minor: 77040,
            max_active_students: 1,
            target_exam_types: ["YKS"],
            description: "",
            is_published: false,
            is_accepting_new_students: true,
            published_at: null,
            capacity: null,
            created_at: "",
            updated_at: "",
          } as CoachingPlan}
          setupConfig={setupConfig}
          currentStep="price"
          capacity={null}
          onSubmit={onSubmit}
          onContinue={() => undefined}
          isSaving={false}
          error={null}
        />
      );
    }
    const field = () => screen.getByLabelText("Koçluk görüşme fiyatın (₺)");

    it("shows how the ceiling comes out: the lesson price times the rate gives the most a meeting can cost", () => {
      render(priceStep());

      assert.ok(screen.getByText("40 dakikalık ders fiyatın"));
      assert.ok(screen.getByText("Koçluk oranı"));
      const ceiling = screen.getByText("Koçluk görüşmen en fazla");
      assert.ok(ceiling.closest("div")?.textContent?.includes("770,40"));
      // The ceiling is a gold surface with --gold-ink on it, never gold text.
      const tile = ceiling.closest("div[class*='bg-gold']") as HTMLElement;
      assert.ok(tile, "the ceiling sits on a gold tile");
      assert.match(tile.className, /\btext-gold-ink\b/);
      // Said in words for a screen reader, not only drawn as signs.
      assert.ok(screen.getByText("çarpı"));
      assert.ok(screen.getByText("eşittir"));
    });

    it("is quiet for a price at or under the ceiling, and for zero (free)", () => {
      render(priceStep());
      for (const value of ["0", "450", "770.40"]) {
        fireEvent.change(field(), { target: { value } });
        assert.equal(field().getAttribute("aria-invalid"), null, `${value} should be fine`);
      }
      assert.equal(screen.queryByRole("alert"), null);
    });

    it("turns the box red and names the ceiling when the price is above it", () => {
      render(priceStep());
      fireEvent.change(field(), { target: { value: "800" } });

      assert.equal(field().getAttribute("aria-invalid"), "true");
      assert.match(field().className, /\bborder-error\b/);
      assert.match(screen.getByRole("alert").textContent ?? "", /En fazla 770,40\s₺ yazabilirsin/);
    });

    it("rejects a negative price and an empty box with their own sentence", () => {
      render(priceStep());

      fireEvent.change(field(), { target: { value: "-5" } });
      assert.equal(screen.getByRole("alert").textContent, "Fiyat 0'dan küçük olamaz.");

      fireEvent.change(field(), { target: { value: "" } });
      assert.match(screen.getByRole("alert").textContent ?? "", /Bir fiyat yaz/);
    });

    it("does not save a price above the ceiling, and keeps the caret in the box", () => {
      let saved = 0;
      render(priceStep(() => { saved += 1; }));
      fireEvent.change(field(), { target: { value: "800" } });
      fireEvent.click(screen.getByRole("button", { name: /devam et/i }));

      assert.equal(saved, 0);
      assert.equal(document.activeElement, field());
    });

    it("says the commission in plain words", () => {
      render(priceStep());
      assert.ok(screen.getByText(/Ücretsiz sunmak için 0 yaz\. Her görüşmeden %12,34 komisyon düşülür/));
    });
  });
});
