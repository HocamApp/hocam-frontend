import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  coachingDateLabel,
  coachingDateTimeLabel,
  coachingLocalDateHeading,
  coachingTimeLabel,
  coachingTimeLocative,
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

describe("coachingTimeLocative", () => {
  it("picks -de or -te from how the clock time is spoken, last word first", () => {
    // Minutes decide when there are any: yirmi, otuz, elli, on, bir, iki, altı...
    assert.equal(coachingTimeLocative("18:20"), "18:20'de");
    assert.equal(coachingTimeLocative("18:30"), "18:30'de");
    assert.equal(coachingTimeLocative("18:50"), "18:50'de");
    assert.equal(coachingTimeLocative("18:10"), "18:10'de");
    assert.equal(coachingTimeLocative("18:06"), "18:06'de");
    assert.equal(coachingTimeLocative("18:01"), "18:01'de");
    // ... except kırk and the numbers ending in üç, dört, beş.
    assert.equal(coachingTimeLocative("18:40"), "18:40'te");
    assert.equal(coachingTimeLocative("18:45"), "18:45'te");
    assert.equal(coachingTimeLocative("18:03"), "18:03'te");
    assert.equal(coachingTimeLocative("18:04"), "18:04'te");
  });

  it("reads the hour when the minutes are zero", () => {
    assert.equal(coachingTimeLocative("18:00"), "18:00'de"); // on sekiz
    assert.equal(coachingTimeLocative("20:00"), "20:00'de"); // yirmi
    assert.equal(coachingTimeLocative("00:00"), "00:00'de"); // sıfır
    assert.equal(coachingTimeLocative("15:00"), "15:00'te"); // on beş
    assert.equal(coachingTimeLocative("13:00"), "13:00'te"); // on üç
    assert.equal(coachingTimeLocative("23:00"), "23:00'te"); // yirmi üç
    assert.equal(coachingTimeLocative("04:00"), "04:00'te"); // dört
  });

  it("hands back anything that is not a clock time unchanged", () => {
    assert.equal(coachingTimeLocative("akşam"), "akşam");
  });
});
