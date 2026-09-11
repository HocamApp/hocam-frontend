import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatCountdown, secondsUntil } from "./verificationChallenge";

describe("doğrulama sayacı", () => {
  it("sunucu bitiş zamanından kalan saniyeyi hesaplar ve sıfırın altına inmez", () => {
    assert.equal(secondsUntil("2026-09-11T12:02:00.000Z", Date.parse("2026-09-11T12:00:30.000Z")), 90);
    assert.equal(secondsUntil("2026-09-11T12:00:00.000Z", Date.parse("2026-09-11T12:00:01.000Z")), 0);
  });

  it("kalan süreyi dakika ve saniye biçiminde gösterir", () => {
    assert.equal(formatCountdown(90), "01:30");
    assert.equal(formatCountdown(0), "00:00");
  });
});
