import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { bookingDateTimeLabel } from "./bookingTime";
import { instantDateLabel, instantDateTimeLabel, instantTimeLabel } from "./instantTime";

describe("instant labels", () => {
  it("draws an instant in Istanbul time whatever offset it arrives with", () => {
    // 15:00 UTC is 18:00 in Istanbul (UTC+3).
    assert.equal(instantTimeLabel("2026-10-12T15:00:00+00:00"), "18:00");
    assert.equal(instantTimeLabel("2026-10-12T15:00:00Z"), "18:00");
    assert.equal(instantTimeLabel("2026-10-12T18:00:00+03:00"), "18:00");
    assert.equal(instantDateTimeLabel("2026-10-12T15:00:00+00:00"), "12 Ekim Pazartesi 18:00");
  });

  it("does not slip a day near midnight", () => {
    // 22:30 UTC on the 11th is 01:30 on the 12th in Istanbul.
    assert.equal(instantDateLabel("2026-10-11T22:30:00Z"), "12 Ekim 2026");
  });

  it("says so instead of printing Invalid Date", () => {
    assert.equal(instantDateTimeLabel("not-a-date"), "Tarih bilgisi alınamadı");
    assert.equal(instantDateLabel(""), "Tarih bilgisi alınamadı");
    assert.equal(instantTimeLabel("nope"), "Saat bilgisi alınamadı");
  });

  it("is the other helper that must not be used for a booking's start_time", () => {
    // A booking's start_time carries Istanbul digits under a UTC label: the
    // lesson at 18:00 arrives as 18:00Z. The booking helper reads the digits
    // as Istanbul time; this one reads the label, and says 21:00.
    assert.equal(bookingDateTimeLabel("2026-10-12T18:00:00Z"), "12 Ekim Pazartesi 18:00");
    assert.equal(instantDateTimeLabel("2026-10-12T18:00:00Z"), "12 Ekim Pazartesi 21:00");
  });
});
