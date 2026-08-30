import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { ReviewCard } from "./ReviewCard";
import type { Review } from "@/types";

afterEach(() => cleanup());

test("review card shows the overall score and comment without criteria scores", () => {
  const review = {
    id: "review-1",
    rating: 5,
    clarity_rating: 5,
    preparation_rating: 4,
    progress_rating: 5,
    confidence_rating: 4,
    comment: "Ders çok verimliydi.",
    created_at: "2026-08-01T12:00:00Z",
  } as Review;

  render(<ReviewCard review={review} />);

  assert.ok(screen.getByText("Ders çok verimliydi."));
  assert.ok(screen.getByText("5.0"));
  for (const criterion of ["Anlatım", "Hazırlık", "İlerleme", "Motivasyon"]) {
    assert.equal(screen.queryByText(new RegExp(criterion)), null);
  }
});
