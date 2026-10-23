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
  it("keeps a space after every bold figure", () => {
    assert.doesNotMatch(pageText(), /\d (gün|saat|dakika)(içinde|sonra|önce|kala|boyunca)/);
  });

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
    // A platform-initiated refund is a staff action (payments/services.py
    // create_refund_request -> record_platform_request), and a refund after
    // a late payment is requested by the student: neither starts by itself.
    assert.doesNotMatch(text, /kendiliğinden başlatır/);
    assert.match(text, /Öğrenci adına iade talebini kendisi açabilir/);
    // An approval's reason is internal (only a refusal's reaches the student).
    assert.match(text, /ret kararı gerekçesiyle birlikte yazılır/);
    assert.doesNotMatch(text, /Onay veya ret kararı gerekçesiyle/);
    // The no-show cancellation needs the student to have joined.
    assert.match(text, /Öğrenci katılmış, Hoca katılmamışsa: ders iptal edilir/);
    // The only trigger in code is the staff action that hides a tutor (tutors/admin.py).
    assert.match(text, /ayrılması veya yayından çıkarılması gibi/);
    assert.match(text, /Öğrenci iade talebi açabilir; bu durum HOCAM’dan kaynaklanan bir neden sayıldığından kesinti yapılmaz/);
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

/** The text between the coaching article's heading and the closing article's. */
function coachingSection() {
  const text = pageText();
  const start = text.indexOf("12. Koçluk görüşmeleri");
  const end = text.indexOf("13. Yürürlük ve değişiklik");
  assert.ok(start >= 0, "the coaching article is on the page");
  assert.ok(end > start, "the closing article follows the coaching one");
  return text.slice(start, end);
}

describe("iptal ve iade koşulları: koçluk görüşmeleri", () => {
  it("keeps the closing article last and the earlier references where they were", () => {
    const text = pageText();
    assert.match(text, /11\. Talep usulü ve inceleme/);
    assert.match(text, /12\. Koçluk görüşmeleri/);
    assert.match(text, /13\. Yürürlük ve değişiklik/);
    assert.doesNotMatch(text, /12\. Yürürlük ve değişiklik/);
  });

  it("says the length and the numbers of the rules", () => {
    const text = coachingSection();
    assert.match(text, new RegExp(`Her koçluk görüşmesi ${f.coachingSessionMinutes} dakika sürer`));
    assert.match(
      text,
      new RegExp(`en geç ${f.coachingTutorAbsentMinutes} dakika içinde odaya girerse görüşme Hocanın geç kaldığı süre kadar uzar`),
    );
    assert.match(text, new RegExp(`Hocanın girdiği andan itibaren ${f.coachingSessionMinutes} dakika sürer`));
    assert.match(
      text,
      new RegExp(`başlangıcından itibaren ${f.coachingTutorAbsentMinutes} dakika içinde odaya girmemişse ve Öğrenci odaya bağlanmışsa görüşme iptal edilir`),
    );
    assert.match(
      text,
      new RegExp(`aynı anda odada bulundukları süre ${f.coachingMeetingHeldMinutes} dakikadan az kalırsa görüşme yarım kalmış sayılır`),
    );
  });

  it("describes each outcome the system decides", () => {
    const text = coachingSection();
    // Late tutor whose extension would run into the next lesson: free extra meeting, only for a waiting student.
    assert.match(text, /hemen ardından gelen dersi veya görüşmesiyle çakışıyorsa görüşme uzatılmaz ve planlanan saatte biter/);
    assert.match(text, /Öğrenci odada bekliyorsa Öğrenciye, dönemin sonuna ücretsiz bir ek görüşme eklenir/);
    // Tutor absent: the cancelled meeting is replaced.
    assert.match(text, /yerine Öğrenciye, dönemin sonuna bir ek görüşme eklenir/);
    // Nobody came: only believable while the connection records are alive.
    assert.match(text, /son yirmi dört saatte başka koçluk görüşmelerinin/);
    assert.match(text, /kimse sorumlu tutulmadan iptal edilir/);
    assert.match(text, /anlaşılamıyorsa kendiliğinden karar verilmez/);
    // Mutual end: an ordinary finished meeting that owes nothing.
    assert.match(text, /diğer taraf bunu açıkça kabul ederse görüşme tamamlanmış sayılır; bu halde ek görüşme hakkı doğmaz/);
    // A cancelled meeting stays closed.
    assert.match(text, /görüşme odası o görüşme için kapalıdır/);
  });

  it("explains where the extra meeting goes and what happens when none fits", () => {
    const text = coachingSection();
    assert.match(text, /Öğrencinin başlangıçta seçtiği haftalık saate/);
    assert.match(text, /Öğrenci ek görüşme için ayrıca saat seçmez/);
    assert.match(text, /bir sonraki haftalık saate kaydırılır/);
    assert.match(text, /ek görüşme hakkı kayıtlı kalır ve Öğrenci destek talebi oluşturabilir/);
    assert.match(text, /Bir görüşme için en fazla bir ek görüşme eklenir/);
  });

  it("gives an objection route and keeps the statutory rights (Arda, 23 October)", () => {
    const text = coachingSection();
    assert.match(text, /kendiliğinden verilebilir/);
    assert.match(text, /destek talebi oluşturarak itiraz edebilir; itiraz HOCAM tarafından incelenir/);
    assert.match(text, /6698 sayılı Kişisel Verilerin Korunması Kanunu’nun 11\. maddesinin birinci fıkrasının \(g\) bendi/);
    assert.match(
      text,
      /ek görüşme hakkı tanınması, Öğrencinin tüketici mevzuatından doğan haklarını ve onuncu maddede düzenlenen iade talebi yolunu ortadan kaldırmaz/,
    );
  });

  it("promises nothing the code does not do", () => {
    const text = coachingSection();
    // No rule here takes the statutory refund route away or promises a refund by itself.
    assert.doesNotMatch(text, /para iadesi (yapılmaz|söz konusu değildir|yoktur)/i);
    assert.doesNotMatch(text, /iade edilmez/);
    assert.doesNotMatch(text, /iade edilir/);
    // An automatic cancellation writes no absence record against the tutor
    // (violations are recorded only after a support review, phase8_views.py).
    assert.doesNotMatch(text, /katılmama kaydı/);
    // The "leave" button does not exist yet; the text must not describe it.
    assert.doesNotMatch(text, /ayrıl/i);
    // No payout or earnings figure on a student-facing page.
    assert.doesNotMatch(text, /hakediş|kazanç|₺|\bTL\b/);
  });
});

