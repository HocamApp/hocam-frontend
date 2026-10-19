import "@/test/setupDom";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, before, describe, it, mock } from "node:test";
import React, { type ComponentType } from "react";
import { cleanup, render } from "@testing-library/react";

import type { PackagePlan, TutorProfile } from "@/types/api";

/*
 * Brand v3 Phase 1B (docs/design/brand-v3/PLAN.md T1.4 to T1.8): the
 * verified band, the student steps, pricing and guarantees. Every change is a
 * `v3:` class, so with the flag off the classes that apply are the old ones.
 */

Object.defineProperty(globalThis, "self", { configurable: true, value: window });

let YsVerifiedBand: ComponentType<{ v2?: boolean }>;
let YsStepTabs: ComponentType<{ label: string; steps: { title: string; body: string[] }[] }>;
let YsPillHeading: ComponentType<{ id: string; lead: string; pill: string }>;
let YsGuarantees: ComponentType;
let PackageExample: ComponentType<{ tutor: TutorProfile; options: PackagePlan[]; brandV3?: boolean }>;
let exampleSelectedDays: (options: PackagePlan[], brandV3: boolean) => number;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  ({ YsVerifiedBand } = await import("./YsVerifiedBand"));
  ({ YsStepTabs } = await import("./YsStepTabs"));
  ({ YsPillHeading } = await import("./YsPillHeading"));
  ({ YsGuarantees } = await import("./YsGuarantees"));
  ({ PackageExample, exampleSelectedDays } = await import("./YsPricing"));
});

afterEach(cleanup);

