import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PAYTR_FAST_POLL_WINDOW_MS,
  PAYTR_POLL_INTERVAL_MS,
  payTRPollIntervalMs,
} from "./paytrPolling";

describe("payTRPollIntervalMs", () => {
  it("asks the server every two seconds while an attempt is open", () => {
    assert.equal(PAYTR_POLL_INTERVAL_MS, 2000);
    assert.equal(
      payTRPollIntervalMs({ attemptActive: true, elapsedMs: 0 }),
      2000
    );
    assert.equal(
      payTRPollIntervalMs({ attemptActive: true, elapsedMs: 44_999 }),
      2000
    );
  });

  it("stops the fast polling after the window, without judging the payment", () => {
    assert.equal(PAYTR_FAST_POLL_WINDOW_MS, 45_000);
    assert.equal(
      payTRPollIntervalMs({ attemptActive: true, elapsedMs: 45_000 }),
      false
    );
    assert.equal(
      payTRPollIntervalMs({ attemptActive: true, elapsedMs: 600_000 }),
      false
    );
  });

  it("polls nothing when there is no attempt to wait for", () => {
    assert.equal(
      payTRPollIntervalMs({ attemptActive: false, elapsedMs: 0 }),
      false
    );
  });

  it("treats a nonsense clock reading as the start of the window", () => {
    assert.equal(
      payTRPollIntervalMs({ attemptActive: true, elapsedMs: -5_000 }),
      2000
    );
    assert.equal(
      payTRPollIntervalMs({ attemptActive: true, elapsedMs: Number.NaN }),
      2000
    );
  });
});
