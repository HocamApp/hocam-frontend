import "@/test/setupDom";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render } from "@testing-library/react";

import { YsFact } from "./YsFact";
import { band, hero, subjects } from "./ysHomeCopy";
import {
  isTodo,
  LESSONS_PER_WEEK,
  MAX_TUTOR_YKS_RANK,
  PLAN_DURATIONS,
  TODO,
} from "./ysHomeFacts";
import { homeSubjectGroups } from "./YsSubjectGrid";

afterEach(cleanup);

describe("homepage facts", () => {
  it("derives the package axes from lessonPricing", () => {
    assert.deepEqual(LESSONS_PER_WEEK, { min: 2, max: 6 });
    assert.deepEqual(
      PLAN_DURATIONS.map((plan) => plan.label),
      ["2 Hafta", "1 Ay", "3 Ay", "6 Ay"],
    );
  });

  it("recognises only the sentinel as TODO", () => {
    assert.equal(isTodo(TODO), true);
    assert.equal(isTodo("TODO"), false);
    assert.equal(isTodo(0), false);
  });
});

describe("YsFact", () => {
  it("prints a decided value", () => {
    const { container } = render(<YsFact value={20} label="X" />);
    assert.equal(container.textContent, "20");
  });

  it("marks an undecided value outside production", () => {
    const { container } = render(<YsFact value={TODO} label="SÜRE" />);
    assert.equal(container.textContent, "[SÜRE]");
    assert.ok(container.querySelector('[data-todo-fact="SÜRE"]'));
  });
});

describe("homepage copy", () => {
  it("lowercases the second headline line", () => {
    assert.equal(hero.titleLine2, "bugünün öğretmeni");
  });

  it("builds the rank badge from the enforced maximum", () => {
    assert.equal(band.rankBadge(MAX_TUTOR_YKS_RANK), "İlk 15.000");
  });
});

describe("subject grid grouping", () => {
  it("shows TYT then AYT, in the API's subject order, and nothing else", () => {
    const groups = homeSubjectGroups([
      { id: "1", name: "Fizik", exam_type: "AYT" },
      { id: "2", name: "Türkçe", exam_type: "TYT" },
      { id: "3", name: "Matematik", exam_type: "KPSS" },
      { id: "4", name: "Matematik", exam_type: "AYT" },
      { id: "5", name: "Sayısal", exam_type: "DGS" },
      { id: "6", name: "Matematik", exam_type: "TYT" },
    ]);
    assert.deepEqual(
      groups.map(({ exam, items }) => [exam, items.map((s) => s.name)]),
      [
        ["TYT", ["Türkçe", "Matematik"]],
        ["AYT", ["Fizik", "Matematik"]],
      ],
    );
  });

  it("renders no row for an exam the API returned nothing for", () => {
    const groups = homeSubjectGroups([{ id: "1", name: "Edebiyat", exam_type: "AYT" }]);
    assert.deepEqual(groups.map(({ exam }) => exam), ["AYT"]);
  });
});

describe("Phase A components keep text in the copy file", () => {
  /* Every plain string in the copy for these sections, flattened. If one of
     them also appears in a component, someone typed it into the JSX. */
  const strings = (value: unknown): string[] =>
    typeof value === "string"
      ? [value]
      : value && typeof value === "object"
        ? Object.values(value).flatMap(strings)
        : [];
  const copyStrings = [hero, subjects, band].flatMap(strings);

  for (const file of ["YsHeroIntro.tsx", "YsSubjectGrid.tsx", "YsVerifiedBand.tsx"]) {
    it(file, () => {
      // Comments may quote the copy; only code counts.
      const source = readFileSync(`src/components/yemeksepeti/${file}`, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      assert.deepEqual(
        copyStrings.filter((text) => source.includes(text)),
        [],
      );
    });
  }
});

describe("the band's checklist card", () => {
  const band = readFileSync("src/components/yemeksepeti/YsVerifiedBand.tsx", "utf8");
  const card = readFileSync("src/components/yemeksepeti/YsChecklistCard.tsx", "utf8");
  const bandVariant = card.match(/band: \{([\s\S]*?)\},/)?.[1] ?? "";

  it("has no shadow", () => {
    assert.doesNotMatch(band, /shadow-/);
    assert.doesNotMatch(card, /shadow-/);
  });

  it("keeps light-theme inks on its fixed white surface", () => {
    // --ink-mid flips light in dark mode and would vanish on white.
    assert.match(band, /variant="band"/);
    assert.match(bandVariant, /bg-white/);
    assert.match(bandVariant, /text-\[var\(--ink-mid-on-light\)\]/);
    assert.match(bandVariant, /border-\[var\(--line-on-light\)\]/);
    assert.doesNotMatch(bandVariant, /text-ink-mid/);
  });
});
