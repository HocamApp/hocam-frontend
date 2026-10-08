import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  coachingDateLabel,
  coachingDateTimeLabel,
  coachingLocalDateHeading,
  coachingTimeLabel,
} from "./coachingTime";

describe("coaching time labels", () => {
  it("draws an instant in Istanbul time whatever the input offset", () => {
    // 15:00 UTC is 18:00 in Istanbul (UTC+3).
    assert.equal(coachingTimeLabel("2026-10-12T15:00:00Z"), "18:00");
    assert.equal(coachingDateTimeLabel("2026-10-12T15:00:00Z"), "12 Ekim Pazartesi 18:00");
  });

  it("does not slip a day near midnight", () => {
    // 22:30 UTC on the 11th is 01:30 on the 12th in Istanbul.
    assert.equal(coachingDateLabel("2026-10-11T22:30:00Z"), "12 Ekim 2026");
  });

  it("reads a bare local date as that Istanbul day", () => {
    assert.equal(coachingLocalDateHeading("2026-10-14"), "14 Ekim Çarşamba");
  });

  it("says so instead of printing Invalid Date", () => {
    assert.equal(coachingDateTimeLabel("not-a-date"), "Tarih bilgisi alınamadı");
  });
});
