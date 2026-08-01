import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

Object.defineProperty(globalThis, "self", {
  value: window,
  configurable: true,
});

mock.module("next/navigation", {
  namedExports: {
    useRouter: () => ({ back: () => {}, push: () => {} }),
  },
});

afterEach(() => cleanup());

test("aligns the back control and brand without a decorative header band", async () => {
  const { MinimalCheckoutHeader } = await import("./MinimalCheckoutHeader");
  render(<MinimalCheckoutHeader tutorId="tutor-1" />);

  const header = screen.getByRole("banner");
  const back = screen.getByRole("button", { name: "Hoca profiline dön" });
  const brand = screen.getByRole("link", { name: "Hocam ana sayfa" });

  assert.ok(back.classList.contains("size-10"));
  assert.ok(brand.classList.contains("h-10"));
  assert.equal(header.querySelector(":scope > div[aria-hidden='true']"), null);
});
