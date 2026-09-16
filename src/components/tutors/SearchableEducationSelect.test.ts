import assert from "node:assert/strict";
import test from "node:test";
import { filterEducationOptions } from "./SearchableEducationSelect";

test("education search is case-insensitive with Turkish characters", () => {
  const options = ["İstanbul Üniversitesi", "Atatürk Üniversitesi", "İzmir Ekonomi Üniversitesi"];

  assert.deepEqual(filterEducationOptions(options, "istanbul"), ["İstanbul Üniversitesi"]);
  assert.deepEqual(filterEducationOptions(options, "ATATÜRK"), ["Atatürk Üniversitesi"]);
  assert.deepEqual(filterEducationOptions(options, "izmir"), ["İzmir Ekonomi Üniversitesi"]);
});

test("typing without Turkish marks still finds the university", () => {
  // Nobody reaches for ğ/ç/ı on a phone keyboard mid-signup.
  const options = ["Boğaziçi Üniversitesi", "Çankaya Üniversitesi", "Işık Üniversitesi"];

  assert.deepEqual(filterEducationOptions(options, "bogazici"), ["Boğaziçi Üniversitesi"]);
  assert.deepEqual(filterEducationOptions(options, "cankaya"), ["Çankaya Üniversitesi"]);
  assert.deepEqual(filterEducationOptions(options, "isik"), ["Işık Üniversitesi"]);
});

test("the dotted and dotless i are the same letter to a searcher", () => {
  // The catalog used to ship "Istanbul Teknik Üniversitesi" (plain I), which
  // no Turkish spelling of the query could match.
  const options = ["İstanbul Teknik Üniversitesi", "Istanbul Teknik Üniversitesi"];

  assert.equal(filterEducationOptions(options, "istanbul").length, 2);
  assert.equal(filterEducationOptions(options, "İSTANBUL").length, 2);
});

test("matches are ranked: name start, then word start, then anywhere", () => {
  // The component also drives the department picker, where mid-word matches
  // are common ("Biyoteknoloji" for "tek").
  const options = [
    "Biyoteknoloji",
    "İstanbul Teknik Üniversitesi",
    "Tekirdağ Namık Kemal Üniversitesi",
    "Hacettepe Üniversitesi",
  ];

  assert.deepEqual(filterEducationOptions(options, "tek"), [
    "Tekirdağ Namık Kemal Üniversitesi",
    "İstanbul Teknik Üniversitesi",
    "Biyoteknoloji",
  ]);
});

test("an empty query returns everything, so the caller decides what to show", () => {
  const options = ["Ege Üniversitesi", "Boğaziçi Üniversitesi"];
  assert.deepEqual(filterEducationOptions(options, "   "), options);
});
