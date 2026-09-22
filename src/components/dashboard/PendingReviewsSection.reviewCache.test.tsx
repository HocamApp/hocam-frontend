import "@/test/setupDom";
import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClientProvider, QueryObserver } from "@tanstack/react-query";

import api from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { PendingReviewsSection } from "./PendingReviewsSection";

/**
 * A rating the student's own review just changed must not keep showing the old
 * number. Every surface below reads a tutor's rating from a query the review
 * path used to leave untouched, so for the whole five-minute staleTime the
 * student saw the score from before they rated — the server was right the
 * entire time.
 *
 * The flow is driven through the real component: the section owns the
 * invalidation, and asserting on the cache it leaves behind is the only way to
 * catch a key going missing from that list.
 */

const TUTOR_ID = "tutor-1";
const OLD_RATING = 4.0;
const NEW_RATING = 4.6;

const pendingItem = {
  id: "booking-1",
  participant_name: "Ada Lovelace",
  subject: { id: "s1", name: "Matematik", exam_type: "TYT" },
  start_time: "2026-09-18T18:00:00Z",
  completed_at: "2026-09-18T18:40:00Z",
  tutor: { id: TUTOR_ID, name: "Ada", surname: "Lovelace" },
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 300));

/** The three caches a student can be looking at when their rating lands. */
function seedPreReviewCaches() {
  queryClient.clear();
  // The tutor's own page, opened within the last five minutes.
  queryClient.setQueryData(["tutor", TUTOR_ID], { id: TUTOR_ID, rating: OLD_RATING });
  // That page's review list — the student's new review belongs in it.
  queryClient.setQueryData(["tutor-reviews-infinite", TUTOR_ID], {
    pages: [{ results: [], next: null }],
    pageParams: [1],
  });
  // The directory cards on / and /favoriler, which render the same rating.
  queryClient.setQueryData(["tutors", {}, 1], {
    results: [{ id: TUTOR_ID, rating: OLD_RATING }],
    count: 1,
    next: null,
  });
}

async function submitAReview() {
  api.defaults.adapter = async (config) => ({
    data: config.url?.includes("/profile/reviews/pending/")
      ? [pendingItem]
      : { id: "review-1", rating: 5 },
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });

  render(
    <QueryClientProvider client={queryClient}>
      <PendingReviewsSection />
    </QueryClientProvider>
  );

  fireEvent.click(await screen.findByRole("button", { name: "Değerlendir" }, { timeout: 3000 }));
  fireEvent.click(await screen.findByLabelText("5 yıldız", {}, { timeout: 3000 }));
  fireEvent.click(screen.getByRole("button", { name: /Değerlendirmeyi gönder/ }));
  await settle();
  assert.equal(screen.queryByLabelText("5 yıldız"), null, "the modal should have closed");
}

function invalidated(key: readonly unknown[]) {
  return queryClient.getQueryCache().find({ queryKey: [...key] })?.state.isInvalidated;
}

test("a submitted review invalidates every cache that shows the tutor's rating", async () => {
  seedPreReviewCaches();

  await submitAReview();

  assert.equal(
    invalidated(["tutor", TUTOR_ID]),
    true,
    "the tutor profile query was left fresh, so the page repaints the old rating"
  );
  assert.equal(
    invalidated(["tutor-reviews-infinite", TUTOR_ID]),
    true,
    "the review list was left fresh, so the student's own review is missing from it"
  );
  assert.equal(
    invalidated(["tutors", {}, 1]),
    true,
    "the directory listing was left fresh, so its card keeps the old rating"
  );
});

test("the invalidated tutor query refetches and settles on the new rating", async () => {
  seedPreReviewCaches();

  await submitAReview();

  // Opening the tutor's page again. Invalidated, it refetches — the difference
  // between showing 4.0 for five minutes and showing what the review produced.
  let refetched = false;
  const observer = new QueryObserver(queryClient, {
    queryKey: ["tutor", TUTOR_ID],
    queryFn: async () => {
      refetched = true;
      return { id: TUTOR_ID, rating: NEW_RATING };
    },
  });
  assert.equal(
    (observer.getCurrentResult().data as { rating: number }).rating,
    OLD_RATING,
    "the first paint still comes from cache, as it should"
  );

  const unsubscribe = observer.subscribe(() => {});
  await settle();

  assert.equal(refetched, true, "mounting the page did not refetch");
  assert.equal(
    (queryClient.getQueryData(["tutor", TUTOR_ID]) as { rating: number }).rating,
    NEW_RATING
  );

  unsubscribe();
  observer.destroy();
});
