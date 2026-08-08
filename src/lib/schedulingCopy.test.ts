import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COACHING_DAY_LABEL,
  RESCHEDULE_STATUS_COPY,
  TIME_REQUEST_STATUS_COPY,
} from "./coachingApi";

describe("COACHING_DAY_LABEL", () => {
  it("covers every weekday 0..6 with the backend's Monday=0 convention", () => {
    for (let day = 0; day <= 6; day += 1) {
      assert.ok(COACHING_DAY_LABEL[day], `missing label for day ${day}`);
    }
    assert.equal(COACHING_DAY_LABEL[0], "Pazartesi");
    assert.equal(COACHING_DAY_LABEL[6], "Pazar");
  });
});

describe("TIME_REQUEST_STATUS_COPY and RESCHEDULE_STATUS_COPY", () => {
  it("never claims money moved — no provider is connected", () => {
    const forbidden = ["Ödendi", "İade edildi", "Para çekildi", "Hakediş oluştu"];
    const allCopy = [
      ...Object.values(TIME_REQUEST_STATUS_COPY),
      ...Object.values(RESCHEDULE_STATUS_COPY),
    ];
    for (const copy of allCopy) {
      for (const phrase of forbidden) {
        assert.ok(
          !copy.includes(phrase),
          `"${copy}" must not contain "${phrase}" — no payment provider is connected`
        );
      }
    }
  });

  it("describes an unresolved time request as unresolved, not as a payment outcome", () => {
    assert.match(TIME_REQUEST_STATUS_COPY.unresolved, /bulunamadı/i);
  });
});
