import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";

import { TutorCoachingSection } from "./TutorCoachingSection";

Object.defineProperty(globalThis, "requestAnimationFrame", {
  value: (callback: FrameRequestCallback) => setTimeout(callback, 0),
  configurable: true,
});
Object.defineProperty(globalThis, "cancelAnimationFrame", {
  value: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
  configurable: true,
});

afterEach(cleanup);

test("renders the public Coaching section from a present coaching summary", () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TutorCoachingSection
        tutorId="tutor-1"
        isStudent={false}
        checkoutEnabled={false}
        checkoutHref="/tutors/tutor-1/checkout"
        coaching={{
          frequency: "weekly",
          session_duration_minutes: 30,
          price_per_session_minor: 30000,
          price_per_session_display: "300,00 ₺",
          is_free: false,
          target_exam_types: ["DGS"],
          description: "Haftalık çalışma takibi.",
          is_accepting_new_students: true,
        }}
      />
    </QueryClientProvider>
  );

  assert.ok(screen.getByRole("heading", { name: "Çalışma Koçluğu" }));
  assert.ok(screen.getByText("DGS"));
});
