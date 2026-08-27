import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { ReviewSummary } from "./ReviewSummary";
import type { TutorReviewSummary } from "@/types";

Object.defineProperty(globalThis, "IntersectionObserver", {
  configurable: true,
  value: class IntersectionObserverMock {
    readonly root = null;
    readonly rootMargin = "0px";
    readonly thresholds = [0];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  },
});

afterEach(() => cleanup());

const summary: TutorReviewSummary = {
  overall_rating: 4.8,
  review_count: 6,
  criteria_ratings: {
    clarity: { label: "Anlatım Netliği", average: 4.8, count: 6 },
    preparation: { label: "Derse Hazırlık", average: 4.7, count: 6 },
    progress: { label: "Hedefe İlerleme", average: 4.9, count: 6 },
    confidence: { label: "Güven & Motivasyon", average: 4.8, count: 6 },
  },
  subject_ratings: [],
};

test("shows only the four criteria summaries, without a duplicate overall summary", () => {
  render(<ReviewSummary summary={summary} />);

  assert.equal(screen.queryByText("Genel değerlendirme"), null);
  assert.equal(screen.queryByText("6 öğrenci değerlendirmesi"), null);

  for (const label of ["Anlatım", "Hazırlık", "İlerleme", "Motivasyon"]) {
    assert.ok(screen.getByText(label));
  }
});
