import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render } from "@testing-library/react";

import DistanceSalesPage from "@/app/(main)/(legal)/mesafeli-satis-sozlesmesi/page";
import PreContractInformationPage from "@/app/(main)/(legal)/on-bilgilendirme-formu/page";
import { PENDING_TEXT } from "@/lib/companyInfo";
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

  it("shows a visible marker, never a blank, for what the owners have not supplied", () => {
    const text = textOf(DistanceSalesPage);
    assert.ok(text.includes(PENDING_TEXT));
    assert.match(text, /MERSİS numarası/);
    assert.match(text, /KEP adresi/);
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

  it("links the privacy notice and says where the withdrawal notice goes", () => {
    const { container } = render(<PreContractInformationPage />);
    const hrefs = Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    assert.ok(hrefs.includes("/kvkk/aydinlatma-metni"));
    assert.ok(hrefs.includes("/iptal-ve-iade"));
    assert.ok(hrefs.includes("/mesafeli-satis-sozlesmesi"));
  });
});
