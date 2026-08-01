import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import {
  PublicSeoBreadcrumbs,
  PublicSeoFaq,
  PublicSeoHero,
  PublicSeoInfoCard,
  PublicSeoSection,
  PublicSeoStat,
} from "@/components/seo/PublicSeoPage";
import {
  breadcrumbJsonLd,
  filterTutorsBySubject,
  loadPublicTutors,
  publicPageMetadata,
  publicWebPageJsonLd,
  summarizeTutorPrices,
  type TutorPriceSummary,
} from "@/lib/publicSeo";
import { formatPrice } from "@/lib/utils";

const path = "/rehber/online-ozel-ders-ucretleri" as const;
const title = "Online Özel Ders Ücretleri";
const description =
  "Hocam'daki doğrulanmış hoca profillerinde listelenen güncel 40 dakikalık online özel ders ücretlerinin aralığını, medyanını ve hesaplama yöntemini görün.";
const breadcrumbs = [
  { label: "YKS özel ders", href: "/yks-ozel-ders" },
  { label: "Online özel ders ücretleri", href: path },
] as const;

export const metadata = publicPageMetadata({
  title,
  description,
  path,
});

export const revalidate = 3_600;

function PriceSummaryCard({
  title: cardTitle,
  summary,
  href,
}: {
  title: string;
  summary: TutorPriceSummary | null;
  href: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <h3 className="text-lg font-semibold">{cardTitle}</h3>
      {summary ? (
        <>
          <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">En düşük</dt>
              <dd className="mt-1 font-semibold">
                {formatPrice(summary.minimum)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Medyan</dt>
              <dd className="mt-1 font-semibold">
                {formatPrice(summary.median)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">En yüksek</dt>
              <dd className="mt-1 font-semibold">
                {formatPrice(summary.maximum)}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            {summary.count} profil, 40 dakikalık standart ders ücreti
          </p>
        </>
      ) : (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Güncel ücretler ilgili hoca profillerinde gösterilir.
        </p>
      )}
      <Link
        href={href}
        className="mt-5 inline-flex text-sm font-medium text-primary hover:underline"
      >
        İlgili hocaları incele
      </Link>
    </div>
  );
}

export default async function OnlineLessonPricesPage() {
  const tutors = await loadPublicTutors();
  const tytMathTutors = filterTutorsBySubject(tutors, "TYT", "Matematik");
  const aytMathTutors = filterTutorsBySubject(tutors, "AYT", "Matematik");
  const allPrices = summarizeTutorPrices(tutors);
  const tytMathPrices = summarizeTutorPrices(tytMathTutors);
  const aytMathPrices = summarizeTutorPrices(aytMathTutors);
  const updateDate = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(new Date());

  return (
    <>
      <JsonLd
        data={[
          publicWebPageJsonLd({ path, name: title, description }),
          breadcrumbJsonLd(breadcrumbs),
        ]}
      />
      <article className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PublicSeoBreadcrumbs items={breadcrumbs} />

        <div className="mt-6">
          <PublicSeoHero
            eyebrow={`PROFİL VERİLERİ · ${updateDate.toLocaleUpperCase("tr-TR")}`}
            title="Online özel ders ücretlerini güncel profillerden karşılaştır"
            description={description}
            primaryAction={{ label: "Hocaları karşılaştır", href: "/tutors" }}
            secondaryAction={{
              label: "Ders sürecini incele",
              href: "/nasil-calisir",
            }}
          >
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <PublicSeoStat
                value={
                  allPrices ? formatPrice(allPrices.minimum) : "Profilde güncel"
                }
                label="listelenen en düşük 40 dakika ücreti"
              />
              <PublicSeoStat
                value={
                  allPrices ? formatPrice(allPrices.median) : "Profilde güncel"
                }
                label="listelenen ücretlerin medyanı"
              />
              <PublicSeoStat
                value={
                  allPrices ? formatPrice(allPrices.maximum) : "Profilde güncel"
                }
                label="listelenen en yüksek 40 dakika ücreti"
              />
            </div>
          </PublicSeoHero>
        </div>

        <PublicSeoSection
          title="Ders türüne göre listelenen ücretler"
          intro={`Aşağıdaki değerler ${updateDate} tarihinde herkese açık ve doğrulanmış profillerden hesaplandı. Her hoca hesaplamaya bir kez dahil edildi.`}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <PriceSummaryCard
              title="Tüm doğrulanmış hocalar"
              summary={allPrices}
              href="/tutors?ordering=price"
            />
            <PriceSummaryCard
              title="TYT Matematik"
              summary={tytMathPrices}
              href="/yks/tyt/matematik-ozel-ders"
            />
            <PriceSummaryCard
              title="AYT Matematik"
              summary={aytMathPrices}
              href="/yks/ayt/matematik-ozel-ders"
            />
          </div>
        </PublicSeoSection>

        <PublicSeoSection
          title="Hesaplama yöntemi"
          className="border-t"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <PublicSeoInfoCard title="Standart süre">
              Hocam&apos;daki profil ücreti 40 dakikalık standart ders için
              kaydedilir. Daha uzun dersler bu ücret üzerinden orantılı
              hesaplanır.
            </PublicSeoInfoCard>
            <PublicSeoInfoCard title="Medyan">
              Ücretler küçükten büyüğe sıralanır. Medyan, listenin ortasındaki
              değerdir; profil sayısı çiftse ortadaki iki değerin ortalaması
              kullanılır.
            </PublicSeoInfoCard>
            <PublicSeoInfoCard title="Güncel profil esas alınır">
              Hocalar profil ücretlerini değiştirebilir. Ders seçmeden önce
              ilgili profil kartındaki güncel değeri kontrol et.
            </PublicSeoInfoCard>
          </div>
        </PublicSeoSection>

        <PublicSeoSection
          title="Ücret karşılaştırırken"
          intro="Benzer ücretteki iki profil arasında karar verirken ders alanı, uygunluk, bio ve tamamlanan ders değerlendirmelerini de incele. YKS sıralaması akademik geçmişi gösterir; ders uyumunu tek başına belirlemez."
          className="border-t"
        >
          <div className="rounded-2xl border bg-muted/30 p-6 text-sm leading-7 text-muted-foreground">
            Bu sayfadaki aralıklar, herkese açık profillerde yayınlanan
            40 dakikalık ders ücretlerinin özetidir. Öğrencinin seçtiği hoca,
            ders süresi ve ders planı toplam tutarı değiştirebilir.
          </div>
        </PublicSeoSection>

        <PublicSeoSection
          title="Online özel ders ücretleri hakkında sorular"
          className="border-t"
        >
          <PublicSeoFaq
            items={[
              {
                question: "Listelenen ücret hangi süre için?",
                answer:
                  "Her profil kartındaki ücret 40 dakikalık standart ders süresi içindir.",
              },
              {
                question: "Medyan ücret ne anlama geliyor?",
                answer:
                  "Profillerin yarısı medyan değerin altında veya bu değerde, diğer yarısı ise bu değerde veya üzerindedir.",
              },
              {
                question: "Bu değerler sabit mi?",
                answer:
                  "Hocalar profil ücretlerini güncelleyebilir. Bu sayfa, herkese açık profil verileriyle saatte bir güncellenir.",
              },
            ]}
          />
        </PublicSeoSection>
      </article>
    </>
  );
}
