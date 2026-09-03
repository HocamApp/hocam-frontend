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
import { TutorCard } from "@/components/tutors/TutorCard";
import {
  breadcrumbJsonLd,
  loadPublicTutors,
  publicPageMetadata,
  publicWebPageJsonLd,
  summarizeTutorPrices,
  tutorItemListJsonLd,
} from "@/lib/publicSeo";
import { formatPrice } from "@/lib/utils";

const path = "/yks-ozel-ders" as const;
const title = "YKS Online Özel Ders";
const description =
  "TYT ve AYT için doğrulanmış hocaları ders alanı, YKS sıralaması, değerlendirme, fiyat ve uygunluk bilgileriyle karşılaştırın.";
const breadcrumbs = [
  { label: "Hocalar", href: "/tutors" },
  { label: "YKS özel ders", href: path },
] as const;

export const metadata = publicPageMetadata({
  title,
  description,
  path,
});

export const revalidate = 3_600;

export default async function YksPrivateLessonPage() {
  const tutors = await loadPublicTutors();
  const featuredTutors = tutors.slice(0, 6);
  const priceSummary = summarizeTutorPrices(tutors);

  return (
    <>
      <JsonLd
        data={[
          publicWebPageJsonLd({ path, name: title, description }),
          breadcrumbJsonLd(breadcrumbs),
          tutorItemListJsonLd({
            tutors: featuredTutors,
            name: "Öne çıkan doğrulanmış YKS hocaları",
            path,
          }),
        ]}
      />
      <article className="mx-auto w-full max-w-[1248px] px-6 py-16 text-ink md:py-24">
        <PublicSeoBreadcrumbs items={breadcrumbs} />

        <div className="mt-6">
          <PublicSeoHero
            eyebrow="TYT VE AYT İÇİN BİREBİR ONLINE DERS"
            title="YKS için hocanı profilleri karşılaştırarak seç"
            description={description}
            primaryAction={{ label: "Hocaları incele", href: "/tutors" }}
            secondaryAction={{
              label: "Nasıl çalıştığını gör",
              href: "/nasil-calisir",
            }}
          >
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <PublicSeoStat
                value={tutors.length > 0 ? String(tutors.length) : "Güncel"}
                label={
                  tutors.length > 0
                    ? "doğrulanmış ve herkese açık hoca profili"
                    : "hoca profilleri dizinde listeleniyor"
                }
              />
              <PublicSeoStat
                value="TYT + AYT"
                label="ders ve sınav türüne göre filtreleme"
              />
              <PublicSeoStat
                value={
                  priceSummary
                    ? `${formatPrice(priceSummary.minimum)} ile ${formatPrice(
                        priceSummary.maximum
                      )}`
                    : "Profilde güncel"
                }
                label="listelenen 40 dakikalık ders ücretleri"
              />
            </div>
          </PublicSeoHero>
        </div>

        <PublicSeoSection
          title="Profilde hangi bilgileri karşılaştırabilirsin?"
          intro="Her hoca profili aynı temel bilgileri gösterir. Ders seçimini yalnızca tek bir puana veya sıralamaya dayandırmak yerine bu alanları birlikte değerlendirebilirsin."
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <PublicSeoInfoCard title="Ders alanları">
              Hocanın hangi TYT ve AYT derslerini verdiğini profilinde
              görebilirsin.
            </PublicSeoInfoCard>
            <PublicSeoInfoCard title="YKS sıralaması">
              Doğrulama sürecinde incelenen YKS sıralaması profilde açıkça
              gösterilir.
            </PublicSeoInfoCard>
            <PublicSeoInfoCard title="Üniversite ve bölüm">
              Hocanın üniversite ve bölüm bilgileri profil karşılaştırmasına
              eşlik eder.
            </PublicSeoInfoCard>
            <PublicSeoInfoCard title="Ders ücreti">
              Hoca, 40 dakikalık standart ders ücretini profilinde yayınlar.
            </PublicSeoInfoCard>
            <PublicSeoInfoCard title="Uygunluk">
              Müsaitlik bilgileri, ders zamanı seçerken uygun seçenekleri
              görmene yardımcı olur.
            </PublicSeoInfoCard>
            <PublicSeoInfoCard title="Ders değerlendirmeleri">
              Tamamlanan derslerin ardından bırakılan öğrenci
              değerlendirmelerini inceleyebilirsin.
            </PublicSeoInfoCard>
          </div>
        </PublicSeoSection>

        <PublicSeoSection
          title="Matematik için TYT ve AYT sayfaları"
          intro="TYT ve AYT matematik farklı sınav türleri olduğu için ayrı hoca listelerine ve ayrı sayfalara sahiptir."
          className="border-t"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <PublicSeoInfoCard
              title="TYT Matematik Özel Ders"
              href="/yks/tyt/matematik-ozel-ders"
              linkLabel="TYT matematik hocalarını gör"
            >
              TYT Matematik dersi veren doğrulanmış hocaları ve profil
              bilgilerini tek sayfada karşılaştır.
            </PublicSeoInfoCard>
            <PublicSeoInfoCard
              title="AYT Matematik Özel Ders"
              href="/yks/ayt/matematik-ozel-ders"
              linkLabel="AYT matematik hocalarını gör"
            >
              AYT Matematik dersi veren doğrulanmış hocaları fiyat, sıralama ve
              değerlendirme bilgileriyle incele.
            </PublicSeoInfoCard>
          </div>
        </PublicSeoSection>

        {featuredTutors.length > 0 && (
          <PublicSeoSection
            title="Doğrulanmış YKS hocaları"
            intro="Aşağıdaki profiller herkese açık hoca dizininden alınır. Güncel ders alanı, ücret ve uygunluk için ilgili profili incele."
            className="border-t"
          >
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredTutors.map((tutor) => (
                <TutorCard key={tutor.id} tutor={tutor} />
              ))}
            </div>
            <div className="mt-7 text-center">
              <Link
                href="/tutors"
                className="font-medium text-primary hover:underline"
              >
                Tüm doğrulanmış hocaları incele
              </Link>
            </div>
          </PublicSeoSection>
        )}

        <PublicSeoSection
          title="YKS özel ders hakkında sık sorulanlar"
          className="border-t"
        >
          <PublicSeoFaq
            items={[
              {
                question: "Hocam'daki dersler online mı?",
                answer:
                  "Evet. Hocam, öğrenciler ile doğrulanmış hocaları online birebir ders için buluşturur.",
              },
              {
                question: "Hocaların YKS sıralaması doğrulanıyor mu?",
                answer: (
                  <>
                    Hocalar öğrenci kimliği, YKS sonuç belgesi ve üniversite
                    e-posta adresiyle doğrulama başvurusu yapar. Ayrıntıları{" "}
                    <Link
                      className="text-primary hover:underline"
                      href="/hocalar-nasil-dogrulaniyor"
                    >
                      doğrulama sayfasında
                    </Link>{" "}
                    okuyabilirsin.
                  </>
                ),
              },
              {
                question: "Ders ücretini nerede görebilirim?",
                answer: (
                  <>
                    Her hoca profilinde 40 dakikalık standart ders ücreti
                    gösterilir. Ders paketlerini ve güncel ücretleri hocanın profilinden inceleyebilirsin.
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
