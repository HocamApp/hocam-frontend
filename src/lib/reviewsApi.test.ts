import assert from "node:assert/strict";
import { mock, test } from "node:test";

test("createReview adapts one overall score to the current API contract", async () => {
  const calls: Array<{ url: string; body: unknown }> = [];
  mock.module("./api", {
    defaultExport: {
      post: async (url: string, body: unknown) => {
        calls.push({ url, body });
        return { data: { id: "review-1", rating: 5 } };
      },
    },
  });

  const { createReview } = await import("./reviewsApi");
  await createReview({ booking: "booking-1", rating: 5, comment: "Harika." });

  assert.deepEqual(calls, [
    {
      url: "/reviews/",
      body: {
        booking: "booking-1",
        clarity_rating: 5,
        preparation_rating: 5,
        progress_rating: 5,
        confidence_rating: 5,
        comment: "Harika.",
      },
    },
  ]);
  mock.reset();
});
