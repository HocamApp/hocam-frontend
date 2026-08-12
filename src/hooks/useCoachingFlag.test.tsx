import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, mock, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

process.env.NEXT_PUBLIC_COACHING_ENABLED = "true";

let fetchFlag: () => Promise<{ enabled: boolean; checkout_enabled: boolean }>;

mock.module("@/hooks/useAuth", {
  namedExports: {
    useAuth: () => ({ isAuthenticated: true }),
  },
});

mock.module("@/lib/coachingApi", {
  namedExports: {
    fetchCoachingFlag: () => fetchFlag(),
  },
});

let useCoachingFlag: typeof import("./useCoachingFlag").useCoachingFlag;

before(async () => {
  useCoachingFlag = (await import("./useCoachingFlag")).useCoachingFlag;
});

function Probe() {
  const flag = useCoachingFlag();
  return <output data-testid="flag">{JSON.stringify(flag)}</output>;
}

function renderProbe() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}><Probe /></QueryClientProvider>);
}

function readFlag() {
  return JSON.parse(screen.getByTestId("flag").textContent ?? "{}") as Record<string, unknown>;
}

afterEach(cleanup);

test("keeps checkout state unknown while the authenticated runtime flag is loading", () => {
  fetchFlag = () => new Promise(() => {});

  renderProbe();

  const flag = readFlag();
  assert.equal(flag.checkoutEnabled, false);
  assert.equal(flag.checkoutState, "loading");
});

test("reports enabled and disabled checkout as resolved states", async () => {
  fetchFlag = async () => ({ enabled: true, checkout_enabled: true });
  const rendered = renderProbe();
  await waitFor(() => assert.equal(readFlag().checkoutState, "enabled"));

  rendered.unmount();
  fetchFlag = async () => ({ enabled: true, checkout_enabled: false });
  renderProbe();
  await waitFor(() => assert.equal(readFlag().checkoutState, "disabled"));
});

test("does not turn a failed runtime flag request into a resolved disabled state", async () => {
  fetchFlag = async () => {
    throw new Error("flag unavailable");
  };

  renderProbe();

  await waitFor(() => assert.equal(readFlag().checkoutState, "error"));
});