describe("verified band (T1.4)", () => {
  it("turns the band's type black under v3 and keeps it pink", () => {
    const css = readFileSync("src/styles/yemeksepeti.css", "utf8");
    assert.match(css, /\[data-brand="v3"\] \.ys-band \{\s*color: var\(--on-accent\);\s*\}/);
    const { container } = render(<YsVerifiedBand v2 />);
    assert.match(container.querySelector("#ys-band-title + p")!.className, /\bv3:text-on-accent\b/);
  });

  it("has a black button under v3 and no hex colours in the component", () => {
    const source = readFileSync("src/components/yemeksepeti/YsVerifiedBand.tsx", "utf8");
    assert.doesNotMatch(source, /#[0-9a-f]{6}\b/i);
    const { getByRole } = render(<YsVerifiedBand v2 />);
    const cta = getByRole("link", { name: /Nasıl doğruluyoruz/ });
    assert.match(cta.className, /\bbg-white\b/);
    assert.match(cta.className, /text-\[var\(--ink-on-light\)\]/);
    assert.match(cta.className, /\bv3:bg-band\b.*\bv3:text-on-band\b/);
  });

  it("makes the checklist card black with quiet check circles under v3", () => {
    const { container } = render(<YsVerifiedBand v2 />);
    const card = container.querySelector("h3")!.parentElement!;
    assert.match(card.className, /\bbg-white\b/);
    assert.match(card.className, /\bv3:bg-band\b/);
    const check = card.querySelector("li > span")!;
    assert.match(check.className, /\btext-success\b/);
    assert.match(check.className, /\bv3:bg-on-band-quiet\b/);
    assert.doesNotMatch(check.className, /yellow/);
  });
});

describe("student steps (T1.6)", () => {
  const steps = [
    { title: "Bir", body: ["birinci"] },
    { title: "İki", body: ["ikinci"] },
  ];

  it("adds number tiles only under v3: yellow on the active step, white on the others", () => {
    const { getAllByRole } = render(<YsStepTabs label="Adımlar" steps={steps} />);
    const [first, second] = getAllByRole("tab");
    const tile = (tab: HTMLElement) =>
      Array.from(tab.querySelectorAll("span")).find((s) => /\bv3:grid\b/.test(s.className))!;
    assert.equal(tile(first).textContent, "01");
    assert.match(tile(first).className, /\bhidden\b/);
    assert.match(tile(first).className, /\bbg-yellow\b/);
    assert.match(tile(second).className, /\bbg-surface\b/);
    assert.match(first.className, /\bv3:bg-surface\b/);
    assert.doesNotMatch(second.className, /\bv3:bg-surface\b/);

    const oldNumber = Array.from(first.querySelectorAll("span")).find((s) => s.textContent === "01.")!;
    assert.match(oldNumber.className, /\bv3:hidden\b/);
  });
});

describe("heading pills", () => {
  it("are pale pink under v3 for pricing and guarantees", () => {
    const { container } = render(<YsPillHeading id="x" lead="Ne kadar" pill="ödersin?" />);
    const pill = Array.from(container.querySelectorAll("span")).find((s) => s.textContent === "ödersin?")!;
    assert.match(pill.className, /\bbg-pink\b/);
    assert.match(pill.className, /\bv3:bg-pink-soft\b.*\bv3:text-ink\b/);
  });

  it("leave the journey's full pink \"seç\" pill alone (BRAND.md §3 rule 8)", () => {
    const source = readFileSync("src/components/yemeksepeti/YsJourneyHeading.tsx", "utf8");
    assert.doesNotMatch(source, /v3:/);
  });
});

describe("pricing (T1.7)", () => {
  const tutor = { id: "t1", name: "Mehmet", surname: "Demir", profile_picture: "", hourly_price: 980 } as unknown as TutorProfile;
  const plan = (days: number, lessons: number, discount: number) =>
    ({ id: `p${days}`, lesson_count: lessons, lessons_per_week: 2, duration_days: days, discount_percent: discount }) as PackagePlan;

  it("puts the plan box on --band under v3, pink border on the selected plan", () => {
    const { container, getByText } = render(
      <PackageExample tutor={tutor} options={[plan(14, 4, 0), plan(30, 8, 5), plan(90, 24, 15)]} />,
    );
    const box = container.querySelector("a")!;
    assert.match(box.className, /\bbg-pink-pale\b/);
    assert.match(box.className, /\bv3:bg-band\b/);

    const rows = Array.from(box.querySelectorAll("[aria-hidden] > div"));
    assert.equal(rows.length, 3);
    assert.match(rows[1].className, /\bv3:border-pink\b/);
    assert.doesNotMatch(rows[0].className, /\bv3:border-pink\b/);

    assert.match(getByText("En popüler").className, /\bv3:bg-pink\b/);
    assert.match(getByText("%15 fiyat avantajı").className, /\bv3:bg-yellow-soft\b/);
  });

  it("opens on the \"En popüler\" plan under v3, so the border and the tag share a row", () => {
    const options = [plan(14, 4, 0), plan(30, 8, 5), plan(90, 24, 15)];
    assert.equal(exampleSelectedDays(options, false), 30);
    assert.equal(exampleSelectedDays(options, true), 90);
    assert.equal(exampleSelectedDays(options.slice(0, 2), true), 30);

    const { container, getByText } = render(<PackageExample tutor={tutor} options={options} brandV3 />);
    const rows = Array.from(container.querySelectorAll("a [aria-hidden] > div"));
    const popularRow = getByText("En popüler").closest("[aria-hidden] > div");
    assert.equal(popularRow, rows[2]);
    assert.match(rows[2].className, /\bv3:border-pink\b/);
    assert.doesNotMatch(rows[1].className, /\bv3:border-pink\b/);
  });

  it("gives the three fact cards the same pale pink tile", () => {
    const source = readFileSync("src/components/yemeksepeti/YsPricing.tsx", "utf8");
    assert.equal(source.match(/tile=\{/g)?.length, 3);
    assert.match(source, /hidden size-16[^"]*bg-pink-soft[^"]*v3:flex/);
  });
});

describe("guarantees (T1.8)", () => {
  it("makes all four icon tiles pale yellow under v3 and the policy link ink", () => {
    const { container, getByRole } = render(<YsGuarantees />);
    const tiles = Array.from(container.querySelectorAll("h3")).map((h) => h.previousElementSibling!);
    assert.equal(tiles.length, 4);
    for (const tile of tiles) assert.match(tile.className, /\bv3:bg-yellow-soft\b/);
    const link = getByRole("link", { name: /iptal ve iade/i });
    assert.match(link.className, /\btext-pink\b.*\bv3:text-ink\b/);
  });
});
