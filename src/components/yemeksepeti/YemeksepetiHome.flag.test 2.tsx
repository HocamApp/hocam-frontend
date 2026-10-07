import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React, { type ComponentType } from "react";
import { cleanup, render } from "@testing-library/react";

/*
 * Renders the whole homepage with NEXT_PUBLIC_HOME_V2 off and on.
 *
 * The sections the flag does not touch fetch data, read the URL or the
 * session, so they are stubbed with a marker. The hero, the band and the
 * page's own wiring render for real: those are what the flag changes.
 */
const STUBBED = [
  "YsTutorDirectory",
  "YsSubjectGrid",
  "YsUniversityStrip",
  "YsHowItWorks",
  "YsTestimonials",
  "YsHomeFaq",
  "YsEntryDialog",
] as const;

// The hero's campus carousel watches its own visibility; jsdom has no observer.
class NoopIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
Object.defineProperty(globalThis, "IntersectionObserver", {
  value: NoopIntersectionObserver,
  configurable: true,
});

let YemeksepetiHome: ComponentType<{ v2?: boolean }>;

before(async () => {
  // A plain anchor: the real Link prefetches through browser idle callbacks.
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  for (const name of STUBBED) {
    mock.module(`@/components/yemeksepeti/${name}`, {
      namedExports: { [name]: () => <div data-stub={name} /> },
    });
  }
  ({ YemeksepetiHome } = await import("./YemeksepetiHome"));
});

afterEach(cleanup);

function stubs(container: HTMLElement) {
  return Array.from(container.querySelectorAll("[data-stub]")).map((el) => el.getAttribute("data-stub"));
}

describe("homepage with NEXT_PUBLIC_HOME_V2 off", () => {
  it("is the default", () => {
    const { container } = render(<YemeksepetiHome />);
    assert.match(container.textContent ?? "", /Bugünün öğretmeni/);
    assert.equal(container.querySelector('a[href="#ogrenciler"]'), null);
  });

  it("renders the pre-rebuild hero, band and section list", () => {
    const { container } = render(<YemeksepetiHome v2={false} />);
    const text = container.textContent ?? "";

    assert.match(text, /Bugünün öğretmeni/);
    assert.ok(container.querySelector('a[href="/register?role=tutor"]'));
    assert.equal(container.querySelector('a[href="#hocalar"]'), null);
    assert.doesNotMatch(text, /Senin için olan kısma atla/);

    assert.doesNotMatch(text, /Her hoca başvurusunda kontrol ettiklerimiz/);
    assert.doesNotMatch(text, /İlk 15\.000/);
    assert.ok(container.querySelector("section.ys-band.pt-20"));

    assert.deepEqual(stubs(container), [
      "YsTutorDirectory",
      "YsUniversityStrip",
      "YsHowItWorks",
      "YsTestimonials",
      "YsHomeFaq",
      "YsEntryDialog",
    ]);
  });
});

describe("homepage with NEXT_PUBLIC_HOME_V2 on", () => {
  it("renders the Phase A hero, subject grid and two-column band", () => {
    const { container } = render(<YemeksepetiHome v2 />);
    const text = container.textContent ?? "";

    assert.match(text, /bugünün öğretmeni/);
    assert.doesNotMatch(text, /Bugünün öğretmeni/);
    assert.equal(container.querySelector('a[href="/register?role=tutor"]'), null);
    assert.match(text, /Senin için olan kısma atla/);
    for (const anchor of ["#ogrenciler", "#veliler", "#hocalar"]) {
      assert.ok(container.querySelector(`a[href="${anchor}"]`), `missing link to ${anchor}`);
    }

    assert.match(text, /Her hoca başvurusunda kontrol ettiklerimiz/);
    assert.match(text, /İlk 15\.000/);
    assert.ok(container.querySelector("section.ys-band .md\\:grid-cols-2"));

    assert.deepEqual(stubs(container), [
      "YsTutorDirectory",
      "YsSubjectGrid",
      "YsUniversityStrip",
      "YsHowItWorks",
      "YsTestimonials",
      "YsHomeFaq",
      "YsEntryDialog",
    ]);
  });
});
