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

    it("states that messaging opens with the first message or a lesson request", () => {
      // A message request becomes a real conversation at once (no approval
      // step), and a lesson request opens one too. The old text said only a
      // lesson request did, which the code never required.
      const serializers = read("apps/messaging/serializers.py");
      assert.match(serializers, /a message request immediately\s+# becomes a real conversation/);
      assert.match(serializers, /accept_message_request\(message_request\)/);
      assert.match(read("apps/messaging/models.py"), /lesson_request = models\.OneToOneField/);
      assert.match(prose, /ilk mesajını göndermesiyle ya da bir ders talebi oluşturmasıyla açılır/);
      assert.doesNotMatch(prose, /ancak bir ders talebi oluşturulduktan sonra açılır/);
    });

    it("promises no notice or announcement the code does not send (suspension, planned downtime)", () => {
      // No code notifies a user of a suspension or announces maintenance, and
      // suspension does not settle lessons or packages by itself.
      assert.doesNotMatch(prose, /gerekçesiyle birlikte Kullanıcıya bildirilir/);
      assert.doesNotMatch(prose, /Planlı kesintiler/);
      assert.doesNotMatch(prose, /Devam eden dersler ve açık paketler, iptal ve iade kurallarına göre sonuçlandırılır/);
      assert.match(prose, /Kullanıcı, bu karara destek kanalı üzerinden itiraz edebilir/);
    });

    it("states the tutor verification inputs", () => {
      assert.match(prose, /\.edu\.tr/);
      assert.match(prose, /YKS sonuç belgesi/);
    });
  },
);

describe("kullanım koşulları claim nothing the platform cannot do", () => {
  it("describes card payment through the provider, not a manual process", () => {
    assert.match(prose, /PayTR’nin güvenli sayfasında kart ile/);
    assert.match(prose, /kart bilgileri HOCAM’a ulaşmaz/);
    assert.doesNotMatch(prose, /otomatik tahsilat yapılmamaktadır/);
    assert.doesNotMatch(prose, /elle yürütülür/);
    assert.doesNotMatch(prose, /kartınızdan tahsil/);
  });

  it("does not say the tutor accepts a paid package, and binds the tutor to the lessons", () => {
    assert.doesNotMatch(prose, /Hocanın onayı ile kesinleşir/);
    assert.match(prose, /ödemenin onaylanmasıyla Hocanın takvimine yazılır/);
    assert.match(prose, /bu derslere girmekle yükümlüdür/);
    assert.match(prose, /f\.tutorCancelLockHours/);
    if (backendAvailable) {
      assert.match(
        read("apps/lessons/policy.py"),
        /"TUTOR_CANCEL_LOCK_HOURS", 12\)/,
      );
    }
  });

  it("describes account deletion the way the code does it (N1)", () => {
    // Blockers stop the request (open refund, disputed / awaiting / running
    // lesson, coaching); planned lessons and unused rights only warn. Today
    // nothing refunds a paid, unused package when the account goes, so the
    // text advises a refund request first and promises no hold or block for it.
    assert.match(prose, /silme talebi oluşturulamaz/);
    assert.match(prose, /Planlanmış dersler ve kullanılmamış ders hakları silme talebini engellemez/);
    assert.match(prose, /ödenen bedel kendiliğinden iade edilmez/);
    assert.match(prose, /iade talebi açması önerilir/);
    assert.doesNotMatch(prose, /açık paket veya sonuçlanmamış iade talebi bulunması halinde silme işlemi bunlar/);
    if (backendAvailable) {
      const users = read("apps/users/services.py");
      assert.match(users, /warnings\.append\(\s*\{\s*"code": "unused_credits"/);
      assert.match(users, /warnings\.append\(\s*\{\s*"code": "upcoming_lessons"/);
      assert.doesNotMatch(users, /blockers\.append\(\s*\{\s*"code": "unused_credits"/);
    }
  });

  it("names the commission rate the code carries", () => {
    // 6563 s.K. requires the stated fee to be the real one, so the rate is
    // named rather than deferred. It has to agree with the constant.
    assert.match(prose, /%17,5 oranında komisyon/);
    assert.doesNotMatch(prose, /%15 oranında/);
    if (backendAvailable) {
      assert.match(
        read("apps/tutors/price_insights.py"),
        /TUTOR_ESTIMATED_COMMISSION_BPS = 1750/,
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
