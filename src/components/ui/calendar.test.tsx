import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach } from "node:test";
import { test } from "node:test";
import { cleanup, render } from "@testing-library/react";

import { Calendar } from "./calendar";

afterEach(() => cleanup());

test("responsive calendar keeps phone cells compact and restores large cells at sm", () => {
  const { container } = render(
    <Calendar mode="single" size="responsive" defaultMonth={new Date(2026, 8, 1)} />,
  );

  const weekday = container.querySelector("th");
  const day = container.querySelector("td");
  assert.match(weekday?.className ?? "", /size-9 sm:size-14/);
  assert.match(weekday?.className ?? "", /text-xs sm:text-sm/);
  assert.match(day?.className ?? "", /size-9 sm:size-14/);
  assert.match(day?.className ?? "", /text-sm sm:text-base/);
});
