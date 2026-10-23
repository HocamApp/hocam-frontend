import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { CoachingChoiceCard } from "./CoachingChoiceCard";
import { COACHING_INCLUDED, type CoachingEligibility } from "@/lib/coachingApi";

afterEach(() => cleanup());

const paid: CoachingEligibility = {
  eligible: true,
  reason: "ok",
  message: "",
  plan: {
    frequency: "weekly",
    session_duration_minutes: 30,
    price_per_session_minor: 40000,
    price_per_session_display: "400,00 ₺",
    is_free: false,
    target_exam_types: ["YKS"],
    description: "Her görüşmede deneme sonuçlarına bakıp programı birlikte güncelliyoruz.",
  },
};

const free: CoachingEligibility = {
  ...paid,
  plan: { ...paid.plan!, is_free: true, price_per_session_minor: 0, price_per_session_display: "0 ₺" },
};

const closed: CoachingEligibility = {
  eligible: false,
  reason: "capacity_full",
  message: "Bu hocanın koçluk kontenjanı şu anda dolu.",
  plan: paid.plan,
};

function renderCard(eligibility: CoachingEligibility, selected = false, onToggle = () => {}) {
  return render(<CoachingChoiceCard eligibility={eligibility} selected={selected} onToggle={onToggle} />);
}

describe("the coaching offer card on the checkout step", () => {
  it("is one card: the title, how often, the price per meeting, and the list of what is included", () => {
    renderCard(paid);

    assert.ok(screen.getByRole("heading", { name: "Çalışma Koçluğu" }));
    assert.ok(screen.getByText("Haftada 1 görüşme · 30 dk"));
    assert.ok(screen.getByText("400 ₺"));
    assert.equal(screen.queryByText(/400,00/), null);
    assert.ok(screen.getByText("/ görüşme"));
    assert.ok(screen.getByText("Toplam, paket süresine göre sonraki adımda hesaplanır."));
    assert.ok(screen.getByText(paid.plan!.description));
    const items = screen.getAllByRole("listitem").map((item) => item.textContent);
    assert.deepEqual(items, [...COACHING_INCLUDED]);
    assert.ok(COACHING_INCLUDED.includes("Kaynak takibi ve önerileri"));
  });

  it("is not chosen until the student adds it: the button adds, and nothing says Seçili", () => {
    const toggles: number[] = [];
    renderCard(paid, false, () => toggles.push(1));

    assert.equal(screen.queryByText("Seçili"), null);
    assert.equal(screen.getByRole("region", { name: "Çalışma Koçluğu" }).getAttribute("data-selected"), "false");
    fireEvent.click(screen.getByRole("button", { name: "Koçluk ekle" }));
    assert.equal(toggles.length, 1);
  });

  it("shows a chosen card as chosen, and the button takes it back", () => {
    const toggles: number[] = [];
    renderCard(paid, true, () => toggles.push(1));

    assert.ok(screen.getByText("Seçili"));
    assert.equal(screen.getByRole("region", { name: "Çalışma Koçluğu" }).getAttribute("data-selected"), "true");
    assert.equal(screen.queryByRole("button", { name: "Koçluk ekle" }), null);
    fireEvent.click(screen.getByRole("button", { name: "Koçluğu kaldır" }));
    assert.equal(toggles.length, 1);
  });

  it("says Ücretsiz instead of a price when the tutor gives it with the package", () => {
    renderCard(free);

    assert.ok(screen.getByText("Ücretsiz"));
    assert.ok(screen.getByText("Ders paketine dahil."));
    assert.equal(screen.queryByText("/ görüşme"), null);
    assert.equal(screen.queryByText("0 ₺"), null);
    assert.equal(screen.queryByText(/sonraki adımda hesaplanır/), null);
    assert.ok(screen.getByRole("button", { name: "Koçluk ekle" }));
  });

  it("offers nothing to press when the server says it cannot be chosen, and shows the server's reason", () => {
    renderCard(closed);

    assert.ok(screen.getByText("Şu anda seçilemez"));
    assert.ok(screen.getByText(closed.message));
    assert.equal(screen.queryByRole("button"), null);
  });

  it("draws nothing without a plan", () => {
    const { container } = renderCard({ ...paid, plan: null });
    assert.equal(container.firstChild, null);
  });

  it("uses the global tokens: the checkout palette variables are not loaded on this route", () => {
    const { container } = renderCard(paid, true);
    assert.doesNotMatch(container.innerHTML, /--checkout-/);
  });
});
