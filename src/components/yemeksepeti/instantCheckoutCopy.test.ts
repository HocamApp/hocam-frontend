import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { helpSections } from "@/components/support/supportContent";
import { POLICY_FACTS as f } from "@/lib/policyFacts";

import {
  faq,
  type FaqFacts,
  paymentGuaranteeAnswer,
  pricingNoCharge,
  studentPayStep,
} from "./ysHomeCopy";
import {
  REMAINING_ON_SWITCH_TEXT,
  STUDENT_NO_SHOW_TEXT,
  TUTOR_NO_SHOW_TEXT,
  tutorMustAcceptText,
} from "./ysHomeFacts";

/**
 * The homepage, the FAQ and the help page each say two things about money: what
 * the product did before the instant checkout (a package request the tutor
 * accepts, payment settled by hand) and what it does with it (the student picks
 * hours and pays, the lessons are written to the calendar). The build flag
 * picks one, so these tests build both and check that neither leaks into the
 * other, and that every number comes from policyFacts.ts.
 */

const FACTS = (instant: boolean): FaqFacts => ({
  trialMinutes: 20,
  trialLimit: 3,
  lessonMinutes: 40,
  weeklyMin: 1,
  weeklyMax: 6,
  shortestPlan: "2 hafta",
  longestPlan: "6 ay",
  maxDiscount: 30,
  cancelHours: f.freeCancelHours,
  instant,
  holdMinutes: f.holdMinutes,
  firstLessonNoticeHours: f.firstLessonNoticeHours,
  withdrawalDays: f.withdrawalDays,
  refundSettleDays: f.refundSettleDays,
  offPlatform: null,
  parentCanPay: null,
  parentCanJoin: null,
  tutorNoShow: null,
  trialPaid: null,
  mustAccept: null,
  studentNoShow: null,
  tax: null,
});

const answerText = (parts: readonly unknown[]) =>
  parts.map((part) => (typeof part === "string" ? part : (part as { text?: string }).text ?? "")).join("");

describe("what the tutor is told about accepting", () => {
  it("before instant checkout the tutor accepts package requests", () => {
    const text = tutorMustAcceptText(false);
    assert.match(text, /paket taleplerini ve yeni rezervasyonları sen onaylarsın/);
  });

  it("with instant checkout the tutor does not accept a package, owes the lessons and is locked in", () => {
    const text = tutorMustAcceptText(true);
    assert.match(text, /Paket satışında talep onaylamazsın/);
    assert.match(text, /bu derslere girmen gerekir/);
    assert.match(text, new RegExp(`${f.tutorCancelLockHours} saat ya da daha az kala onaylı bir dersi iptal edemezsin`));
    assert.match(text, /acil bir durumda destek ekibine başvurursun/);
    assert.doesNotMatch(text, /paket taleplerini .* sen onaylarsın/);
  });
});

describe("the student's payment step", () => {
  it("before: a request, nothing charged", () => {
    const step = studentPayStep(false, "X");
    assert.equal(step.title, "Paket talebini gönder");
    assert.equal(step.body[0], "Paket talebini oluştururken kartından ücret alınmaz. ");
    assert.equal(pricingNoCharge(false), "Paket talebini oluştururken kartından ücret alınmaz.");
    assert.equal(paymentGuaranteeAnswer(false, "X")[0], "Paket talebini oluştururken kartından ücret alınmaz. ");
  });

  it("after: pick the hours and pay, with the provider named and no card data kept", () => {
    const step = studentPayStep(true, "X");
    assert.equal(step.title, "Saatlerini seç ve öde");
    assert.deepEqual(step.body, ["X"]);
    assert.match(pricingNoCharge(true), /PayTR’nin güvenli sayfasında/);
    assert.match(pricingNoCharge(true), /kart bilgilerin Hocam’a ulaşmaz/);
    assert.deepEqual(paymentGuaranteeAnswer(true, "X"), ["X"]);
  });
});

