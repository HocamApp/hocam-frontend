import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { CoachingPageShell } from "./CoachingPageShell";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

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
      </CoachingPageShell>
    );

    assert.equal(screen.getAllByRole("heading", { level: 1 }).length, 1);
    assert.ok(screen.getByRole("navigation", { name: "Sayfa yolu" }));
    assert.equal(
      screen.getByRole("link", { name: "Çalışma koçluğu" }).getAttribute("href"),
      "/dashboard/tutor/coaching"
    );
    assert.ok(screen.getByText("Görüşmeler için ayırdığın saatleri düzenle."));
  });
});
