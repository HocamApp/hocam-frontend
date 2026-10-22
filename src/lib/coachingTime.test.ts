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
  it("follows the vowel of the last word spoken: front vowels take -de/-te, back vowels -da/-ta", () => {
    // Minutes decide when there are any, and the last word is spoken first:
    // yirmi, elli, bir, iki, yedi, sekiz are front (-de) ...
    assert.equal(coachingTimeLocative("18:20"), "18:20'de");
    assert.equal(coachingTimeLocative("18:50"), "18:50'de");
    assert.equal(coachingTimeLocative("18:01"), "18:01'de");
    assert.equal(coachingTimeLocative("18:02"), "18:02'de");
    assert.equal(coachingTimeLocative("18:07"), "18:07'de");
    assert.equal(coachingTimeLocative("18:08"), "18:08'de");
    // ... on, otuz, altı, dokuz are back (-da) ...
    assert.equal(coachingTimeLocative("18:10"), "18:10'da");
    assert.equal(coachingTimeLocative("18:30"), "18:30'da");
    assert.equal(coachingTimeLocative("18:06"), "18:06'da");
    assert.equal(coachingTimeLocative("18:09"), "18:09'da");
    // ... üç, dört, beş end in a voiceless consonant after a front vowel (-te), kırk after a back one (-ta).
    assert.equal(coachingTimeLocative("18:45"), "18:45'te");
    assert.equal(coachingTimeLocative("18:03"), "18:03'te");
    assert.equal(coachingTimeLocative("18:04"), "18:04'te");
    assert.equal(coachingTimeLocative("18:40"), "18:40'ta");
  });

  it("reads the hour when the minutes are zero", () => {
    assert.equal(coachingTimeLocative("18:00"), "18:00'de"); // on sekiz
    assert.equal(coachingTimeLocative("20:00"), "20:00'de"); // yirmi
    assert.equal(coachingTimeLocative("21:00"), "21:00'de"); // yirmi bir
    assert.equal(coachingTimeLocative("12:00"), "12:00'de"); // on iki
    assert.equal(coachingTimeLocative("17:00"), "17:00'de"); // on yedi
    assert.equal(coachingTimeLocative("19:00"), "19:00'da"); // on dokuz
    assert.equal(coachingTimeLocative("16:00"), "16:00'da"); // on altı
    assert.equal(coachingTimeLocative("10:00"), "10:00'da"); // on
    assert.equal(coachingTimeLocative("09:00"), "09:00'da"); // dokuz
    assert.equal(coachingTimeLocative("00:00"), "00:00'da"); // sıfır
    assert.equal(coachingTimeLocative("15:00"), "15:00'te"); // on beş
    assert.equal(coachingTimeLocative("13:00"), "13:00'te"); // on üç
    assert.equal(coachingTimeLocative("23:00"), "23:00'te"); // yirmi üç
    assert.equal(coachingTimeLocative("04:00"), "04:00'te"); // dört
  });

  it("hands back anything that is not a clock time unchanged", () => {
    assert.equal(coachingTimeLocative("akşam"), "akşam");
  });
});
