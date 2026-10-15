import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { describePurchaseError } from "./purchaseErrors";

const failure = (status: number, data: unknown) => ({ response: { status, data } });
const FALLBACK = "Paket talebi oluşturulamadı. Lütfen tekrar deneyin.";

describe("describing a refused purchase", () => {
  it("sends every schedule refusal back to the hours, with our own sentence", () => {
    for (const code of [
      "schedule_taken",
      "schedule_unavailable",
      "schedule_overlap",
      "schedule_invalid",
      "schedule_count_mismatch",
      "schedule_subject_invalid",
    ]) {
      const error = describePurchaseError(failure(409, { code, detail: "SERVER TEXT" }), FALLBACK);
      assert.equal(error.kind, "schedule", code);
      assert.match(error.message, /Ders saatlerini yeniden seç/);
      assert.doesNotMatch(error.message, /SERVER TEXT/);
    }
  });

  it("asks for the hours when there are none", () => {
    const error = describePurchaseError(failure(409, { code: "schedule_required" }), FALLBACK);
    assert.equal(error.kind, "schedule");
    assert.equal(error.message, "Önce ders programını seçmen gerekiyor.");
  });

  it("points to the purchase that is already waiting for its payment", () => {
    const error = describePurchaseError(
      failure(409, { code: "pending_purchase_exists", purchase_id: "p-1" }),
      FALLBACK
    );
    assert.equal(error.kind, "pending_exists");
    assert.equal(error.purchaseId, "p-1");
    assert.match(error.message, /Onu tamamla ya da iptal et/);
  });

  it("tells a full tutor from places held by other checkouts", () => {
    const held = describePurchaseError(
      failure(409, { code: "capacity_full", reserved_by_others: true }),
      FALLBACK
    );
    const full = describePurchaseError(
      failure(409, { code: "capacity_full", reserved_by_others: false }),
      FALLBACK
    );
    assert.match(held.message, /Birkaç dakika sonra tekrar dene/);
    assert.match(full.message, /yeni öğrenci almıyor/);
    assert.equal(held.kind, "capacity_full");
    assert.equal(full.kind, "capacity_full");
  });

  it("says online payment is not open, whichever way the server puts it", () => {
    for (const code of ["checkout_disabled", "live_not_approved", "policy_acceptance_disabled"]) {
      const error = describePurchaseError(failure(503, { code }), FALLBACK);
      assert.equal(error.kind, "checkout_disabled", code);
      assert.match(error.message, /Ödeme sistemi henüz açılmadı/);
    }
  });

  it("carries the current version of the rules for the two policy refusals", () => {
    const missing = describePurchaseError(
      failure(409, { code: "policy_not_accepted", policy_version: "p-abc" }),
      FALLBACK
    );
    const stale = describePurchaseError(
      failure(409, { code: "policy_version_changed", policy_version: "p-def" }),
      FALLBACK
    );
    assert.deepEqual([missing.kind, missing.policyVersion], ["policy_not_accepted", "p-abc"]);
    assert.deepEqual([stale.kind, stale.policyVersion], ["policy_version_changed", "p-def"]);
  });

  it("calls a lost answer unknown and tells the student to look before trying again", () => {
    const error = describePurchaseError(new Error("Network Error"), FALLBACK);
    assert.equal(error.kind, "unknown_outcome");
    assert.match(error.message, /Yeniden denemeden önce Paketlerim sayfasında/);
  });

  it("leaves anything it does not know to the caller's own sentence", () => {
    assert.equal(describePurchaseError(failure(500, "<html>"), FALLBACK).message, FALLBACK);
    assert.equal(describePurchaseError(failure(400, { detail: "x" }), FALLBACK).kind, "other");
    assert.equal(describePurchaseError(failure(409, { code: "brand_new" }), FALLBACK).kind, "other");
  });

  it("never carries an exclamation mark, an em dash or an emoji", () => {
    const codes = [
      "schedule_taken",
      "schedule_required",
      "pending_purchase_exists",
      "capacity_full",
      "tutor_unavailable",
      "checkout_disabled",
      "policy_not_accepted",
      "policy_version_changed",
    ];
    const emoji = new RegExp("\\p{Extended_Pictographic}", "u");
    const texts = codes.map((code) => describePurchaseError(failure(409, { code }), FALLBACK).message);
    texts.push(describePurchaseError(new Error("x"), FALLBACK).message);
    for (const text of texts) {
      assert.doesNotMatch(text, /!/, text);
      assert.doesNotMatch(text, /—/, text);
      assert.doesNotMatch(text, emoji, text);
    }
  });
});
