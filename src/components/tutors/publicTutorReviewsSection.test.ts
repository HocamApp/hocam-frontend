/**
 * Structural guards for the public tutor profile's Değerlendirmeler section.
 *
 * The per-subject rating breakdown appeared twice on this page: once inside
 * the header's rating popover and again as a full block under the reviews.
 * Only the popover survives. These are source-level guards because the page
 * itself is a large client component wired to react-query, auth, and Next
 * navigation — rendering it in a unit test would assert far more than the
 * one behaviour that must not regress.
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

  it("keeps the fallback rating summary for tutors without a summary payload", () => {
    assert.ok(publicPage.includes("{tutor.total_reviews} değerlendirme"));
  });

  it("keeps the section order: availability before reviews", () => {
    const availability = publicPage.indexOf(">Müsaitlik<");
    const reviews = publicPage.indexOf(">Değerlendirmeler<");
    assert.ok(availability > 0);
    assert.ok(reviews > 0);
    assert.ok(availability < reviews);
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

describe("public tutor profile — Google Calendar block placement", () => {
  it("renders the owner card inside the availability section", () => {
    const availabilityHeading = publicPage.indexOf(">Müsaitlik<");
    const card = publicPage.indexOf("<GoogleCalendarConnectionCard />");
    const calendar = publicPage.indexOf("<AvailabilityCalendar");
    const reviewsHeading = publicPage.indexOf(">Değerlendirmeler<");

    assert.ok(card > availabilityHeading, "card must come after the heading");
    assert.ok(card < calendar, "card must sit above the availability calendar");
    assert.ok(calendar < reviewsHeading, "reviews must stay last");
  });

  it("shows the owner card only to the profile owner", () => {
    assert.ok(
      publicPage.includes("{isOwnProfile ? (") ||
        publicPage.includes("isOwnProfile ? (")
    );
    const ownerBranch = publicPage.slice(
      publicPage.indexOf("isOwnProfile ? ("),
      publicPage.indexOf("<AvailabilityCalendar")
    );
    assert.ok(ownerBranch.includes("<GoogleCalendarConnectionCard />"));
    assert.ok(ownerBranch.includes("<GoogleCalendarAssurance"));
  });

  it("passes only the public boolean to the student/visitor assurance", () => {
    assert.ok(publicPage.includes("connected={tutor.google_calendar_connected}"));
    // The private endpoint must never be read from the public page.
    assert.equal(publicPage.includes("fetchGoogleCalendarConnection"), false);
    assert.equal(publicPage.includes("account_email"), false);
    assert.equal(publicPage.includes("last_error"), false);
  });

  it("keeps the AvailabilityCalendar props untouched", () => {
    const calendarBlock = publicPage.slice(
      publicPage.indexOf("<AvailabilityCalendar"),
      publicPage.indexOf("<AvailabilityCalendar") + 220
    );
    assert.ok(calendarBlock.includes("availability={availability}"));
    assert.ok(calendarBlock.includes("editable={false}"));
    assert.ok(calendarBlock.includes("showBookings={false}"));
  });

  it("keeps the four content sections in their original order", () => {
    const order = [
      "Tanıtım Videosu",
      ">Verdiği Dersler<",
      ">Müsaitlik<",
      ">Değerlendirmeler<",
    ].map((needle) => publicPage.indexOf(needle));

    order.forEach((index, position) => {
      assert.ok(index > 0, `missing section ${position}`);
      if (position > 0) {
        assert.ok(index > order[position - 1], `section ${position} moved`);
      }
    });
  });
});
