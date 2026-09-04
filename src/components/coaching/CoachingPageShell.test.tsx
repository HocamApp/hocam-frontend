import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { CoachingPageShell } from "./CoachingPageShell";

Object.defineProperty(globalThis, "self", {
  value: window,
  configurable: true,
});

after(() => window.close());
afterEach(cleanup);

describe("CoachingPageShell", () => {
  it("gives every Coaching page exactly one title and nothing above it", () => {
    // The breadcrumb, the eyebrow and the standfirst that used to sit in this
    // band are gone: the tab strip below is both the navigation and the
    // location indicator, so a back link and a category label were saying a
    // third and fourth time what the highlighted tab already says.
    render(
      <CoachingPageShell title="Koçluk müsaitliği">
        <p>Sayfa içeriği</p>
      </CoachingPageShell>,
    );

    assert.equal(screen.getAllByRole("heading", { level: 1 }).length, 1);
    assert.ok(screen.getByRole("heading", { level: 1, name: "Koçluk müsaitliği" }));
    assert.equal(screen.queryByRole("navigation", { name: "Sayfa yolu" }), null);
  });

  it("keeps the current Coaching location visible inside operational pages", () => {
    render(
      <CoachingPageShell
        title="Yaklaşan görüşmeler"
        currentHref="/dashboard/tutor/coaching/upcoming"
        audience="tutor"
      >
        <p>Görüşme içeriği</p>
      </CoachingPageShell>,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Koçluk bölümleri",
    });
    const currentLink = screen.getByRole("link", { name: "Görüşmeler" });

    assert.ok(navigation.contains(currentLink));
    assert.equal(currentLink.getAttribute("aria-current"), "page");
    assert.ok(screen.getByText("Koçlukta konumun"));
  });

  it("leaves the page's one main landmark to the app shell", () => {
    // Every Coaching route renders inside (main)/layout.tsx, which already
    // provides <main id="ys-main-content">. This shell used to add a second
    // one inside it, which makes the primary landmark ambiguous and gives
    // "skip to content" two places to land.
    const { container } = render(
      <CoachingPageShell title="Koçluk müsaitliği">
        <p>Sayfa içeriği</p>
      </CoachingPageShell>,
    );

    assert.equal(container.querySelectorAll("main").length, 0);
  });

  it("holds one container width, so the tab strip cannot resize between tabs", () => {
    // The sub-tab strip lives inside this shell, so a page that narrows the
    // container narrows the navigation with it and the tabs visibly jump as
    // you move between them. Header and stack must always agree.
    const { container: wide } = render(
      <CoachingPageShell title="Çalışma koçluğu" width="wide">
        <p>İçerik</p>
      </CoachingPageShell>,
    );
    const header = wide.querySelector('[data-testid="coaching-page-header"] > div');
    const stack = wide.querySelector('[data-testid="coaching-shell-stack"]');

    assert.match(header!.className, /max-w-7xl/);
    assert.match(stack!.className, /max-w-7xl/);
  });

  it("separates the header by colour as a full-bleed band, with straight edges", () => {
    // Sections separate by colour rather than by nesting another bordered
    // box. Pale rather than ink: a dark slab is the heaviest thing on the
    // screen and every surface under it then has to answer it. The diagonal
    // cut belongs to the landing page and does not follow the user into the
    // product.
    render(
      <CoachingPageShell title="Koçluk teklifini hazırla">
        <p>Karar içeriği</p>
      </CoachingPageShell>,
    );

    const header = screen.getByTestId("coaching-page-header");
    assert.match(header.className, /band-full-bleed/);
    assert.match(header.className, /bg-band-pale/);
    assert.doesNotMatch(header.className, /bg-ink/);
    assert.doesNotMatch(header.className, /band-cut/);
  });
});
