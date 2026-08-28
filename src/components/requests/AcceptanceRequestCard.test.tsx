import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { AcceptanceRequest } from "@/lib/coachingApi";
import { AcceptanceRequestCard } from "./AcceptanceRequestCard";

after(() => window.close());
afterEach(cleanup);

const bundledRequest: AcceptanceRequest = {
  id: "request-1",
  student: { id: "student-1", name: "Deniz", surname: "Yılmaz" },
  package: {
    id: "package-1",
    plan_name: "Haftalık Ders Paketi",
    lessons_per_week: 2,
    duration_days: 90,
    total_credits: 24,
    total_price: 23520,
  },
  coaching: {
    frequency: "weekly",
    total_sessions: 12,
    total_price_minor: 960000,
    service_status: "pending_acceptance",
  },
  includes_coaching: true,
  status: "pending",
  purchase_status: "pending_tutor_acceptance",
  requested_at: "2026-08-12T10:00:00Z",
  expires_at: "2026-08-14T10:00:00Z",
  responded_at: null,
  rejection_reason: "",
  rejection_note: "",
};

describe("AcceptanceRequestCard", () => {
  it("shows the lesson package and Coaching add-on as one understandable request", () => {
    render(<AcceptanceRequestCard request={bundledRequest} isPending={false} onRespond={() => undefined} />);

    assert.ok(screen.getByText("Deniz Yılmaz"));
    assert.ok(screen.getByText("Haftalık Ders Paketi"));
    assert.ok(screen.getByText(/Haftada 2 ders/));
    assert.ok(screen.getByText(/3 Ay/));
    assert.ok(screen.getByText(/24 ders/));
    assert.ok(screen.getByText(/Haftada 1 görüşme/));
    assert.ok(screen.getByText(/12 görüşme/));
    assert.ok(screen.getByText("23.520,00 ₺"));
    assert.ok(screen.getByText(/9\.600,00/));
    // The two chips sit side by side and must not compete: the add-on is a
    // fact about the request, the status is the thing the tutor acts on. The
    // assertion is on the construction rather than one hex-bearing class,
    // because the solid fill is what carries the emphasis.
    const addOn = screen.getByText("Çalışma koçluğu dahil").className;
    const status = screen.getByText("Öğretmen yanıtı bekleniyor").className;
    assert.match(addOn, /text-ink-mid/);
    assert.match(addOn, /bg-transparent/);
    assert.match(status, /bg-ink|bg-pink/);
    assert.ok(screen.getByRole("heading", { name: "Birlikte değerlendirilecek talep" }));
    assert.equal(screen.queryByText(/bundle/i), null);
  });

  it("answers the whole combined request through one existing decision callback", () => {
    const decisions: Array<["accept" | "reject", string | undefined]> = [];
    render(
      <AcceptanceRequestCard
        request={bundledRequest}
        isPending={false}
        onRespond={(decision, note) => decisions.push([decision, note])}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Ders + koçluğu kabul et" }));
    assert.deepEqual(decisions, [["accept", undefined]]);
  });
});
