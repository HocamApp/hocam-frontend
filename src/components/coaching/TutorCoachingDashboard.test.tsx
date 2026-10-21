import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { CoachingTodo, CoachingWeekDay } from "@/lib/coachingOverview";
import type { CoachingDerivedStatus } from "@/lib/coachingPresentation";
let TutorCoachingDashboard: typeof import("./TutorCoachingDashboard").TutorCoachingDashboard;

before(async () => {
  // The page intro reads the account's hint state (auth + React Query); these
  // tests render the dashboard bare. Its own behaviour is in PageIntroHint.test.tsx.
  mock.module("@/components/shared/PageIntroHint", {
    namedExports: { PageIntroHint: () => null },
  });
  // The tutor tab badge reads React Query; not what these tests check.
  mock.module("./TutorCoachingPendingBadge", {
    namedExports: { TutorCoachingPendingBadge: () => null },
  });
  ({ TutorCoachingDashboard } = await import("./TutorCoachingDashboard"));
});

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

after(() => window.close());
afterEach(cleanup);

const publishedPaused: CoachingDerivedStatus = {
  publication: "published",
  intake: "open",
  capacity: "available",
  platformCheckout: "platform_paused",
  readiness: "complete",
  stepsDone: { onboarding: true, plan: true, availability: true, capacity: true, publish: true },
  platformMessage:
    "Teklifin yayında. Yeni koçluk satışları platform genelinde şu anda kapalı.",
  nextAction: null,
};

const todos: CoachingTodo[] = [
  {
    id: "report-1",
    kind: "report",
    tab: "reports",
    title: "Zeynep K. raporu yazılmadı",
    detail: "18 Ekim Pazar görüşmesi",
    due: { label: "Yarın 18:00", urgent: false },
    action: { label: "Raporu yaz", href: "/dashboard/tutor/coaching/sessions/s-r/report" },
    at: 1,
  },
];

const days: CoachingWeekDay[] = ["Pzt 19", "Sal 20", "Çar 21", "Per 22", "Cum 23", "Cmt 24", "Paz 25"].map(
  (label, index) => ({
    dateKey: `2026-10-${19 + index}`,
    label,
    isToday: index === 0,
    sessions: index === 0 ? [{ id: "s-1", time: "19:00", studentName: "Zeynep K." }] : [],
  })
);

function lists(overrides: Partial<NonNullable<React.ComponentProps<typeof TutorCoachingDashboard>["lists"]>> = {}) {
  return {
    todos,
    todoState: "ready" as const,
    week: { days, total: 1 },
    weekState: "ready" as const,
    offer: { published: true, acceptingNewStudents: true, activeStudents: 3, maxStudents: 6 },
    onRetryTodos: () => undefined,
    onRetryWeek: () => undefined,
    isRetrying: false,
    ...overrides,
  };
}

describe("TutorCoachingDashboard", () => {
  it("presents platform checkout as information, never as a tutor-fixable failure", () => {
    render(<TutorCoachingDashboard status={publishedPaused} lists={lists()} />);

    assert.ok(
      screen.getByText(
        "Teklifin yayında. Yeni koçluk satışları platform genelinde şu anda kapalı."
      )
    );
    assert.equal(screen.queryByText(/checkout aç/i), null);
    assert.equal(screen.queryByText(/satışları aç/i), null);
    const platformRegion = screen.getByRole("region", { name: "Platform durumu" });
    assert.ok(platformRegion.textContent?.includes("platform genelinde şu anda kapalı"));
  });

  it("is titled like its tab, Genel bakış", () => {
    render(<TutorCoachingDashboard status={publishedPaused} lists={lists()} />);

    assert.ok(screen.getByRole("heading", { level: 1, name: "Genel bakış" }));
  });

  it("opens a set-up tutor on the to-do list and the week, with no big status panel", () => {
    render(<TutorCoachingDashboard status={publishedPaused} lists={lists()} />);

    assert.ok(screen.getByRole("heading", { name: "Yapılacaklar" }));
    assert.ok(screen.getByRole("heading", { name: "Bu hafta" }));
    assert.ok(screen.getByText("Zeynep K. raporu yazılmadı"));
    assert.equal(screen.queryByRole("region", { name: "Koçluk hizmet durumu" }), null);
    assert.equal(screen.queryByText("Koçluk düzenin hazır"), null);
    // The old percent bar and four-tile rhythm are gone.
    assert.equal(screen.queryByRole("progressbar"), null);
    assert.equal(screen.queryByText("Koçluk akışın burada şekillenecek"), null);
  });

  it("says nothing extra about the platform when there is nothing to say", () => {
    render(
      <TutorCoachingDashboard status={{ ...publishedPaused, platformMessage: null }} lists={lists()} />
    );

    assert.equal(screen.queryByRole("region", { name: "Platform durumu" }), null);
  });

  it("keeps the next-step panel for a tutor whose setup is not finished", () => {
    render(
      <TutorCoachingDashboard
        status={{
          ...publishedPaused,
          publication: "draft",
          readiness: "availability",
          platformMessage: null,
          nextAction: { label: "Koçluk saatlerini ekle", href: "/dashboard/tutor/coaching/plan?step=availability" },
        }}
        lists={lists()}
      />
    );

    assert.ok(screen.getByRole("region", { name: "Koçluk hizmet durumu" }));
    assert.equal(
      screen.getByRole("link", { name: /Koçluk saatlerini ekle/ }).getAttribute("href"),
      "/dashboard/tutor/coaching/plan?step=availability"
    );
  });

  it("shows only the next-step panel when there is no plan to list anything from", () => {
    render(
      <TutorCoachingDashboard
        status={{
          ...publishedPaused,
          publication: "missing",
          readiness: "plan",
          platformMessage: null,
          nextAction: { label: "Teklifini oluştur", href: "/dashboard/tutor/coaching/plan?step=frequency" },
        }}
        lists={null}
      />
    );

    assert.ok(screen.getByRole("region", { name: "Koçluk hizmet durumu" }));
    assert.equal(screen.queryByRole("heading", { name: "Yapılacaklar" }), null);
    assert.equal(screen.queryByRole("heading", { name: "Bu hafta" }), null);
  });

  it("lets each card fail and retry on its own", () => {
    const onRetryTodos = mock.fn();
    const onRetryWeek = mock.fn();
    render(
      <TutorCoachingDashboard
        status={publishedPaused}
        lists={lists({ todoState: "error", weekState: "error", onRetryTodos, onRetryWeek })}
      />
    );

    const retries = screen.getAllByRole("button", { name: /Tekrar dene/ });
    assert.equal(retries.length, 2);
    fireEvent.click(retries[0]);
    fireEvent.click(retries[1]);
    assert.equal(onRetryTodos.mock.callCount(), 1);
    assert.equal(onRetryWeek.mock.callCount(), 1);
  });
});
