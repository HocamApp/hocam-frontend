import { JsonLd } from "@/components/seo/JsonLd";
import {
  PublicSeoBreadcrumbs,
  PublicSeoHero,
  PublicSeoInfoCard,
  PublicSeoSection,
} from "@/components/seo/PublicSeoPage";
import {
  breadcrumbJsonLd,
  publicPageMetadata,
  publicWebPageJsonLd,
} from "@/lib/publicSeo";

const path = "/hakkimizda" as const;
const title = "Hocam Hakkında";
const description =
  "Hocam'ın doğrulanmış YKS hocalarıyla online birebir ders arayan öğrencileri buluşturan pazar yeri modelini öğrenin.";
const breadcrumbs = [
  { label: "YKS özel ders", href: "/yks-ozel-ders" },
  { label: "Hakkımızda", href: path },
] as const;

export const metadata = publicPageMetadata({
  title,
  description,
  path,
});

export default function AboutHocamPage() {
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
            eyebrow="HOCAM HAKKINDA"
            title="YKS öğrencileri için doğrulanmış hoca pazaryeri"
            description="Hocam, Türkiye genelinde online birebir ders arayan öğrenciler ile doğrulama sürecini tamamlamış hocaları buluşturur. Öğrenci, karar vermeden önce hoca profillerini aynı temel bilgiler üzerinden karşılaştırabilir."
            primaryAction={{ label: "Hocaları incele", href: "/tutors" }}
            secondaryAction={{
              label: "Nasıl çalıştığını gör",
              href: "/nasil-calisir",
            }}
          />
        </div>

        <PublicSeoSection title="Hocam'ın mevcut odağı">
          <div className="grid gap-4 md:grid-cols-3">
            <PublicSeoInfoCard title="YKS hazırlığı">
              Hoca dizini, TYT ve AYT dersleri için online birebir destek arayan
              öğrencilere odaklanır.
            </PublicSeoInfoCard>
            <PublicSeoInfoCard title="Doğrulanmış profiller">
              Hocalar, akademik bilgilerini destekleyen belgeler ve üniversite
              e-posta adresiyle başvuru yapar.
            </PublicSeoInfoCard>
            <PublicSeoInfoCard title="Karşılaştırılabilir bilgiler">
              Profil sayfaları ders alanı, üniversite, bölüm, YKS sıralaması,
              ücret ve değerlendirmeleri birlikte gösterir.
            </PublicSeoInfoCard>
          </div>
        </PublicSeoSection>

        <PublicSeoSection
          title="Öğrencinin kontrolünde bir seçim"
          intro="Hocam, tek bir hoca önerisini herkes için doğru kabul etmez. Öğrenci kendi ders ihtiyacına, programına ve bütçesine göre profilleri inceler. YKS sıralaması seçimde kullanılan bilgilerden biridir; öğretim yaklaşımı ve tamamlanan ders değerlendirmeleri de profil karşılaştırmasına dahildir."
          className="border-t"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <PublicSeoInfoCard
              title="Hoca doğrulama"
              href="/hocalar-nasil-dogrulaniyor"
              linkLabel="Doğrulama sürecini oku"
            >
              Hocaların herkese açık profile geçmeden önce sunduğu akademik
              bilgileri ve gizlilik sınırını incele.
            </PublicSeoInfoCard>
            <PublicSeoInfoCard
              title="Ders süreci"
              href="/nasil-calisir"
              linkLabel="Ders adımlarını gör"
            >
              Hoca arama, profil karşılaştırma ve online derse katılma
              adımlarını oku.
            </PublicSeoInfoCard>
          </div>
        </PublicSeoSection>
      </article>
    </>
  );
}
