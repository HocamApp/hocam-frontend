import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  normalizePayTRPhone,
  paytrCustomerSchema,
} from "./paytrCustomerSchema";

describe("normalizePayTRPhone", () => {
  it("strips the separators Turkish numbers are usually written with", () => {
    assert.equal(normalizePayTRPhone("0555 111 22 33"), "05551112233");
    assert.equal(normalizePayTRPhone("(0555) 111-22-33"), "05551112233");
    assert.equal(normalizePayTRPhone("555.111.22.33"), "5551112233");
    assert.equal(normalizePayTRPhone("0555 111 22 33"), "05551112233");
  });

  it("keeps a single leading +, because the country code is the user's to give", () => {
    assert.equal(normalizePayTRPhone("+90 555 111 22 33"), "+905551112233");
    assert.equal(normalizePayTRPhone(" +90 (555) 111 22 33 "), "+905551112233");
  });

  it("never invents a country code for a national number", () => {
    assert.equal(normalizePayTRPhone("05551112233"), "05551112233");
    assert.equal(normalizePayTRPhone("5551112233"), "5551112233");
  });
});

describe("paytrCustomerSchema — phone", () => {
  function phoneIssue(value: string): string | undefined {
    const parsed = paytrCustomerSchema.safeParse({
      user_name: "Ada Yılmaz",
      user_address: "Bağdat Caddesi 1, Kadıköy",
      user_phone: value,
    });
    if (parsed.success) return undefined;
    return parsed.error.flatten().fieldErrors.user_phone?.[0];
  }

  it("accepts the common Turkish spellings", () => {
    for (const value of [
      "0555 111 22 33",
      "(0555) 111-22-33",
      "+90 555 111 22 33",
      "5551112233",
    ]) {
      assert.equal(phoneIssue(value), undefined, value);
    }
  });

  it("rejects letters, stray plus signs and an empty field", () => {
    assert.ok(phoneIssue("beş yüz elli beş"));
    assert.ok(phoneIssue("+90+5551112233"));
    assert.ok(phoneIssue("90+5551112233"));
    assert.ok(phoneIssue("   "));
  });

  it("rejects a number too long to send instead of silently cutting it", () => {
    const tooLong = `+${"9".repeat(20)}`;

    assert.equal(tooLong.length, 21);
    assert.ok(phoneIssue(tooLong));
  });

  it("rejects a fragment that cannot be a phone number", () => {
    assert.ok(phoneIssue("555"));
  });
});

describe("paytrCustomerSchema — name and address", () => {
  function parse(values: Record<string, string>) {
    return paytrCustomerSchema.safeParse({
      user_name: "Ada Yılmaz",
      user_address: "Bağdat Caddesi 1, Kadıköy",
      user_phone: "05551112233",
      ...values,
    });
  }

  it("measures the trimmed value at both ends of the range", () => {
    assert.equal(parse({ user_name: " A " }).success, false);
    assert.equal(parse({ user_name: "Ay" }).success, true);
    assert.equal(parse({ user_name: "A".repeat(60) }).success, true);
    assert.equal(parse({ user_name: "A".repeat(61) }).success, false);

    assert.equal(parse({ user_address: "Kadı" }).success, false);
    assert.equal(parse({ user_address: "Kadık" }).success, true);
    assert.equal(parse({ user_address: "A".repeat(400) }).success, true);
    assert.equal(parse({ user_address: "A".repeat(401) }).success, false);
  });

  it("hands the backend trimmed, normalized values", () => {
    const parsed = parse({
      user_name: "  Ada Yılmaz  ",
      user_address: "  Bağdat Caddesi 1  ",
      user_phone: " 0555 111 22 33 ",
    });

    assert.deepEqual(parsed.success && parsed.data, {
      user_name: "Ada Yılmaz",
      user_address: "Bağdat Caddesi 1",
      user_phone: "05551112233",
    });
  });

  it("speaks Turkish, in the wording the screens agreed on", () => {
    const parsed = parse({ user_name: "A", user_address: "Kad", user_phone: "x" });
    const errors = !parsed.success ? parsed.error.flatten().fieldErrors : {};

    assert.equal(errors.user_name?.[0], "Ad soyad 2–60 karakter olmalı.");
    assert.equal(errors.user_address?.[0], "Adres 5–400 karakter olmalı.");
    assert.equal(errors.user_phone?.[0], "Geçerli bir telefon numarası gir.");
  });
});
