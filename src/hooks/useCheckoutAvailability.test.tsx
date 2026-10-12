import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, mock, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

import type { CheckoutAvailability } from "@/types";

let auth: { isAuthenticated: boolean; user: { id: string } | null };
let answer: () => Promise<CheckoutAvailability>;
let asked = 0;

mock.module("@/lib/featureFlags", { namedExports: { PAYTR_ENABLED: true } });
mock.module("@/hooks/useAuth", { namedExports: { useAuth: () => auth } });
mock.module("@/lib/checkoutAvailabilityApi", {
  namedExports: {
    fetchCheckoutAvailability: () => {
      asked += 1;
      return answer();
    },
  },
});

let useCheckoutAvailability: typeof import("./useCheckoutAvailability").useCheckoutAvailability;

before(async () => {
  useCheckoutAvailability = (await import("./useCheckoutAvailability")).useCheckoutAvailability;
});

beforeEach(() => {
  auth = { isAuthenticated: true, user: { id: "student-1" } };
  answer = async () => ({ available: true, code: null });
  asked = 0;
});

afterEach(cleanup);

function Probe() {
  const result = useCheckoutAvailability();
  return <output data-testid="result">{JSON.stringify(result)}</output>;
}

function read() {
  return JSON.parse(screen.getByTestId("result").textContent ?? "{}") as {
    state: string;
    open: boolean;
    loading: boolean;
    code: string | null;
  };
}

function renderProbe(client = new QueryClient()) {
  const view = render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return { client, ...view };
}

test("a visitor who is not signed in sees it closed, and nothing is asked", () => {
  auth = { isAuthenticated: false, user: null };

  renderProbe();

  assert.deepEqual(read(), { state: "closed", open: false, loading: false, code: null });
  assert.equal(asked, 0);
});

test("a signed-in student is not told it is open before the server has answered", () => {
  answer = () => new Promise(() => {});

  renderProbe();

  assert.equal(read().state, "loading");
  assert.equal(read().open, false);
});

test("it is open when the server says it is open for this student", async () => {
  renderProbe();

  await waitFor(() => assert.equal(read().state, "open"));
  assert.equal(read().open, true);
});

test("it is closed, with the reason, when the server says it is not open for this student", async () => {
  answer = async () => ({ available: false, code: "checkout_disabled" });

  renderProbe();

  await waitFor(() => assert.equal(read().state, "closed"));
  assert.equal(read().code, "checkout_disabled");
});

test("a failed request is closed, never open", async () => {
  answer = async () => {
    throw new Error("Network Error");
  };

  renderProbe();

  await waitFor(() => assert.equal(read().state, "closed"));
  assert.equal(read().open, false);
});

test("one student's answer is never read by the next person who signs in", async () => {
  const client = new QueryClient();
  const first = renderProbe(client);
  await waitFor(() => assert.equal(read().state, "open"));
  first.unmount();

  auth = { isAuthenticated: true, user: { id: "student-2" } };
  answer = async () => ({ available: false, code: "checkout_disabled" });
  renderProbe(client);

  // Never "open" from the first student's cached answer, not even for a moment.
  assert.notEqual(read().state, "open");
  await waitFor(() => assert.equal(read().state, "closed"));
});

test("it asks again each time a screen that needs it appears, so a change shows at once", async () => {
  const client = new QueryClient();
  const first = renderProbe(client);
  await waitFor(() => assert.equal(read().state, "open"));
  first.unmount();
  assert.equal(asked, 1);

  answer = async () => ({ available: false, code: "checkout_disabled" });
  renderProbe(client);

  await waitFor(() => assert.equal(read().state, "closed"));
  assert.equal(asked, 2);
});
