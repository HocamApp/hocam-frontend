import assert from "node:assert/strict";
import { before, beforeEach, describe, it, mock } from "node:test";

const calls: string[] = [];
let getResponse: () => unknown = () => ({ data: { available: true, code: null } });

let api: typeof import("./checkoutAvailabilityApi");

before(async () => {
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        calls.push(url);
        return getResponse();
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  api = await import("./checkoutAvailabilityApi");
});

beforeEach(() => {
  calls.length = 0;
  getResponse = () => ({ data: { available: true, code: null } });
});

describe("the checkout availability call", () => {
  it("asks the server about the signed-in student and returns its answer", async () => {
    getResponse = () => ({ data: { available: false, code: "live_not_approved" } });

    const answer = await api.fetchCheckoutAvailability();

    assert.deepEqual(calls, ["/payments/checkout-availability/"]);
    assert.deepEqual(answer, { available: false, code: "live_not_approved" });
  });

  it("reads a 404 from an older deployment as closed", async () => {
    getResponse = () => Promise.reject({ response: { status: 404 } });

    assert.deepEqual(await api.fetchCheckoutAvailability(), {
      available: false,
      code: "checkout_disabled",
    });
  });

  it("lets any other failure through, so the screen can treat it as closed on its own", async () => {
    getResponse = () => Promise.reject({ response: { status: 500 } });

    await assert.rejects(api.fetchCheckoutAvailability());
  });
});
