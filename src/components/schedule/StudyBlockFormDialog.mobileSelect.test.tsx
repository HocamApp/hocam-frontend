import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, mock, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

mock.module("@/lib/tutorsApi", {
  namedExports: {
    fetchSubjects: async () => [],
  },
});

let StudyBlockFormDialog: typeof import("./StudyBlockFormDialog").StudyBlockFormDialog;

before(async () => {
  StudyBlockFormDialog = (
    await import("./StudyBlockFormDialog")
  ).StudyBlockFormDialog;
});

afterEach(() => cleanup());

test("mobile study block form uses native pickers inside its dialog", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <StudyBlockFormDialog
        open
        onOpenChange={() => {}}
        defaultDate={new Date(2026, 8, 2)}
        onSubmit={() => {}}
      />
    </QueryClientProvider>,
  );

  const subjectPicker = screen.getByRole("combobox", { name: "Ders" });
  assert.equal(subjectPicker.tagName, "SELECT");
});
