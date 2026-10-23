import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

/**
 * Pins the two notices derived from backend documents to their sources, the
 * way cancellationPolicy.test.ts and termsOfService.test.ts do.
 *
 * The retention page is the risky one: its table has to match the periods
 * apps/privacy/retention.py actually enforces. A policy that publishes a
 * period the system does not apply is worse than publishing none.
 */

const BACKEND = path.join(process.cwd(), "..", "Hocam_backend");
const LEGAL = path.join(process.cwd(), "src/app/(main)/(legal)");

const read = (file: string) => fs.readFileSync(file, "utf8");
const backendAvailable = fs.existsSync(BACKEND);
const backend = (rel: string) => read(path.join(BACKEND, rel));

const retentionPage = read(
  path.join(LEGAL, "kvkk/saklama-ve-imha-politikasi/page.tsx"),
);
const tutorPage = read(path.join(LEGAL, "kvkk/hoca-aydinlatma-metni/page.tsx"));

describe("hoca aydınlatma metni", () => {
  it("informs without asking for consent, and keeps the two apart", () => {
    // Kurul 18.02.2026 / 2026/347: information and consent are separate texts.
    assert.match(tutorPage, /senden onay\s*\n?\s*istemez/);
    assert.match(
      tutorPage,
      /Açık rıza, başka bir işleme\s*\n?\s*şartının yerine/,
    );
  });

  it("marks the public profile as the consent-based processing", () => {
    assert.match(tutorPage, /Profilinin herkese açık yayımlanması açık rızana bağlıdır/);
  });

  it("states that lessons are not recorded", () => {
    assert.match(tutorPage, /ses ve görüntü kaydını almıyoruz/);
  });

  it("layers rather than repeats the verification notice", () => {
    assert.match(tutorPage, /href="\/kvkk\/hoca-dogrulama"/);
  });

  it("uses the real contact address", () => {
    assert.match(tutorPage, /iletisim@hocamozelders\.com/);
    assert.doesNotMatch(tutorPage, /kvkk@|destek@/);
  });
});