describe("the student FAQ", () => {
  const ids = (instant: boolean) => faq.student(FACTS(instant)).map((item) => item.id);

  it("does not talk about payment or refunds before the instant checkout", () => {
    assert.ok(!ids(false).includes("odeme-saat"));
    assert.ok(!ids(false).includes("iade"));
  });

  it("explains the hold and the refund once the student can pay", () => {
    const items = faq.student(FACTS(true));
    const hold = answerText(items.find((item) => item.id === "odeme-saat")!.answer);
    const refund = answerText(items.find((item) => item.id === "iade")!.answer);

    assert.match(hold, new RegExp(`${f.holdMinutes} dakika boyunca yalnızca senin için ayrılır`));
    assert.match(hold, new RegExp(`en az ${f.firstLessonNoticeHours} saat sonra başlar`));
    assert.match(refund, new RegExp(`${f.withdrawalDays} gün içinde, hiçbir ders kullanılmadıysa`));
    assert.match(refund, new RegExp(`en geç ${f.refundSettleDays} gün içinde sonuçlandırırız`));
    assert.match(refund, /kesinti olmadan iade edilir/);
  });

  it("calls the returned right an unplaced right once she can place it", () => {
    const text = (instant: boolean) =>
      answerText(faq.student(FACTS(instant)).find((item) => item.id === "iptal")!.answer);
    assert.match(text(true), /yerleşmemiş hak/);
    assert.doesNotMatch(text(false), /yerleşmemiş hak/);
  });
});

describe("the settled policy sentences agree with the legal pages", () => {
  it("quotes the refund settle time the legal pages quote, never the old fifteen days", () => {
    assert.match(String(REMAINING_ON_SWITCH_TEXT), new RegExp(`en geç ${f.refundSettleDays} gün içinde sonuçlanır`));
    assert.doesNotMatch(String(REMAINING_ON_SWITCH_TEXT), /15 gün/);
  });

  it("quotes the attendance numbers from the same list", () => {
    assert.match(String(TUTOR_NO_SHOW_TEXT), new RegExp(`${f.noShowGraceMinutes} dakika beklenir`));
    assert.match(String(STUDENT_NO_SHOW_TEXT), new RegExp(`${f.absenceDisputeHours} saat içinde itiraz`));
  });
});

describe("the help page", () => {
  const section = (instant: boolean, title: string) =>
    helpSections(instant).find((entry) => entry.title === title)!.items.join(" ");

  it("before: the support desk settles payments by hand and the tutor accepts bookings", () => {
    assert.match(section(false, "Ödeme ve iade bilgilendirmesi"), /otomatik ödeme veya iade işlemi bulunmamaktadır/);
    assert.match(section(false, "Ders ve rezervasyon kuralları"), /Rezervasyon onayı eğitmenin kabul etmesiyle kesinleşir/);
  });

  it("after: payment through the provider, the hold, withdrawal and the settle time", () => {
    const payment = section(true, "Ödeme ve iade bilgilendirmesi");
    assert.match(payment, /PayTR'nin güvenli sayfasında/);
    assert.match(payment, new RegExp(`${f.holdMinutes} dakika boyunca`));
    assert.match(payment, new RegExp(`${f.withdrawalDays} gün içinde cayabilirsiniz`));
    assert.match(payment, new RegExp(`en geç ${f.refundSettleDays} gün içinde sonuçlandırır`));
    assert.doesNotMatch(payment, /manuel/);
    assert.doesNotMatch(payment, /otomatik ödeme veya iade işlemi bulunmamaktadır/);

    const booking = section(true, "Ders ve rezervasyon kuralları");
    assert.match(booking, /ödeme onaylanınca eğitmenin takvimine yazılır ve kesinleşir/);
    assert.doesNotMatch(booking, /Rezervasyon onayı eğitmenin kabul etmesiyle kesinleşir/);
    assert.match(booking, new RegExp(`${f.freeCancelHours} saatten fazla varken ücretsiz iptal`));
    assert.match(booking, /yerleşmemiş hak/);
  });
});
