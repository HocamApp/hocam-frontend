import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";

import type { CoachingDerivedStatus } from "@/lib/coachingPresentation";

let CoachingStatusCard: React.ComponentType<{ status: CoachingDerivedStatus }>;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  ({ CoachingStatusCard } = await import("./CoachingStatusCard"));
});

afterEach(cleanup);

function status(overrides: Partial<CoachingDerivedStatus> = {}): CoachingDerivedStatus {
  return {
    publication: "draft",
    intake: "not_applicable",
    capacity: "missing_availability",
    platformCheckout: "enabled",
    readiness: "availability",
    platformMessage: null,
    nextAction: { label: "Koçluk saatlerini ekle", href: "/dashboard/tutor/coaching/plan?step=availability" },
    ...overrides,
  };
}

const rows = () => within(screen.getByRole("list", { name: "Kurulum adımları" })).getAllByRole("listitem");

describe("CoachingStatusCard", () => {
  it("lists the five steps of the setup and says which one is open", () => {
    render(<CoachingStatusCard status={status()} />);

    assert.ok(screen.getByRole("region", { name: "Koçluk hizmet durumu" }));
    assert.ok(screen.getByRole("heading", { name: "Teklifin için kalan adımlar" }));
    assert.deepEqual(
      rows().map((row) => row.textContent),
      [
        "Tamamlandı. Tanıtım",
        "Tamamlandı. Teklif (düzen, fiyat, sınavlar, açıklama)",
        "Sıradaki adım. Koçluk saatleriÖğrencilerin seçebileceği haftalık saatleri sen belirlersin.Koçluk saatlerini ekle",
        "Bekliyor. Kapasite",
        "Bekliyor. Gözden geçir ve yayınla",
      ],
    );
  });

  it("gives the open step one solid gold way forward, and the others none", () => {
    render(<CoachingStatusCard status={status()} />);

    const links = screen.getAllByRole("link");
    assert.equal(links.length, 1);
    assert.equal(links[0].getAttribute("href"), "/dashboard/tutor/coaching/plan?step=availability");
    assert.match(links[0].className, /bg-gold/);
    assert.doesNotMatch(links[0].className, /bg-pink|border-ink|bg-transparent/);
    assert.equal(within(rows()[2]).getAllByRole("link").length, 1);
  });

  it("moves the open step as the setup moves", () => {
    render(
      <CoachingStatusCard
        status={status({
          readiness: "publish",
          nextAction: { label: "Teklifini gözden geçir", href: "/dashboard/tutor/coaching/plan?step=publish" },
        })}
      />,
    );

    assert.ok(within(rows()[4]).getByText("Sıradaki adım."));
    assert.ok(within(rows()[3]).getByText("Tamamlandı."));
    assert.equal(
      within(rows()[4]).getByRole("link", { name: "Teklifini gözden geçir" }).getAttribute("href"),
      "/dashboard/tutor/coaching/plan?step=publish",
    );
  });

  it("no longer talks about a running offer or a finished setup: the card is only for an unfinished one", () => {
    render(<CoachingStatusCard status={status()} />);

    assert.equal(screen.queryByText(/Koçluğun yayında/), null);
    assert.equal(screen.queryByText(/Koçluk düzenin hazır/), null);
    assert.equal(screen.queryByText(/Öğrenci görünümünü aç/), null);
  });

  it("says so when the offer is already published but a step went missing", () => {
    render(<CoachingStatusCard status={status({ publication: "published" })} />);

    assert.ok(screen.getByText("Teklifin yayında; aşağıdaki adım eksik kaldı."));
  });

  it("draws no button, and does not break, if a status has no next action", () => {
    render(<CoachingStatusCard status={status({ nextAction: null })} />);

    assert.equal(screen.queryByRole("link"), null);
    assert.equal(rows().length, 5);
  });

  it("keeps the platform notice under the card", () => {
    render(<CoachingStatusCard status={status({ platformMessage: "Yeni koçluk satışları şu anda kapalı." })} />);

    assert.ok(screen.getByRole("region", { name: "Platform durumu" }));
  });
});
