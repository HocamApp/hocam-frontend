import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render } from "@testing-library/react";

import DistanceSalesPage from "@/app/(main)/(legal)/mesafeli-satis-sozlesmesi/page";
import PreContractInformationPage from "@/app/(main)/(legal)/on-bilgilendirme-formu/page";
import { COMPANY } from "@/lib/companyInfo";
import { POLICY_FACTS as f } from "@/lib/policyFacts";

/**
 * Guards what the distance-sales contract and the pre-contract form must say
 * (Mesafeli Sözleşmeler Yönetmeliği m.5, m.7, m.9, m.10, m.12, m.15).
 *
 * The clause a mistake makes most expensive is the notice that the right of
 * withdrawal is lost once performance begins with the consumer's consent
 * (m.15(1)(h), told beforehand under m.5(1)(h)). Drop it and the 14 days never
 * start to run, which leaves the right alive for up to a year (m.10).
 */

afterEach(() => cleanup());

function textOf(Page: () => React.JSX.Element) {
  const { container } = render(<Page />);
  return (container.textContent ?? "").replace(/\s+/g, " ");
}

describe("mesafeli satış sözleşmesi", () => {
  it("names the provider, the intermediary and the buyer", () => {
    const text = textOf(DistanceSalesPage);
    assert.match(text, /Sağlayıcı: paketin bağlı olduğu Hoca/);
    assert.match(text, /Aracı hizmet sağlayıcı: HOCAM/);
    assert.match(text, /Alıcı: HOCAM üzerinde öğrenci hesabı/);
    assert.match(text, /sözleşmenin kurulmasına aracılık eder ve paket bedelini Sağlayıcı adına tahsil eder/);
  });

  it("grants the 14-day withdrawal right and a 14-day refund window", () => {
    const text = textOf(DistanceSalesPage);
    assert.match(text, new RegExp(`${f.withdrawalDays} gün içinde hiçbir gerekçe göstermeksizin`));
    assert.match(text, new RegExp(`ulaştığı tarihten itibaren ${f.withdrawalDays} gün içinde`));
    assert.match(text, /satın alırken kullandığı ödeme aracına uygun şekilde/);
  });

  it("warns before the right lapses, as m.5(1)(h) requires", () => {
    const text = textOf(DistanceSalesPage);
    assert.match(text, /İlk ders başladığında hizmetin ifasına başlanmış olur/);
    assert.match(text, /ödemeden önce bu hususta bilgilendirilmiş/);
    assert.match(text, /cayma hakkının sona ereceğini kabul eder/);
  });

  it("keeps the refund policy alive after the right lapses, as HOCAM's own commitment", () => {
    const text = textOf(DistanceSalesPage);
    assert.match(text, /ortadan kaldırmaz/);
    assert.match(text, /iade hakkını Alıcıya ayrıca tanır/);
    assert.match(text, new RegExp(`en geç ${f.refundSettleDays} gün içinde sonuçlandırılır`));
    // The old text called the refund the statutory floor; it is HOCAM's term.
    assert.doesNotMatch(text, /asgari koruma/);
  });

  it("carries the example withdrawal form and the platform's duty to keep the channel open", () => {
    const text = textOf(DistanceSalesPage);
    assert.match(text, /Örnek cayma formu/);
    assert.match(text, /kesintisiz olarak açık tutar/);
  });

  it("names the dispute route including mediation before court", () => {
    const text = textOf(DistanceSalesPage);
    assert.match(text, /Tüketici Hakem Heyet/);
    assert.match(text, /arabulucuya başvurulması şartıyla/);
  });

  it("keeps a space after every bold figure (no \"güniçinde\" run-ons)", () => {
    for (const Page of [DistanceSalesPage, PreContractInformationPage]) {
      assert.doesNotMatch(textOf(Page), /\d (gün|saat|dakika)(içinde|sonra|önce|kala|boyunca)/);
    }
  });

  it("prints no row, label or placeholder for company details nobody supplied", () => {
    for (const Page of [DistanceSalesPage, PreContractInformationPage]) {
      const text = textOf(Page);
      assert.doesNotMatch(text, /yayın öncesinde eklenecek/);
      assert.doesNotMatch(text, /MERSİS numarası|KEP adresi|Vergi dairesi ve numarası|Unvan/);
      assert.doesNotMatch(text, /Destek e-posta adresi/);
    }
  });

  it("prints a company detail as soon as it is filled in, and only that one", () => {
    const original = COMPANY.legalName;
    COMPANY.legalName = "Örnek Eğitim A.Ş.";
    try {
      for (const Page of [DistanceSalesPage, PreContractInformationPage]) {
        const text = textOf(Page);
        assert.match(text, /Unvan\s*Örnek Eğitim A\.Ş\./);
        assert.doesNotMatch(text, /MERSİS numarası/);
      }
    } finally {
      COMPANY.legalName = original;
      cleanup();
    }
  });

  it("names the support e-mail for people without an account only when one is set", () => {
    const original = COMPANY.supportEmail;
    try {
      assert.match(textOf(PreContractInformationPage), /Hesabı bulunmayanlar iletişim sayfası üzerinden iletir/);
      cleanup();
      COMPANY.supportEmail = "destek@example.test";
      assert.match(textOf(PreContractInformationPage), /bildirim adresi destek@example\.test e-posta adresidir/);
    } finally {
      COMPANY.supportEmail = original;
    }
  });

  it("promises only what the product does (no tax id on the order screen, no sent copy, no instant acknowledgement)", () => {
    const text = textOf(DistanceSalesPage);
    // The tutor's tax identity is not collected or shown anywhere yet (O8).
    assert.doesNotMatch(text, /vergi kimlik bilgileri/);
    assert.match(text, /Hocanın adı ve soyadı, Alıcıya ödemeden önce sipariş ekranında gösterilir/);
    // Nothing sends a contract copy; what is recorded is the accepted version and its time.
    assert.doesNotMatch(text, /nüshası kalıcı veri saklayıcısı ile Alıcıya iletilir/);
    assert.match(text, /onayladığı koşulların sürümü ve onay zamanı satın alma kaydında tutulur/);
    // A support ticket sends no acknowledgement; a refund request does.
    assert.doesNotMatch(text, /derhal teyit eder/);
    assert.match(text, /İade talebiyle yapılan bildirimin alındığı, hesaba gönderilen bildirimle/);
  });

  it("claims no manual collection and invents no address", () => {
    const text = textOf(DistanceSalesPage);
    assert.doesNotMatch(text, /otomatik tahsilat/);
    assert.doesNotMatch(text, /destek ekibi tarafından elle/);
    assert.doesNotMatch(text, /destek@|kvkk@/);
  });
});

