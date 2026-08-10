import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getVisiblePages } from "./sliding-pagination";

describe("getVisiblePages", () => {
  it("keeps the next pages reachable from the first page", () => {
    assert.deepEqual(getVisiblePages(6, 1, 5), [1, 2, 3, 4, -1, 6]);
  });

  it("uses ellipses around a middle window", () => {
    assert.deepEqual(getVisiblePages(12, 6, 5), [1, -1, 5, 6, 7, -1, 12]);
  });

  it("keeps the final pages reachable near the end", () => {
    assert.deepEqual(getVisiblePages(12, 12, 5), [1, -1, 9, 10, 11, 12]);
  });
});
