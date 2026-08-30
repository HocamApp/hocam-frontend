import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, test, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

Object.defineProperty(globalThis, "self", {
  value: globalThis.window,
  configurable: true,
});
Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: (query: string) => ({
    matches: query === "(pointer: fine)",
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

let EntryDialog: React.ComponentType | null = null;

before(async () => {
  mock.module("@/hooks/useAuth", {
    namedExports: {
      useAuth: () => ({ isAuthenticated: false }),
    },
  });
  EntryDialog = (await import("./YsEntryDialog")).YsEntryDialog;
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
});

test("promo illustration gains contrast in dark mode", async () => {
  document.documentElement.classList.add("dark");
  const Dialog = EntryDialog as React.ComponentType;
  render(<Dialog />);

  fireEvent.mouseOut(document, { relatedTarget: null, clientY: -1 });
  await screen.findByRole("dialog", { name: "İlk dersin bizden" });

  const illustration = document.querySelector<HTMLImageElement>(
    'img[src*="entry-promo-illustration"]'
  );
  assert.ok(illustration, "promo illustration should render");
  assert.match(illustration.className, /dark:invert/);
});