describe("ön bilgilendirme formu", () => {
  it("follows the list of Mesafeli Sözleşmeler Yönetmeliği m.5(1)", () => {
    const text = textOf(PreContractInformationPage);
    for (const heading of [
      "1. Hizmetin temel nitelikleri",
      "2. Sağlayıcı ve aracı hizmet sağlayıcı",
      "3. Toplam fiyat",
      "4. Ödeme, ifa ve şikayet çözümü",
      "5. Cayma hakkı",
      "6. Cayma hakkının kaybedilmesi",
      "7. Uyuşmazlıkların çözümü",
    ]) {
      assert.ok(text.includes(heading), heading);
    }
  });

  it("states the price duty, the payment obligation and the withdrawal facts", () => {
    const text = textOf(PreContractInformationPage);
    assert.match(text, /tüm vergiler dahil toplam fiyatı/);
    assert.match(text, /Siparişin onaylanması ödeme yükümlülüğü anlamına gelir/);
    assert.match(text, new RegExp(`${f.withdrawalDays} gün içinde hiçbir gerekçe`));
    assert.match(text, /cayma hakkının sona ereceğini kabul eder/);
    assert.match(text, /Tüketici Hakem Heyetine/);
    assert.match(text, /arabulucuya/);
  });

  it("does not promise the tutor's tax identity on the order screen", () => {
    const text = textOf(PreContractInformationPage);
    assert.doesNotMatch(text, /vergi kimlik bilgileri/);
    assert.match(text, /Hocanın adı ve soyadı sipariş ekranında gösterilir/);
  });

  it("links the privacy notice and says where the withdrawal notice goes", () => {
    const { container } = render(<PreContractInformationPage />);
    const hrefs = Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    assert.ok(hrefs.includes("/kvkk/aydinlatma-metni"));
    assert.ok(hrefs.includes("/iptal-ve-iade"));
    assert.ok(hrefs.includes("/mesafeli-satis-sozlesmesi"));
  });
});

