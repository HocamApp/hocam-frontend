import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React, { type ComponentType } from "react";
import { cleanup, render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { Subject, TutorProfile } from "@/types/api";

/*
 * Brand v3 Phase 1A (docs/design/brand-v3/PLAN.md T1.1 to T1.3): the hero,
 * the subject tiles and the tutor card. Every change is behind the brandV3
 * prop or a `v3:` class, so with the flag off the markup that shows is the
 * old one.
 */

class NoopIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
Object.defineProperty(globalThis, "IntersectionObserver", { value: NoopIntersectionObserver, configurable: true });
Object.defineProperty(globalThis, "self", { configurable: true, value: window });

let YsHeroIntro: ComponentType<{ v2?: boolean; brandV3?: boolean }>;
let YsSubjectGrid: ComponentType<{ brandV3?: boolean }>;
let subjectGlyph: (exam: "TYT" | "AYT", name: string) => string | null;
let TutorCard: ComponentType<{ tutor: TutorProfile; size?: "default" | "lg" }>;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("next/image", {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    defaultExport: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
  });
  mock.module("@/hooks/useCoachingFlag", {
    namedExports: { useCoachingFlag: () => ({ enabled: false }) },
  });
  ({ YsHeroIntro } = await import("./YsHeroIntro"));
  ({ YsSubjectGrid, subjectGlyph } = await import("./YsSubjectGrid"));
  ({ TutorCard } = await import("@/components/tutors/TutorCard"));
});

afterEach(cleanup);

describe("hero", () => {
  it("keeps the campus ring and the plain headline with the flag off", () => {
    const { container } = render(<YsHeroIntro v2 />);
    assert.equal(container.querySelector('[data-testid="ys-hero-collage"]'), null);
    assert.equal(container.querySelector("h1 .bg-yellow"), null);
    assert.match(container.querySelector("h1")!.textContent!, /bugünün öğretmeni/);
  });

  it("swaps in the collage and highlights the last word with the flag on", () => {
    const { container } = render(<YsHeroIntro v2 brandV3 />);
    const collage = container.querySelector('[data-testid="ys-hero-collage"]')!;
    assert.ok(collage);
    assert.equal(container.querySelector("h1 .bg-yellow")!.textContent, "öğretmeni");
    assert.equal(container.querySelector("h1")!.textContent, "Dünün öğrencisi,bugünün öğretmeni");

    const text = collage.textContent ?? "";
    assert.match(text, /İlk 15\.000/);
    // D3: generic, no name and no photo of a person.
    assert.match(text, /Deneme dersin onaylandı/);
    assert.match(text, /20 dakika/);
    const photos = Array.from(collage.querySelectorAll("img")).map((img) => img.getAttribute("src"));
    assert.deepEqual(photos, [
      "/images/universities/campus/bogazici.jpg",
      "/images/universities/campus/odtu.jpg",
    ]);
  });

  it("uses --pink-deep for the white-text button only under v3 (D1)", () => {
    const { getByText } = render(<YsHeroIntro v2 brandV3 />);
    const cta = getByText("Hocaları gör");
    assert.match(cta.className, /\bbg-pink\b/);
    assert.match(cta.className, /\bv3:bg-pink-deep\b/);
  });
});

describe("subject grid", () => {
  const subjects: Subject[] = [
    { id: "1", name: "Matematik", exam_type: "TYT" },
    { id: "2", name: "Matematik", exam_type: "AYT" },
    { id: "3", name: "Sosyoloji", exam_type: "AYT" },
  ] as Subject[];

  function renderGrid(brandV3: boolean) {
    const client = new QueryClient();
    client.setQueryData(["subjects"], subjects);
    return render(
      <QueryClientProvider client={client}>
        <YsSubjectGrid brandV3={brandV3} />
      </QueryClientProvider>,
    );
  }

  it("keeps the pills with the flag off", () => {
    const { container } = renderGrid(false);
    assert.equal(container.querySelector(".bg-pink-soft"), null);
    assert.equal(container.querySelectorAll("a").length, 3);
  });

  it("draws one tile per subject, TYT pale pink and AYT pale yellow, with the exam in words", () => {
    const { container } = renderGrid(true);
    const tiles = Array.from(container.querySelectorAll("ul.grid a"));
    assert.equal(tiles.length, 3);
    assert.match(tiles[0].className, /bg-pink-soft/);
    assert.match(tiles[1].className, /bg-yellow-soft/);
    assert.match(tiles[0].textContent!, /^TYTMatematik/);
    assert.match(tiles[1].textContent!, /^AYTMatematik/);
    assert.match(container.querySelector("ul.grid")!.className, /minmax\(150px,1fr\)/);
  });

  it("hides the watermark from assistive tech and leaves unknown subjects blank", () => {
    assert.equal(subjectGlyph("TYT", "Matematik"), "∑");
    assert.equal(subjectGlyph("AYT", "Matematik"), "∫");
    assert.equal(subjectGlyph("AYT", "Sosyoloji"), null);
    const { container } = renderGrid(true);
    const glyphs = Array.from(container.querySelectorAll("ul.grid a [aria-hidden]"));
    assert.equal(glyphs.length, 2);
  });
});

describe("tutor card under v3", () => {
  const tutor = {
    id: "t1",
    user: "u1",
    name: "Mehmet",
    surname: "Demir",
    profile_picture: "",
    bio: "",
    university: "Boğaziçi Üniversitesi",
    department: "Matematik",
    yks_rank: 540,
    hourly_price: 980,
    rating: 4.9,
    total_reviews: 3,
    completed_lessons_count: 7,
    is_online: false,
    subjects: [
      { id: "s1", name: "Fizik", exam_type: "TYT" },
      { id: "s2", name: "Kimya", exam_type: "AYT" },
      { id: "s3", name: "Tarih", exam_type: "KPSS" },
    ],
  } as unknown as TutorProfile;

  it("adds the photo rank pill hidden unless v3, and hides the rail rank under v3", () => {
    const { container } = render(<TutorCard tutor={tutor} size="lg" />);
    const pills = container.querySelectorAll('[aria-label="YKS sıralaması: 540"]');
    assert.equal(pills.length, 1);
    assert.match(pills[0].className, /\bhidden\b/);
    assert.match(pills[0].className, /\bv3:inline-flex\b/);
    assert.match(pills[0].textContent!, /İlk 540/);
    const railRank = Array.from(container.querySelectorAll("dd")).find((dd) => /İlk 540/.test(dd.textContent!))!;
    assert.match(railRank.parentElement!.className, /\bv3:hidden\b/);
  });

  it("colours TYT and AYT chips only under v3, and leaves other exams alone", () => {
    const { getByText } = render(<TutorCard tutor={tutor} size="lg" />);
    assert.match(getByText("Fizik").className, /v3:bg-pink-soft/);
    assert.match(getByText("Kimya").className, /v3:bg-yellow-soft/);
    assert.doesNotMatch(getByText("Tarih").className, /v3:/);
  });
});
