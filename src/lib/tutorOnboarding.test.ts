import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { shouldShowLessonsEditCta } from "./tutorOnboarding";

describe("shouldShowLessonsEditCta", () => {
  it("shows the CTA for an approved tutor stuck with zero subjects", () => {
    // Regression: the lessons step could never complete from onboarding when
    // the profile had no subjects — the calendar alone cannot add subjects.
    assert.equal(
      shouldShowLessonsEditCta({
        verificationApproved: true,
        lessonsReady: false,
        subjectCount: 0,
      }),
      true
    );
  });

  it("hides the CTA once subjects exist (calendar alone can finish the step)", () => {
    assert.equal(
      shouldShowLessonsEditCta({
        verificationApproved: true,
        lessonsReady: false,
        subjectCount: 2,
      }),
      false
    );
  });

  it("hides the CTA for unapproved tutors", () => {
    assert.equal(
      shouldShowLessonsEditCta({
        verificationApproved: false,
        lessonsReady: false,
        subjectCount: 0,
      }),
      false
    );
  });

  it("hides the CTA when the step is already complete", () => {
    assert.equal(
      shouldShowLessonsEditCta({
        verificationApproved: true,
        lessonsReady: true,
        subjectCount: 0,
      }),
      false
    );
  });
});