describe("çalışma koçluğu: mesafeli satış sözleşmesi", () => {
  const text = () => textOf(DistanceSalesPage);
  const section = () => {
    const all = text();
    const start = all.indexOf("11. Çalışma koçluğu");
    const end = all.indexOf("12. Yürürlük ve bildirim");
    assert.ok(start >= 0, "the coaching article is on the page");
    assert.ok(end > start, "the closing article follows it");
    return all.slice(start, end);
  };

  it("keeps the closing article last and the earlier numbering where it was", () => {
    const all = text();
    assert.match(all, /10\. Uyuşmazlıklar/);
    assert.match(all, /11\. Çalışma koçluğu/);
    assert.match(all, /12\. Yürürlük ve bildirim/);
    assert.doesNotMatch(all, /11\. Yürürlük ve bildirim/);
    // The note and the withdrawal text point at the article by its number.
    assert.match(all, /koçluğa özgü hükümler on birinci maddededir/);
  });

  it("says what coaching is, and that it is not sold alone", () => {
    const t = section();
    assert.match(t, /aynı Hocadan çalışma koçluğu satın alabilir/);
    assert.match(t, /ders paketi olmadan tek başına satın alınamaz/);
    assert.match(t, /aynı anda yalnızca bir aktif çalışma koçuna sahip olabilir/);
    assert.match(t, new RegExp(`her biri ${f.coachingSessionMinutes} dakika süren çevrim içi birebir görüşmelerden`));
    assert.match(t, new RegExp(`mesajlara ${f.coachingMessageReplyHours} saat içinde yanıttan oluşur`));
    assert.match(t, /iki haftada bir, haftada bir veya haftada iki/);
    assert.match(t, /Koçluk hakları dönemseldir ve birikmez/);
  });

  it("prices it per meeting, with the package term discount, on what was really paid", () => {
    const t = section();
    assert.match(t, /görüşme başı bedel ile görüşme sayısının çarpımından/);
    assert.match(t, /paket süresine göre uygulanan indirim düşülerek/);
    assert.match(t, /Koçluk ücretsiz sunulabilir; bu halde bedel yoktur/);
    assert.match(t, /fiilen ödediği koçluk bedeli üzerinden yapılır/);
  });

  it("asks the tutor's yes first, starts on the weekly hour, and names both deadlines", () => {
    const t = section();
    assert.match(t, /Hocanın talebi kabul etmesine bağlıdır/);
    assert.match(t, /Hoca talebi kabul etmezse veya süresinde yanıtlamazsa sipariş gerçekleşmez/);
    assert.match(t, /düzenli görüşme saatini seçtiğinde başlar/);
    assert.match(t, new RegExp(`saati ${f.coachingScheduleDeadlineDays} gün içinde seçmezse koçluk iptal edilir`));
    assert.match(t, new RegExp(`saat talebinden itibaren ${f.coachingTimeRequestHours} saat içinde yeni saat önermezse koçluk iptal edilir`));
    assert.match(t, /ders paketi devam eder/);
  });

  it("sends a failed meeting to the cancellation text and ends coaching without touching the package", () => {
    const t = section();
    assert.match(t, /İptal ve İade Koşullarının on ikinci maddesinde düzenlenmiştir/);
    assert.match(t, /Alıcı koçluğu dilediği zaman sonlandırabilir; ders paketi devam eder, eski program ve raporlar silinmez/);
    assert.match(t, /Henüz başlamamış koçluk dönemlerinin bedeli iade edilir/);
    assert.match(t, /tamamlanmış dönemlerin bedeli iade edilmez/);
    assert.match(t, /Hoca kalan koçluğu sonlandırırsa başlamamış dönemlerin bedeli aynı şekilde iade edilir/);
  });

  it("gives the complaint windows and promises no automatic refund", () => {
    const t = section();
    assert.match(t, new RegExp(`görüşmenin bitiminden itibaren ${f.coachingComplaintSessionHours} saat`));
    assert.match(t, new RegExp(`yanıt süresinin dolmasından itibaren ${f.coachingComplaintDays} gün`));
    assert.match(t, new RegExp(`dönemin bitiminden itibaren ${f.coachingComplaintDays} gün`));
    assert.match(t, /Şikâyet tek başına iade doğurmaz; destek ekibi inceler/);
    assert.match(t, /yeniden görüşme, ilgili dönemin iadesi veya kalan koçluğun sonlandırılması/);
  });

  it("records refunds as obligations, never as done, and keeps the statutory rights", () => {
    const t = section();
    assert.match(t, /HOCAM iade yükümlülüğünü kaydeder ve iadeyi ödeme hizmeti sağlayıcısı üzerinden, İptal ve İade Koşullarında anlatılan usulle yapar/);
    assert.match(t, /tüketici mevzuatından doğan haklarını ortadan kaldırmaz/);
    assert.doesNotMatch(t, /iade edildi\b|₺|\bTL\b/);
  });

  it("starts the right of withdrawal at the first lesson or the first coaching meeting, whichever is first", () => {
    assert.match(text(), /ilk ders ya da ilk koçluk görüşmesinden hangisi önce başlarsa onun başlamasıyla başlar/);
  });
});

