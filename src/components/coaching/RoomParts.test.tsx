import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import type { RoomClock } from "@/lib/coachingRoom";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

let R: typeof import("./RoomParts");

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  R = await import("./RoomParts");
});

after(() => window.close());
afterEach(() => {
  cleanup();
  mock.timers.reset();
});

const live: RoomClock = { phase: "live", label: "Kalan 18 dk", urgent: false };

function bar(overrides: Partial<React.ComponentProps<typeof R.RoomTopBar>> = {}) {
  return (
    <R.RoomTopBar
      title="Deniz Yıldız"
      meta="3. görüşme · 19:00–19:30"
      clock={live}
      summaryHref="/session/coaching/s-3/summary"
      panelOpen
      onTogglePanel={() => {}}
      {...overrides}
    />
  );
}

describe("RoomTopBar", () => {
  it("is a dark bar whose title is the page's h1, with the meeting's own line and the time left", () => {
    render(bar());

    const title = screen.getByRole("heading", { level: 1, name: "Deniz Yıldız" });
    assert.ok(title.closest(".bg-ink"), "the bar is ink");
    assert.ok(screen.getByText("3. görüşme · 19:00–19:30"));
    const chip = screen.getByText("Kalan 18 dk");
    assert.match(chip.className, /border-paper/);
    assert.doesNotMatch(chip.className, /bg-pink-deep/);
  });

  it("marks the last minutes with a filled deep-pink chip", () => {
    render(bar({ clock: { phase: "live", label: "Kalan 4 dk", urgent: true } }));

    const chip = screen.getByText("Kalan 4 dk");
    assert.match(chip.className, /bg-pink-deep/);
    assert.match(chip.className, /text-white/);
  });

  it("offers the screen after the meeting once the time is up, and not before", () => {
    const before = render(bar());
    assert.equal(screen.queryByRole("link", { name: "Görüşme özeti" }), null);
    before.unmount();

    render(bar({ clock: { phase: "over", label: "Süre doldu", urgent: true } }));
    const link = screen.getByRole("link", { name: "Görüşme özeti" });
    assert.equal(link.getAttribute("href"), "/session/coaching/s-3/summary");
    assert.match(link.className, /bg-gold/);
    assert.ok(screen.getByText("Süre doldu"));
  });

  it("has no summary link to offer when it has nowhere to send", () => {
    render(bar({ clock: { phase: "over", label: "Süre doldu", urgent: true }, summaryHref: null }));

    assert.equal(screen.queryByRole("link", { name: "Görüşme özeti" }), null);
  });

  it("shows no clock before the meeting is known", () => {
    render(bar({ clock: null, title: "Görüşme", meta: "" }));

    assert.ok(screen.getByRole("heading", { level: 1, name: "Görüşme" }));
    assert.equal(screen.queryByText(/dk$/), null);
  });

  it("opens and closes the panel from a button that only a desktop has", () => {
    const toggled: boolean[] = [];
    const view = render(bar({ panelOpen: true, onTogglePanel: () => toggled.push(true) }));

    const button = screen.getByRole("button", { name: "Panel" });
    assert.equal(button.getAttribute("aria-expanded"), "true");
    assert.equal(button.getAttribute("aria-controls"), "oda-paneli");
    assert.match(button.className, /\bhidden\b/, "a phone has the bottom bar instead");
    assert.match(button.className, /md:inline-flex/);
    fireEvent.click(button);
    assert.equal(toggled.length, 1);
    view.unmount();

    render(bar({ panelOpen: false }));
    assert.equal(screen.getByRole("button", { name: "Panel" }).getAttribute("aria-expanded"), "false");
  });
});

describe("RoomBottomBar", () => {
  const items = [
    { key: "dosyalar" as const, label: "Dosyalar", icon: <span aria-hidden="true">d</span> },
    { key: "rapor" as const, label: "Rapor", icon: <span aria-hidden="true">r</span> },
    { key: "sorun" as const, label: "Sorun", icon: <span aria-hidden="true">s</span> },
  ];

  it("is a bar of buttons a phone has, one per part of the panel, with the open one pressed", () => {
    const picked: string[] = [];
    render(<R.RoomBottomBar items={items} active="rapor" onSelect={(key) => picked.push(key)} />);

    const nav = screen.getByRole("navigation", { name: "Görüşme paneli" });
    assert.match(nav.className, /md:hidden/);
    assert.equal(within(nav).getByRole("button", { name: "Rapor" }).getAttribute("aria-pressed"), "true");
    assert.equal(within(nav).getByRole("button", { name: "Dosyalar" }).getAttribute("aria-pressed"), "false");
    fireEvent.click(within(nav).getByRole("button", { name: "Sorun" }));
    assert.deepEqual(picked, ["sorun"]);
  });
});

