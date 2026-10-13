import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, mock, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";

let asked = 0;

mock.module("@/lib/featureFlags", { namedExports: { PAYTR_ENABLED: false } });
mock.module("@/hooks/useAuth", {
  namedExports: { useAuth: () => ({ isAuthenticated: true, user: { id: "student-1" } }) },
});
mock.module("@/lib/checkoutAvailabilityApi", {
  namedExports: {
    fetchCheckoutAvailability: async () => {
      asked += 1;
      return { available: true, code: null };
    },
  },
});

let useCheckoutAvailability: typeof import("./useCheckoutAvailability").useCheckoutAvailability;

before(async () => {
  useCheckoutAvailability = (await import("./useCheckoutAvailability")).useCheckoutAvailability;
});

afterEach(cleanup);

function Probe() {
  const result = useCheckoutAvailability();
  return <output data-testid="result">{JSON.stringify(result)}</output>;
}

test("with the build flag off, as in production today, nothing is asked and it is off", async () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Probe />
    </QueryClientProvider>,
  );
  await new Promise((resolve) => setTimeout(resolve, 30));

  const result = JSON.parse(screen.getByTestId("result").textContent ?? "{}");
  assert.equal(result.state, "off");
  assert.equal(result.open, false);
  assert.equal(asked, 0);
});
