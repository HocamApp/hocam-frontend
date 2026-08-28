import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import {
  COACHING_SECTION_TITLE_CLASS,
  COACHING_SUBSECTION_TITLE_CLASS,
  CoachingSectionHeading,
} from "./CoachingSectionHeading";

after(() => window.close());
afterEach(cleanup);

describe("coaching section heading", () => {
  it("renders an h2 at the section scale by default", () => {
    render(<CoachingSectionHeading>Başvurularım</CoachingSectionHeading>);

    const heading = screen.getByRole("heading", { level: 2 });
    assert.equal(heading.textContent, "Başvurularım");
    assert.equal(heading.className, COACHING_SECTION_TITLE_CLASS);
  });

  it("drops to an h3 at the subsection scale", () => {
    render(
      <CoachingSectionHeading level="subsection">
        Kanıtlar
      </CoachingSectionHeading>,
    );

    const heading = screen.getByRole("heading", { level: 3 });
    assert.equal(heading.className, COACHING_SUBSECTION_TITLE_CLASS);
  });

  // The shell owns the h1. A section heading that emitted one would put two
  // page titles in the same document.
  it("never emits an h1", () => {
    render(<CoachingSectionHeading>Koçluk alanların</CoachingSectionHeading>);

    assert.equal(screen.queryByRole("heading", { level: 1 }), null);
  });

  it("keeps one weight and one scale across both levels", () => {
    [COACHING_SECTION_TITLE_CLASS, COACHING_SUBSECTION_TITLE_CLASS].forEach(
      (scale) => {
        assert.match(scale, /font-medium/);
        assert.doesNotMatch(scale, /font-bold/);
        // text-2xl is the CardTitle default that made the program tab shout.
        assert.doesNotMatch(scale, /text-2xl/);
      },
    );
  });

  it("renders a description and actions when given them", () => {
    render(
      <CoachingSectionHeading
        description="Kısa açıklama"
        actions={<button>Ekle</button>}
      >
        Programım
      </CoachingSectionHeading>,
    );

    assert.ok(screen.getByText("Kısa açıklama"));
    assert.ok(screen.getByRole("button", { name: "Ekle" }));
  });
});