describe(
  "iptal ve iade koşulları: koçluk görüşmeleri mirror the backend",
  { skip: !backendAvailable && "Hocam_backend not checked out" },
  () => {
    it("the lifecycle decides the cases the article names", () => {
      const lifecycle = read("apps/coaching/session_lifecycle.py");
      // The tutor's absence needs the student on record; nobody-came needs a live webhook.
      assert.match(lifecycle, /if rows\.filter\(user_id=session\.student_id\)\.exists\(\):\s+return "tutor_only"/);
      assert.match(lifecycle, /if not ops_alert\.webhook_looks_alive\(session, now=now\):/);
      assert.match(lifecycle, /if tutor_rows\.filter\(joined_at__lte=deadline\)\.exists\(\):/);
      // Both the absent-tutor and the short-meeting decisions hand the student a replacement.
      assert.match(lifecycle, /request_makeup_right\(\s*cancelled, reason=late_tutor\.MAKEUP_REASON_REPLACEMENT/);
      assert.match(lifecycle, /request_makeup_right\(\s*transitioned, reason=late_tutor\.MAKEUP_REASON_REPLACEMENT/);
    });

    it("a late tutor's free extra meeting needs a student who was already waiting", () => {
      const lateTutor = read("apps/coaching/late_tutor.py");
      assert.match(lateTutor, /CoachingSessionAttendance\.objects\.filter\(\s*session=locked, user_id=locked\.student_id, joined_at__lte=tutor_joined_at/);
      assert.match(lateTutor, /request_makeup_right\(locked, reason=MAKEUP_REASON_COMPENSATION/);
    });

    it("the nobody-came check looks at the last 24 hours of other meetings", () => {
      const alert = read("apps/coaching/ops_alert.py");
      assert.match(alert, /WEBHOOK_LIVE_WINDOW = timedelta\(hours=24\)/);
      assert.match(alert, /\.exclude\(session_id=session\.pk\)/);
    });

    it("one extra meeting per lost meeting, on the student's own weekly hour, and kept when none fits", () => {
      const makeup = read("apps/coaching/makeup.py");
      assert.match(makeup, /_TUTOR_EARNS_BY_REASON = \{\s*REASON_YERINE_GECEN: True,\s*REASON_TAZMINAT_UCRETSIZ: False,\s*\}/);
      assert.match(makeup, /the right is kept as\s+``unplaced``/);
      assert.match(read("apps/coaching/models.py"), /origin_session = models\.(OneToOneField|ForeignKey)/);
    });

    it("a mutual end touches no earning or refund, and a cancelled meeting has no open room", () => {
      assert.match(read("apps/coaching/early_end.py"), /Nothing here touches earnings, refunds or holds/);
      const views = read("apps/coaching/session_views.py");
      assert.match(views, /if session\.status not in \(_SS\.SCHEDULED, _SS\.IN_PROGRESS\):\s+return Response\(\s+\{"code": "session_not_active"/);
    });

    it("an automatic cancellation records no violation against the tutor", () => {
      // Violations are written only from the support-reviewed paths in phase8_views.py.
      assert.doesNotMatch(read("apps/coaching/session_lifecycle.py"), /record_verified_tutor_violation/);
      assert.doesNotMatch(read("apps/coaching/late_tutor.py"), /record_verified_tutor_violation/);
      assert.doesNotMatch(read("apps/coaching/makeup.py"), /record_verified_tutor_violation/);
    });
  },
);
