import "@/test/setupDom";

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render } from "@testing-library/react";

import CancellationAndRefundPage from "@/app/(main)/(legal)/iptal-ve-iade/page";
import { EXTENSION_CAPS, formatTlAmount, POLICY_FACTS as f } from "@/lib/policyFacts";

/**
 * Pins /iptal-ve-iade to the rules the platform enforces.
 *
 * The page is rendered and read as a person reads it, so the numbers checked
 * here are the ones on the screen, not the ones in the source. Each rule is
 * also checked against the backend source it mirrors (policyFacts.test.ts does
 * the same for every number); a sibling checkout is optional and the mirror
 * block skips without it.
 */

const BACKEND = path.join(process.cwd(), "..", "Hocam_backend");
const backendAvailable = fs.existsSync(BACKEND);
const read = (rel: string) => fs.readFileSync(path.join(BACKEND, rel), "utf8");

afterEach(() => cleanup());

function pageText() {
  const { container } = render(<CancellationAndRefundPage />);
  return (container.textContent ?? "").replace(/\s+/g, " ");
}

describe("iptal ve iade koşulları say the numbers of the rules", () => {
  it("checkout: hold, payment page, retry, attempts, first lesson", () => {
    const text = pageText();
    assert.match(text, new RegExp(`${f.holdMinutes} dakika boyunca yalnızca`));
    assert.match(text, new RegExp(`en çok ${f.paymentPageMinutes} dakika açık kalır`));
    assert.match(text, new RegExp(`en çok ${f.failedRetryHoldMinutes} dakika daha tutulur`));
    assert.match(text, new RegExp(`en çok ${f.maxPaymentAttempts} kez denenebilir`));
    assert.match(text, new RegExp(`ödemeden en az ${f.firstLessonNoticeHours} saat sonra başlar`));
  });

  it("withdrawal: 14 days, refunded within 14 days", () => {
    const text = pageText();
    assert.match(text, new RegExp(`${f.withdrawalDays} gün içinde hiçbir gerekçe göstermeksizin`));
    assert.match(text, new RegExp(`ulaştığı tarihten itibaren ${f.withdrawalDays} gün içinde`));
    assert.match(text, /İlk ders başladığında hizmetin ifasına başlanmış olur/);
    assert.match(text, /kullanılmamış dersler için iade talep etme hakkını ortadan kaldırmaz/);
  });

  it("cancellation: the student's free window, the tutor's lock", () => {
    const text = pageText();
    assert.match(text, new RegExp(`${f.freeCancelHours} saatten fazla süre varken yapılan iptal ücretsizdir`));
    assert.match(text, new RegExp(`${f.freeCancelHours} saatten az süre kalmışsa ders hakkı geri dönmez`));
    assert.match(text, new RegExp(`${f.tutorCancelLockHours} saat ya da daha az kala iptal edemez`));
    assert.match(text, /destek ekibinin onayıyla iptal/);
  });

  it("attendance: grace, dispute, auto-confirm, review, hide threshold", () => {
    const text = pageText();
    assert.match(text, new RegExp(`${f.noShowGraceMinutes} dakika boyunca beklenir`));
    assert.match(text, new RegExp(`yapılmasından itibaren ${f.absenceDisputeHours} saat içinde itiraz`));
    assert.match(text, new RegExp(`ders bitiminden itibaren ${f.autoConfirmHours} saat içinde onay`));
    assert.match(text, new RegExp(`ders bitiminden itibaren ${f.reviewWindowDays} gün içinde`));
    assert.match(text, new RegExp(`Hakkında ${f.noShowHideThreshold} katılmama kaydı`));
  });

  it("term: the extension caps for every plan the catalog sells", () => {
    const text = pageText();
    assert.match(text, new RegExp(`${f.maxExtensionDays} günü aşamaz`));
    for (const cap of EXTENSION_CAPS) {
      assert.match(text, new RegExp(`${cap.planDays} gün\\) plan: en çok ${cap.capDays} gün`));
    }
  });

  it("refunds: near window, settle time, second approval", () => {
    const text = pageText();
    assert.match(text, new RegExp(`sonraki ${f.refundNearLessonHours} saat içinde başlayacak dersler`));
    assert.match(text, new RegExp(`en geç ${f.refundSettleDays} gün içinde sonuçlandırır`));
    assert.match(text, new RegExp(`${formatTlAmount(f.refundSecondApprovalTl).replace(".", "\\.")} ve üzeri iadelerde ikinci bir yetkilinin`));
  });
});

