import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PAYTR_FAST_POLL_WINDOW_MS,
  PAYTR_POLL_INTERVAL_MS,
  payTRPollIntervalMs,
  payTRRecoveryStartedAt,
} from "./paytrPolling";

describe("payTRPollIntervalMs", () => {
  it("retains elapsed recovery time and clamps a future clock once", () => {
    const openedAt = 100_000;
    const old = payTRRecoveryStartedAt(55_000, openedAt);
    assert.equal(payTRPollIntervalMs({ attemptActive: true, elapsedMs: openedAt - old }), false);
    const future = payTRRecoveryStartedAt(200_000, openedAt);
    assert.equal(future, openedAt);
    assert.equal(payTRPollIntervalMs({ attemptActive: true, elapsedMs: 144_999 - future }), 2000);
    assert.equal(payTRPollIntervalMs({ attemptActive: true, elapsedMs: 145_000 - future }), false);
  });

  it("stops immediately on every terminal server status", () => {
    for (const purchaseStatus of ["paid", "cancelled", "refunded"]) {
      assert.equal(payTRPollIntervalMs({ attemptActive: true, elapsedMs: 1, purchaseStatus }), false);
    }
  });
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
