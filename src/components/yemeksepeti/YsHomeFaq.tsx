"use client";

import Link from "next/link";

import {
  SupportAccordionSection,
  type SupportAccordionSectionItem,
} from "@/components/support/SupportAccordionSection";

import {
  CANCELLATION_FREE_HOURS,
  LESSON_MINUTES,
  MAX_PACKAGE_DISCOUNT_PERCENT,
  MONTHLY_TRIAL_LIMIT,
  PACKAGE_GRACE_DAYS,
  TRIAL_MINUTES,
} from "./ysHomeFacts";

/**
 * The homepage FAQ.
 *
 * Reuses `SupportAccordionSection` — the same split layout and the same 200ms
 * Radix accordion `/support` uses — and only supplies its own content. The
 * support page's own `SupportFAQ` is deliberately not reused: its questions are
 * about the support desk, and it anchors to a form that does not exist here.
 *
 * Every number below comes from `ysHomeFacts.ts`, which mirrors the backend
 * constants. Three subjects are left out on purpose because the code cannot
 * back them up: payment methods and refunds (no provider is connected — the
 * checkout says "Bu adımda kartından ücret alınmaz"), coaching (behind two
 * flags that both default to off), and any turnaround time (no SLA exists).
 */

const faqLinkClass = "font-medium text-brand-700 underline-offset-2 hover:underline";

const YS_HOME_FAQ_ITEMS: SupportAccordionSectionItem[] = [
  {
    id: "ys-faq-deneme",
    title: "Ücretsiz deneme dersi nasıl çalışıyor?",
    content: (
      <p className="text-base leading-7">
        Deneme dersi {TRIAL_MINUTES} dakika sürer ve ücretsizdir; ödeme ya da paket hakkı
        gerekmez. Her hocayla bir kez deneme dersi yapabilirsin ve aynı takvim ayı içinde en
        fazla {MONTHLY_TRIAL_LIMIT} deneme dersi hakkın olur. Bu seçeneği yalnızca profilinde
        deneme dersini açık tutan hocalarda görürsün.
      </p>
    ),
  },
  {
    id: "ys-faq-sure-ucret",
    title: `Standart bir ders kaç dakika, ücreti nasıl belirleniyor?`,
    content: (
      <p className="text-base leading-7">
        Standart ders {LESSON_MINUTES} dakikadır. Hoca profilinde gördüğün ücret bu{" "}
        {LESSON_MINUTES} dakikalık dersin ücretidir; ücreti her hoca kendisi belirler ve
        dilediğinde güncelleyebilir. Bu yüzden ders seçmeden önce ilgili profildeki güncel
        değere bak. Listelenen ücretlerin aralığını ve medyanını{" "}
        <Link href="/rehber/online-ozel-ders-ucretleri" className={faqLinkClass}>
          ders ücretleri rehberinde
        </Link>{" "}
        karşılaştırabilirsin.
      </p>
    ),
  },
  {
    id: "ys-faq-tek-ders",
    title: "Tek ders satın alabilir miyim?",
    content: (
      <p className="text-base leading-7">
        Hayır. Ücretsiz deneme dersi dışındaki dersler paket üzerinden alınır. Paketi kurarken
        haftada 2–6 ders arasından seçim yapar, süreyi 2 hafta, 1 ay, 3 ay veya 6 ay olarak
        belirlersin. Paket seçtiğin hocaya özeldir ve otomatik yenilenmez. Süre dolduktan sonra
        kalan derslerini kullanman için {PACKAGE_GRACE_DAYS} günlük ek süren olur.
      </p>
    ),
  },
  {
    id: "ys-faq-paket-fiyat",
    title: "Paket seçerken ders başına fiyat nasıl değişiyor?",
    content: (
      <p className="text-base leading-7">
        Haftalık ders sayısı arttıkça ve paket süresi uzadıkça ders başına ücret düşer. En yoğun
        ve en uzun seçimde bu fiyat avantajı %{MAX_PACKAGE_DISCOUNT_PERCENT}&apos;a kadar
        çıkabilir. Seçimini yaptığında toplam ders sayısı, liste fiyatı ve uygulanan fiyat
        avantajı özet ekranında ayrı ayrı gösterilir.
      </p>
    ),
  },
  {
    id: "ys-faq-iptal",
    title: "Bir dersi iptal edersem ne oluyor?",
    content: (
      <p className="text-base leading-7">
        Dersin başlamasına {CANCELLATION_FREE_HOURS} saatten fazla varken iptal edersen
        kullandığın ders hakkı paketine geri döner. {CANCELLATION_FREE_HOURS} saatten az
        kaldığında yapılan iptalde ders hakkı geri verilmez. Planın değişecekse hocanı mümkün
        olduğunca erken haberdar et.
      </p>
    ),
  },
  {
    id: "ys-faq-ders-odasi",
    title: "Dersler nerede yapılıyor, kaydediliyor mu?",
    content: (
      <p className="text-base leading-7">
        Dersler Hocam&apos;ın kendi online ders odasında yapılır; ders saatinde hesabındaki
        rezervasyon üzerinden katılırsın. Ders odasında kayıt, canlı yayın ve otomatik konuşma
        dökümü kapalıdır — dersler kaydedilmez.
      </p>
    ),
  },
  {
    id: "ys-faq-dogrulama",
    title: "Hocalar nasıl doğrulanıyor?",
    content: (
      <p className="text-base leading-7">
        Hoca adayları öğrenci kimliği, YKS sonuç belgesi ve .edu.tr uzantılı üniversite e-posta
        adresiyle başvurur. Dizinde yalnızca doğrulanmış ve yayına açık profiller listelenir.
        Doğrulamada kullanılan belgeler herkese açık profilde yayınlanmaz. Ayrıntıları{" "}
        <Link href="/hocalar-nasil-dogrulaniyor" className={faqLinkClass}>
          doğrulama sayfasında
        </Link>{" "}
        okuyabilirsin.
      </p>
    ),
  },
  {
    id: "ys-faq-mesaj",
    title: "Ders almadan hocayla iletişim kurabilir miyim?",
    content: (
      <p className="text-base leading-7">
        Evet. Hoca profilindeki mesaj alanından ilk mesajını gönderdiğinde konuşma hemen başlar,
        ayrıca bir onay adımı yoktur. Ders talebi oluşturduğunda da aynı konuşma açılır. Mesaj
        gönderebilmek için hesabınla giriş yapmış olman gerekir.
      </p>
    ),
  },
];

export { YS_HOME_FAQ_ITEMS };

export function YsHomeFaq() {
  return (
    <div id="sikca-sorulan-sorular" className="scroll-mt-24">
      <SupportAccordionSection
        layout="split"
        items={YS_HOME_FAQ_ITEMS}
        heading={
          <div>
            <p className="text-sm font-medium text-brand-700">Merak edilenler</p>
            <h2 className="mt-3 text-2xl font-bold leading-[1.333] tracking-tight">
              Sıkça Sorulan Sorular
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              Deneme dersinden paket seçimine kadar en çok sorulanlar.
            </p>
            <Link href="/nasil-calisir" className={`mt-2 inline-flex ${faqLinkClass}`}>
              Ders sürecinin tamamını oku
            </Link>
          </div>
        }
      />
    </div>
  );
}
