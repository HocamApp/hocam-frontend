import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultTutorOrdering,
  parseComparisonIds,
  removeTutorFilterCategory,
  savedSearchToTutorFilters,
} from "./tutorDirectory";

test("comparison ids are unique and capped at three", () => {
  assert.deepEqual(parseComparisonIds("a,b,a,c,d"), ["a", "b", "c"]);
});

test("relevance is the implicit default for discovery searches", () => {
  assert.equal(defaultTutorOrdering({ search: "matematik" }), "relevance");
  assert.equal(defaultTutorOrdering({ topic: "topic-id" }), "relevance");
  assert.equal(defaultTutorOrdering({}), "rating");
});

test("relaxing price removes both price bounds only", () => {
  assert.deepEqual(
    removeTutorFilterCategory({ min_price: "500", max_price: "800", subject: "Fizik" }, "price"),
    { subject: "Fizik" }
  );
});

test("saved teaching attributes restore the API comma format", () => {
  const filters = savedSearchToTutorFilters({
    id: "saved", name: "", ordering: "rating",
    filters: { teaching_attributes: ["patient", "visual"], subject: "Matematik" },
    created_at: "", updated_at: "",
  });
  assert.equal(filters.teaching_attributes, "patient,visual");
  assert.equal(filters.subject, "Matematik");
});
