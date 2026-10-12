import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { RefundBlockedReason, RefundRequestReason } from "@/types";

import {
  REFUND_ENTRY,
  REFUND_LIST,
  REFUND_PAGES,
  REFUND_PREVIEW_STEP,
  REFUND_REASON_OPTIONS,
  REFUND_REASON_STEP,
  REFUND_STATUS_LABEL,
  REFUND_STATUS_VIEW,
  SLOT_CONFLICT_OPTION,
  answerWithinSentence,
  blockedReasonText,
  deductionExplanation,
  previewValiditySentence,
  refundErrorText,
  refundReasonLabel,
  refundStatusLabel,
  unscheduledSentence,
  usedLessonNote,
  whatHappensNext,
} from "./refundCopy";

// A constructor, not a literal: the project compiles to a target that has no
// regular expression "u" flag in its literals.
const EMOJI = new RegExp("\\p{Extended_Pictographic}", "u");

/** Every sentence the copy module can produce, with representative arguments. */
function everySentence(): string[] {
  const out: string[] = [];
  const collect = (value: unknown) => {
    if (typeof value === "string") out.push(value);
    else if (typeof value === "function") return;
    else if (value && typeof value === "object") Object.values(value).forEach(collect);
  };
  [
    REFUND_ENTRY,
    REFUND_LIST,
    REFUND_PAGES,
    REFUND_PREVIEW_STEP,
    REFUND_REASON_OPTIONS,
    REFUND_REASON_STEP,
    REFUND_STATUS_LABEL,
    REFUND_STATUS_VIEW,
    SLOT_CONFLICT_OPTION,
  ].forEach(collect);

  out.push(REFUND_ENTRY.openLead("İnceleniyor"));
  for (const days of [0, 14]) out.push(answerWithinSentence(days));
  out.push(previewValiditySentence(15), deductionExplanation(2, "850 ₺"), unscheduledSentence(4));
  for (const reason of ["voluntary", "tutor_issue", "technical", "other", "slot_conflict"] as const) {
    out.push(...whatHappensNext(14, reason));
  }
  for (const why of [
    "lesson_taken",
    "cancelled_late",
    "confirmed_and_due",
    "starts_within_the_window",
    "something_else",
  ]) {
    out.push(usedLessonNote(why, 12));
  }
  for (const code of [
    "already_refunded",
    "not_paid",
    "refund_in_progress",
    "reason_not_applicable",
    "nothing_to_refund",
    "unheard_of",
  ]) {
    out.push(blockedReasonText(code));
  }
  for (const kind of [
    "changed",
    "in_progress",
    "blocked",
    "token",
    "invalid",
    "unavailable",
    "throttled",
    "unknown",
  ] as const) {
    out.push(refundErrorText(kind, "preview"), refundErrorText(kind, "submit"));
  }
  return out;
}

describe("refund copy follows DESIGN.md", () => {
  const sentences = everySentence();

  it("has plenty to check", () => {
    assert.ok(sentences.length > 60, String(sentences.length));
  });

  it("uses no em dash, no exclamation mark and no emoji", () => {
    for (const text of sentences) {
      assert.doesNotMatch(text, /—/, `em dash: ${text}`);
      assert.doesNotMatch(text, /!/, `exclamation mark: ${text}`);
      assert.doesNotMatch(text, EMOJI, `emoji: ${text}`);
    }
  });

  it("keeps the register to 'sen' (no 'siz' forms)", () => {
    for (const text of sentences) {
      assert.doesNotMatch(text, /\b(talebiniz|hesabınız|paketiniz|yapabilirsiniz|görebilirsiniz)\b/i, text);
    }
  });

  it("has no stray spacing", () => {
    for (const text of sentences) {
      assert.equal(text, text.trim(), `outer space: "${text}"`);
      assert.doesNotMatch(text, / {2}/, `double space: "${text}"`);
    }
  });

  it("never promises a number of days for the money to arrive", () => {
    for (const text of sentences) {
      assert.doesNotMatch(text, /iş günü/i, text);
    }
  });

  it("writes the answer deadline only in terms of the team's reply", () => {
    assert.match(answerWithinSentence(14), /en geç 14 gün içinde yanıt verir/);
    assert.doesNotMatch(answerWithinSentence(0), /\d/);
  });
});

describe("reasons and statuses", () => {
  it("offers the four everyday reasons, and slot_conflict only on its own", () => {
    assert.deepEqual(
      REFUND_REASON_OPTIONS.map((option) => option.value),
      ["voluntary", "tutor_issue", "technical", "other"]
    );
    assert.equal(SLOT_CONFLICT_OPTION.value, "slot_conflict");
  });

  it("names every reason a request can carry", () => {
    const reasons: RefundRequestReason[] = [
      "voluntary",
      "tutor_issue",
      "technical",
      "other",
      "slot_conflict",
      "plan_expired_leftover",
      "tutor_left",
      "verification_revoked",
      "service_failure",
    ];
    for (const reason of reasons) {
      assert.notEqual(refundReasonLabel(reason), "Belirtilmedi", reason);
    }
    assert.equal(refundReasonLabel("brand_new"), "Belirtilmedi");
  });

  it("labels the four statuses", () => {
    assert.equal(refundStatusLabel("requested"), "İnceleniyor");
    assert.equal(refundStatusLabel("approved"), "Onaylandı");
    assert.equal(refundStatusLabel("rejected"), "Reddedildi");
    assert.equal(refundStatusLabel("processed"), "İade edildi");
    assert.equal(refundStatusLabel("unheard_of"), "unheard_of");
  });

  it("explains every reason a package cannot be refunded", () => {
    const codes: RefundBlockedReason[] = [
      "already_refunded",
      "not_paid",
      "refund_in_progress",
      "reason_not_applicable",
      "nothing_to_refund",
    ];
    const texts = codes.map((code) => blockedReasonText(code));
    assert.equal(new Set(texts).size, codes.length);
    assert.equal(blockedReasonText("unheard_of"), "Bu paket için şu anda iade istenemiyor.");
  });

  it("tells the student a lost answer to the request may still have created it", () => {
    assert.match(refundErrorText("unknown", "submit"), /Yeniden göndermeden önce/);
    assert.doesNotMatch(refundErrorText("unknown", "preview"), /Yeniden göndermeden önce/);
  });

  it("says a tutor-side problem is checked before the amount is final", () => {
    assert.ok(
      whatHappensNext(14, "tutor_issue").some((line) => /yeniden hesaplanır/.test(line))
    );
    const voluntary = whatHappensNext(14, "voluntary").join(" ");
    assert.doesNotMatch(voluntary, /hocadan ya da platformdan/);
  });

  it("tells the student that nothing is cancelled by asking", () => {
    assert.match(whatHappensNext(14, "voluntary")[0], /hiçbir dersi iptal etmez/);
  });
});