describe("RoomPanel", () => {
  // A function: `R` is only loaded once the mocks are in place, after this block has run.
  const sections = () => (
    <>
      <R.RoomPanelSection id="dosyalar" view="rapor">
        <p>Dosyalar içeriği</p>
      </R.RoomPanelSection>
      <R.RoomPanelSection id="rapor" view="rapor">
        <p>Rapor içeriği</p>
      </R.RoomPanelSection>
    </>
  );

  it("is shut on a phone until a part is chosen, and open on a desktop until it is closed", () => {
    const view = render(<R.RoomPanel view={null} desktopOpen>{sections()}</R.RoomPanel>);
    const aside = screen.getByRole("complementary", { name: "Görüşme paneli" });
    assert.equal(aside.getAttribute("id"), "oda-paneli");
    assert.match(aside.className, /\bhidden\b/);
    assert.match(aside.className, /md:flex/);
    view.unmount();

    render(<R.RoomPanel view="rapor" desktopOpen={false}>{sections()}</R.RoomPanel>);
    const open = screen.getByRole("complementary", { name: "Görüşme paneli" });
    assert.match(open.className, /\bflex\b/);
    assert.match(open.className, /md:hidden/);
  });

  it("shows the chosen part on a phone and every part on a desktop", () => {
    render(<R.RoomPanel view="rapor" desktopOpen>{sections()}</R.RoomPanel>);

    assert.doesNotMatch((screen.getByText("Rapor içeriği").closest("section") as HTMLElement).className, /\bhidden\b/);
    const other = screen.getByText("Dosyalar içeriği").closest("section") as HTMLElement;
    assert.match(other.className, /hidden md:block/);
  });

  it("keeps a part mounted while it is hidden, so a half-written draft is not lost", () => {
    render(<R.RoomPanel view={null} desktopOpen={false}>{sections()}</R.RoomPanel>);

    assert.ok(document.getElementById("oda-rapor"));
    assert.equal(document.querySelectorAll("section").length, 2);
  });
});

describe("RoomStateCard", () => {
  it("is a title, a sentence, a count and the actions that go with them", () => {
    render(
      <R.RoomStateCard title="Oda 18:50'de açılır" message="Görüşme 19:00'da başlıyor." countdown="20 dk kaldı">
        <a href="/hazirlan">Görüşmeye hazırlan</a>
      </R.RoomStateCard>,
    );

    assert.ok(screen.getByRole("heading", { level: 2, name: "Oda 18:50'de açılır" }));
    assert.ok(screen.getByText("Görüşme 19:00'da başlıyor."));
    assert.ok(screen.getByText("20 dk kaldı"));
    assert.ok(screen.getByRole("link", { name: "Görüşmeye hazırlan" }));
  });

  it("leaves out what it was not given", () => {
    render(<R.RoomStateCard title="Bu görüşmeye şu an girilemiyor" message="" countdown={null} />);

    assert.equal(document.querySelectorAll("p").length, 0);
  });
});

describe("RoomConnectionStrip", () => {
  it("says the connection dropped, in plain red at a readable size", () => {
    render(<R.RoomConnectionStrip />);

    const strip = screen.getByRole("status");
    assert.match(strip.textContent ?? "", /Bağlantı koptu\. Yeniden bağlanmaya çalışılıyor…/);
    assert.match(strip.className, /bg-danger/);
    assert.match(strip.className, /text-small/);
    assert.doesNotMatch(strip.className, /text-xs/);
  });
});

describe("useRoomOpenTimer", () => {
  const NOW = new Date("2026-10-21T15:30:00Z");
  let opened = 0;

  beforeEach(() => {
    opened = 0;
    mock.timers.enable({ apis: ["setTimeout", "Date"], now: NOW });
  });

  function Harness({ opensAt }: { opensAt: number | null }) {
    R.useRoomOpenTimer(opensAt, () => {
      opened += 1;
    });
    return null;
  }

  it("asks once, a breath after the moment the room opens", () => {
    render(<Harness opensAt={NOW.getTime() + 60_000} />);

    mock.timers.tick(60_000);
    assert.equal(opened, 0, "not yet: the breath");
    mock.timers.tick(1_500);
    assert.equal(opened, 1);
    mock.timers.tick(60_000);
    assert.equal(opened, 1);
  });

  it("sets no timer for a moment already past or not known", () => {
    render(<Harness opensAt={NOW.getTime() - 1_000} />);
    render(<Harness opensAt={null} />);

    mock.timers.tick(10 * 60_000);
    assert.equal(opened, 0);
  });

  it("stops waiting when the screen goes away", () => {
    const view = render(<Harness opensAt={NOW.getTime() + 60_000} />);
    view.unmount();

    mock.timers.tick(5 * 60_000);
    assert.equal(opened, 0);
  });
});
