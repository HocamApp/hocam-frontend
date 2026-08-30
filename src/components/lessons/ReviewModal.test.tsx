import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { ReviewModal } from "./ReviewModal";
import type { Booking } from "@/types";

afterEach(() => cleanup());

test("lesson review asks for one overall score without criteria questions", () => {
  const booking = {
    id: "booking-1",
    subject: { id: "subject-1", name: "Matematik", exam_type: "TYT" },
  } as Booking;

  render(
    <ReviewModal
      booking={booking}
      isOpen
      onClose={() => {}}
      onSuccess={() => {}}
    />
  );

  assert.ok(screen.getByText("Genel puan"));
  assert.equal(screen.getAllByRole("button", { name: /yıldız$/ }).length, 5);
  for (const criterion of [
    "Anlatım Netliği",
    "Derse Hazırlık",
    "Hedefe İlerleme",
    "Güven & Motivasyon",
  ]) {
    assert.equal(screen.queryByText(criterion), null);
  }
});
