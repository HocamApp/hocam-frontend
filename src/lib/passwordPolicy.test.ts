import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluatePassword, passwordSchema } from "./passwordPolicy";

describe("yeni şifre politikası", () => {
  it("8 karakter, büyük-küçük harf ve sayı veya sembol ister", () => {
    assert.equal(passwordSchema.safeParse("Güvenli9").success, true);
    assert.equal(passwordSchema.safeParse("Güvenli!").success, true);
    assert.equal(passwordSchema.safeParse("güvenli9").success, false);
    assert.equal(passwordSchema.safeParse("GÜVENLİ9").success, false);
    assert.equal(passwordSchema.safeParse("GüvenliX").success, false);
    assert.equal(passwordSchema.safeParse("Güven7").success, false);
  });

  it("boşluğu sembol saymaz ve 128 karakter üstünü reddeder", () => {
    assert.equal(passwordSchema.safeParse("Güvenli ").success, false);
    assert.equal(passwordSchema.safeParse(`Güvenli9${"a".repeat(121)}`).success, false);
  });

  it("Türkçe harfleri büyük ve küçük harf olarak değerlendirir", () => {
    const result = evaluatePassword("İstanbul9");
    assert.equal(result.rules.every((rule) => rule.met), true);
  });
});
