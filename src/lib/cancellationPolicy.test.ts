import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

/**
 * Pins /iptal-ve-iade to the rules the backend actually enforces.
 *
 * The page is written in plain contract prose with no code references, which
 * means nothing in the page itself would notice a constant changing under it.
 * This test is that notice: change CANCELLATION_FREE_WINDOW to 24 hours and
 * the assertion below fails until the sentence is rewritten.
 *
 * The backend is a sibling checkout, not a dependency. When it is absent the
 * suite skips rather than fails — a missing sibling is not a frontend defect.
 */

const BACKEND = path.join(process.cwd(), "..", "Hocam_backend");
const PAGE = path.join(
  process.cwd(),
  "src/app/(main)/(legal)/iptal-ve-iade/page.tsx",
);

const page = fs.readFileSync(PAGE, "utf8");
/** Prose only: JSX tags carry class names full of digits. */
const prose = page
  .replace(/className="[^"]*"/g, "")
  .replace(/<[^>]*>/g, " ")
  .replace(/\{"\s*"\}/g, " ")
  .replace(/\s+/g, " ");

const backendAvailable = fs.existsSync(BACKEND);
const read = (rel: string) => fs.readFileSync(path.join(BACKEND, rel), "utf8");

function constant(src: string, pattern: RegExp) {
  const m = src.match(pattern);
  assert.ok(m, `constant not found: ${pattern}`);
  return Number(m[1]);
}

describe("iptal ve iade koşulları mirror the enforced rules", { skip: !backendAvailable && "Hocam_backend not checked out" }, () => {
  const lessons = () => read("apps/lessons/services.py");
  const lessonModels = () => read("apps/lessons/models.py");
  const payments = () => read("apps/payments/services.py");
  const paymentModels = () => read("apps/payments/models.py");

  it("states the 12-hour free cancellation window", () => {
    assert.equal(
      constant(lessons(), /CANCELLATION_FREE_WINDOW = timedelta\(hours=(\d+)\)/),
      12,
    );
    assert.match(prose, /on iki saatten fazla/);
    assert.match(prose, /on iki saatten az/);
  });

  it("states the 15-minute attendance grace period", () => {
    assert.equal(
      constant(lessons(), /NO_SHOW_GRACE_PERIOD = timedelta\(minutes=(\d+)\)/),
      15,
    );
    assert.match(prose, /on beş dakika/);
  });

  it("states the 24-hour absence dispute window", () => {
    assert.equal(
      constant(
        lessons(),
        /STUDENT_ABSENCE_DISPUTE_WINDOW = timedelta\(hours=(\d+)\)/,
      ),
      24,
    );
    assert.match(prose, /tespitin yapılmasından itibaren yirmi dört saat/);
  });

  it("states the 24-hour auto-confirmation and 3-day review window", () => {
    assert.equal(constant(lessonModels(), /AUTO_CONFIRM_HOURS = (\d+)/), 24);
    assert.equal(constant(lessonModels(), /REVIEW_WINDOW_DAYS = (\d+)/), 3);
    assert.match(prose, /ders bitiminden itibaren yirmi dört saat/);
    assert.match(prose, /ders bitiminden itibaren üç gün/);
  });

  it("states the 3 no-show auto-hide threshold", () => {
    assert.equal(constant(lessons(), /NO_SHOW_AUTO_HIDE_THRESHOLD = (\d+)/), 3);
    assert.match(prose, /Hakkında üç katılmama kaydı/);
  });

  it("states the tutor penalty point for a late tutor cancellation", () => {
    assert.equal(
      constant(lessons(), /LATE_TUTOR_CANCELLATION_PENALTY_POINTS = (\d+)/),
      1,
    );
    assert.match(prose, /öğretmenin hesabına ceza puanı işlenir/);
  });

  it("no longer promises a grace period after the package term", () => {
    // The window was retired. New purchases carry grace_period_days=0;
    // packages sold before the change keep their snapshot, which is why the
    // model has the field at all.
    assert.equal(constant(payments(), /PACKAGE_GRACE_PERIOD_DAYS = (\d+)/), 0);
    assert.match(
      paymentModels(),
      /grace_period_days = models\.PositiveSmallIntegerField\(default=0\)/,
    );
    assert.doesNotMatch(prose, /ek süre eklenir/);
  });

  it("states the 15-day refund payout window", () => {
    // Abonelik Sözleşmeleri Yönetmeliği: the unperformed part is refunded
    // without deduction within fifteen days of termination.
    assert.match(prose, /on beş gün içinde Kullanıcının ödeme yaptığı yöntemle/);
  });

  it("keeps the credit rule the right way round", () => {
    // refund_credit = not (actor == STUDENT and is_late)
    // i.e. ONLY a late student cancellation forfeits the credit. A late tutor
    // cancellation refunds it. Getting this backwards on the page would be
    // the most expensive error on it.
    assert.match(
      lessons(),
      /refund_credit = not \(actor == STUDENT and is_late\)/,
    );
    assert.match(
      prose,
      /İptal öğrenci tarafından yapılmışsa, derse ayrılmış paket kredisi iade edilmez/,
    );
    assert.match(
      prose,
      /İptal öğretmen tarafından yapılmışsa, paket kredisi öğrenciye iade edilir/,
    );
  });

  it("lists exactly the registered refund reasons", () => {
    const models = paymentModels();
    assert.match(models, /STUDENT_REASONS = \(Reason\.VOLUNTARY, Reason\.PLAN_EXPIRED_LEFTOVER\)/);
    assert.match(
      models,
      /PLATFORM_REASONS = \(\s*Reason\.TUTOR_LEFT,\s*Reason\.VERIFICATION_REVOKED,\s*Reason\.SERVICE_FAILURE,\s*\)/,
    );
    // two student-initiated, three platform-initiated
    assert.match(prose, /kullanılmaya devam edilmek istenmemesi/);
    assert.match(prose, /Süresi dolan bir pakette kullanılmamış kredi/);
    assert.match(prose, /öğretmenin platformdan ayrılması/);
    assert.match(prose, /doğrulama statüsünün geri alınması/);
    assert.match(prose, /kaynaklanan bir nedenle sunulamaması/);
  });

  it("deducts used lessons at the discounted unit price", () => {
    assert.match(
      payments(),
      /deduction_unit_price = purchase\.unit_price/,
    );
    assert.match(prose, /fiilen ödenen indirimli birim ders bedeli/);
  });

  it("allows only one open refund request per purchase", () => {
    assert.match(
      paymentModels(),
      /OPEN_STATUSES = \(Status\.REQUESTED, Status\.APPROVED\)/,
    );
    assert.match(prose, /yalnızca bir iade talebi açık olabilir/);
  });
});

describe("iptal ve iade koşulları claim nothing the platform cannot do", () => {
  it("never promises an automatic refund", () => {
    // AI_AGENT_RULES §1: no payment provider is connected, and
    // process_refund_request() only moves a database status.
    assert.match(
      prose,
      /otomatik tahsilat veya otomatik bedel iadesi yapılmamaktadır/,
    );
    assert.doesNotMatch(prose, /otomatik olarak iade edilir/);
    assert.doesNotMatch(prose, /kartınıza iade edilir/);
  });

  it("does not invent a support address", () => {
    // destek@ does not exist anywhere in the product.
    assert.doesNotMatch(page, /destek@/);
  });
});
