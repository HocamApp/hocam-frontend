import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error — plain ESM helper shared with the unit-test runner script.
import { missingTestFiles } from "../../scripts/testRunCompleteness.mjs";

describe("missingTestFiles", () => {
  it("passes a run where every discovered file reported", () => {
    assert.deepEqual(missingTestFiles(["a.test.ts", "b.test.ts"], ["b.test.ts", "a.test.ts"]), []);
  });

  it("names the files a forced exit cut short", () => {
    assert.deepEqual(
      missingTestFiles(["a.test.ts", "b.test.ts", "c.test.ts"], ["a.test.ts"]),
      ["b.test.ts", "c.test.ts"]
    );
  });

  it("ignores extra files the reporter saw but nobody asked for", () => {
    assert.deepEqual(missingTestFiles(["a.test.ts"], ["a.test.ts", "d.test.ts"]), []);
  });
});
