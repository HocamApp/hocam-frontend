import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, waitFor } from "@testing-library/react";

import { GoogleSignInButton } from "./GoogleSignInButton";

type GisCallback = (response: { credential?: string }) => void;

let renderCount = 0;
let gisCallback: GisCallback | null = null;

beforeEach(() => {
  renderCount = 0;
  gisCallback = null;
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";
  (window as unknown as { google: unknown }).google = {
    accounts: {
      id: {
        initialize: ({ callback }: { callback: GisCallback }) => {
          gisCallback = callback;
        },
        renderButton: (parent: HTMLElement) => {
          renderCount += 1;
          parent.appendChild(document.createElement("iframe"));
        },
      },
    },
  };
});

afterEach(() => {
  cleanup();
  delete (window as unknown as { google?: unknown }).google;
});

describe("GoogleSignInButton", () => {
  it("keeps the rendered button when the parent passes a new handler", async () => {
    const calls: string[] = [];
    const { rerender } = render(
      <GoogleSignInButton onCredential={(credential) => calls.push(`first:${credential}`)} />
    );
    await waitFor(() => assert.equal(renderCount, 1));

    rerender(
      <GoogleSignInButton onCredential={(credential) => calls.push(`second:${credential}`)} />
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(renderCount, 1);

    gisCallback?.({ credential: "token" });
    assert.deepEqual(calls, ["second:token"]);
  });

  it("redraws on resize only when the available width changes", async () => {
    const { container } = render(<GoogleSignInButton onCredential={() => {}} />);
    await waitFor(() => assert.equal(renderCount, 1));

    // Same width, e.g. iOS Safari collapsing its toolbar while scrolling.
    window.dispatchEvent(new window.Event("resize"));
    await new Promise((resolve) => setTimeout(resolve, 200));
    assert.equal(renderCount, 1);

    const slot = container.querySelector("iframe")?.parentElement as HTMLElement;
    Object.defineProperty(slot, "clientWidth", { value: 280, configurable: true });
    window.dispatchEvent(new window.Event("resize"));
    await waitFor(() => assert.equal(renderCount, 2), { timeout: 1000 });
  });

  it("reserves a fixed-height slot so nothing below moves while it loads", () => {
    const { container } = render(<GoogleSignInButton onCredential={() => {}} />);
    const slot = container.firstElementChild as HTMLElement;
    assert.match(slot.className, /\bh-11\b/);
  });
});
