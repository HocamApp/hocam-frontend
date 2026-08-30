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
  it("gives every Coaching page one title and a labelled parent route", () => {
    render(
      <CoachingPageShell
        title="Koçluk müsaitliği"
        description="Görüşmeler için ayırdığın saatleri düzenle."
        parentHref="/dashboard/tutor/coaching"
        parentLabel="Çalışma koçluğu"
      >
        <p>Sayfa içeriği</p>
      </CoachingPageShell>,
    );

    assert.equal(screen.getAllByRole("heading", { level: 1 }).length, 1);
    assert.ok(screen.getByRole("navigation", { name: "Sayfa yolu" }));
    assert.equal(
      screen
        .getByRole("link", { name: "Çalışma koçluğu" })
        .getAttribute("href"),
      "/dashboard/tutor/coaching",
    );
    assert.ok(screen.getByText("Görüşmeler için ayırdığın saatleri düzenle."));
  });

  it("keeps the current Coaching location visible inside operational pages", () => {
    render(
      <CoachingPageShell
        title="Yaklaşan görüşmeler"
        description="Planlanan koçluk görüşmelerini takip et."
        parentHref="/dashboard/tutor/coaching"
        parentLabel="Çalışma koçluğu"
        currentHref="/dashboard/tutor/coaching/upcoming"
        audience="tutor"
      >
        <p>Görüşme içeriği</p>
      </CoachingPageShell>,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Koçluk bölümleri",
    });
    const currentLink = screen.getByRole("link", {
      name: "Görüşmeler",
    });

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
      <CoachingPageShell
        title="Koçluk müsaitliği"
        description="Görüşmeler için ayırdığın saatleri düzenle."
        parentHref="/dashboard/tutor/coaching"
        parentLabel="Çalışma koçluğu"
      >
        <p>Sayfa içeriği</p>
      </CoachingPageShell>,
    );

    assert.equal(container.querySelectorAll("main").length, 0);
  });

  it("uses compact mobile chrome without changing the desktop scale", () => {
    render(
      <CoachingPageShell
        title="Koçluk teklifini hazırla"
        description="Sekiz adımda ilerle."
        parentHref="/dashboard/tutor/coaching"
        parentLabel="Koçluk ana sayfası"
      >
        <p>Karar içeriği</p>
      </CoachingPageShell>,
    );

    assert.match(
      screen.getByTestId("coaching-shell-stack").className,
      /space-y-6/,
    );
    assert.match(screen.getByTestId("coaching-page-header").className, /p-6/);
    assert.match(
      screen.getByTestId("coaching-page-header").className,
      /sm:p-8/,
    );
  });

  it("uses the shared ink editorial header instead of a generic white card", () => {
    render(
      <CoachingPageShell
        title="Koçluk teklifini hazırla"
        description="Sekiz adımda ilerle."
        parentHref="/dashboard/tutor/coaching"
        parentLabel="Koçluk ana sayfası"
      >
        <p>Karar içeriği</p>
      </CoachingPageShell>,
    );

    const header = screen.getByTestId("coaching-page-header");
    assert.match(header.className, /bg-ink/);
    assert.match(header.className, /dark:bg-\[var\(--ink-on-light\)\]/);
    assert.doesNotMatch(header.className, /bg-surface/);
  });
});
