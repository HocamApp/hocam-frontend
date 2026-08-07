import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ACCEPTANCE_STATUS_COPY, acceptanceStatusCopy } from "./coachingApi";

describe("acceptanceStatusCopy", () => {
  it("describes each status honestly", () => {
    assert.match(acceptanceStatusCopy("pending"), /bekleniyor/i);
    assert.match(acceptanceStatusCopy("accepted"), /kabul etti/i);
    assert.match(acceptanceStatusCopy("accepted"), /aktivasyonu bekleniyor/i);
    assert.match(acceptanceStatusCopy("rejected"), /kabul etmedi/i);
    assert.match(acceptanceStatusCopy("expired"), /süresi doldu/i);
    assert.match(acceptanceStatusCopy("cancelled"), /iptal edildi/i);
  });

  it("falls back rather than inventing a status", () => {
    assert.equal(acceptanceStatusCopy("nonsense"), "Talep durumu bilinmiyor");
  });

  it("never claims money moved", () => {
    // No payment provider is connected, so no status may read as a
    // completed payment, refund, payout or earning.
    const forbidden = [
      "Ödendi",
      "İade edildi",
      "Para çekildi",
      "Hakediş oluştu",
    ];
    for (const copy of Object.values(ACCEPTANCE_STATUS_COPY)) {
      for (const phrase of forbidden) {
        assert.equal(
          copy.includes(phrase),
          false,
          `"${copy}" must not contain "${phrase}"`
        );
      }
    }
  });
});
