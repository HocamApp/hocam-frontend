import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

/**
 * Lives here rather than beside the layout because the test runner's path
 * globbing cannot address a directory called `[id]`.
 */
const layout = readFileSync("src/app/(main)/tutors/[id]/layout.tsx", "utf8");

describe("tutor profile hydration", () => {
  it("seeds the server's anonymous copy as already stale", () => {
    // The server fetch has no student's token, so it carries none of the
    // per-student fields the profile decides with: trial eligibility, the
    // monthly allowance. Seeded fresh it satisfied the five-minute staleTime
    // and the browser never asked again, so a signed-in student was served
    // the signed-out answer and never saw the free-trial CTA.
    assert.match(
      layout,
      /setQueryData\(\["tutor", params\.id\], tutor, \{ updatedAt: 0 \}\)/,
    );
  });

  it("still hands the first paint and the SEO payload to the server", () => {
    // The fix must not turn the profile into a spinner: the seeding stays,
    // only its freshness changes.
    assert.match(layout, /HydrationBoundary/);
    assert.match(layout, /fetchPublicTutor\(params\.id\)/);
  });
});
