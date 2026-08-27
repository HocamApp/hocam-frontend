/**
 * Structural guards for the public tutor profile's section order and its
 * Değerlendirmeler content.
 *
 * The per-subject rating breakdown appeared twice on this page: once inside
 * the header's rating popover and again as a full block under the reviews.
 * Only the popover survives. These are source-level guards because the page
 * itself is a large client component wired to react-query, auth, and Next
 * navigation — rendering it in a unit test would assert far more than the
 * few behaviours that must not regress.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const publicPage = readFileSync(
  path.join(process.cwd(), "src/app/(main)/tutors/[id]/page.tsx"),
  "utf8"
);
const tutorDashboard = readFileSync(
  path.join(process.cwd(), "src/app/(main)/dashboard/tutor/page.tsx"),
  "utf8"
);

describe("public tutor profile — duplicate subject rating block", () => {
  it("does not render SubjectRatingBreakdown anywhere on the public page", () => {
    assert.equal(publicPage.includes("<SubjectRatingBreakdown"), false);
  });

  it("drops the now unused import", () => {
    assert.equal(publicPage.includes("SubjectRatingBreakdown"), false);
  });

  it("keeps the per-subject scores reachable through the header popover", () => {
    assert.ok(publicPage.includes("function RatingSummaryPopover"));
    assert.ok(publicPage.includes("subjectRatings"));
    // Rendered next to the header rating and inside the sticky action card.
    const usages = publicPage.match(/<RatingSummaryPopover/g) ?? [];
    assert.equal(usages.length, 2);
  });

  it("leaves the popover's hover, focus, blur, and escape handling untouched", () => {
    for (const handler of [
      "onMouseEnter={openPopover}",
      "onMouseLeave={closePopover}",
      "onFocus={openPopoverOnKeyboardFocus}",
      "onBlur={closePopover}",
      "onEscapeKeyDown={",
      'event.target.matches(":focus-visible")',
    ]) {
      assert.ok(publicPage.includes(handler), `missing popover handler: ${handler}`);
    }
  });
});

describe("public tutor profile — reviews section is otherwise intact", () => {
  it("still renders the review summary", () => {
    assert.ok(publicPage.includes("<ReviewSummary summary={reviewSummary} />"));
    assert.ok(publicPage.includes('import { ReviewSummary }'));
  });

  it("still renders the review list", () => {
    assert.ok(publicPage.includes("<ReviewCard key={review.id} review={review} />"));
  });

  it("still supports infinite loading", () => {
    assert.ok(publicPage.includes("hasNextPage"));
    assert.ok(publicPage.includes("isFetchingNextPage"));
    assert.ok(publicPage.includes("fetchNextPage"));
  });

  it("does not reintroduce an overall rating fallback inside the reviews section", () => {
    const reviewsSection = publicPage.slice(
      publicPage.indexOf("{/* Section 4 — Reviews */}"),
      publicPage.indexOf("{/* Supplementary — kept out", publicPage.indexOf("{/* Section 4 — Reviews */}"))
    );
    assert.equal(reviewsSection.includes("{tutor.total_reviews} değerlendirme"), false);
  });

  it("renders the reviews exactly once", () => {
    for (const [needle, expected] of [
      [">Değerlendirmeler<", 1],
      ["<ReviewSummary", 1],
      ["<ReviewCard", 1],
    ] as const) {
      const hits =
        needle === ">Değerlendirmeler<"
          ? (publicPage.match(/>\s*Değerlendirmeler\s*</g) ?? []).length
          : publicPage.split(needle).length - 1;
      assert.equal(hits, expected, `${needle} rendered ${hits} times`);
    }
  });

  it("keeps the section order: availability before reviews", () => {
    const availability = publicPage.search(/>\s*Müsaitlik\s*</);
    const reviews = publicPage.search(/>\s*Değerlendirmeler\s*</);
    assert.ok(availability > 0);
    assert.ok(reviews > 0);
    assert.ok(availability < reviews);
  });
});

describe("public tutor profile — subject labels", () => {
  it("does not repeat generic TYT/AYT chips below the YKS rank", () => {
    const rankStart = publicPage.indexOf("{tutor.yks_rank > 0 && (");
    const bioStart = publicPage.indexOf("{tutor.bio && (", rankStart);
    const rankArea = publicPage.slice(rankStart, bioStart);

    assert.equal(rankArea.includes("subjectGroups.map"), false);
  });

  it("keeps detailed subject chips in the reservation card", () => {
    assert.ok(publicPage.includes("{subjectLabels.map((subject) => ("));
    assert.ok(publicPage.includes("{subject.label}"));
  });
});

describe("SubjectRatingBreakdown component", () => {
  it("is still shipped for its other consumer, the tutor dashboard", () => {
    assert.ok(
      tutorDashboard.includes(
        'import { SubjectRatingBreakdown } from "@/components/tutors/SubjectRatingBreakdown";'
      )
    );
    assert.ok(tutorDashboard.includes("<SubjectRatingBreakdown"));
    const component = readFileSync(
      path.join(process.cwd(), "src/components/tutors/SubjectRatingBreakdown.tsx"),
      "utf8"
    );
    assert.ok(component.includes("export function SubjectRatingBreakdown"));
  });
});

describe("public tutor profile — required section order is uninterrupted", () => {
  /**
   * Every `<h2>` the page renders, in source order. The action/profile card
   * carries no `<h2>`, so this list is exactly the section headings.
   */
  const headings: string[] = [];
  const headingPattern = /<h2[^>]*>([\s\S]*?)<\/h2>/g;
  let match = headingPattern.exec(publicPage);
  while (match !== null) {
    headings.push(
      match[1]
        .replace(/<[^>]*>/g, " ") // drop the icon element in the video heading
        .replace(/\{[^}]*\}/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    );
    match = headingPattern.exec(publicPage);
  }

  it("renders the four required sections back to back, with nothing wedged between them", () => {
    const required = [
      "Tanıtım Videosu",
      "Verdiği Dersler",
      "Müsaitlik",
      "Değerlendirmeler",
    ];
    const start = headings.indexOf(required[0]);

    assert.ok(start >= 0, `missing heading: ${required[0]}`);
    assert.deepEqual(headings.slice(start, start + required.length), required);
  });

  it("starts the section column with the intro video — the profile/action card comes first and has no heading", () => {
    assert.equal(headings[0], "Tanıtım Videosu");
  });

  it("moves Ders Anlatım Özellikleri below the reviews instead of dropping it", () => {
    const attributes = headings.indexOf("Ders Anlatım Özellikleri");
    const reviews = headings.indexOf("Değerlendirmeler");

    assert.ok(attributes >= 0, "the teaching attributes section must survive");
    assert.ok(
      attributes > reviews,
      "Ders Anlatım Özellikleri must sit after Değerlendirmeler"
    );
  });

  it("keeps the teaching attributes content and its guard intact", () => {
    assert.ok(publicPage.includes("(tutor.teaching_attributes ?? []).length > 0"));
    assert.ok(publicPage.includes("(tutor.teaching_attributes ?? []).map((attribute)"));
    assert.ok(publicPage.includes("Hoca tarafından seçilen özellikler"));
    assert.ok(publicPage.includes("{attribute.description}"));
  });
});