describe("iptal ve iade koşulları describe the model that runs", () => {
  it("uses one word for the right that is not on the calendar", () => {
    const text = pageText();
    assert.match(text, /Yerleşmemiş hak:/);
    assert.doesNotMatch(text, /\bkredi/i);
  });

  it("claims nothing the product no longer does", () => {
    const text = pageText();
    assert.doesNotMatch(text, /ceza puanı/);
    assert.doesNotMatch(text, /otomatik tahsilat/);
    assert.doesNotMatch(text, /elle yürütülür/);
    assert.doesNotMatch(text, /on beş gün/);
    assert.doesNotMatch(text, /destek@|kvkk@/);
    // The tutor-fault refund is a staff decision, not the student's claim.
    assert.match(text, /beyandır ve karar yerine geçmez/);
  });

  it("states that the tutor's own cancellation never costs the student", () => {
    const text = pageText();
    assert.match(text, /Hocanın iptal ettiği her ders için ders hakkı Öğrenciye geri döner/);
    assert.match(text, /Öğrencinin kendi iptali, geç kalması veya derse katılmaması paketin süresini uzatmaz/);
  });
});

describe("iptal ve iade koşulları mirror the backend", { skip: !backendAvailable && "Hocam_backend not checked out" }, () => {
  it("only a late student cancellation forfeits the right", () => {
    // Getting this backwards would be the most expensive error on the page.
    assert.match(read("apps/lessons/services.py"), /refund_credit = not \(actor == STUDENT and is_late\)/);
  });

  it("a confirmed lesson cannot be cancelled by the tutor inside the lock", () => {
    const services = read("apps/lessons/services.py");
    assert.match(services, /booking\.status == _S\.CONFIRMED\s+and booking\.start_instant - now < tutor_cancel_lock_window\(\)/);
  });

  it("lists the refund reasons the model accepts", () => {
    const models = read("apps/payments/models.py");
    assert.match(
      models,
      /STUDENT_REASONS = \(\s*Reason\.VOLUNTARY,\s*Reason\.PLAN_EXPIRED_LEFTOVER,\s*Reason\.TUTOR_ISSUE,\s*Reason\.TECHNICAL,\s*Reason\.OTHER,\s*Reason\.SLOT_CONFLICT,\s*\)/,
    );
    assert.match(
      models,
      /PLATFORM_REASONS = \(\s*Reason\.TUTOR_LEFT,\s*Reason\.VERIFICATION_REVOKED,\s*Reason\.SERVICE_FAILURE,\s*\)/,
    );
    const text = pageText();
    for (const phrase of [
      /Paketten vazgeçilmesi/,
      /Hocayla ilgili bir sorun/,
      /Teknik bir sorun/,
      /ödeme sırasında başkasına geçmesi/,
      /yerleşmemiş hak kalması/,
      /Diğer nedenler/,
      /Hocanın platformdan ayrılması/,
      /doğrulama statüsünün geri alınması/,
      /HOCAM’dan kaynaklanan bir nedenle sunulamaması/,
    ]) {
      assert.match(text, phrase);
    }
  });

  it("deducts used lessons at the unit price actually paid, and a full refund before any use", () => {
    const calc = read("apps/payments/refund_calc.py");
    assert.match(calc, /unit_price = purchase\.unit_price/);
    assert.match(calc, /full_refund = used_before_near == 0/);
    assert.match(calc, /near = \[\] if \(full_refund or fault != "none"\) else near_candidates/);
    assert.match(pageText(), /fiilen ödenen ders başı bedel/);
  });

  it("allows only one open refund request per purchase", () => {
    assert.match(read("apps/payments/models.py"), /OPEN_STATUSES = \(Status\.REQUESTED, Status\.APPROVED\)/);
    assert.match(pageText(), /yalnızca bir iade talebi açık olabilir/);
  });

  it("extends the term for exactly the tutor-caused losses the page names", () => {
    const extensions = read("apps/payments/extensions.py");
    for (const reason of ["tutor_cancelled", "tutor_no_show", "tutor_unanswered"]) {
      assert.match(extensions, new RegExp(`"${reason}"`));
    }
    assert.match(pageText(), /iptal etmesi, derse katılmaması veya talebe hiç yanıt vermemesi/);
  });
});
