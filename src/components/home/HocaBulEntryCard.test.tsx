import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { createDraft, draftKey, writeDraft } from "@/lib/hocaBulDraft";
import { writePreview } from "@/lib/hocaBulPreviewCache";
import { createMemoryStorage, type StorageLike } from "@/lib/safeStorage";
import type { MatchingPreview } from "@/types";
import type { HocaBulApiAnswers, HocaBulDraft } from "@/types/hocaBul";

// framer-motion's useReducedMotion reads matchMedia, which the shared jsdom
// setup does not provide.
Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

const USER = "student-1";
const NOW = 1_700_000_000_000;

let currentUser: { id: string } | undefined = { id: USER };

const completeAnswers: HocaBulApiAnswers = {
  goal: "DGS",
  stage: "ongoing",
  subject_keys: ["matematik"],
  challenges: ["foundations"],
  teaching_styles: ["question_speed"],
  availability_windows: ["weekday_evening"],
  budget_segment: "balanced",
  schema_version: 1,
};

const preview: MatchingPreview = { matches: [], candidate_count: 2 };

type CardProps = {
  storageOverride?: { local: StorageLike | null; session: StorageLike | null };
  nowOverride?: number;
};

let EntryCard: React.ComponentType<CardProps> | null = null;

async function loadCard() {
  if (EntryCard) return;

  mock.module("@/hooks/useAuth", {
    namedExports: {
      useAuth: () => ({
        user: currentUser,
        isLoading: !currentUser,
        isAuthenticated: Boolean(currentUser),
      }),
    },
  });
  // next/link needs an App Router context it has no business requiring here,
  // and Radix's Slot hands it a ref, so the stand-in forwards one.
  mock.module("next/link", {
    defaultExport: React.forwardRef<
      HTMLAnchorElement,
      { href: string; children?: React.ReactNode }
    >(function MockLink({ href, children, ...rest }, ref) {
      return React.createElement("a", { href, ref, ...rest }, children);
    }),
  });

  EntryCard = (await import("./HocaBulEntryCard"))
    .HocaBulEntryCard as React.ComponentType<CardProps>;
}

function storages(
  seed: Partial<Pick<HocaBulDraft, "answers" | "client" | "stepId">> | null,
  options: { cachedFor?: HocaBulApiAnswers; rawDraft?: string } = {}
) {
  const local = createMemoryStorage();
  const session = createMemoryStorage();
  if (seed) writeDraft(local, createDraft(USER, NOW, seed));
  if (options.rawDraft) local.setItem(draftKey(USER) as string, options.rawDraft);
  if (options.cachedFor) writePreview(session, USER, options.cachedFor, preview, NOW);
  return { local, session };
}

function renderCard(props: CardProps = {}) {
  return render(EntryCard ? <EntryCard nowOverride={NOW} {...props} /> : null);
}

function analyticsSpy() {
  const events: Array<{ event: string; properties: Record<string, unknown> }> = [];
  const listener = (event: Event) => events.push((event as CustomEvent).detail);
  window.addEventListener("hocam:analytics", listener);
  return {
    events,
    stop: () => window.removeEventListener("hocam:analytics", listener),
  };
}

beforeEach(async () => {
  await loadCard();
  currentUser = { id: USER };
});

afterEach(() => {
  cleanup();
});

