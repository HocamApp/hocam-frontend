import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

let isTutor = true;
let coachingCheckoutEnabled = false;
let config = { enabled: false, has_open_requests: false, acceptance_expiry_hours: 48 };

let useTutorAcceptanceConfig: typeof import("./useTutorAcceptanceConfig").useTutorAcceptanceConfig;

before(async () => {
  mock.module("@/hooks/useAuth", {
    namedExports: { useAuth: () => ({ isAuthenticated: true, isTutor }) },
  });
  mock.module("@/hooks/useCoachingFlag", {
    namedExports: { useCoachingFlag: () => ({ checkoutEnabled: coachingCheckoutEnabled }) },
  });
  mock.module("@/lib/coachingApi", {
    namedExports: { fetchTutorAcceptanceConfig: async () => config },
  });
  ({ useTutorAcceptanceConfig } = await import("./useTutorAcceptanceConfig"));
});

beforeEach(() => {
  isTutor = true;
  coachingCheckoutEnabled = false;
  config = { enabled: false, has_open_requests: false, acceptance_expiry_hours: 48 };
});

afterEach(cleanup);

async function offered() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useTutorAcceptanceConfig(), { wrapper });
  await waitFor(() => assert.equal(result.current.isLoading, false));
  return result.current.showPackageRequests;
}

describe("when the tutor is offered \"Paket Talepleri\"", () => {
  it("is not for the retired rollout flag: lesson packages no longer wait for a tutor", async () => {
    config = { enabled: true, has_open_requests: false, acceptance_expiry_hours: 48 };

    assert.equal(await offered(), false);
  });

  it("is when a request that is already open still needs an answer", async () => {
    config = { enabled: false, has_open_requests: true, acceptance_expiry_hours: 48 };

    assert.equal(await offered(), true);
  });

  it("is when coaching checkout is open, so a bundle request could arrive", async () => {
    coachingCheckoutEnabled = true;

    assert.equal(await offered(), true);
  });

  it("is never for a student", async () => {
    isTutor = false;
    config = { enabled: true, has_open_requests: true, acceptance_expiry_hours: 48 };
    coachingCheckoutEnabled = true;

    assert.equal(await offered(), false);
  });
});
