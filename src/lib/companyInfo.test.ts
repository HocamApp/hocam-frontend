import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { COMPANY, COMPANY_FIELD_LABELS, PENDING_TEXT, companyInfoMissing, companyValue } from "./companyInfo";

describe("company info", () => {
  it("labels every field the contract prints", () => {
    assert.deepEqual(Object.keys(COMPANY_FIELD_LABELS).sort(), Object.keys(COMPANY).sort());
  });

  it("prints a visible marker, never a blank, for a value nobody supplied", () => {
    for (const field of companyInfoMissing()) {
      assert.equal(companyValue(field), PENDING_TEXT);
    }
    for (const field of Object.keys(COMPANY) as (keyof typeof COMPANY)[]) {
      assert.notEqual(companyValue(field).trim(), "");
    }
  });

  it("lists what the owners still have to supply (the legal review's open list)", () => {
    // Fill a value into companyInfo.ts and this list shrinks; the contract and the
    // pre-contract form then print it. Until every entry is gone the real-money
    // launch has an open item (LEGAL_REVIEW.md, "Arda'dan gereken bilgiler").
    assert.deepEqual(companyInfoMissing(), [
      "legalName",
      "mersisNo",
      "taxId",
      "address",
      "kepAddress",
      "supportEmail",
    ]);
  });
});
