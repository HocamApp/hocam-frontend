import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { DiscoveryConsentStatus } from "@/lib/discovery";

let currentStatus: DiscoveryConsentStatus = "unset";
let collectionEnabled = true;
const choices: boolean[] = [];

mock.module("next/link", {
  defaultExport: React.forwardRef<
    HTMLAnchorElement,
    { href: string; children?: React.ReactNode }
  >(function MockLink({ href, children, ...rest }, ref) {
    return React.createElement("a", { href, ref, ...rest }, children);
  }),
});
mock.module("@/lib/discovery", {
  namedExports: {
    getDiscoveryConsent: async () => ({
      status: currentStatus,
      policy_version: "kvkk-analytics-v1",
      collection_enabled: collectionEnabled,
    }),
    setDiscoveryConsent: async (granted: boolean) => {
      choices.push(granted);
      currentStatus = granted ? "granted" : "denied";
      return { status: currentStatus };
    },
  },
});

let DiscoveryConsentBanner: React.ComponentType | null = null;

beforeEach(async () => {
  if (!DiscoveryConsentBanner) {
    DiscoveryConsentBanner = (await import("./DiscoveryConsentBanner"))
      .DiscoveryConsentBanner;
  }
  currentStatus = "unset";
  collectionEnabled = true;
  choices.length = 0;
});

afterEach(() => cleanup());

function renderBanner() {
  const Component = DiscoveryConsentBanner as React.ComponentType;
  return render(<Component />);
}

describe("discovery consent banner", () => {
  it("offers equally direct reject and allow actions when consent is unset", async () => {
    renderBanner();

    const reject = await screen.findByRole("button", { name: "Reddet" });
    const allow = screen.getByRole("button", { name: "İzin ver" });

    assert.equal((reject as HTMLButtonElement).disabled, false);
    assert.equal((allow as HTMLButtonElement).disabled, false);
  });

  it("records rejection without granting analytics", async () => {
    renderBanner();

    fireEvent.click(await screen.findByRole("button", { name: "Reddet" }));

    await waitFor(() => assert.deepEqual(choices, [false]));
    await waitFor(() =>
      assert.equal(screen.queryByRole("button", { name: "İzin ver" }), null)
    );
  });

  it("records explicit approval", async () => {
    renderBanner();

    fireEvent.click(await screen.findByRole("button", { name: "İzin ver" }));

    await waitFor(() => assert.deepEqual(choices, [true]));
  });

  it("does not prompt when collection is disabled", async () => {
    collectionEnabled = false;
    renderBanner();

    await waitFor(() =>
      assert.equal(
        screen.queryByText("Hocam’ı geliştirmemize yardımcı olur musun?"),
        null
      )
    );
    assert.deepEqual(choices, []);
  });
});
