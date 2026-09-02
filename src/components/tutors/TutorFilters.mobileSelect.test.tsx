import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, mock, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { TutorFilters as TutorFiltersType } from "@/lib/tutorsApi";

mock.module("@/lib/tutorsApi", {
  namedExports: {
    fetchTeachingAttributes: async () => [],
  },
});
mock.module("@/lib/learningApi", {
  namedExports: {
    fetchLearningTopics: async () => [],
  },
});

let TutorFilters: typeof import("./TutorFilters").TutorFilters;

before(async () => {
  TutorFilters = (await import("./TutorFilters")).TutorFilters;
});

afterEach(() => cleanup());

test("mobile tutor filters use a native picker and emit one change", () => {
  const changes: TutorFiltersType[] = [];
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <TutorFilters
        filters={{}}
        subjects={[]}
        onFiltersChange={(filters) => changes.push(filters)}
        onClear={() => {}}
        isLoading={false}
      />
    </QueryClientProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Filtrele" }));
  const examPicker = screen.getByRole("combobox", { name: "Sınav" });
  assert.equal(examPicker.tagName, "SELECT");

  fireEvent.change(examPicker, { target: { value: "TYT" } });
  assert.equal(changes.length, 1);
  assert.equal(changes[0]?.exam_type, "TYT");
});
