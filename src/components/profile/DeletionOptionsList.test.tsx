import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { DeletionOptionsList } from "./DeletionOptionsList";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

afterEach(cleanup);

test("upcoming lesson blockers use the caller's canonical dashboard", () => {
  render(
    <DeletionOptionsList
      blockers={[{ code: "upcoming_lessons", message: "Yaklaşan ders var." }]}
      warnings={[]}
      onContinue={() => {}}
      upcomingLessonsHref="/dashboard/tutor?tab=bookings"
    />,
  );

  assert.equal(
    screen.getByRole("link", { name: /Derslerinizi görüntüleyin/ }).getAttribute("href"),
    "/dashboard/tutor?tab=bookings",
  );
});