describe(
  "saklama ve imha politikası matches what the code enforces",
  { skip: !backendAvailable && "Hocam_backend not checked out" },
  () => {
    const rules = () => backend("apps/privacy/retention.py");

    /** DAYS(n) for a retention category, from the enforced registry. */
    function days(category: string) {
      const block = rules().match(
        new RegExp(`category="${category}"[\\s\\S]*?max_age=DAYS\\((\\d+)\\)`),
      );
      assert.ok(block, `no enforced period for ${category}`);
      return Number(block[1]);
    }

    it("publishes the enforced short-lived periods", () => {
      assert.equal(days("pending_registration"), 1);
      assert.equal(days("verification_code"), 30);
      assert.equal(days("jaas_webhook_event"), 90);
      assert.equal(days("notification"), 90);
      assert.match(retentionPage, /period: "1 gün"/);
      assert.match(retentionPage, /period: "30 gün"/);
      assert.match(retentionPage, /period: "90 gün"/);
    });

    it("publishes the enforced multi-year periods", () => {
      assert.equal(days("session_attendance"), 730);
      assert.equal(days("admin_action_log"), 730);
      assert.equal(days("support_ticket"), 1095);
      assert.equal(days("account_deletion_request"), 1095);
      assert.match(retentionPage, /Derse katılım kayıtları", period: "2 yıl"/);
      assert.match(retentionPage, /Destek talepleri", period: "3 yıl"/);
    });

    it("publishes the enforced AI and analytics periods", () => {
      assert.equal(days("ai_conversation"), 180);
      assert.equal(days("ai_usage_log"), 365);
      assert.equal(days("discovery_interaction"), 365);
      assert.match(retentionPage, /Son etkileşimden 180 gün/);
      assert.match(retentionPage, /Keşif ve analitik kayıtları", period: "12 ay"/);
    });

    it("says storage objects are outside the automated run, as the command warns", () => {
      assert.match(
        backend("apps/privacy/management/commands/kvkk_periyodik_imha.py"),
        /Supabase depolama nesneleri bu komutun kapsamında değildir/,
      );
      assert.match(retentionPage, /bu işlemin kapsamı dışında/);
      // The destruction command is run by hand (dry run unless --apply) and nothing
      // schedules it, so the page does not call it "otomatik".
      assert.doesNotMatch(retentionPage, /otomatik işlem/);
    });

    it("splits what holds a deletion by role, as the precheck does", () => {
      // Student blockers: open refund, disputed / awaiting / running lesson,
      // coaching. No security-review blocker for a student; a tutor has one
      // (trust_safety_case) plus the offboarding process.
      const users = backend("apps/users/services.py");
      assert.match(users, /"code": "open_refund"/);
      assert.match(users, /"code": "trust_safety_case"/);
      const studentPrecheck = users.slice(
        users.indexOf("def run_student_deletion_precheck"),
        users.indexOf("def _coaching_deletion_blockers"),
      );
      assert.doesNotMatch(studentPrecheck, /trust_safety/);
      assert.match(retentionPage, /Öğrenci hesabında/);
      assert.match(retentionPage, /Öğrenci hesabı için ayrı bir güvenlik incelemesi\s+engeli yoktur/);
      assert.match(retentionPage, /Hoca hesabında/);
      assert.doesNotMatch(retentionPage, /dosya\s+kapanışına kadar ertelenir/);
      assert.doesNotMatch(retentionPage, /yazılı olarak bildirilir/);
    });

    it("keeps financial records out of the deletion path", () => {
      assert.match(retentionPage, /Mali kayıtlar silinmez/);
      assert.match(retentionPage, /Fatura ve mali kayıtlar", period: "10 yıl"/);
    });
  },
);

const noticePage = read(path.join(LEGAL, "kvkk/aydinlatma-metni/page.tsx"));
const flat = (source: string) => source.replace(/\s+/g, " ");

describe("aydınlatma metinleri anlatır: koçluk katılım kaydı ve otomatik karar", () => {
  it("the student notice says what is kept, what it decides, and how to object", () => {
    const text = flat(noticePage);
    assert.match(text, /Çalışma koçluğu görüşmelerinde de ses ve görüntü kaydı almıyoruz/);
    assert.match(text, /Görüşme odasına kimin ne zaman girip çıktığını tutuyoruz/);
    assert.match(text, /görüşmenin uzatılmasına, iptal edilmesine ve sana ek görüşme hakkı tanınmasına sistem tarafından kendiliğinden karar verilebilir/);
    assert.match(text, /KVKK’nın 11\. maddesinin birinci fıkrasının \(g\) bendi uyarınca/);
    assert.match(text, /itirazın bir kişi tarafından yeniden incelenir/);
    assert.match(text, /Koçluk görüşmesi katılım kayıtların kayıt tarihinden itibaren 2 yıl saklanır/);
  });

  it("the tutor notice says the same from the tutor's side, without promising earnings", () => {
    const text = flat(tutorPage);
    assert.match(text, /Koçluk görüşmelerinde de ses ve görüntü kaydı almıyoruz/);
    assert.match(text, /senin gelmediğin veya yarım kalan görüşmenin sistem tarafından kendiliğinden iptal edilmesine/);
    assert.match(text, /iptal edilen görüşme için gelir yansıtılmamasına/);
    assert.match(text, /KVKK’nın 11\. maddesinin birinci fıkrasının \(g\) bendi uyarınca/);
    assert.match(text, /Koçluk görüşmesi katılım kayıtların: kayıt tarihinden itibaren 2 yıl/);
    assert.doesNotMatch(text, /hakediş|₺|\bTL\b/);
  });

  it("states no violation record is written by the automatic decision", () => {
    assert.match(flat(tutorPage), /Bu karar tek başına hakkında ihlal kaydı oluşturmaz/);
  });
});

describe(
  "the coaching attendance period is the one the code enforces",
  { skip: !backendAvailable && "Hocam_backend not checked out" },
  () => {
    it("publishes two years, by record date, as retention.py applies", () => {
      const block = backend("apps/privacy/retention.py").match(
        /category="coaching_session_attendance"[\s\S]*?max_age=DAYS\((\d+)\)[\s\S]*?date_field="(\w+)"/,
      );
      assert.ok(block, "no enforced period for coaching_session_attendance");
      assert.equal(Number(block[1]), 730);
      assert.equal(block[2], "created_at");
      assert.match(retentionPage, /Koçluk görüşmesi katılım kayıtları", period: "2 yıl", method: "Silme"/);
    });

    it("the registration notice version the server asks for is the one the notice page carries", () => {
      const server = backend("apps/privacy/notices.py").match(/REGISTRATION_NOTICE_VERSION = "(v[\d.]+)"/);
      assert.ok(server);
      const registry = read(path.join(process.cwd(), "src/lib/legalDocuments.ts"));
      const entry = registry.match(/slug: "aydinlatma-metni"[\s\S]*?version: "(v[\d.]+)"/);
      assert.ok(entry);
      assert.equal(entry[1], server[1]);
    });
  },
);