describe("fresh card", () => {
  it("renders the approved copy for both viewports", () => {
    renderCard({ storageOverride: storages(null) });

    assert.ok(screen.getByText("SANA ÖZEL"));
    assert.ok(
      screen.getByRole("heading", {
        level: 2,
        name: "Sana uygun hocayı 2 dakikada bulalım",
      })
    );
    assert.ok(
      screen.getByText(
        "Hedefini, seviyeni ve programını birkaç soruda anla; doğrulanmış hocalar arasından sana uyanları nedenleriyle gösterelim."
      )
    );
    assert.ok(
      screen.getByText(
        "Birkaç soruda hedefini anla, sana uyan doğrulanmış hocaları gör."
      )
    );
  });

  it("offers exactly the four approved goal chips", () => {
    renderCard({ storageOverride: storages(null) });

    const group = screen.getByRole("group", { name: "Neye hazırlanıyorsun?" });
    const chips = Array.from(group.querySelectorAll("button"));
    assert.deepEqual(
      chips.map((chip) => chip.textContent?.trim()),
      ["YKS", "DGS", "KPSS", "Henüz karar vermedim"]
    );
    for (const chip of chips) {
      assert.equal(chip.getAttribute("aria-pressed"), "false");
    }
    assert.equal(screen.queryByText("LGS"), null);
    assert.equal(screen.queryByText(/koçluk/i), null);
  });

  it("keeps the call to action usable before any chip is chosen", () => {
    renderCard({ storageOverride: storages(null) });

    const cta = screen.getByRole("link", { name: /Hocamı bul/ });
    assert.equal(cta.getAttribute("href"), "/hoca-bul?kaynak=home");
    assert.equal(cta.hasAttribute("aria-disabled"), false);
  });

  it("carries a selected goal into the call to action and its href", () => {
    renderCard({ storageOverride: storages(null) });

    const yks = screen.getByRole("button", { name: "YKS" });
    fireEvent.click(yks);

    assert.equal(yks.getAttribute("aria-pressed"), "true");
    const cta = screen.getByRole("link", { name: /YKS için hocamı bul/ });
    assert.equal(cta.getAttribute("href"), "/hoca-bul?hedef=YKS&kaynak=home");
  });

  it("gives the undecided chip its own contextual call to action", () => {
    renderCard({ storageOverride: storages(null) });

    fireEvent.click(screen.getByRole("button", { name: "Henüz karar vermedim" }));

    const cta = screen.getByRole("link", { name: /Karar vermeden devam et/ });
    assert.equal(cta.getAttribute("href"), "/hoca-bul?hedef=UNDECIDED&kaynak=home");
    assert.equal(screen.queryByText(/Henüz karar vermedim için/), null);
  });

  it("deselects a chip that is tapped again", () => {
    renderCard({ storageOverride: storages(null) });

    const dgs = screen.getByRole("button", { name: "DGS" });
    fireEvent.click(dgs);
    fireEvent.click(dgs);

    assert.equal(dgs.getAttribute("aria-pressed"), "false");
    assert.ok(screen.getByRole("link", { name: /Hocamı bul/ }));
  });

  it("links the secondary action at the full tutor list", () => {
    renderCard({ storageOverride: storages(null) });

    assert.equal(
      screen.getByRole("link", { name: "Tüm hocalara göz at" }).getAttribute("href"),
      "/tutors"
    );
  });
});

describe("draft card", () => {
  it("offers to continue at the stored question", () => {
    renderCard({
      storageOverride: storages({
        answers: { goal: "DGS", stage: "ongoing" },
        stepId: "dersler",
      }),
    });

    assert.ok(screen.getByText("SANA ÖZEL"));
    assert.ok(
      screen.getByRole("heading", { level: 2, name: "Kaldığın yerden devam et" })
    );
    assert.ok(screen.getByText("3. sorudan devam edeceksin."));
    assert.equal(
      screen.getByRole("link", { name: /Devam et/ }).getAttribute("href"),
      "/hoca-bul?adim=dersler&kaynak=home"
    );
    assert.equal(screen.queryByRole("group", { name: "Neye hazırlanıyorsun?" }), null);
    assert.equal(screen.queryByText("Sana uygun hocayı 2 dakikada bulalım"), null);
  });
});

describe("result card", () => {
  it("re-opens a cached result and offers to update the answers", () => {
    renderCard({
      storageOverride: storages(
        { answers: completeAnswers, stepId: "kontrol" },
        { cachedFor: completeAnswers }
      ),
    });

    assert.ok(screen.getByText("EŞLEŞMEN HAZIR"));
    assert.ok(
      screen.getByRole("heading", {
        level: 2,
        name: "Sana uygun hocaları tekrar gör",
      })
    );
    assert.equal(
      screen.getByRole("link", { name: /Eşleşmelerimi gör/ }).getAttribute("href"),
      "/hoca-bul/sonuclar"
    );
    assert.equal(
      screen
        .getByRole("link", { name: "Tercihlerimi güncelle" })
        .getAttribute("href"),
      "/hoca-bul?adim=kontrol&kaynak=sonuclar"
    );
    assert.equal(screen.queryByRole("group", { name: "Neye hazırlanıyorsun?" }), null);
  });
});

