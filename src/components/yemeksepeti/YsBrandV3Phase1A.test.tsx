import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React, { type ComponentType } from "react";
import { cleanup, render } from "@testing-library/react";

import type { TutorProfile } from "@/types/api";

/*
 * Brand v3 Phase 1A (docs/design/brand-v3/PLAN.md T1.1 to T1.3): the hero
 * and the tutor card. Every change is behind the brandV3
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

  it("keeps the plain chip row everywhere but v3, and adds a labelled one for v3", () => {
    const { container, getByText } = render(<TutorCard tutor={tutor} size="lg" />);
    const plain = getByText("Fizik").parentElement!;
    assert.match(plain.className, /\bv3:hidden\b/);
    assert.doesNotMatch(getByText("Fizik").className, /pink-soft/);

    const v3 = container.querySelector('[data-testid="v3-subject-chips"]')!;
    assert.match(v3.className, /\bhidden\b.*\bv3:flex\b/);
    const chips = Array.from(v3.children).map((chip) => [chip.textContent, chip.className]);
    assert.equal(chips[0][0], "TYT Fizik");
    assert.match(chips[0][1], /bg-pink-soft/);
    assert.equal(chips[1][0], "AYT Kimya");
    assert.match(chips[1][1], /bg-yellow-soft/);
    // Other exams carry their label but no tint.
    assert.equal(chips[2][0], "KPSS Tarih");
    assert.doesNotMatch(chips[2][1], /soft/);
  });

  it("shows the same subject once per exam under v3", () => {
    const both = {
      ...tutor,
      subjects: [
        { id: "a", name: "Matematik", exam_type: "AYT" },
        { id: "b", name: "Matematik", exam_type: "TYT" },
      ],
    } as unknown as TutorProfile;
    const { container } = render(<TutorCard tutor={both} size="lg" />);
    const labels = Array.from(container.querySelector('[data-testid="v3-subject-chips"]')!.children).map((c) => c.textContent);
    assert.deepEqual(labels, ["TYT Matematik", "AYT Matematik"]);
  });

  it("gives every chip one pale pink treatment when no subject names its exam", () => {
    const unlabelled = {
      ...tutor,
      subjects: [
        { id: "a", name: "Fizik", exam_type: "" },
        { id: "b", name: "Kimya", exam_type: "" },
      ],
    } as unknown as TutorProfile;
    const { container } = render(<TutorCard tutor={unlabelled} size="lg" />);
    const chips = Array.from(container.querySelector('[data-testid="v3-subject-chips"]')!.children);
    assert.deepEqual(chips.map((c) => c.textContent), ["Fizik", "Kimya"]);
    for (const chip of chips) assert.match(chip.className, /bg-pink-soft/);
  });
});
