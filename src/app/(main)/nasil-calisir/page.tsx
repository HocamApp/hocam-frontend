import Link from "next/link";
import { PublicPageIllustration } from "@/components/shared/PublicPageIllustration";

import { JsonLd } from "@/components/seo/JsonLd";
import {
  PublicSeoFaq,
  PublicSeoHero,
  PublicSeoRows,
  PublicSeoSection,
} from "@/components/seo/PublicSeoPage";
import { publicPageMetadata, publicWebPageJsonLd } from "@/lib/publicSeo";

const path = "/nasil-calisir" as const;
const title = "Hocam Nasıl Çalışır?";
const description =
  "Doğrulanmış hoca profillerini inceleme, ders seçimi, rezervasyon ve online ders sürecindeki temel adımları öğrenin.";
export const metadata = publicPageMetadata({
  title,
  description,
  path,
});

export default function HowItWorksPage() {
  return (
    <>
      <JsonLd
        data={[publicWebPageJsonLd({ path, name: title, description })]}
      />
      <article className="mx-auto w-full max-w-[1248px] px-6 py-16 text-ink md:py-24">
        <div>
          <PublicSeoHero
            illustration={<PublicPageIllustration kind="lesson" priority />}
            title="Hoca aramadan online derse kadar"
            description={description}
            primaryAction={{ label: "Hocaları incele", href: "/tutors" }}
            secondaryAction={{
              label: "Doğrulama sürecini oku",
              href: "/hocalar-nasil-dogrulaniyor",
            }}
          />
        </div>

        <PublicSeoSection
          title="Dört temel adım"
          intro="Hoca profillerini hesap açmadan inceleyebilirsin. Ders ayırtma ve hesapla ilişkili işlemler için giriş yapman gerekir."
        >
          <ol className="grid gap-4 md:grid-cols-2">
            {[
              {
                number: "1",
                title: "Ders ve hoca ara",
                text: "Hoca listesinde sınav türü, ders, fiyat, YKS sıralaması, üniversite ve uygunluk filtrelerini kullan.",
              },
              {
                number: "2",
                title: "Profilleri karşılaştır",
                text: "Hocanın bio bilgisini, ders alanlarını, 40 dakikalık ücretini ve tamamlanan ders değerlendirmelerini birlikte incele.",
              },
              {
                number: "3",
                title: "Hesabınla ders adımına geç",
                text: "Ders ayırtmak istediğinde giriş yap. Profilde sunulan ders ve uygunluk seçeneklerinden sana uyan seçeneği belirle.",
              },
              {
                number: "4",
                title: "Onaylanan derse online katıl",
                text: "Onaylanan ders hesabındaki yaklaşan derslerde görünür. Ders saatinde aynı kayıt üzerinden online ders odasına katıl.",
              },
            ].map((step) => (
              <li
                key={step.number}
                className="flex gap-4 rounded-[20px] border border-line bg-[var(--surface)] p-6"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-pale text-sm font-medium text-ink-on-light">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-[19px] font-medium leading-[1.3] md:text-[22px]">{step.title}</h3>
                  <p className="mt-2 text-base leading-[1.6] text-ink-mid">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </PublicSeoSection>

        <PublicSeoSection
          title="Profil karşılaştırmasında kullanabileceğin bilgiler"
          className="border-t"
        >
          <PublicSeoRows
            items={[
              {
                title: "Akademik bilgiler",
                body: "Üniversite, bölüm, YKS sıralaması ve doğrulanmış profil rozeti birlikte gösterilir.",
              },
              {
                title: "Ders bilgileri",
                body: "Hoca profilinde sınav türüne göre verdiği dersleri ve kendi açıklamasını yayınlar.",
              },
              {
                title: "Ders geçmişi",
                body: "Tamamlanan ders sayısı ve bu derslerden gelen öğrenci değerlendirmeleri profilde yer alır.",
              },
            ]}
          />
        </PublicSeoSection>

        <PublicSeoSection
          title="Süreç hakkında sık sorulanlar"
          className="border-t"
        >
          <PublicSeoFaq
            items={[
              {
                question: "Hoca profillerini görmek için hesap gerekiyor mu?",
                answer:
                  "Hayır. Herkese açık ve doğrulanmış hoca profillerini giriş yapmadan inceleyebilirsin.",
              },
              {
                question: "Dersler nerede yapılıyor?",
                answer:
                  "Onaylanan dersler Hocam hesabında görünür. Ders saatinde online ders odasına aynı kayıt üzerinden katılırsın.",
              },
              {
                question: "Değerlendirmeler nereden geliyor?",
                answer:
                  "Öğrenciler tamamlanan derslerin ardından hoca ve ders için değerlendirme bırakabilir.",
              },
              {
                question: "Hoca seçerken nereden başlamalıyım?",
                answer: (
                  <>
                    Önce ders ve sınav türünü seç. Ardından profilleri
                    karşılaştırmak için{" "}
                    <Link
                      href="/tutors"
                      className="text-primary hover:underline"
                    >
                      hoca listesine
                    </Link>{" "}
                    geçebilirsin.
                  </>
                ),
              },
            ]}
          />
        </PublicSeoSection>
      </article>
    </>
  );
}