describe("çalışma koçluğu: ön bilgilendirme formu", () => {
  const text = () => textOf(PreContractInformationPage);

  it("lists the coaching service's main features and that it is not sold alone", () => {
    const t = text();
    assert.match(t, /aynı Hocadan çalışma koçluğu da satın alabilir/);
    assert.match(t, new RegExp(`her biri ${f.coachingSessionMinutes} dakika süren çevrim içi birebir görüşmeler`));
    assert.match(t, new RegExp(`mesajlara ${f.coachingMessageReplyHours} saat içinde yanıttan oluşur`));
    assert.match(t, /ders paketi olmadan tek başına alınamaz/);
  });

  it("shows the coaching total before the payment", () => {
    assert.match(text(), /koçluğun toplam bedeli de ödeme öncesinde sipariş ekranında ayrıca gösterilir/);
  });

  it("says how coaching starts and where the rest is written", () => {
    const t = text();
    assert.match(t, /Hocanın talebi kabul etmesine bağlıdır/);
    assert.match(t, new RegExp(`saat ${f.coachingScheduleDeadlineDays} gün içinde seçilmezse ya da uygun saat bulunamazsa koçluk iptal edilir`));
    assert.match(t, /Mesafeli Satış Sözleşmesinin 11\. maddesinde ve İptal ve İade Koşullarının 12\. maddesinde yer alır/);
  });

  it("tells when the right of withdrawal is lost for an order with coaching", () => {
    assert.match(text(), /ilk ders ya da ilk koçluk görüşmesinden hangisi önce başlarsa onun başlamasıyla başlar/);
  });
});
