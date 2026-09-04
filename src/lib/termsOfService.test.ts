import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

/**
 * Pins /kullanim-kosullari to the rules the platform actually enforces, the
 * same way cancellationPolicy.test.ts does for /iptal-ve-iade.
 *
 * A terms document is the one page where an unnoticed drift is expensive:
 * it is the text a user is told they agreed to. Change a constant and this
 * fails until the sentence is rewritten.
 */

const BACKEND = path.join(process.cwd(), "..", "Hocam_backend");
const PAGE = path.join(
  process.cwd(),
  "src/app/(main)/(legal)/kullanim-kosullari/page.tsx",
);

const page = fs.readFileSync(PAGE, "utf8");
const prose = page
  .replace(/className="[^"]*"/g, "")
  .replace(/<[^>]*>/g, " ")
  .replace(/\{"\s*"\}/g, " ")
  .replace(/\s+/g, " ");

const backendAvailable = fs.existsSync(BACKEND);
const read = (rel: string) => fs.readFileSync(path.join(BACKEND, rel), "utf8");

describe(
  "kullanım koşulları mirror the enforced rules",
  { skip: !backendAvailable && "Hocam_backend not checked out" },
  () => {
    it("states the age of majority the backend applies", () => {
      assert.match(
        read("config/settings.py"),
        /KVKK_AGE_OF_MAJORITY = config\('KVKK_AGE_OF_MAJORITY', default=18/,
      );
      assert.match(prose, /On sekiz yaşından küçük Kullanıcılar/);
    });

    it("states the monthly trial limit and the once-per-tutor rule", () => {
      const models = read("apps/lessons/models.py");
      assert.match(models, /MONTHLY_TRIAL_LIMIT = 3/);
      assert.match(models, /name="unique_active_trial_booking_per_tutor"/);
      assert.match(prose, /en fazla üç deneme talebi/);
      assert.match(prose, /her hocayla deneme hakkını bir kez/);
    });

    it("states the 24-hour auto-confirmation and 3-day review window", () => {
      const models = read("apps/lessons/models.py");
      assert.match(models, /AUTO_CONFIRM_HOURS = 24/);
      assert.match(models, /REVIEW_WINDOW_DAYS = 3/);
      assert.match(prose, /ders bitiminden itibaren yirmi dört saat/);
      assert.match(prose, /ders bitiminden itibaren üç gün/);
    });

    it("states the 3 no-show auto-hide threshold", () => {
      assert.match(
        read("apps/lessons/services.py"),
        /NO_SHOW_AUTO_HIDE_THRESHOLD = 3/,
      );
      assert.match(prose, /üç katılmama kaydı oluşan hocanın profili/);
    });

    it("states the 14-day account deletion grace period", () => {
      assert.match(
        read("config/settings.py"),
        /ACCOUNT_DELETION_GRACE_DAYS = config\(\s*'ACCOUNT_DELETION_GRACE_DAYS', default=14/,
      );
      assert.match(prose, /on dört gün süren bir bekleme dönemi/);
    });

    it("states that messaging opens only after a lesson request", () => {
      // Conversation hangs off a lesson request, so there is no free-form
      // messaging to describe.
      assert.match(
        read("apps/messaging/models.py"),
        /lesson_request = models\.OneToOneField/,
      );
      assert.match(prose, /ancak bir ders talebi oluşturulduktan sonra açılır/);
    });

    it("states the tutor verification inputs", () => {
      assert.match(prose, /\.edu\.tr/);
      assert.match(prose, /YKS sonuç belgesi/);
    });
  },
);

describe("kullanım koşulları claim nothing the platform cannot do", () => {
  it("never promises automatic collection", () => {
    // AI_AGENT_RULES §1: no payment provider is connected.
    assert.match(prose, /otomatik tahsilat yapılmamaktadır/);
    assert.doesNotMatch(prose, /kartınızdan tahsil/);
  });

  it("names the commission rate the code carries", () => {
    // 6563 s.K. requires the stated fee to be the real one, so the rate is
    // named rather than deferred. It has to agree with the constant.
    assert.match(prose, /%15 oranında komisyon/);
    if (backendAvailable) {
      assert.match(
        read("apps/tutors/price_insights.py"),
        /TUTOR_ESTIMATED_COMMISSION_BPS = 1500/,
      );
    }
  });

  it("does not reserve a retroactive or unilateral adverse change", () => {
    // 6563 s.K. forbids that clause in an intermediary agreement.
    assert.match(prose, /geçmişe yürümez/);
    assert.match(prose, /yürürlüğe girmeden makul bir süre önce/);
  });

  it("does not invent a support address", () => {
    assert.doesNotMatch(page, /destek@|kvkk@/);
  });

  it("keeps consumer rights outside the liability cap", () => {
    assert.match(prose, /tüketici mevzuatının Kullanıcıya tanıdığı/);
  });
});