describe("untrustworthy stored state", () => {
  it("falls back to the fresh card without leaking a stale claim", () => {
    const cases = [
      storages(null, { rawDraft: "{not json" }),
      // A draft belonging to another account on a shared device.
      (() => {
        const local = createMemoryStorage();
        const session = createMemoryStorage();
        writeDraft(
          local,
          createDraft("student-2", NOW, {
            answers: { goal: "DGS", stage: "ongoing" },
            stepId: "dersler",
          })
        );
        return { local, session };
      })(),
      // Expired: resolved far past the draft TTL.
      storages({ answers: { goal: "DGS", stage: "ongoing" }, stepId: "dersler" }),
    ];

    for (let index = 0; index < cases.length; index += 1) {
      renderCard({
        storageOverride: cases[index],
        nowOverride: index === 2 ? NOW + 30 * 24 * 60 * 60 * 1000 : NOW,
      });

      assert.ok(
        screen.getByRole("heading", {
          level: 2,
          name: "Sana uygun hocayı 2 dakikada bulalım",
        })
      );
      assert.equal(screen.queryByText("Kaldığın yerden devam et"), null);
      assert.equal(screen.queryByText("EŞLEŞMEN HAZIR"), null);
      assert.equal(document.body.textContent?.includes("sorudan devam"), false);
      cleanup();
    }
  });

  it("renders the fresh card, unchanged, while the user is still unknown", () => {
    const seeded = storages({
      answers: { goal: "DGS", stage: "ongoing" },
      stepId: "dersler",
    });

    currentUser = { id: USER };
    const resolved = renderCard({ storageOverride: storages(null) });
    const freshMarkup = resolved.container.innerHTML;
    cleanup();

    currentUser = undefined;
    const pending = renderCard({ storageOverride: seeded });

    // First paint is the server-rendered fresh card: no draft claim before the
    // state is known, and nothing for hydration to correct.
    assert.equal(pending.container.innerHTML, freshMarkup);
  });
});

describe("analytics", () => {
  it("emits one closed-payload event per call-to-action click", () => {
    const spy = analyticsSpy();
    renderCard({ storageOverride: storages(null) });

    fireEvent.click(screen.getByRole("button", { name: "KPSS" }));
    fireEvent.click(screen.getByRole("link", { name: /KPSS için hocamı bul/ }));

    spy.stop();
    assert.equal(spy.events.length, 1);
    assert.equal(spy.events[0]?.event, "home_matching_started");
    assert.deepEqual(spy.events[0]?.properties, { state: "fresh", goal: "KPSS" });
  });

  it("omits the goal when no chip was chosen and reports the clicked variant", () => {
    const spy = analyticsSpy();
    renderCard({
      storageOverride: storages({
        answers: { goal: "DGS", stage: "ongoing" },
        stepId: "dersler",
      }),
    });

    fireEvent.click(screen.getByRole("link", { name: /Devam et/ }));

    spy.stop();
    assert.equal(spy.events.length, 1);
    assert.deepEqual(spy.events[0]?.properties, { state: "draft" });
  });

  it("stays silent on render, on chip selection and on the secondary link", () => {
    const spy = analyticsSpy();
    renderCard({ storageOverride: storages(null) });

    fireEvent.click(screen.getByRole("button", { name: "YKS" }));
    fireEvent.click(screen.getByRole("link", { name: "Tüm hocalara göz at" }));

    spy.stop();
    assert.equal(spy.events.length, 0);
  });

  it("never carries identifying or answer data", () => {
    const spy = analyticsSpy();
    renderCard({
      storageOverride: storages(
        { answers: completeAnswers, stepId: "kontrol" },
        { cachedFor: completeAnswers }
      ),
    });

    fireEvent.click(screen.getByRole("link", { name: /Eşleşmelerimi gör/ }));
    spy.stop();

    const properties = spy.events[0]?.properties ?? {};
    assert.deepEqual(Object.keys(properties).sort(), ["state"]);
    for (const forbidden of [
      "user",
      "user_id",
      "id",
      "email",
      "answers",
      "budget",
      "budget_segment",
      "subject_keys",
      "stage",
    ]) {
      assert.equal(forbidden in properties, false, `${forbidden} must not be sent`);
    }
  });
});

describe("accessibility and touch targets", () => {
  it("labels the chip group and keeps every control a real 44px control", () => {
    renderCard({ storageOverride: storages(null) });

    assert.ok(screen.getByRole("group", { name: "Neye hazırlanıyorsun?" }));

    const controls = [
      ...screen.getAllByRole("button"),
      ...screen.getAllByRole("link"),
    ];
    assert.ok(controls.length >= 6);
    for (const control of controls) {
      assert.ok(
        control.className.includes("min-h-11"),
        `${control.textContent?.trim()} needs a 44px target`
      );
      // Native buttons and anchors are keyboard-operable without extra wiring.
      assert.ok(["BUTTON", "A"].includes(control.tagName));
      assert.ok(
        control.className.includes("focus-visible:ring-2"),
        `${control.textContent?.trim()} needs a visible focus ring`
      );
    }
  });

  it("names the card by its own heading", () => {
    renderCard({ storageOverride: storages(null) });

    assert.ok(
      screen.getByRole("region", { name: "Sana uygun hocayı 2 dakikada bulalım" })
    );
  });
});
