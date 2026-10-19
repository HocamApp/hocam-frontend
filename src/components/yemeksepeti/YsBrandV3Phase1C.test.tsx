import "@/test/setupDom";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, before, describe, it, mock } from "node:test";
import React, { type ComponentType } from "react";
import { cleanup, render } from "@testing-library/react";

/*
 * Brand v3 Phase 1C (docs/design/brand-v3/PLAN.md T1.9 to T1.12): the parents
 * panel, the tutor band, testimonials and the FAQ. Colour changes are `v3:`
 * classes; the two markup changes (the parents label and the tutor band's
 * highlighted word) sit behind the `brandV3` prop. With the flag off the
 * classes and markup that apply are the old ones.
 */

Object.defineProperty(globalThis, "self", { configurable: true, value: window });

let YsParentsPanel: ComponentType<{ brandV3?: boolean }>;
let YsStepList: ComponentType<{ tone?: "paper" | "ink"; steps: { title: string; body: string[] }[] }>;
let ReviewCard: ComponentType<{ quote: string; name: string; credential: string; photo: string; tone?: number }>;
let YsHomeFaq: ComponentType<{ v2?: boolean }>;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("next/image", {
    defaultExport: (props: React.ComponentProps<"img">) => <img {...props} alt={props.alt ?? ""} />,
  });
  ({ YsParentsPanel } = await import("./YsParentsPanel"));
  ({ YsStepList } = await import("./YsStepList"));
  ({ ReviewCard } = await import("./YsTestimonials"));
  ({ YsHomeFaq } = await import("./YsHomeFaq"));
});

afterEach(cleanup);

describe("parents panel (T1.9)", () => {
  it("keeps the old heading with the flag off", () => {
    const { getByRole, container } = render(<YsParentsPanel />);
    assert.equal(getByRole("heading", { level: 2 }).textContent, "Veliler için");
    assert.equal(container.querySelector(".bg-ink"), null);
  });

  it("puts \"Veliler için\" on an ink label and the lead's first sentence in the heading under v3", () => {
    const { getByRole, getByText } = render(<YsParentsPanel brandV3 />);
    assert.equal(getByRole("heading", { level: 2 }).textContent, "Çocuğunuzun kiminle, nerede ders aldığını bilin");
    assert.match(getByText("Veliler için").className, /\bbg-ink\b.*\btext-paper\b/);
    assert.match(getByText(/^Hocalarımız YKS'de/).textContent!, /üniversite öğrencileri\.$/);
  });

  it("splits the lead without changing its words", async () => {
    const { parents } = await import("./ysHomeCopy");
    assert.equal(`${parents.headline}. ${parents.leadRest}`, parents.lead);
  });
});

describe("tutor band (T1.10)", () => {
  const source = readFileSync("src/components/yemeksepeti/YsTutorBand.tsx", "utf8");

  it("is --band under v3, so it stays dark in dark mode", () => {
    assert.match(source, /bg-ink [^"]*text-paper[^"]*v3:bg-band v3:text-on-band/);
  });

  it("has one yellow button and a quiet outline one", () => {
    assert.equal(source.match(/v3:bg-yellow\b/g)?.length, 1);
    assert.match(source, /v3:bg-yellow v3:font-bold v3:text-on-accent/);
    assert.match(source, /v3:border-2 v3:border-on-band-mid/);
  });

  it("draws quiet check circles, not yellow ones", () => {
    assert.match(source, /<Check\s+className="[^"]*v3:bg-on-band-quiet[^"]*"/);
  });

  it("highlights a word that is in the title", async () => {
    const { tutors } = await import("./ysHomeCopy");
    assert.ok(tutors.title.includes(tutors.titleHighlight));
  });

  it("keeps the ink step list quiet under v3: lines, marker and 40% numbers", () => {
    const steps = [
      { title: "Bir", body: ["birinci"] },
      { title: "İki", body: ["ikinci"] },
    ];
    const { container } = render(<YsStepList tone="ink" steps={steps} />);
    assert.match(container.querySelector("ol")!.className, /\bborder-paper\/20\b.*\bv3:border-on-band-quiet\b/);
    const number = Array.from(container.querySelectorAll("span")).find((s) => s.textContent === "01.")!;
    assert.match(number.className, /\btext-paper\/55\b.*\bv3:text-on-band\b.*\bv3:opacity-40\b/);
    assert.doesNotMatch(container.innerHTML, /yellow/);
  });
});

describe("testimonials (T1.11)", () => {
  const person = { quote: "Söz", name: "Ad", credential: "12. sınıf", photo: "/x.jpeg" };

  it("cycles yellow-soft, surface, pink-soft under v3", () => {
    const tints = [0, 1, 2, 3].map((tone) => {
      const { container } = render(<ReviewCard {...person} tone={tone} />);
      const cls = (container.firstElementChild as HTMLElement).className;
      cleanup();
      return cls;
    });
    assert.match(tints[0], /\bv3:bg-yellow-soft\b/);
    assert.match(tints[1], /\bv3:bg-surface\b/);
    assert.match(tints[2], /\bv3:bg-pink-soft\b/);
    assert.match(tints[3], /\bv3:bg-yellow-soft\b/);
    for (const cls of tints) assert.match(cls, /\bhover:bg-gold\b/);
  });

  it("puts an ink quote mark on tinted cards and a pink one on the white card", () => {
    const mark = (tone: number) => {
      const { container } = render(<ReviewCard {...person} tone={tone} />);
      const el = Array.from(container.querySelectorAll("span[aria-hidden]")).find((s) => s.textContent === "“")!;
      const cls = el.className;
      cleanup();
      return cls;
    };
    assert.match(mark(0), /\bhidden\b.*\bv3:block\b.*\btext-ink\b/);
    assert.match(mark(1), /\btext-pink\b/);
  });

  it("has no colour literals left in the component, and no sheen under v3", () => {
    const tsx = readFileSync("src/components/yemeksepeti/YsTestimonials.tsx", "utf8");
    assert.doesNotMatch(tsx, /#[0-9a-f]{6}\b|rgb\(/i);
    const css = readFileSync("src/styles/yemeksepeti.css", "utf8");
    assert.match(css, /\[data-brand="v3"\] \.ys-sheen \{\s*display: none;\s*\}/);
    assert.doesNotMatch(css.slice(css.indexOf(".ys-sheen {")), /^\s*radial-gradient\([^)]*#/m);
  });
});

describe("FAQ (T1.12)", () => {
  it("keeps the selected tab ink and makes the others surface pills with a line under v3", () => {
    const { getAllByRole } = render(<YsHomeFaq v2 />);
    const [selected, other] = getAllByRole("tab");
    assert.equal(selected.getAttribute("aria-selected"), "true");
    assert.match(selected.className, /\bbg-ink\b.*\btext-paper\b/);
    assert.doesNotMatch(selected.className, /v3:/);
    assert.match(other.className, /\bv3:border-line\b.*\bv3:bg-surface\b/);
  });
});
