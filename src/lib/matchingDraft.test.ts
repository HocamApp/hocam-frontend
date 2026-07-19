import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MATCHING_DRAFT_TTL_MS,
  createMatchingDraft,
  isCompleteMatchingAnswers,
  parseMatchingDraft,
} from "./matchingDraft";

describe("matching draft", () => {
  it("expires drafts after seven days", () => {
    const draft = createMatchingDraft({ goal: "YKS" }, 2, 1000);
    assert.equal(parseMatchingDraft(JSON.stringify(draft), 1000 + MATCHING_DRAFT_TTL_MS - 1)?.step, 2);
    assert.equal(parseMatchingDraft(JSON.stringify(draft), 1000 + MATCHING_DRAFT_TTL_MS), null);
  });

  it("accepts only complete answer sets", () => {
    assert.equal(isCompleteMatchingAnswers({ goal: "YKS" }), false);
    assert.equal(
      isCompleteMatchingAnswers({
        goal: "YKS",
        stage: "grade_12",
        subject_keys: ["matematik"],
        challenges: ["foundations"],
        teaching_styles: ["foundations_patient"],
        availability_windows: ["flexible"],
        budget_segment: "flexible",
        schema_version: 1,
      }),
      true
    );
  });
});
